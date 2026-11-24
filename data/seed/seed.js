import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
dotenv.config({ path: path.join(repoRoot, 'backend', '.env') });
const prisma = new PrismaClient();
const replacePlacesOnly = process.argv.includes('--replace-places-only');

// Helper chuyển chuỗi "HH:mm" thành Date object cho kiểu PostgreSQL TIME
function parseTimeToDate(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hh = parts[0].padStart(2, '0');
  const mm = parts[1].padStart(2, '0');
  return new Date(`1970-01-01T${hh}:${mm}:00.000Z`);
}

function getPlaceIdentity(place, zoneCode) {
  return [place.name, place.city, zoneCode]
    .map((value) => String(value || '').normalize('NFC').trim().toLocaleLowerCase())
    .join('\u0000');
}

function mapPlaceData(place, zoneId) {
  return {
    name: place.name,
    city: place.city,
    zoneId,
    address: place.address || null,
    estimatedCost: Number(place.estimatedCost) || 0,
    duration: Number(place.duration) || 60,
    openingTime: parseTimeToDate(place.openingTime),
    closingTime: parseTimeToDate(place.closingTime),
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    popularity: place.popularity ?? 0.5,
    rating: place.rating ?? 4.5,
    imageUrl: place.imageUrl || null,
    shortDesc: place.shortDesc || null
  };
}

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu cho GeoZone AI...');

  if (!replacePlacesOnly) {
    // 1. Tạo người dùng mẫu (Demo Users theo chuẩn Velora)
    const salt = await bcrypt.genSalt(10);
    const demoPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    await prisma.user.upsert({
      where: { email: 'demo@geozone.vn' },
      update: {
        password_hash: demoPassword,
        is_active: true,
        is_verified: true
      },
      create: {
        email: 'demo@geozone.vn',
        password_hash: demoPassword,
        name: 'Khách du lịch Demo',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DemoUser',
        role: 'USER',
        is_active: true,
        is_verified: true
      }
    });

    await prisma.user.upsert({
      where: { email: 'admin@geozone.vn' },
      update: {
        password_hash: adminPassword,
        is_active: true,
        is_verified: true
      },
      create: {
        email: 'admin@geozone.vn',
        password_hash: adminPassword,
        name: 'Quản trị viên GeoZone',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminUser',
        role: 'ADMIN',
        is_active: true,
        is_verified: true
      }
    });
    console.log('✅ Đã tạo tài khoản demo và admin.');
  } else {
    console.log('ℹ️ Chế độ chỉ thay thế places: không chỉnh sửa tài khoản người dùng.');
  }

  // 2. Nạp toàn bộ catalog từ các bộ dữ liệu dùng trong giao diện.
  const cityDataFiles = [
    { key: 'danang', file: 'danang_places.json', zonePrefix: '' },
    { key: 'hue', file: 'hue_places.json', zonePrefix: 'HUE-' },
    { key: 'hanoi', file: 'hanoi_places.json', zonePrefix: '' },
    { key: 'halong', file: 'halong_places.json', zonePrefix: '' },
    { key: 'ninhbinh', file: 'ninhbinh_places.json', zonePrefix: 'NINHBINH-' }
  ];
  const zoneByCode = new Map();
  const placeEntries = [];
  const allTags = new Set();

  for (const cityData of cityDataFiles) {
    const dataPath = path.join(repoRoot, 'frontend', 'src', 'data', cityData.file);
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Không tìm thấy dữ liệu địa điểm: ${dataPath}`);
    }

    const places = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    for (const place of places) {
      const zoneCode = `${cityData.zonePrefix}${place.zoneCode}`;
      const entry = { ...place, zoneCode, cityKey: cityData.key };
      placeEntries.push(entry);

      for (const tag of Array.isArray(place.tags) ? place.tags : []) {
        allTags.add(String(tag).trim().toLowerCase());
      }

      const zone = zoneByCode.get(zoneCode) || {
        code: zoneCode,
        name: place.zoneName || zoneCode,
        city: place.city,
        latitudeTotal: 0,
        longitudeTotal: 0,
        coordinateCount: 0
      };
      if (Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))) {
        zone.latitudeTotal += Number(place.latitude);
        zone.longitudeTotal += Number(place.longitude);
        zone.coordinateCount += 1;
      }
      zoneByCode.set(zoneCode, zone);
    }
  }

  const zonesData = [...zoneByCode.values()].map((zone) => ({
    code: zone.code,
    name: zone.name,
    description: `Phân vùng ${zone.name} tại ${zone.city}`,
    centerLat: zone.coordinateCount ? zone.latitudeTotal / zone.coordinateCount : null,
    centerLng: zone.coordinateCount ? zone.longitudeTotal / zone.coordinateCount : null
  }));

  let currentPlaces = [];
  let favoritesToRestore = [];
  if (replacePlacesOnly) {
    const [existingPlaces, existingFavorites, knowledgeChunkCount] = await Promise.all([
      prisma.place.findMany({
        include: { zone: { select: { code: true } } },
        orderBy: { id: 'asc' }
      }),
      prisma.userFavorite.findMany(),
      prisma.knowledgeChunk.count()
    ]);
    if (knowledgeChunkCount > 0) {
      throw new Error('Không thể thay thế places an toàn: database đang có KnowledgeChunk liên kết với địa điểm.');
    }

    currentPlaces = existingPlaces;
    const existingByIdentity = new Map();
    const existingOccurrenceById = new Map();
    for (const place of existingPlaces) {
      const identity = getPlaceIdentity(place, place.zone.code);
      const matches = existingByIdentity.get(identity) || [];
      existingOccurrenceById.set(place.id, matches.length);
      matches.push(place);
      existingByIdentity.set(identity, matches);
    }

    const sourceByIdentityOccurrence = new Map();
    const sourceOccurrences = new Map();
    for (const place of placeEntries) {
      const identity = getPlaceIdentity(place, place.zoneCode);
      const occurrence = sourceOccurrences.get(identity) || 0;
      sourceOccurrences.set(identity, occurrence + 1);
      const existing = existingByIdentity.get(identity)?.[occurrence];
      if (existing) place.preservedId = existing.id;
      sourceByIdentityOccurrence.set(`${identity}\u0000${occurrence}`, place);
    }

    const existingById = new Map(existingPlaces.map((place) => [place.id, place]));
    favoritesToRestore = existingFavorites.map((favorite) => {
      const oldPlace = existingById.get(favorite.place_id);
      const occurrence = existingOccurrenceById.get(favorite.place_id);
      const identity = oldPlace ? getPlaceIdentity(oldPlace, oldPlace.zone.code) : '';
      const replacement = sourceByIdentityOccurrence.get(`${identity}\u0000${occurrence}`);
      if (!replacement?.preservedId) {
        throw new Error(`Không thể giữ yêu thích ${favorite.id}: địa điểm liên kết không có bản tương ứng trong dữ liệu mới.`);
      }
      return {
        id: favorite.id,
        user_id: favorite.user_id,
        place_id: replacement.preservedId,
        created_at: favorite.created_at
      };
    });
  }

  for (const zone of zonesData) {
    await prisma.zone.upsert({
      where: { code: zone.code },
      update: replacePlacesOnly
        ? {}
        : {
            name: zone.name,
            centerLat: zone.centerLat,
            centerLng: zone.centerLng
          },
      create: zone
    });
  }

  for (const tagName of allTags) {
    if (!tagName) continue;
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    });
  }

  const [zones, tags] = await Promise.all([
    prisma.zone.findMany(),
    prisma.tag.findMany()
  ]);
  const zonesByCode = new Map(zones.map((zone) => [zone.code, zone]));
  const tagsByName = new Map(tags.map((tag) => [tag.name.toLowerCase(), tag]));

  if (replacePlacesOnly) {
    const maxExistingId = currentPlaces.reduce((max, place) => Math.max(max, place.id), 0);
    await prisma.$transaction(async (tx) => {
      await tx.place.deleteMany({});
      if (maxExistingId) {
        await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('places', 'id'), ${maxExistingId}, true)`;
      } else {
        await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('places', 'id'), 1, false)`;
      }

      const placeTagRows = [];
      for (const place of placeEntries) {
        const zone = zonesByCode.get(place.zoneCode);
        if (!zone) throw new Error(`Không tìm thấy Zone ${place.zoneCode} cho "${place.name}".`);

        const placeData = mapPlaceData(place, zone.id);
        const savedPlace = place.preservedId
          ? await tx.place.create({ data: { id: place.preservedId, ...placeData } })
          : await tx.place.create({ data: placeData });
        const tagIds = [...new Set(
          (Array.isArray(place.tags) ? place.tags : [])
            .map((name) => tagsByName.get(String(name).trim().toLowerCase())?.id)
            .filter((id) => id !== undefined)
        )];
        placeTagRows.push(...tagIds.map((tagId) => ({ placeId: savedPlace.id, tagId })));
      }

      if (placeTagRows.length) await tx.placeTag.createMany({ data: placeTagRows });
      if (favoritesToRestore.length) {
        await tx.userFavorite.createMany({ data: favoritesToRestore });
      }
      await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('places', 'id'), COALESCE((SELECT MAX(id) FROM places), 1), true)`;
    });

    console.log(`✅ Đã xóa và nạp lại ${placeEntries.length} places; giữ nguyên ${favoritesToRestore.length} favorites.`);
  } else {
    let createdCount = 0;
    let updatedCount = 0;
    const placeOccurrences = new Map();
    for (const place of placeEntries) {
      const zone = zonesByCode.get(place.zoneCode);
      if (!zone) throw new Error(`Không tìm thấy Zone ${place.zoneCode} cho "${place.name}".`);

      const placeData = mapPlaceData(place, zone.id);
      const identity = `${place.name}\u0000${place.city}\u0000${zone.id}`;
      const occurrenceIndex = placeOccurrences.get(identity) || 0;
      placeOccurrences.set(identity, occurrenceIndex + 1);
      const existingMatches = await prisma.place.findMany({
        where: {
          name: place.name,
          city: place.city,
          zoneId: zone.id
        },
        orderBy: { id: 'asc' },
        select: { id: true }
      });
      const existing = existingMatches[occurrenceIndex];
      const savedPlace = existing
        ? await prisma.place.update({ where: { id: existing.id }, data: placeData })
        : await prisma.place.create({ data: placeData });

      if (existing) updatedCount += 1;
      else createdCount += 1;

      const tagIds = [...new Set(
        (Array.isArray(place.tags) ? place.tags : [])
          .map((name) => tagsByName.get(String(name).trim().toLowerCase())?.id)
          .filter((id) => id !== undefined)
      )];
      await prisma.placeTag.deleteMany({ where: { placeId: savedPlace.id } });
      if (tagIds.length) {
        await prisma.placeTag.createMany({
          data: tagIds.map((tagId) => ({ placeId: savedPlace.id, tagId }))
        });
      }
    }

    console.log(`✅ Đã đồng bộ ${placeEntries.length} địa điểm (${createdCount} mới, ${updatedCount} cập nhật), ${zonesData.length} Zone và ${allTags.size} Tags.`);
  }

  console.log('🎉 Hoàn tất quá trình seed database GeoZone!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

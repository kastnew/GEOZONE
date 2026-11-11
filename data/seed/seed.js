import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper chuyển chuỗi "HH:mm" thành Date object cho kiểu PostgreSQL TIME
function parseTimeToDate(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hh = parts[0].padStart(2, '0');
  const mm = parts[1].padStart(2, '0');
  return new Date(`1970-01-01T${hh}:${mm}:00.000Z`);
}

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu cho GeoZone AI...');

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
  console.log('✅ Đã tạo tài khoản demo (demo@geozone.vn / password123) và admin (admin@geozone.vn / admin123).');

  // 2. Tạo các Zone cố định
  const zonesData = [
    { code: 'Z1', name: 'Trung tâm Hải Châu', description: 'Khu vực trung tâm thương mại, bảo tàng, chợ truyền thống', centerLat: 16.0678, centerLng: 108.2208 },
    { code: 'Z2', name: 'Ven biển Mỹ Khê - Sơn Trà', description: 'Dải bờ biển du lịch, công viên ven biển, nhà hàng hải sản', centerLat: 16.0590, centerLng: 108.2450 },
    { code: 'Z3', name: 'Bán đảo Sơn Trà', description: 'Du lịch sinh thái, rừng nguyên sinh, chùa Linh Ứng', centerLat: 16.1100, centerLng: 108.2800 },
    { code: 'Z4', name: 'Khu vực Ngũ Hành Sơn', description: 'Di tích danh thắng núi đá, hang động, làng nghề truyền thống', centerLat: 16.0040, centerLng: 108.2610 },
    { code: 'Z5', name: 'Ngoại ô Hòa Vang - Bà Nà', description: 'Quần thể khu du lịch sinh thái và vui chơi giải trí trên đỉnh núi', centerLat: 15.9980, centerLng: 107.9940 }
  ];

  for (const z of zonesData) {
    await prisma.zone.upsert({
      where: { code: z.code },
      update: {},
      create: z
    });
  }
  console.log('✅ Đã tạo 5 Zone địa lý mẫu.');

  // 3. Tạo các Tags
  const defaultTags = ['food', 'beach', 'culture', 'nature', 'adventure', 'nightlife', 'sightseeing'];
  for (const tagName of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    });
  }
  console.log('✅ Đã nạp danh sách Tags.');

  // 4. Đọc dữ liệu địa điểm từ danang_places.json
  const rawPath = path.resolve('..', 'data', 'raw', 'danang_places.json');
  if (fs.existsSync(rawPath)) {
    const rawContent = fs.readFileSync(rawPath, 'utf-8');
    const places = JSON.parse(rawContent);

    // Xóa place_tags và places cũ để seed sạch không bị trùng ID
    await prisma.placeTag.deleteMany();
    await prisma.place.deleteMany();

    for (const p of places) {
      const zone = await prisma.zone.findUnique({ where: { code: p.zoneCode } });
      if (!zone) continue;

      const createdPlace = await prisma.place.create({
        data: {
          id: p.id,
          name: p.name,
          city: p.city,
          zoneId: zone.id,
          address: p.address,
          estimatedCost: p.estimatedCost,
          duration: p.duration,
          openingTime: parseTimeToDate(p.openingTime),
          closingTime: parseTimeToDate(p.closingTime),
          latitude: p.latitude,
          longitude: p.longitude,
          popularity: p.popularity,
          rating: 4.5
        }
      });

      // Gán tags
      for (const tName of p.tags) {
        const tag = await prisma.tag.findUnique({ where: { name: tName } });
        if (tag) {
          await prisma.placeTag.create({
            data: {
              placeId: createdPlace.id,
              tagId: tag.id
            }
          });
        }
      }
    }
    console.log(`✅ Đã nạp thành công ${places.length} địa điểm du lịch.`);
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

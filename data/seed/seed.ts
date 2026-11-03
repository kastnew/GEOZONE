import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu cho GeoZone AI...');

  // 1. Tạo các Zone cố định
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

  // 2. Tạo các Tags
  const defaultTags = ['food', 'beach', 'culture', 'nature', 'adventure', 'nightlife', 'sightseeing'];
  for (const tagName of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    });
  }
  console.log('✅ Đã nạp danh sách Tags.');

  // 3. Đọc dữ liệu địa điểm từ danang_places.json
  const rawPath = path.resolve('..', 'data', 'raw', 'danang_places.json');
  if (fs.existsSync(rawPath)) {
    const rawContent = fs.readFileSync(rawPath, 'utf-8');
    const places = JSON.parse(rawContent);

    for (const p of places) {
      const zone = await prisma.zone.findUnique({ where: { code: p.zoneCode } });
      if (!zone) continue;

      const createdPlace = await prisma.place.create({
        data: {
          name: p.name,
          city: p.city,
          zoneId: zone.id,
          address: p.address,
          estimatedCost: p.estimatedCost,
          duration: p.duration,
          openingTime: p.openingTime,
          closingTime: p.closingTime,
          latitude: p.latitude,
          longitude: p.longitude,
          popularity: p.popularity
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

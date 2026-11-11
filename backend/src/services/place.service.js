import { prisma } from '../config/database.js';

function formatTime(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().substring(11, 16);
  }
  return String(val);
}

function mapPlace(p) {
  return {
    id: p.id,
    name: p.name,
    city: p.city,
    zoneId: p.zoneId,
    zoneCode: p.zone?.code || `Z${p.zoneId}`,
    zoneName: p.zone?.name || `Zone ${p.zoneId}`,
    address: p.address,
    estimatedCost: Number(p.estimatedCost) || 0,
    duration: p.duration,
    openingTime: formatTime(p.openingTime),
    closingTime: formatTime(p.closingTime),
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    popularity: p.popularity ? Number(p.popularity) : 0.5,
    imageUrl: p.imageUrl,
    rating: p.rating ? Number(p.rating) : 4.5,
    shortDesc: p.shortDesc,
    tags: p.placeTags ? p.placeTags.map(pt => pt.tag.name) : []
  };
}

export class PlaceService {
  /**
   * Lấy danh sách toàn bộ các Zone
   */
  async getAllZones() {
    return await prisma.zone.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { places: true }
        }
      }
    });
  }

  /**
   * Lấy danh sách địa điểm theo điều kiện lọc
   * @param {string} city
   * @param {string[]} tags
   */
  async findCandidates(city, tags) {
    const places = await prisma.place.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' },
        ...(tags && tags.length > 0 && {
          placeTags: {
            some: {
              tag: {
                name: { in: tags }
              }
            }
          }
        })
      },
      include: {
        zone: true,
        placeTags: {
          include: { tag: true }
        }
      }
    });

    return places.map(mapPlace);
  }

  /**
   * Lấy các địa điểm thay thế trong cùng zone để phục vụ Dynamic Swap
   * @param {number} zoneId
   * @param {number[]} excludedPlaceIds
   * @param {number} maxCost
   * @param {string[]} preferences
   */
  async findSwapCandidates(zoneId, excludedPlaceIds, maxCost, preferences) {
    const candidates = await prisma.place.findMany({
      where: {
        zoneId,
        id: { notIn: excludedPlaceIds },
        estimatedCost: { lte: maxCost }
      },
      include: {
        zone: true,
        placeTags: {
          include: { tag: true }
        }
      }
    });

    return candidates.map(mapPlace);
  }
}

export const placeService = new PlaceService();

import { prisma } from '../config/database.js';

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

    return places.map(p => ({
      id: p.id,
      name: p.name,
      city: p.city,
      zoneId: p.zoneId,
      zoneCode: p.zone.code,
      zoneName: p.zone.name,
      address: p.address,
      estimatedCost: p.estimatedCost,
      duration: p.duration,
      openingTime: p.openingTime,
      closingTime: p.closingTime,
      latitude: p.latitude,
      longitude: p.longitude,
      popularity: p.popularity,
      tags: p.placeTags.map(pt => pt.tag.name)
    }));
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

    return candidates.map(p => ({
      id: p.id,
      name: p.name,
      city: p.city,
      zoneId: p.zoneId,
      zoneCode: p.zone.code,
      zoneName: p.zone.name,
      address: p.address,
      estimatedCost: p.estimatedCost,
      duration: p.duration,
      openingTime: p.openingTime,
      closingTime: p.closingTime,
      latitude: p.latitude,
      longitude: p.longitude,
      popularity: p.popularity,
      tags: p.placeTags.map(pt => pt.tag.name)
    }));
  }
}

export const placeService = new PlaceService();

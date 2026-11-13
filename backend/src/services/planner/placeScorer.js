// /**
//  * Bước 2: Chấm điểm độ phù hợp của từng địa điểm
//  * Công thức: Score(i) = w1 * Preference(i) + w2 * Popularity(i) + w3 * CostScore(i)
//  * 
//  * @param {import('../../types/plan.types.js').PlaceEntity[]} places
//  * @param {string[]} userPreferences
//  * @param {{ wPreference?: number, wPopularity?: number, wCost?: number }} [weights]
//  */
// export function scorePlaces(
//   places,
//   userPreferences,
//   weights = { wPreference: 0.5, wPopularity: 0.3, wCost: 0.2 }
// ) {
//   const maxCost = Math.max(...places.map(p => p.estimatedCost), 100000);

//   return places.map(place => {
//     // 1. Điểm sở thích: Tỷ lệ tag trùng với preferences của người dùng
//     const matchedTags = place.tags.filter(t => userPreferences.includes(t));
//     const preferenceScore = userPreferences.length > 0 
//       ? matchedTags.length / userPreferences.length 
//       : 0.5;

//     // 2. Điểm chi phí: Chi phí càng thấp thì điểm càng cao
//     const costScore = 1 - Math.min(place.estimatedCost / maxCost, 1);

//     // 3. Điểm phổ biến (có sẵn trong DB từ 0.0 -> 1.0)
//     const popularityScore = place.popularity || 0.5;

//     // Tổng điểm có trọng số
//     const totalScore = 
//       weights.wPreference * preferenceScore +
//       weights.wPopularity * popularityScore +
//       weights.wCost * costScore;

//     return {
//       ...place,
//       preferenceScore,
//       costScore,
//       popularityScore,
//       totalScore
//     };
//   }).sort((a, b) => b.totalScore - a.totalScore); // Sắp xếp giảm dần theo điểm tổng
// }




/**
 * Bước 2 (Phiên bản cải tiến): Chấm điểm độ phù hợp của từng địa điểm
 * 
 * Công thức mới gồm 2 pha:
 * - Pha 1 (Điểm cơ sở):
 *   BaseScore(i) = w1 * Preference(i) + w2 * RatingScore(i) + w3 * CostScore(i)
 *   (Thay thế Popularity bằng Rating chuẩn hóa về thang 0.0 -> 1.0)
 * - Pha 2 (Phạt trùng lặp loại địa điểm - Diversity Penalty):
 *   TotalScore(i) = max(0, BaseScore(i) - DiversityPenalty(i))
 *   Hạn chế chọn quá nhiều địa điểm cùng loại trong cùng một Zone.
 *
 * @param {import('../../types/plan.types.js').PlaceEntity[]} places
 * @param {string[]} [userPreferences=[]]
 * @param {{ wPreference?: number, wRating?: number, wPopularity?: number, wCost?: number }} [weights]
 */
export function scorePlaces(
  places,
  userPreferences = [],
  weights = { wPreference: 0.5, wRating: 0.3, wCost: 0.2 }
) {
  if (!Array.isArray(places) || places.length === 0) {
    return [];
  }

  const prefs = Array.isArray(userPreferences) ? userPreferences : [];
  const wPreference = weights.wPreference ?? 0.5;
  // Hỗ trợ tương thích ngược nếu nơi gọi truyền weights.wPopularity
  const wRating = weights.wRating ?? weights.wPopularity ?? 0.3;
  const wCost = weights.wCost ?? 0.2;

  const maxCost = Math.max(...places.map(p => Number(p.estimatedCost) || 0), 100000);

  // Pha 1: Tính baseScore với rating thay cho popularity
  const baseScoredPlaces = places.map(place => {
    const tags = Array.isArray(place.tags) ? place.tags : [];
    const estimatedCost = Number(place.estimatedCost) || 0;

    // 1. Điểm sở thích: Tỷ lệ tag trùng với preferences của người dùng
    const matchedTags = tags.filter(t => prefs.includes(t));
    const preferenceScore = prefs.length > 0
      ? matchedTags.length / prefs.length
      : 0.5;

    // 2. Điểm đánh giá (Rating): Chuẩn hóa từ thang 5.0 về [0, 1], mặc định 4.5 nếu DB chưa có
    const rawRating = Number(place.rating) || 4.5;
    const ratingScore = Math.min(Math.max(rawRating / 5.0, 0), 1);

    // 3. Điểm chi phí: Chi phí càng thấp thì điểm càng cao
    const costScore = 1 - Math.min(estimatedCost / maxCost, 1);

    const baseScore =
      wPreference * preferenceScore +
      wRating * ratingScore +
      wCost * costScore;

    return {
      ...place,
      preferenceScore,
      ratingScore,
      costScore,
      baseScore
    };
  });

  // Sắp xếp sơ bộ giảm dần theo baseScore trước khi tính mức phạt đa dạng
  baseScoredPlaces.sort((a, b) => b.baseScore - a.baseScore);

  // Pha 2: Phạt trùng lặp loại địa điểm (Diversity Penalty) theo từng Zone và toàn cục
  const zoneTypeCounts = new Map();
  const globalTypeCounts = new Map();

  const finalScoredPlaces = baseScoredPlaces.map(place => {
    const tags = Array.isArray(place.tags) ? place.tags : [];
    const primaryType = tags[0] || 'other';
    const zoneKey = `${place.zoneId ?? 'unknown'}:${primaryType}`;

    const typeCountInZone = zoneTypeCounts.get(zoneKey) || 0;
    const globalCount = globalTypeCounts.get(primaryType) || 0;

    // Phạt lũy tiến trong cùng Zone: lần 1 = 0, lần 2 = 0.08, từ lần 3 trở đi = 0.15 * số lần
    let diversityPenalty = 0;
    if (typeCountInZone === 1) {
      diversityPenalty = 0.08;
    } else if (typeCountInZone >= 2) {
      diversityPenalty = 0.15 * typeCountInZone;
    }

    zoneTypeCounts.set(zoneKey, typeCountInZone + 1);
    globalTypeCounts.set(primaryType, globalCount + 1);

    const totalScore = Math.max(0, Number((place.baseScore - diversityPenalty).toFixed(4)));

    return {
      ...place,
      primaryType,
      diversityPenalty,
      totalScore
    };
  });

  // Sắp xếp lại giảm dần theo totalScore cuối cùng
  return finalScoredPlaces.sort((a, b) => b.totalScore - a.totalScore);
}

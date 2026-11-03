/**
 * Bước 2: Chấm điểm độ phù hợp của từng địa điểm
 * Công thức: Score(i) = w1 * Preference(i) + w2 * Popularity(i) + w3 * CostScore(i)
 * 
 * @param {import('../../types/plan.types.js').PlaceEntity[]} places
 * @param {string[]} userPreferences
 * @param {{ wPreference?: number, wPopularity?: number, wCost?: number }} [weights]
 */
export function scorePlaces(
  places,
  userPreferences,
  weights = { wPreference: 0.5, wPopularity: 0.3, wCost: 0.2 }
) {
  const maxCost = Math.max(...places.map(p => p.estimatedCost), 100000);

  return places.map(place => {
    // 1. Điểm sở thích: Tỷ lệ tag trùng với preferences của người dùng
    const matchedTags = place.tags.filter(t => userPreferences.includes(t));
    const preferenceScore = userPreferences.length > 0 
      ? matchedTags.length / userPreferences.length 
      : 0.5;

    // 2. Điểm chi phí: Chi phí càng thấp thì điểm càng cao
    const costScore = 1 - Math.min(place.estimatedCost / maxCost, 1);

    // 3. Điểm phổ biến (có sẵn trong DB từ 0.0 -> 1.0)
    const popularityScore = place.popularity || 0.5;

    // Tổng điểm có trọng số
    const totalScore = 
      weights.wPreference * preferenceScore +
      weights.wPopularity * popularityScore +
      weights.wCost * costScore;

    return {
      ...place,
      preferenceScore,
      costScore,
      popularityScore,
      totalScore
    };
  }).sort((a, b) => b.totalScore - a.totalScore); // Sắp xếp giảm dần theo điểm tổng
}

/**
 * Xây dựng User Prompt cho phương án 1 (Không có RAG - Direct JSON)
 * @param {any[]} days
 * @param {string[]} userPreferences
 */
export function buildDirectJsonPrompt(days, userPreferences) {
  return `
Dưới đây là dữ liệu thô các ngày tham quan đã được thuật toán Backend phân vùng Zone và kiểm soát ngân sách:

Sở thích của khách du lịch: ${userPreferences.join(', ')}

DỮ LIỆU LỊCH TRÌNH:
${JSON.stringify(days, null, 2)}

HÃY TRẢ VỀ JSON theo schema sau (giữ nguyên placeId, chỉ bổ sung/cập nhật title của ngày và aiDescription cho từng activity):
{
  "overallSummary": "Đoạn văn ngắn tổng quan chuyến đi (2-3 câu)",
  "days": [
    {
      "dayNumber": 1,
      "title": "Tiêu đề hấp dẫn cho ngày 1",
      "activities": [
        {
          "placeId": 1,
          "aiDescription": "Đoạn mô tả trải nghiệm 2 câu súc tích"
        }
      ]
    }
  ]
}
`;
}

/**
 * Xây dựng User Prompt cho phương án 2 (Có RAG - Knowledge Augmented)
 * @param {any[]} days
 * @param {string[]} userPreferences
 * @param {string[]} retrievedContexts
 */
export function buildRagEnrichedPrompt(
  days,
  userPreferences,
  retrievedContexts
) {
  return `
DỮ LIỆU LỊCH TRÌNH ĐÃ PHÂN BỔ:
${JSON.stringify(days, null, 2)}

TRI THỨC BỔ TRỢ ĐƯỢC TRUY XUẤT (RETRIEVED KNOWLEDGE BASE):
${retrievedContexts.join('\n\n---\n\n')}

HÃY TRẢ VỀ JSON theo schema sau:
{
  "overallSummary": "Đoạn văn tổng quan hành trình kết hợp cẩm nang",
  "days": [
    {
      "dayNumber": 1,
      "title": "Tiêu đề độc đáo dựa trên đặc trưng Zone",
      "activities": [
        {
          "placeId": 1,
          "aiDescription": "Mô tả trải nghiệm sinh động",
          "aiTravelTip": "Tips thực tế từ cẩm nang (món nên gọi, góc chụp ảnh, lưu ý)"
        }
      ]
    }
  ]
}
`;
}

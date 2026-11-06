/**
 * @file Định nghĩa cấu trúc dữ liệu chuẩn (JSDoc schema) cho toàn bộ hệ thống GeoZone AI
 */

/**
 * @typedef {Object} UserProfile
 * @property {number} id - ID người dùng
 * @property {string} email - Email người dùng
 * @property {string} name - Họ tên người dùng
 * @property {string} [avatar] - Đường dẫn avatar
 * @property {'USER' | 'ADMIN'} role - Vai trò tài khoản
 * @property {string} createdAt - Ngày tạo
 */

/**
 * @typedef {Object} SavedPlanItem
 * @property {number} id - ID lịch trình đã lưu
 * @property {number} userId - ID người dùng sở hữu
 * @property {string} planTitle - Tiêu đề lịch trình
 * @property {string} city - Thành phố
 * @property {number} totalDays - Tổng số ngày
 * @property {number} totalBudget - Ngân sách dự chi
 * @property {number} actualCost - Chi phí thực tế
 * @property {'DIRECT_JSON' | 'RAG_AUGMENTED'} strategyUsed - Chế độ AI
 * @property {GeneratedPlan} [planData] - Dữ liệu chi tiết của lịch trình
 * @property {string} createdAt - Ngày lưu
 * @property {string} updatedAt - Ngày cập nhật
 */

/**
 * @typedef {Object} UserTripRequest
 * @property {string} city - Tên thành phố (ví dụ: "Da Nang")
 * @property {number} days - Số ngày lưu trú (ví dụ: 2)
 * @property {number} totalBudget - Tổng ngân sách dự kiến (VNĐ)
 * @property {string[]} preferences - Danh sách sở thích (["food", "beach", "culture"])
 * @property {string} [startTime] - Mốc bắt đầu ngày (mặc định "08:00")
 * @property {string} [endTime] - Mốc kết thúc ngày (mặc định "21:00")
 * @property {boolean} [enableRag] - Có kích hoạt chế độ RAG hay không
 */

/**
 * @typedef {Object} PlaceEntity
 * @property {number} id - Mã định danh địa điểm
 * @property {string} name - Tên địa điểm
 * @property {string} city - Thành phố
 * @property {number} zoneId - ID khu vực
 * @property {string} [zoneCode] - Mã zone (Z1, Z2...)
 * @property {string} [zoneName] - Tên hiển thị của zone
 * @property {string} [address] - Địa chỉ
 * @property {number} estimatedCost - Chi phí dự kiến (VNĐ)
 * @property {number} duration - Thời gian trải nghiệm (phút)
 * @property {string} [openingTime] - Giờ mở cửa
 * @property {string} [closingTime] - Giờ đóng cửa
 * @property {number} [latitude] - Vĩ độ
 * @property {number} [longitude] - Kinh độ
 * @property {number} popularity - Độ phổ biến (0.0 -> 1.0)
 * @property {string[]} tags - Các tag thể loại
 */

/**
 * @typedef {PlaceEntity & {
 *   preferenceScore: number,
 *   costScore: number,
 *   popularityScore: number,
 *   totalScore: number
 * }} ScoredPlace
 */

/**
 * @typedef {Object} ScheduledActivity
 * @property {number} placeId - ID địa điểm
 * @property {string} placeName - Tên địa điểm
 * @property {number} zoneId - ID khu vực
 * @property {string} zoneName - Tên khu vực
 * @property {string} timeSlot - Khung giờ (ví dụ: "08:00 - 09:30")
 * @property {string} startTime - Giờ bắt đầu
 * @property {string} endTime - Giờ kết thúc
 * @property {number} duration - Thời lượng (phút)
 * @property {number} estimatedCost - Chi phí (VNĐ)
 * @property {number} travelTimeFromPrev - Thời gian di chuyển từ điểm trước (phút)
 * @property {string} [aiDescription] - Mô tả narrative do LLM sinh ra
 * @property {string} [aiTravelTip] - Mẹo thực tế do RAG bổ trợ
 * @property {number} [latitude] - Vĩ độ
 * @property {number} [longitude] - Kinh độ
 */

/**
 * @typedef {Object} DayItinerary
 * @property {number} dayNumber - Ngày thứ mấy (1, 2, 3...)
 * @property {number} zoneId - ID khu vực trọng tâm của ngày
 * @property {string} zoneName - Tên khu vực
 * @property {string} title - Tiêu đề ngày do LLM sinh
 * @property {number} totalEstimatedCost - Tổng chi phí trong ngày (VNĐ)
 * @property {number} totalDurationMin - Tổng thời lượng trong ngày (phút)
 * @property {ScheduledActivity[]} activities - Danh sách hoạt động
 */

/**
 * @typedef {Object} GeneratedPlan
 * @property {string} planId - Mã lịch trình
 * @property {string} city - Thành phố
 * @property {number} totalDays - Tổng số ngày
 * @property {number} totalBudget - Ngân sách yêu cầu
 * @property {number} actualCost - Chi phí thực tế tính toán được
 * @property {'DIRECT_JSON' | 'RAG_AUGMENTED'} strategyUsed - Chế độ AI đã sử dụng
 * @property {string} overallSummary - Tóm tắt toàn chuyến đi
 * @property {DayItinerary[]} days - Lịch trình từng ngày
 */

export {};

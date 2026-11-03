/**
 * Định nghĩa Type / Interface cho toàn bộ hệ thống GeoZone AI
 */

export interface UserTripRequest {
  city: string;
  days: number;
  totalBudget: number;
  preferences: string[]; // ['food', 'beach', 'culture', ...]
  startTime?: string;    // Mặc định "08:00"
  endTime?: string;      // Mặc định "21:00"
  enableRag?: boolean;   // Flag toggle phương án RAG hay Không RAG
}

export interface PlaceEntity {
  id: number;
  name: string;
  city: string;
  zoneId: number;
  zoneCode?: string;
  zoneName?: string;
  address?: string | null;
  estimatedCost: number;
  duration: number; // Phút
  openingTime?: string | null;
  closingTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  popularity: number;
  tags: string[];
}

export interface ScoredPlace extends PlaceEntity {
  preferenceScore: number;
  costScore: number;
  popularityScore: number;
  totalScore: number;
}

export interface ScheduledActivity {
  placeId: number;
  placeName: string;
  zoneId: number;
  zoneName: string;
  timeSlot: string;      // Ví dụ: "08:00 - 09:30"
  startTime: string;     // "08:00"
  endTime: string;       // "09:30"
  duration: number;      // 90 phút
  estimatedCost: number;
  travelTimeFromPrev: number; // Thời gian di chuyển từ điểm trước (phút)
  aiDescription?: string;     // Lời văn do LLM sinh ra
  aiTravelTip?: string;       // Tips chi tiết (khi dùng RAG)
  latitude?: number | null;
  longitude?: number | null;
}

export interface DayItinerary {
  dayNumber: number;
  zoneId: number;
  zoneName: string;
  title: string;             // Tiêu đề ngày do LLM sinh (ví dụ: "Ngày 1: Hành trình khám phá nét cổ xưa")
  totalEstimatedCost: number;
  totalDurationMin: number;
  activities: ScheduledActivity[];
}

export interface GeneratedPlan {
  planId: string;
  city: string;
  totalDays: number;
  totalBudget: number;
  actualCost: number;
  strategyUsed: 'DIRECT_JSON' | 'RAG_AUGMENTED';
  overallSummary: string;
  days: DayItinerary[];
}

export interface DynamicSwapRequest {
  currentPlaceId: number;
  dayNumber: number;
  excludedPlaceIds: number[];
  targetZoneId: number;
  remainingBudget: number;
  userPreferences: string[];
}

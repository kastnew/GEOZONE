export interface TripInputState {
  city: string;
  days: number;
  totalBudget: number;
  preferences: string[];
  enableRag: boolean;
}

export interface ActivityItem {
  placeId: number;
  placeName: string;
  zoneId: number;
  zoneName: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedCost: number;
  travelTimeFromPrev: number;
  aiDescription?: string;
  aiTravelTip?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DayPlan {
  dayNumber: number;
  zoneId: number;
  zoneName: string;
  title: string;
  totalEstimatedCost: number;
  totalDurationMin: number;
  activities: ActivityItem[];
}

export interface GeneratedPlanResponse {
  planId: string;
  city: string;
  totalDays: number;
  totalBudget: number;
  actualCost: number;
  strategyUsed: 'DIRECT_JSON' | 'RAG_AUGMENTED';
  overallSummary: string;
  days: DayPlan[];
}

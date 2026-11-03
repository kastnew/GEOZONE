import { DayItinerary, GeneratedPlan, UserTripRequest } from '../../../types/plan.types.js';

export interface IAiNarrativeStrategy {
  readonly strategyName: 'DIRECT_JSON' | 'RAG_AUGMENTED';

  /**
   * Phương thức nhận Draft Days đã được Backend tính toán, dùng AI để biên tập nội dung
   */
  generateNarrative(
    draftDays: DayItinerary[],
    request: UserTripRequest,
    totalActualCost: number
  ): Promise<GeneratedPlan>;
}

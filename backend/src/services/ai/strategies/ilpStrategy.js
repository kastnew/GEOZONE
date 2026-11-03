/**
 * Base Strategy Class cho AI Narrative Generator
 */
export class BaseAiNarrativeStrategy {
  constructor(name) {
    this.strategyName = name;
  }

  /**
   * Phương thức nhận Draft Days đã được Backend tính toán, dùng AI để biên tập nội dung
   * @param {any[]} draftDays
   * @param {any} request
   * @param {number} totalActualCost
   * @returns {Promise<any>}
   */
  async generateNarrative(draftDays, request, totalActualCost) {
    throw new Error('Method generateNarrative must be implemented');
  }
}

/**
 * @file JSDoc schema cho Frontend
 */

/**
 * @typedef {Object} UserProfile
 * @property {number} id
 * @property {string} email
 * @property {string} name
 * @property {string} [avatar]
 * @property {'USER' | 'ADMIN'} role
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SavedPlanItem
 * @property {number} id
 * @property {string} planTitle
 * @property {string} city
 * @property {number} totalDays
 * @property {number} totalBudget
 * @property {number} actualCost
 * @property {'DIRECT_JSON' | 'RAG_AUGMENTED'} strategyUsed
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {GeneratedPlanResponse} [planData]
 */

/**
 * @typedef {Object} TripInputState
 * @property {string} city
 * @property {number} days
 * @property {number} totalBudget
 * @property {string[]} preferences
 * @property {boolean} enableRag
 */

/**
 * @typedef {Object} ActivityItem
 * @property {number} placeId
 * @property {string} placeName
 * @property {number} zoneId
 * @property {string} zoneName
 * @property {string} timeSlot
 * @property {string} startTime
 * @property {string} endTime
 * @property {number} duration
 * @property {number} estimatedCost
 * @property {number} travelTimeFromPrev
 * @property {string} [aiDescription]
 * @property {string} [aiTravelTip]
 * @property {number} [latitude]
 * @property {number} [longitude]
 */

/**
 * @typedef {Object} DayPlan
 * @property {number} dayNumber
 * @property {number} zoneId
 * @property {string} zoneName
 * @property {string} title
 * @property {number} totalEstimatedCost
 * @property {number} totalDurationMin
 * @property {ActivityItem[]} activities
 */

/**
 * @typedef {Object} GeneratedPlanResponse
 * @property {string} planId
 * @property {string} city
 * @property {number} totalDays
 * @property {number} totalBudget
 * @property {number} actualCost
 * @property {'DIRECT_JSON' | 'RAG_AUGMENTED'} strategyUsed
 * @property {string} overallSummary
 * @property {DayPlan[]} days
 */

export {};

/**
 * Cost model for Streamlight pass comparison.
 * Pure logic: given inputs and pricing data, returns annual cost for each plan.
 * Pricing comes from the data layer (CSV); no hardcoded constants.
 */

/**
 * Calculate annual cost for each plan (golf + practice where applicable).
 * @param {Object} scenario - From readScenario(): rounds, cartPercent, twilightPercent, practiceSessionsPerWeek, rangeBucketSize, etc.
 * @param {Object} pricing - From pricing data layer (getPricingForModel())
 * @returns {{ payAsYouGo: number, coursePass: number, allInclusive: number }}
 */
export function calculateCosts(scenario, pricing) {
  const { rounds = 0, cartPercent = 0, twilightPercent = 0, practiceSessionsPerWeek = 0 } = scenario;
  const cartPct = Math.max(0, Math.min(100, cartPercent || 0)) / 100;
  const twiPct = Math.max(0, Math.min(50, twilightPercent || 0)) / 100;

  const regularGreen = pricing?.regularGreen ?? 35;
  const twilightGreen = pricing?.twilightGreen ?? 27;
  const cartFee = pricing?.cartFee ?? 15;
  const coursePassAnnual = pricing?.coursePass ?? 975;
  const allInclusiveAnnual = pricing?.allInclusive ?? 2300;
  const bucketPrice = pricing?.bucketPrice ?? 9;

  const avgGreenFee = (1 - twiPct) * regularGreen + twiPct * twilightGreen;
  const cartPerRound = cartFee * cartPct;
  const avgRoundCost = avgGreenFee + cartPerRound;
  const golfCost = rounds * avgRoundCost;

  const sessionsPerWeek = Math.max(0, Math.min(7, practiceSessionsPerWeek || 0));
  const practiceSessionsPerYear = sessionsPerWeek * 52;
  const practiceCost = practiceSessionsPerYear * bucketPrice;

  return {
    payAsYouGo: golfCost + practiceCost,
    coursePass: coursePassAnnual + practiceCost,
    allInclusive: allInclusiveAnnual
  };
}

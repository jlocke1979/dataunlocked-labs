/**
 * Cost model for Streamlight pass comparison.
 * Pure logic: given inputs and pricing data, returns annual cost for each plan.
 * Pricing comes from the data layer (CSV); no hardcoded constants.
 */

/**
 * Calculate annual cost for each plan.
 * Range cost is included only in Pay As You Go; membership plans that include range do not add it.
 * @param {Object} scenario - From readScenario(): rounds, cartPercent, twilightPercent, rangeBucketsPerSeason, rangeBucketSize, etc.
 * @param {Object} pricing - From pricing data layer (getPricingForModel())
 * @returns {{ payAsYouGo: number, coursePass: number, allInclusive: number }}
 */
export function calculateCosts(scenario, pricing) {
  const { rounds = 0, cartPercent = 0, twilightPercent = 0, rangeBucketsPerSeason = 0 } = scenario;
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

  const buckets = Math.max(0, Math.min(120, rangeBucketsPerSeason || 0));
  const rangeCost = buckets * bucketPrice;

  return {
    payAsYouGo: golfCost + rangeCost,
    coursePass: coursePassAnnual,
    allInclusive: allInclusiveAnnual
  };
}

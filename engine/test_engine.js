import { compareOptions } from "./pricing_engine.js";

const result = compareOptions({
  rounds: 50,
  greenFee: 25,
  cartFee: 15,
  cartUsageRate: 0.5,
  membershipCost: 1200
});

console.log(result);

import { generateCostCurve } from "./pricing_engine.js";

const curve = generateCostCurve({
  greenFee: 25,
  cartFee: 15,
  cartUsageRate: 0.5,
  membershipCost: 1200
}, 366);

console.log(curve);

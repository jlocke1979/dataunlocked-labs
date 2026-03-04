/**
 * Pricing data layer: dimension-based golf pricing from CSV.
 * Schema: course, player_type, item, holes, day_type, time_of_day, price
 * No category string parsing; filter by dimensions only.
 */

let _rows = [];

function trim(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

/**
 * Load pricing from a CSV URL. Uses fetch (no d3 dependency).
 * @param {string} url - Path to CSV
 * @returns {Promise<Array>}
 */
export function loadPricing(url) {
  return fetch(url)
    .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.text(); })
    .then((text) => {
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) return [];
      const headers = lines[0].split(",").map((h) => h.trim());
      const raw = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return headers.reduce((o, h, i) => { o[h] = values[i] ?? ""; return o; }, {});
      });
      _rows = raw.map((d) => ({
        course: trim(d.course),
        player_type: trim(d.player_type),
        item: trim(d.item),
        holes: parseInt(d.holes, 10) || 0,
        day_type: trim(d.day_type),
        time_of_day: trim(d.time_of_day),
        price: +d.price || 0
      }));
      return _rows;
    });
}

/** True if dimension matches: filter is wildcard, row value is wildcard, or they're equal. */
function dimMatch(rowVal, filterVal) {
  const r = trim(rowVal);
  const f = trim(filterVal);
  return f === "*" || f === "any" || r === "*" || r === "any" || r === f;
}

/**
 * Match a single row by dimensions. "*" or "any" matches any value for that dimension.
 * @returns {Object|null} Row or null
 */
function matchRow(course, playerType, item, holes, dayType, timeOfDay) {
  const c = trim(course);
  const p = trim(playerType);
  const i = trim(item);
  const h = holes == null || holes === "*" || holes === "any" ? null : parseInt(holes, 10);
  const d = trim(dayType);
  const t = trim(timeOfDay);

  return _rows.find((r) => {
    if (!dimMatch(r.course, c)) return false;
    if (!dimMatch(r.player_type, p)) return false;
    if (r.item !== i) return false;
    if (h != null && r.holes !== h) return false;
    if (!dimMatch(r.day_type, d)) return false;
    if (!dimMatch(r.time_of_day, t)) return false;
    return true;
  }) || null;
}

/**
 * Get price for exact or wildcard dimensions.
 * @param {string} course
 * @param {string} playerType
 * @param {string} item - e.g. "green", "cart", "course_pass", "all_inclusive"
 * @param {number|string} [holes] - 0, 9, 18, or "*" / "any"
 * @param {string} [dayType] - "weekday", "weekend", "any"
 * @param {string} [timeOfDay] - "regular", "twilight", "any"
 * @returns {number|null}
 */
export function getPrice(course, playerType, item, holes, dayType, timeOfDay) {
  const row = matchRow(course, playerType, item, holes, dayType, timeOfDay);
  if (row) return row.price;
  const fallback = matchRow("*", "*", item, holes ?? "*", dayType ?? "any", timeOfDay ?? "any");
  return fallback ? fallback.price : null;
}

/**
 * Get all rows matching optional dimension filters. Omitted or "*" / "any" matches all.
 * @param {Object} filters - { course, player_type, item, holes, day_type, time_of_day }
 * @returns {Array<{course, player_type, item, holes, day_type, time_of_day, price}>}
 */
export function getRows(filters = {}) {
  const {
    course,
    player_type,
    item,
    holes,
    day_type,
    time_of_day
  } = filters;

  const cf = course != null ? trim(course) : null;
  const pf = player_type != null ? trim(player_type) : null;
  const itemFilter = item != null ? trim(item) : null;
  const hf = holes != null && holes !== "*" && holes !== "any" ? parseInt(holes, 10) : null;
  const df = day_type != null ? trim(day_type) : null;
  const tf = time_of_day != null ? trim(time_of_day) : null;

  return _rows.filter((r) => {
    if (cf != null && !dimMatch(r.course, cf)) return false;
    if (pf != null && !dimMatch(r.player_type, pf)) return false;
    if (itemFilter != null && r.item !== itemFilter) return false;
    if (hf != null && r.holes !== hf) return false;
    if (df != null && !dimMatch(r.day_type, df)) return false;
    if (tf != null && !dimMatch(r.time_of_day, tf)) return false;
    return true;
  });
}

/**
 * Get all green fee rows for a course/player (for weighted averages).
 * @param {string} [course] - default "*"
 * @param {string} [playerType] - default "adult"
 */
export function getGreenPrices(course = "*", playerType = "adult") {
  return getRows({ course, player_type: playerType, item: "green" });
}

/**
 * Compute expected green fee from dimension-based weights.
 * Supports weighted averages for weekday vs weekend, twilight vs regular, 9 vs 18 holes.
 * @param {string} [course] - default "*" (average across courses)
 * @param {string} [playerType] - default "adult"
 * @param {Object} weights
 * @param {number} [weights.weekdayPct] - 0..1, share of rounds on weekday (default 0.5)
 * @param {number} [weights.weekendPct] - 0..1, share on weekend (default 0.5)
 * @param {number} [weights.twilightPct] - 0..1, share at twilight (default 0)
 * @param {number} [weights.holes9Pct] - 0..1, share 9-hole rounds (default 0)
 * @returns {number} Expected $ per round (green fee only)
 */
export function getExpectedGreenFee(course = "*", playerType = "adult", weights = {}) {
  const greenRows = getGreenPrices(course, playerType);
  if (greenRows.length === 0) {
    const any = getGreenPrices("*", "*");
    if (any.length === 0) return null;
    return any.reduce((s, r) => s + r.price, 0) / any.length;
  }

  const {
    weekdayPct = 0.5,
    weekendPct = 0.5,
    twilightPct = 0,
    holes9Pct = 0
  } = weights;
  const regularPct = 1 - twilightPct;
  const holes18Pct = 1 - holes9Pct;

  let total = 0;
  let totalWeight = 0;
  for (const r of greenRows) {
    let wDay = 1;
    if (r.day_type === "weekday") wDay = weekdayPct;
    else if (r.day_type === "weekend") wDay = weekendPct;
    else if (r.day_type === "any") wDay = 1;
    else continue;

    let wTime = 1;
    if (r.time_of_day === "regular") wTime = regularPct;
    else if (r.time_of_day === "twilight") wTime = twilightPct;
    else if (r.time_of_day === "any") wTime = 1;
    else continue;

    let wHoles = 1;
    if (r.holes === 9) wHoles = holes9Pct;
    else if (r.holes === 18) wHoles = holes18Pct;
    else if (r.holes === 0) wHoles = 1;
    else continue;

    const w = wDay * wTime * wHoles;
    total += r.price * w;
    totalWeight += w;
  }
  if (totalWeight <= 0) return null;
  return total / totalWeight;
}

/**
 * Get range bucket price by size (small, medium, large). Uses dataset; fallback if missing.
 * @param {string} bucketSize - "small", "medium", or "large"
 * @returns {number}
 */
export function getRangeBucketPrice(bucketSize) {
  const size = trim(bucketSize || "medium");
  const price = getPrice("*", "*", "range", 0, "any", size);
  return price ?? (size === "small" ? 6 : size === "large" ? 12 : 9);
}

/**
 * Build the pricing object expected by the cost model.
 * Uses dimension-based lookups: no category string parsing.
 * For green fees, averages by time_of_day (regular vs twilight) so the cost model can blend with twilightPercent.
 * Optional weights support weekday/weekend and 9/18 for future scenario modeling.
 * @param {Object} [weights] - Optional { weekdayPct, weekendPct, twilightPct, holes9Pct } for expected round cost
 * @param {string} [rangeBucketSize] - "small", "medium", "large" for practice cost
 * @returns {{ regularGreen, twilightGreen, cartFee, coursePass, allInclusive, bucketPrice }}
 */
export function getPricingForModel(weights = null, rangeBucketSize = "medium") {
  let regularGreen, twilightGreen;

  if (weights && (weights.weekdayPct != null || weights.weekendPct != null || weights.holes9Pct != null)) {
    const expected = getExpectedGreenFee("*", "adult", weights);
    regularGreen = twilightGreen = expected ?? 35;
  } else {
    const greenRows = getGreenPrices("*", "adult");
    if (greenRows.length === 0) {
      regularGreen = 35;
      twilightGreen = 27;
    } else {
      const regularRows = greenRows.filter((r) => r.time_of_day === "regular");
      const twilightRows = greenRows.filter((r) => r.time_of_day === "twilight");
      const mean = (arr) => (arr.length ? arr.reduce((s, r) => s + r.price, 0) / arr.length : null);
      regularGreen = mean(regularRows) ?? 35;
      twilightGreen = mean(twilightRows) ?? 27;
    }
  }

  const cartFee = getPrice("*", "*", "cart", 0, "any", "any")
    ?? getPrice("*", "*", "cart", "*", "any", "any") ?? 15;
  const coursePass = getPrice("*", "*", "course_pass", 0, "any", "any") ?? 975;
  const allInclusive = getPrice("*", "*", "all_inclusive", 0, "any", "any") ?? 2300;
  const bucketPrice = getRangeBucketPrice(rangeBucketSize);

  return {
    regularGreen,
    twilightGreen,
    cartFee,
    coursePass,
    allInclusive,
    bucketPrice
  };
}

/**
 * Compute expected round cost (green + cart) using dimension weights.
 * For flexible scenario modeling when UI adds weekday/weekend and 9/18 controls.
 * @param {string} [course]
 * @param {string} [playerType]
 * @param {Object} weights - { weekdayPct, weekendPct, twilightPct, holes9Pct, cartUsagePct }
 * @returns {number|null}
 */
export function getExpectedRoundCost(course = "*", playerType = "adult", weights = {}) {
  const greenFee = getExpectedGreenFee(course, playerType, weights);
  if (greenFee == null) return null;
  const cartFee = getPrice("*", "*", "cart", 0, "any", "any") ?? 15;
  const cartPct = Math.max(0, Math.min(1, weights.cartUsagePct ?? 0.5));
  return greenFee + cartFee * cartPct;
}

export function isLoaded() {
  return _rows.length > 0;
}

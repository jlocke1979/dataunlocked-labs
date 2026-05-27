export const HARD_CONSTRAINTS = {
  maxSeatedCapacity: 845,
  maxStandingCapacity: 905
};

export const EVENT_TYPES = [
  {
    id: "ticketed",
    label: "Ticketed Performance Events",
    capacityMode: "standing",
    hasCalendar: true
  },
  {
    id: "weddings",
    label: "Weddings/Private Rentals",
    capacityMode: "seated"
  },
  {
    id: "corporate",
    label: "Corporate Rentals",
    capacityMode: "seated"
  },
  {
    id: "nonprofit",
    label: "Nonprofit/Community Rentals",
    capacityMode: "seated"
  },
  {
    id: "kitchen",
    label: "Kitchen-Enabled Events/Catering",
    capacityMode: "standing"
  },
  {
    id: "sponsorship",
    label: "Sponsorship/Grants/Donations",
    capacityMode: "none"
  }
];

export const FACILITY_PROFILE = {
  approximateSquareFeet: 52000,
  note:
    "Large multi-purpose assembly venue (~50,000+ sq ft). Cost line items use directional industry placeholders scaled to footprint."
};

export const fixedCostLineItems = [
  {
    key: "propertyTaxes",
    label: "Property Taxes",
    min: 0,
    max: 500000,
    step: 1000,
    type: "number",
    format: "currency",
    note: "Known anchor for this scenario"
  },
  {
    key: "insurance",
    label: "Property & Liability Insurance",
    min: 0,
    max: 500000,
    step: 5000,
    type: "number",
    format: "currency",
    note: "~$2.75/sq ft placeholder for large assembly use"
  },
  {
    key: "utilities",
    label: "Utilities (HVAC, electric, water)",
    min: 0,
    max: 800000,
    step: 5000,
    type: "number",
    format: "currency",
    note: "~$6/sq ft placeholder; active event schedule pushes usage up"
  },
  {
    key: "coreStaff",
    label: "Core Salaried Staff (loaded)",
    min: 0,
    max: 2000000,
    step: 10000,
    type: "number",
    format: "currency",
    note: "GM, ops, box office, facilities, admin (~10–12 FTE loaded)"
  },
  {
    key: "hourlyStaffPool",
    label: "Baseline Hourly Staff Pool",
    min: 0,
    max: 600000,
    step: 5000,
    type: "number",
    format: "currency",
    note: "Minimum part-time/event staffing allocation"
  },
  {
    key: "maintenanceRepairs",
    label: "Building Maintenance & Repairs",
    min: 0,
    max: 600000,
    step: 5000,
    type: "number",
    format: "currency",
    note: "~$3.75/sq ft placeholder for aging large-format building"
  },
  {
    key: "custodial",
    label: "Custodial / Janitorial",
    min: 0,
    max: 300000,
    step: 5000,
    type: "number",
    format: "currency"
  },
  {
    key: "securitySystems",
    label: "Security & Life-Safety Systems",
    min: 0,
    max: 200000,
    step: 1000,
    type: "number",
    format: "currency",
    note: "Monitoring, alarm, suppression service contracts"
  },
  {
    key: "marketingBase",
    label: "Baseline Marketing & Community",
    min: 0,
    max: 300000,
    step: 5000,
    type: "number",
    format: "currency"
  },
  {
    key: "adminProfessional",
    label: "Admin, Legal, Accounting",
    min: 0,
    max: 300000,
    step: 5000,
    type: "number",
    format: "currency"
  },
  {
    key: "technology",
    label: "Technology & Ticketing Platforms",
    min: 0,
    max: 200000,
    step: 1000,
    type: "number",
    format: "currency"
  },
  {
    key: "groundsMisc",
    label: "Grounds, Waste, Misc Facility",
    min: 0,
    max: 150000,
    step: 1000,
    type: "number",
    format: "currency"
  },
  {
    key: "occupancyReserve",
    label: "Occupancy / Debt Service Reserve",
    min: 0,
    max: 1500000,
    step: 10000,
    type: "number",
    format: "currency",
    note: "Placeholder for lease, debt service, or capital reserve — set to $0 if not applicable"
  }
];

export const constraintDefinitions = [
  {
    key: "activeWeeksPerYear",
    label: "Active Weeks per Year",
    min: 1,
    max: 52,
    step: 1,
    type: "number"
  },
  {
    key: "maxUsableEventNightsPerWeek",
    label: "Maximum Usable Event Nights per Week",
    min: 1,
    max: 7,
    step: 1,
    type: "number"
  },
  {
    key: "minOperatingResultTarget",
    label: "Minimum Annual Operating Result Target",
    min: -2000000,
    max: 2000000,
    step: 10000,
    type: "number",
    format: "currency"
  },
  {
    key: "maxAnnualFixedCosts",
    label: "Maximum Annual Fixed Costs (Ceiling)",
    min: 0,
    max: 10000000,
    step: 10000,
    type: "number",
    format: "currency",
    note: "Sustainability guardrail — typically set ~10–15% above the built-up fixed cost total"
  }
];

export const DAY_UTILIZATION_KEYS = [
  "mondayUtilizationPct",
  "tuesdayUtilizationPct",
  "wednesdayUtilizationPct",
  "thursdayUtilizationPct",
  "fridayUtilizationPct",
  "saturdayUtilizationPct",
  "sundayUtilizationPct"
];

export const calendarDefinitions = [
  {
    key: "mondayUtilizationPct",
    label: "Monday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "tuesdayUtilizationPct",
    label: "Tuesday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "wednesdayUtilizationPct",
    label: "Wednesday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "thursdayUtilizationPct",
    label: "Thursday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "fridayUtilizationPct",
    label: "Friday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "saturdayUtilizationPct",
    label: "Saturday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "sundayUtilizationPct",
    label: "Sunday Utilization %",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  }
];

export const rangeVariableDefinitions = [
  {
    key: "ticketedSelloutPct",
    label: "Ticketed Sellout % (of standing capacity)",
    min: 0.1,
    max: 1,
    step: 0.01,
    format: "percent"
  },
  {
    key: "ticketedAvgTicketPrice",
    label: "Average Ticket Price",
    min: 5,
    max: 150,
    step: 1,
    format: "currency"
  },
  {
    key: "ticketedAncillaryPerAttendee",
    label: "Ancillary Revenue per Attendee",
    min: 0,
    max: 50,
    step: 0.5,
    format: "currency"
  },
  {
    key: "calendarUtilizationScale",
    label: "Calendar Utilization Scale",
    min: 0.7,
    max: 1.3,
    step: 0.01,
    format: "percent",
    note: "Multiplies Mon–Sun utilization rates (1.0 = current calendar inputs)"
  },
  {
    key: "weddingEventsPerYear",
    label: "Wedding/Private Events per Year",
    min: 0,
    max: 80,
    step: 1,
    format: "number"
  },
  {
    key: "sponsorshipTotal",
    label: "Sponsorship/Grants Total (annual)",
    min: 0,
    max: 1000000,
    step: 5000,
    format: "currency"
  }
];

export const VARIANTS = [
  { id: "min", label: "Conservative (Min)" },
  { id: "base", label: "Base" },
  { id: "max", label: "Aggressive (Max)" }
];

export const defaultRanges = {
  ticketedSelloutPct: { min: 0.52, base: 0.65, max: 0.8 },
  ticketedAvgTicketPrice: { min: 30, base: 38, max: 48 },
  ticketedAncillaryPerAttendee: { min: 9, base: 14, max: 20 },
  calendarUtilizationScale: { min: 0.88, base: 1, max: 1.12 },
  weddingEventsPerYear: { min: 12, base: 18, max: 30 },
  sponsorshipTotal: { min: 250000, base: 380000, max: 610000 }
};

export const eventFieldDefinitions = [
  {
    key: "eventsPerYear",
    label: "Events per Year",
    min: 0,
    max: 365,
    step: 1,
    type: "number",
    computedFor: ["ticketed"]
  },
  {
    key: "avgAttendance",
    label: "Average Attendance",
    min: 0,
    max: HARD_CONSTRAINTS.maxStandingCapacity,
    step: 10,
    type: "number",
    hideFor: ["sponsorship", "ticketed"]
  },
  {
    key: "grossRevenuePerEvent",
    label: "Average Gross Revenue per Event",
    min: 0,
    max: 500000,
    step: 500,
    type: "number",
    format: "currency",
    hideFor: ["ticketed"]
  },
  {
    key: "directCostPct",
    label: "Direct Cost Percentage",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  }
];

const baseFixedCosts = {
  propertyTaxes: 85000,
  insurance: 145000,
  utilities: 335000,
  coreStaff: 920000,
  hourlyStaffPool: 225000,
  maintenanceRepairs: 195000,
  custodial: 125000,
  securitySystems: 48000,
  marketingBase: 80000,
  adminProfessional: 110000,
  technology: 62000,
  groundsMisc: 45000,
  occupancyReserve: 300000
};

const calendarPresets = {
  conservative: {
    mondayUtilizationPct: 0.08,
    tuesdayUtilizationPct: 0.1,
    wednesdayUtilizationPct: 0.12,
    thursdayUtilizationPct: 0.4,
    fridayUtilizationPct: 0.75,
    saturdayUtilizationPct: 0.9,
    sundayUtilizationPct: 0.2
  },
  baseCase: {
    mondayUtilizationPct: 0.08,
    tuesdayUtilizationPct: 0.1,
    wednesdayUtilizationPct: 0.12,
    thursdayUtilizationPct: 0.55,
    fridayUtilizationPct: 0.9,
    saturdayUtilizationPct: 0.95,
    sundayUtilizationPct: 0.3
  },
  aggressive: {
    mondayUtilizationPct: 0.12,
    tuesdayUtilizationPct: 0.15,
    wednesdayUtilizationPct: 0.18,
    thursdayUtilizationPct: 0.72,
    fridayUtilizationPct: 0.95,
    saturdayUtilizationPct: 0.98,
    sundayUtilizationPct: 0.4
  }
};

function scaleFixedCosts(factor, occupancyFactor = factor) {
  const scaled = {};
  for (const [key, value] of Object.entries(baseFixedCosts)) {
    scaled[key] =
      key === "propertyTaxes"
        ? value
        : key === "occupancyReserve"
          ? Math.round(value * occupancyFactor)
          : Math.round(value * factor);
  }
  return scaled;
}

export const presets = {
  conservative: {
    activeWeeksPerYear: 44,
    maxUsableEventNightsPerWeek: 4,
    minOperatingResultTarget: 0,
    maxAnnualFixedCosts: 2550000,
    fixedCostBreakdown: scaleFixedCosts(0.88, 0.5),
    ...calendarPresets.conservative,
    ranges: JSON.parse(JSON.stringify(defaultRanges)),
    eventTypes: {
      ticketed: {
        avgAttendance: 470,
        grossRevenuePerEvent: 28000,
        directCostPct: 0.68
      },
      weddings: {
        eventsPerYear: 10,
        avgAttendance: 320,
        grossRevenuePerEvent: 12000,
        directCostPct: 0.25
      },
      corporate: {
        eventsPerYear: 12,
        avgAttendance: 280,
        grossRevenuePerEvent: 7000,
        directCostPct: 0.2
      },
      nonprofit: {
        eventsPerYear: 18,
        avgAttendance: 220,
        grossRevenuePerEvent: 2800,
        directCostPct: 0.15
      },
      kitchen: {
        eventsPerYear: 24,
        avgAttendance: 180,
        grossRevenuePerEvent: 4500,
        directCostPct: 0.55
      },
      sponsorship: {
        eventsPerYear: 1,
        avgAttendance: 0,
        grossRevenuePerEvent: 250000,
        directCostPct: 0.05
      }
    }
  },
  baseCase: {
    activeWeeksPerYear: 48,
    maxUsableEventNightsPerWeek: 5,
    minOperatingResultTarget: 150000,
    maxAnnualFixedCosts: 3050000,
    fixedCostBreakdown: { ...baseFixedCosts },
    ...calendarPresets.baseCase,
    ranges: JSON.parse(JSON.stringify(defaultRanges)),
    eventTypes: {
      ticketed: {
        avgAttendance: 588,
        grossRevenuePerEvent: 35000,
        directCostPct: 0.65
      },
      weddings: {
        eventsPerYear: 18,
        avgAttendance: 380,
        grossRevenuePerEvent: 12000,
        directCostPct: 0.22
      },
      corporate: {
        eventsPerYear: 24,
        avgAttendance: 340,
        grossRevenuePerEvent: 9000,
        directCostPct: 0.18
      },
      nonprofit: {
        eventsPerYear: 20,
        avgAttendance: 260,
        grossRevenuePerEvent: 3500,
        directCostPct: 0.12
      },
      kitchen: {
        eventsPerYear: 36,
        avgAttendance: 220,
        grossRevenuePerEvent: 6200,
        directCostPct: 0.5
      },
      sponsorship: {
        eventsPerYear: 1,
        avgAttendance: 0,
        grossRevenuePerEvent: 380000,
        directCostPct: 0.04
      }
    }
  },
  aggressive: {
    activeWeeksPerYear: 50,
    maxUsableEventNightsPerWeek: 6,
    minOperatingResultTarget: 350000,
    maxAnnualFixedCosts: 3550000,
    fixedCostBreakdown: scaleFixedCosts(1.12, 1.25),
    ...calendarPresets.aggressive,
    ranges: JSON.parse(JSON.stringify(defaultRanges)),
    eventTypes: {
      ticketed: {
        avgAttendance: 724,
        grossRevenuePerEvent: 42000,
        directCostPct: 0.62
      },
      weddings: {
        eventsPerYear: 30,
        avgAttendance: 420,
        grossRevenuePerEvent: 15500,
        directCostPct: 0.2
      },
      corporate: {
        eventsPerYear: 45,
        avgAttendance: 400,
        grossRevenuePerEvent: 12000,
        directCostPct: 0.16
      },
      nonprofit: {
        eventsPerYear: 30,
        avgAttendance: 300,
        grossRevenuePerEvent: 4200,
        directCostPct: 0.1
      },
      kitchen: {
        eventsPerYear: 52,
        avgAttendance: 280,
        grossRevenuePerEvent: 7800,
        directCostPct: 0.48
      },
      sponsorship: {
        eventsPerYear: 1,
        avgAttendance: 0,
        grossRevenuePerEvent: 610000,
        directCostPct: 0.03
      }
    }
  }
};

export function cloneInputs(inputs) {
  return {
    ...inputs,
    fixedCostBreakdown: { ...inputs.fixedCostBreakdown },
    ranges: cloneRanges(inputs.ranges),
    eventTypes: Object.fromEntries(
      Object.entries(inputs.eventTypes).map(([id, values]) => [id, { ...values }])
    )
  };
}

export function cloneRanges(ranges = defaultRanges) {
  return Object.fromEntries(
    Object.entries(ranges).map(([key, value]) => [key, { ...value }])
  );
}

export function pickVariantValue(range, variantId) {
  const key =
    variantId === "min" || variantId === "conservative"
      ? "min"
      : variantId === "max" || variantId === "aggressive"
        ? "max"
        : "base";
  return range[key];
}

export function computeTicketedGrossPerEvent(selloutPct, ticketPrice, ancillaryPerAttendee) {
  const attendance = capAttendance(
    selloutPct * HARD_CONSTRAINTS.maxStandingCapacity,
    "standing"
  );
  return Math.round(attendance * (ticketPrice + ancillaryPerAttendee));
}

export function syncTicketedFromRangeBase(inputs) {
  if (!inputs.ranges) {
    inputs.ranges = cloneRanges(defaultRanges);
  }
  const sellout = pickVariantValue(inputs.ranges.ticketedSelloutPct, "base");
  const ticketPrice = pickVariantValue(inputs.ranges.ticketedAvgTicketPrice, "base");
  const ancillary = pickVariantValue(inputs.ranges.ticketedAncillaryPerAttendee, "base");
  inputs.eventTypes.ticketed.avgAttendance = Math.round(
    sellout * HARD_CONSTRAINTS.maxStandingCapacity
  );
  inputs.eventTypes.ticketed.grossRevenuePerEvent = computeTicketedGrossPerEvent(
    sellout,
    ticketPrice,
    ancillary
  );
}

export function applyVariant(inputs, variantId = "base") {
  const draft = cloneInputs(inputs);
  if (!draft.ranges) {
    draft.ranges = cloneRanges(defaultRanges);
  }
  const ranges = draft.ranges;

  const sellout = pickVariantValue(ranges.ticketedSelloutPct, variantId);
  const ticketPrice = pickVariantValue(ranges.ticketedAvgTicketPrice, variantId);
  const ancillary = pickVariantValue(ranges.ticketedAncillaryPerAttendee, variantId);
  draft.eventTypes.ticketed.avgAttendance = Math.round(
    sellout * HARD_CONSTRAINTS.maxStandingCapacity
  );
  draft.eventTypes.ticketed.grossRevenuePerEvent = computeTicketedGrossPerEvent(
    sellout,
    ticketPrice,
    ancillary
  );

  const calendarScale = pickVariantValue(ranges.calendarUtilizationScale, variantId);
  for (const key of DAY_UTILIZATION_KEYS) {
    draft[key] = Math.min(1, inputs[key] * calendarScale);
  }

  draft.eventTypes.weddings.eventsPerYear = Math.round(
    pickVariantValue(ranges.weddingEventsPerYear, variantId)
  );
  draft.eventTypes.sponsorship.grossRevenuePerEvent = Math.round(
    pickVariantValue(ranges.sponsorshipTotal, variantId)
  );

  return draft;
}

export function summarizeScenario(inputs, results, variantId) {
  const sellout = pickVariantValue(inputs.ranges.ticketedSelloutPct, variantId);
  const ticketPrice = pickVariantValue(inputs.ranges.ticketedAvgTicketPrice, variantId);

  return {
    variantId,
    ticketedSelloutPct: sellout,
    ticketedAvgTicketPrice: ticketPrice,
    ticketedEvents: results.totals.ticketedEventsPerYear,
    totalGrossRevenue: results.totals.totalGrossRevenue,
    totalNetContribution: results.totals.totalNetContribution,
    annualFixedCosts: results.totals.annualFixedCosts,
    annualOperatingResult: results.totals.annualOperatingResult,
    gapToTarget: results.totals.gapToTarget,
    warningCount: results.warnings.length
  };
}

export function buildRangeOutcomes(inputs) {
  return VARIANTS.map((variant) => {
    const resolved = applyVariant(inputs, variant.id);
    const results = computeCoreResults(resolved);
    return {
      ...variant,
      ...summarizeScenario(inputs, results, variant.id)
    };
  });
}

export function snapshotCurrentScenario(inputs, name) {
  const rangeOutcomes = buildRangeOutcomes(inputs);
  return {
    id: `${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    rangeOutcomes,
    inputs: cloneInputs(inputs)
  };
}

export function computeAnnualFixedCosts(inputs) {
  return fixedCostLineItems.reduce(
    (sum, item) => sum + (inputs.fixedCostBreakdown[item.key] || 0),
    0
  );
}

export function computeFixedCostPerSqFt(total, squareFeet = FACILITY_PROFILE.approximateSquareFeet) {
  return squareFeet > 0 ? total / squareFeet : 0;
}

export function sumDailyUtilization(inputs) {
  return DAY_UTILIZATION_KEYS.reduce((sum, key) => sum + (inputs[key] || 0), 0);
}

export function computeTicketedEventsPerYear(inputs) {
  return inputs.activeWeeksPerYear * sumDailyUtilization(inputs);
}

export function capAttendance(attendance, capacityMode) {
  if (capacityMode === "seated") {
    return Math.min(attendance, HARD_CONSTRAINTS.maxSeatedCapacity);
  }
  if (capacityMode === "standing") {
    return Math.min(attendance, HARD_CONSTRAINTS.maxStandingCapacity);
  }
  return attendance;
}

export function computeEventTypeResults(inputs) {
  const ticketedEventsPerYear = computeTicketedEventsPerYear(inputs);

  return EVENT_TYPES.map((typeDef) => {
    const assumptions = inputs.eventTypes[typeDef.id];
    const eventsPerYear =
      typeDef.id === "ticketed"
        ? ticketedEventsPerYear
        : assumptions.eventsPerYear;
    const rawAttendance = assumptions.avgAttendance || 0;
    const effectiveAttendance = capAttendance(rawAttendance, typeDef.capacityMode);
    const totalGrossRevenue = eventsPerYear * assumptions.grossRevenuePerEvent;
    const totalDirectCosts = totalGrossRevenue * assumptions.directCostPct;
    const netContribution = totalGrossRevenue - totalDirectCosts;

    return {
      id: typeDef.id,
      label: typeDef.label,
      capacityMode: typeDef.capacityMode,
      eventsPerYear,
      avgAttendance: effectiveAttendance,
      rawAvgAttendance: rawAttendance,
      grossRevenuePerEvent: assumptions.grossRevenuePerEvent,
      directCostPct: assumptions.directCostPct,
      totalGrossRevenue,
      totalDirectCosts,
      netContribution
    };
  });
}

export function computeTotals(eventResults, inputs) {
  const totalGrossRevenue = eventResults.reduce(
    (sum, row) => sum + row.totalGrossRevenue,
    0
  );
  const totalDirectCosts = eventResults.reduce(
    (sum, row) => sum + row.totalDirectCosts,
    0
  );
  const totalNetContribution = totalGrossRevenue - totalDirectCosts;
  const annualFixedCosts = computeAnnualFixedCosts(inputs);
  const annualOperatingResult = totalNetContribution - annualFixedCosts;
  const gapToTarget = annualOperatingResult - inputs.minOperatingResultTarget;
  const requiredAdditionalContribution = Math.max(
    0,
    inputs.minOperatingResultTarget + annualFixedCosts - totalNetContribution
  );

  const totalEventNights = eventResults
    .filter((row) => row.id !== "sponsorship")
    .reduce((sum, row) => sum + row.eventsPerYear, 0);
  const maxEventNights =
    inputs.activeWeeksPerYear * inputs.maxUsableEventNightsPerWeek;
  const activeEvents = eventResults.filter((row) => row.eventsPerYear > 0);
  const avgContributionPerActiveEvent =
    activeEvents.length > 0
      ? totalNetContribution /
        activeEvents.reduce((sum, row) => sum + row.eventsPerYear, 0)
      : 0;

  return {
    totalGrossRevenue,
    totalDirectCosts,
    totalNetContribution,
    annualFixedCosts,
    fixedCostPerSqFt: computeFixedCostPerSqFt(annualFixedCosts),
    annualOperatingResult,
    gapToTarget,
    requiredAdditionalContribution,
    totalEventNights,
    maxEventNights,
    avgContributionPerActiveEvent,
    ticketedEventsPerYear: computeTicketedEventsPerYear(inputs)
  };
}

export function computeWarnings(eventResults, totals, inputs) {
  const warnings = [];

  eventResults.forEach((row) => {
    if (row.capacityMode === "seated" && row.rawAvgAttendance > HARD_CONSTRAINTS.maxSeatedCapacity) {
      warnings.push({
        id: `${row.id}-seated`,
        message: `${row.label}: average attendance (${Math.round(row.rawAvgAttendance)}) exceeds seated capacity limit (${HARD_CONSTRAINTS.maxSeatedCapacity}).`
      });
    }
    if (
      row.capacityMode === "standing" &&
      row.rawAvgAttendance > HARD_CONSTRAINTS.maxStandingCapacity
    ) {
      warnings.push({
        id: `${row.id}-standing`,
        message: `${row.label}: average attendance (${Math.round(row.rawAvgAttendance)}) exceeds standing/event capacity limit (${HARD_CONSTRAINTS.maxStandingCapacity}).`
      });
    }
  });

  if (totals.totalEventNights > totals.maxEventNights) {
    warnings.push({
      id: "event-nights",
      message: `Total event nights (${Math.round(totals.totalEventNights)}) exceed calendar capacity (${Math.round(totals.maxEventNights)} = ${inputs.activeWeeksPerYear} weeks × ${inputs.maxUsableEventNightsPerWeek} nights/week).`
    });
  }

  if (totals.annualOperatingResult < inputs.minOperatingResultTarget) {
    warnings.push({
      id: "operating-target",
      message: `Annual operating result (${formatCurrency(totals.annualOperatingResult)}) is below the minimum target (${formatCurrency(inputs.minOperatingResultTarget)}).`
    });
  }

  if (totals.annualFixedCosts > inputs.maxAnnualFixedCosts) {
    warnings.push({
      id: "fixed-costs",
      message: `Built-up annual fixed costs (${formatCurrency(totals.annualFixedCosts)}) exceed the maximum fixed cost constraint (${formatCurrency(inputs.maxAnnualFixedCosts)}).`
    });
  }

  return warnings;
}

function computeCoreResults(inputs) {
  const eventResults = computeEventTypeResults(inputs);
  const totals = computeTotals(eventResults, inputs);
  const warnings = computeWarnings(eventResults, totals, inputs);
  const fixedCostBreakdown = fixedCostLineItems.map((item) => ({
    key: item.key,
    label: item.label,
    value: inputs.fixedCostBreakdown[item.key] || 0
  }));

  return {
    eventResults,
    totals,
    warnings,
    fixedCostBreakdown,
    contributionBreakdown: eventResults.map((row) => ({
      category: row.label,
      value: row.netContribution
    })),
    revenueBreakdown: eventResults.map((row) => ({
      category: row.label,
      value: row.totalGrossRevenue
    }))
  };
}

export function computeSensitivity(inputs) {
  const baseResult = computeCoreResults(inputs);
  const baseOperating = baseResult.totals.annualOperatingResult;

  const scenarios = [
    {
      id: "ticketedAttendance",
      label: "Ticketed Event Attendance",
      apply: (draft, factor) => {
        draft.eventTypes.ticketed.avgAttendance *= factor;
        draft.eventTypes.ticketed.grossRevenuePerEvent *= factor;
      }
    },
    {
      id: "ticketedGross",
      label: "Ticketed Gross per Event",
      apply: (draft, factor) => {
        draft.eventTypes.ticketed.grossRevenuePerEvent *= factor;
      }
    },
    {
      id: "ticketedEvents",
      label: "Number of Ticketed Events",
      apply: (draft, factor) => {
        for (const key of DAY_UTILIZATION_KEYS) {
          draft[key] = Math.min(1, draft[key] * factor);
        }
      }
    },
    {
      id: "fixedCosts",
      label: "Fixed Costs",
      apply: (draft, factor) => {
        for (const key of Object.keys(draft.fixedCostBreakdown)) {
          if (key === "propertyTaxes") continue;
          draft.fixedCostBreakdown[key] = Math.round(
            draft.fixedCostBreakdown[key] * factor
          );
        }
      }
    },
    {
      id: "weddingVolume",
      label: "Wedding/Private Rental Volume",
      apply: (draft, factor) => {
        draft.eventTypes.weddings.eventsPerYear = Math.round(
          draft.eventTypes.weddings.eventsPerYear * factor
        );
        draft.eventTypes.weddings.grossRevenuePerEvent *= factor;
      }
    },
    {
      id: "sponsorship",
      label: "Sponsorship/Grants",
      apply: (draft, factor) => {
        draft.eventTypes.sponsorship.grossRevenuePerEvent *= factor;
      }
    }
  ];

  return scenarios
    .map((scenario) => {
      const lowDraft = cloneInputs(inputs);
      const highDraft = cloneInputs(inputs);
      scenario.apply(lowDraft, 0.9);
      scenario.apply(highDraft, 1.1);

      const lowResult = computeCoreResults(lowDraft).totals.annualOperatingResult;
      const highResult = computeCoreResults(highDraft).totals.annualOperatingResult;
      const lowDelta = lowResult - baseOperating;
      const highDelta = highResult - baseOperating;
      const impact = Math.max(Math.abs(lowDelta), Math.abs(highDelta));

      return {
        id: scenario.id,
        label: scenario.label,
        lowDelta,
        highDelta,
        impact,
        direction:
          Math.abs(highDelta) >= Math.abs(lowDelta)
            ? highDelta >= 0
              ? "positive"
              : "negative"
            : lowDelta >= 0
              ? "positive"
              : "negative"
      };
    })
    .sort((a, b) => b.impact - a.impact);
}

export function calculateResults(inputs, variantId = "base") {
  const resolved = applyVariant(inputs, variantId);
  const core = computeCoreResults(resolved);
  return {
    ...core,
    variantId,
    rangeOutcomes: buildRangeOutcomes(inputs),
    sensitivity: computeSensitivity(resolved)
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

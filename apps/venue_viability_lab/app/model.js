export const controlDefinitions = [
  { key: "capacity", label: "Capacity", min: 100, max: 4000, step: 10, type: "range" },
  {
    key: "averageTicketPrice",
    label: "Average Ticket Price",
    min: 5,
    max: 300,
    step: 1,
    type: "range",
    format: "currency"
  },
  {
    key: "attendanceRate",
    label: "Attendance Rate",
    min: 0.1,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "activeWeeksPerYear",
    label: "Active Weeks per Year",
    min: 1,
    max: 52,
    step: 1,
    type: "range"
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
  },
  {
    key: "weekdayMiscEventsPerYear",
    label: "Weekday/Misc Events per Year",
    min: 0,
    max: 365,
    step: 1,
    type: "number"
  },
  {
    key: "artistCutPct",
    label: "Artist Cut Percentage",
    min: 0,
    max: 1,
    step: 0.01,
    type: "range",
    format: "percent"
  },
  {
    key: "ancillaryRevenuePerAttendee",
    label: "Ancillary Revenue per Attendee",
    min: 0,
    max: 100,
    step: 0.5,
    type: "range",
    format: "currency"
  },
  {
    key: "weddingsPerYear",
    label: "Weddings per Year",
    min: 0,
    max: 150,
    step: 1,
    type: "number"
  },
  {
    key: "weddingRentalFee",
    label: "Wedding Rental Fee",
    min: 0,
    max: 100000,
    step: 500,
    type: "number",
    format: "currency"
  },
  {
    key: "corporateRentalsPerYear",
    label: "Corporate Rentals per Year",
    min: 0,
    max: 250,
    step: 1,
    type: "number"
  },
  {
    key: "corporateRentalFee",
    label: "Corporate Rental Fee",
    min: 0,
    max: 100000,
    step: 500,
    type: "number",
    format: "currency"
  },
  {
    key: "nonprofitRentalsPerYear",
    label: "Nonprofit Rentals per Year",
    min: 0,
    max: 250,
    step: 1,
    type: "number"
  },
  {
    key: "nonprofitRentalFee",
    label: "Nonprofit Rental Fee",
    min: 0,
    max: 100000,
    step: 250,
    type: "number",
    format: "currency"
  },
  {
    key: "sponsorshipRevenue",
    label: "Sponsorship Revenue",
    min: 0,
    max: 5000000,
    step: 5000,
    type: "number",
    format: "currency"
  },
  {
    key: "grantsDonations",
    label: "Grants/Donations",
    min: 0,
    max: 5000000,
    step: 5000,
    type: "number",
    format: "currency"
  },
  {
    key: "annualFixedCosts",
    label: "Annual Fixed Costs",
    min: 0,
    max: 10000000,
    step: 10000,
    type: "number",
    format: "currency"
  }
];

export const presets = {
  conservative: {
    capacity: 800,
    averageTicketPrice: 32,
    attendanceRate: 0.52,
    activeWeeksPerYear: 44,
    thursdayUtilizationPct: 0.4,
    fridayUtilizationPct: 0.75,
    saturdayUtilizationPct: 0.9,
    sundayUtilizationPct: 0.2,
    weekdayMiscEventsPerYear: 7,
    artistCutPct: 0.72,
    ancillaryRevenuePerAttendee: 9,
    weddingsPerYear: 10,
    weddingRentalFee: 9000,
    corporateRentalsPerYear: 12,
    corporateRentalFee: 7000,
    nonprofitRentalsPerYear: 18,
    nonprofitRentalFee: 2800,
    sponsorshipRevenue: 120000,
    grantsDonations: 130000,
    annualFixedCosts: 3100000
  },
  baseCase: {
    capacity: 1200,
    averageTicketPrice: 40,
    attendanceRate: 0.65,
    activeWeeksPerYear: 48,
    thursdayUtilizationPct: 0.55,
    fridayUtilizationPct: 0.9,
    saturdayUtilizationPct: 0.95,
    sundayUtilizationPct: 0.35,
    weekdayMiscEventsPerYear: 12,
    artistCutPct: 0.65,
    ancillaryRevenuePerAttendee: 14,
    weddingsPerYear: 18,
    weddingRentalFee: 12000,
    corporateRentalsPerYear: 24,
    corporateRentalFee: 9000,
    nonprofitRentalsPerYear: 20,
    nonprofitRentalFee: 3500,
    sponsorshipRevenue: 220000,
    grantsDonations: 160000,
    annualFixedCosts: 3800000
  },
  optimistic: {
    capacity: 1600,
    averageTicketPrice: 48,
    attendanceRate: 0.8,
    activeWeeksPerYear: 50,
    thursdayUtilizationPct: 0.72,
    fridayUtilizationPct: 0.95,
    saturdayUtilizationPct: 0.98,
    sundayUtilizationPct: 0.5,
    weekdayMiscEventsPerYear: 18,
    artistCutPct: 0.6,
    ancillaryRevenuePerAttendee: 19,
    weddingsPerYear: 30,
    weddingRentalFee: 15500,
    corporateRentalsPerYear: 45,
    corporateRentalFee: 12000,
    nonprofitRentalsPerYear: 30,
    nonprofitRentalFee: 4200,
    sponsorshipRevenue: 360000,
    grantsDonations: 250000,
    annualFixedCosts: 4300000
  }
};

export function calculateResults(inputs) {
  const expectedTicketedEvents =
    inputs.activeWeeksPerYear *
      (inputs.thursdayUtilizationPct +
        inputs.fridayUtilizationPct +
        inputs.saturdayUtilizationPct +
        inputs.sundayUtilizationPct) +
    inputs.weekdayMiscEventsPerYear;

  const attendeeCount =
    inputs.capacity * inputs.attendanceRate * expectedTicketedEvents;
  const ticketRevenue = attendeeCount * inputs.averageTicketPrice;
  const artistCost = ticketRevenue * inputs.artistCutPct;
  const ancillaryRevenue = attendeeCount * inputs.ancillaryRevenuePerAttendee;
  const rentalRevenue =
    inputs.weddingsPerYear * inputs.weddingRentalFee +
    inputs.corporateRentalsPerYear * inputs.corporateRentalFee +
    inputs.nonprofitRentalsPerYear * inputs.nonprofitRentalFee;
  const totalRevenue =
    ticketRevenue +
    ancillaryRevenue +
    rentalRevenue +
    inputs.sponsorshipRevenue +
    inputs.grantsDonations;

  const operatingResult = totalRevenue - artistCost - inputs.annualFixedCosts;

  const contributionPerTicketedEvent =
    inputs.capacity *
      inputs.attendanceRate *
      (inputs.averageTicketPrice * (1 - inputs.artistCutPct) +
        inputs.ancillaryRevenuePerAttendee) || 0;
  const baselineOtherRevenue =
    rentalRevenue + inputs.sponsorshipRevenue + inputs.grantsDonations;

  const breakEvenTicketedEvents =
    contributionPerTicketedEvent > 0
      ? Math.max(
          0,
          (inputs.annualFixedCosts - baselineOtherRevenue) /
            contributionPerTicketedEvent
        )
      : Number.POSITIVE_INFINITY;

  const perAttendancePointContribution =
    inputs.capacity *
      expectedTicketedEvents *
      (inputs.averageTicketPrice * (1 - inputs.artistCutPct) +
        inputs.ancillaryRevenuePerAttendee) || 0;

  const breakEvenAttendanceRate =
    perAttendancePointContribution > 0
      ? Math.max(
          0,
          (inputs.annualFixedCosts - baselineOtherRevenue) /
            perAttendancePointContribution
        )
      : Number.POSITIVE_INFINITY;

  return {
    ticketRevenue,
    artistCost,
    ancillaryRevenue,
    rentalRevenue,
    totalRevenue,
    operatingResult,
    expectedTicketedEvents,
    breakEvenAttendanceRate,
    breakEvenTicketedEvents,
    revenueBreakdown: [
      { category: "Ticket Revenue", value: ticketRevenue },
      { category: "Ancillary Revenue", value: ancillaryRevenue },
      { category: "Rental Revenue", value: rentalRevenue },
      { category: "Sponsorship", value: inputs.sponsorshipRevenue },
      { category: "Grants/Donations", value: inputs.grantsDonations }
    ]
  };
}

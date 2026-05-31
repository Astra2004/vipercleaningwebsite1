export const serviceLabels = {
  standard: "Whole House Cleaning",
  deep: "Deep Cleaning",
  move: "Move-In / Move-Out",
  vacation: "Vacation Rental Turnover",
  commercial: "Commercial Cleaning",
};

export const frequencyLabels = {
  "one-time": "One-time",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

export const extraLabels = {
  fridge: "Inside fridge",
  oven: "Inside oven",
  windows: "Interior windows",
  laundry: "Laundry reset",
  pets: "Pet hair detail",
  patio: "Patio sweep",
};

export const wheelPrizes = [
  "10% off",
  "$25 off",
  "Free fridge clean",
  "15% off",
  "Free oven clean",
  "50% off an add-on",
  "Free standard clean",
  "Free patio sweep",
];

export function calculateEstimate(input) {
  const service = serviceLabels[input.service] ? input.service : "standard";
  const frequency = frequencyLabels[input.frequency] ? input.frequency : "one-time";
  const sqft = Math.max(300, Number(input.sqft) || 300);
  const bedrooms = Math.max(0, Number(input.bedrooms) || 0);
  const bathrooms = Math.max(0, Number(input.bathrooms) || 0);
  const extras = Array.isArray(input.extras) ? input.extras.filter((extra) => extraLabels[extra]) : [];

  const sqftRate = {
    standard: 0.1,
    deep: 0.14,
    move: 0.16,
    vacation: 0.12,
    commercial: 0.25,
  };

  const frequencyDiscount = {
    "one-time": 1,
    weekly: 0.86,
    biweekly: 0.9,
    monthly: 0.95,
  };

  const extraRate = {
    fridge: 25,
    oven: 35,
    windows: 45,
    laundry: 25,
    pets: 20,
    patio: 20,
  };

  const roomCost = (bedrooms + bathrooms) * 10;
  const extrasCost = extras.reduce((sum, extra) => sum + (extraRate[extra] ?? 0), 0);
  const raw = (sqft * sqftRate[service] + roomCost + extrasCost) * frequencyDiscount[frequency];
  const total = Math.max(95, Math.round(raw / 5) * 5);
  const low =
    service === "commercial"
      ? Math.max(95, Math.round(((sqft * 0.2 + roomCost + extrasCost) * frequencyDiscount[frequency]) / 5) * 5)
      : Math.round((total * 0.85) / 5) * 5;
  const high =
    service === "commercial"
      ? Math.max(95, Math.round(((sqft * 0.3 + roomCost + extrasCost) * frequencyDiscount[frequency]) / 5) * 5)
      : Math.round((total * 1.15) / 5) * 5;

  return {
    service,
    frequency,
    sqft,
    bedrooms,
    bathrooms,
    extras,
    total,
    low,
    high,
  };
}

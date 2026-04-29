export const WAITLIST_CATEGORIES = [
  { organ: "Kidney", count: 180 },
  { organ: "Liver", count: 24 },
  { organ: "Heart", count: 8 },
  { organ: "Lung", count: 6 },
  { organ: "Pancreas", count: 4 },
  { organ: "Intestine", count: 2 },
  { organ: "Other", count: 3 }
];

export const WAITLIST_COLORS = {
  Kidney: "#4E79A7",
  Liver: "#A05A2C",
  Heart: "#C44E52",
  Lung: "#59A14F",
  Pancreas: "#B07AA1",
  Intestine: "#9C755F",
  Other: "#8A8A8A"
};

const GROUP_TARGETS = {
  Kidney: { x: 230, y: 300 },
  Liver: { x: 430, y: 300 },
  Heart: { x: 630, y: 300 },
  Lung: { x: 830, y: 300 },
  Pancreas: { x: 330, y: 430 },
  Intestine: { x: 530, y: 430 },
  Other: { x: 730, y: 430 }
};

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateOrganicOffsets(count, minDistance, maxRadius, seed) {
  const random = createSeededRandom(seed);
  const points = [];
  const minDistanceSq = minDistance * minDistance;

  for (let i = 0; i < count; i += 1) {
    let placed = false;

    for (let attempt = 0; attempt < 400; attempt += 1) {
      const theta = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * maxRadius;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;

      let overlaps = false;
      for (let j = 0; j < points.length; j += 1) {
        const dx = x - points[j].x;
        const dy = y - points[j].y;
        if ((dx * dx) + (dy * dy) < minDistanceSq) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        points.push({ x, y });
        placed = true;
        break;
      }
    }

    if (!placed) {
      const theta = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * maxRadius;
      points.push({
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius
      });
    }
  }

  return points;
}

const CLOUD_CENTER = { x: 600, y: 337.5 };
const cloudOffsets = generateOrganicOffsets(227, 9, 140, 20260425);

let cloudIndex = 0;
const baseNodes = WAITLIST_CATEGORIES.flatMap((cat, catIdx) => {
  const groupMaxRadius = Math.max(16, Math.sqrt(cat.count) * 10);
  const groupOffsets = generateOrganicOffsets(cat.count, 8, groupMaxRadius, 9000 + catIdx);
  const radiusRandom = createSeededRandom(12000 + catIdx);

  return Array.from({ length: cat.count }, (_, i) => {
    const cloudP = cloudOffsets[cloudIndex];
    cloudIndex += 1;
    const groupP = groupOffsets[i];

    return {
      organ: cat.organ,
      radius: 4 + radiusRandom() * 2,
      initialX: CLOUD_CENTER.x + cloudP.x,
      initialY: CLOUD_CENTER.y + cloudP.y,
      targetX: GROUP_TARGETS[cat.organ].x + groupP.x,
      targetY: GROUP_TARGETS[cat.organ].y + groupP.y
    };
  });
});

export function getSharedWaitlistNodes() {
  return baseNodes.map(d => ({ ...d }));
}

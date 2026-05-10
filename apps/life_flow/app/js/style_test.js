import { statusColors, storyColors } from "./constants/colors.js";
import { typography } from "./constants/typography.js";

const width = 1280;
const height = 720;
const marginX = 156;

const type = {
  mainTitle: typography.mainTitle,
  sceneTitle: typography.sceneTitle,
  body: typography.body,
  caption: typography.caption,
  label: typography.label,
  dataValue: typography.dataValue
};

const columns = [
  { key: "waiting", label: "Waiting", x: 205 },
  { key: "movement", label: "Movement", x: 330 },
  { key: "transplant", label: "Transplanted", x: 455 },
  { key: "fatality", label: "Fatality", x: 580 },
  { key: "accent", label: "Accent", x: 705 },
  { key: "neutral", label: "Neutral", x: 830 }
];
const circleRadius = 47;
const topRowY = 340;
const bottomRowY = 503;
const legendY = 570;
const rowLabelOffset = 7;

const circleText = {
  family: "\"Book Antiqua\", Palatino, serif",
  nameSize: 10,
  hexSize: 10,
  weight: 700
};

const statusGuide = [
  { ...columns[0], color: statusColors.waiting },
  { ...columns[1], color: statusColors.movement },
  { ...columns[2], color: statusColors.transplant },
  { ...columns[3], color: statusColors.fatality },
  { ...columns[4], color: statusColors.accent }
];

const palette = [
  { ...columns[0], name: "Soft Ash Gray", hex: "#B8B8B3", color: statusColors.waiting, y: topRowY, textColor: storyColors.textPrimary },
  { ...columns[1], name: "Mist Harbor Blue", hex: "#7A8FA3", color: statusColors.movement, y: topRowY, textColor: "#ffffff" },
  { ...columns[2], name: "Deep Slate Harbor", hex: "#4F6675", color: statusColors.transplant, y: topRowY, textColor: "#ffffff" },
  { ...columns[3], name: "Muted Clay Rose", hex: "#8A6A6A", color: statusColors.fatality, y: topRowY, textColor: "#ffffff" },
  { ...columns[4], name: "Warm Linen Sand", hex: "#C7B79B", color: statusColors.accent, y: topRowY, textColor: storyColors.textPrimary },
  { ...columns[5], name: "Museum White", hex: "#F7F7F4", color: storyColors.museumWhite, y: topRowY, textColor: storyColors.textPrimary },
  { ...columns[0], name: "Deep Ash Stone", hex: "#666660", color: storyColors.deepAshStone, y: bottomRowY, textColor: "#ffffff" },
  { ...columns[1], name: "Harbor Slate", hex: "#4F6675", color: storyColors.deepSlateHarbor, y: bottomRowY, textColor: "#ffffff" },
  { ...columns[2], name: "Transplant Ink", hex: "#344955", color: storyColors.slateFogBlue, y: bottomRowY, textColor: "#ffffff" },
  { ...columns[3], name: "Dusty Burgundy", hex: "#6F5959", color: storyColors.dustyBurgundy, y: bottomRowY, textColor: "#ffffff" },
  { ...columns[4], name: "Weathered Brass", hex: "#A49370", color: storyColors.weatheredBrass, y: bottomRowY, textColor: "#ffffff" },
  { ...columns[5], name: "Charcoal Forest", hex: "#202623", color: storyColors.charcoalForest, y: bottomRowY, textColor: "#ffffff" }
];

function applyText(selection, style) {
  selection
    .attr("font-family", style.family)
    .attr("font-size", style.size)
    .attr("font-weight", style.weight)
    .attr("font-style", style.style);
}

d3.select("body")
  .style("background", storyColors.background);

const container = d3.select("#style-test")
  .style("background", storyColors.background);

function createSlide(label) {
  const slide = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100vh")
    .attr("role", "img")
    .attr("aria-label", label)
    .style("display", "block");

  slide.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", storyColors.background);

  return slide;
}

const svg = createSlide("Life Flow palette style test");

const mainTitle = svg.append("text")
  .attr("x", marginX)
  .attr("y", 104)
  .attr("fill", storyColors.textPrimary)
  .text("Life Flow");
applyText(mainTitle, type.mainTitle);

const sceneTitle = svg.append("text")
  .attr("x", marginX)
  .attr("y", 139)
  .attr("fill", storyColors.textPrimary)
  .text("Visual language for organ transplant narratives");
applyText(sceneTitle, type.sceneTitle);

svg.append("line")
  .attr("x1", marginX)
  .attr("x2", width - marginX)
  .attr("y1", 178)
  .attr("y2", 178)
  .attr("stroke", storyColors.weatheredBrass)
  .attr("stroke-width", 1);

const body = svg.append("text")
  .attr("x", marginX)
  .attr("y", 232)
  .attr("fill", storyColors.textPrimary);
applyText(body, type.body);

body.selectAll("tspan")
  .data([
    "A quiet editorial frame for showing movement through a fragile system.",
    "The palette stays close to earth, skin, paper, and hospital light."
  ])
  .enter()
  .append("tspan")
  .attr("x", marginX)
  .attr("dy", (d, i) => i === 0 ? 0 : type.body.size * type.body.lineHeight)
  .text(d => d);

const primaryRowLabel = svg.append("text")
  .attr("x", columns[0].x - circleRadius)
  .attr("y", topRowY - circleRadius - 22 + rowLabelOffset)
  .attr("fill", storyColors.textPrimary)
  .text("PRIMARY COLORS");
applyText(primaryRowLabel, type.label);

const labelRowLabel = svg.append("text")
  .attr("x", columns[0].x - circleRadius)
  .attr("y", bottomRowY - circleRadius - 22 + rowLabelOffset)
  .attr("fill", storyColors.textPrimary)
  .text("DARKER LABEL COLORS");
applyText(labelRowLabel, type.label);

const backgroundLabel = svg.append("text")
  .attr("x", columns[5].x)
  .attr("y", topRowY - circleRadius - 22 + rowLabelOffset)
  .attr("text-anchor", "middle")
  .attr("fill", storyColors.textPrimary)
  .text("BACKGROUND");
applyText(backgroundLabel, type.label);

const fontLabel = svg.append("text")
  .attr("x", columns[5].x)
  .attr("y", bottomRowY - circleRadius - 22 + rowLabelOffset)
  .attr("text-anchor", "middle")
  .attr("fill", storyColors.textPrimary)
  .text("FONT");
applyText(fontLabel, type.label);

const paletteGroups = svg.append("g")
  .selectAll("circle")
  .data(palette)
  .enter()
  .append("g");

paletteGroups
  .append("circle")
  .attr("cx", d => d.x)
  .attr("cy", d => d.y)
  .attr("r", circleRadius)
  .attr("fill", d => d.color)
  .attr("stroke", d => d.stroke || storyColors.panel)
  .attr("stroke-width", 1.4);

paletteGroups
  .append("text")
  .attr("x", d => d.x)
  .attr("y", d => d.y - 5)
  .attr("text-anchor", "middle")
  .attr("fill", d => d.textColor)
  .attr("font-family", circleText.family)
  .attr("font-size", circleText.nameSize)
  .attr("font-weight", circleText.weight)
  .selectAll("tspan")
  .data(d => {
    const parts = d.name.split(" ");
    const midpoint = Math.ceil(parts.length / 2);
    return [
      { parent: d, text: parts.slice(0, midpoint).join(" "), dy: 0 },
      { parent: d, text: parts.slice(midpoint).join(" "), dy: 13 }
    ];
  })
  .enter()
  .append("tspan")
  .attr("x", d => d.parent.x)
  .attr("dy", d => d.dy)
  .text(d => d.text);

paletteGroups
  .append("text")
  .attr("x", d => d.x)
  .attr("y", d => d.y + 26)
  .attr("text-anchor", "middle")
  .attr("fill", d => d.textColor)
  .attr("font-family", circleText.family)
  .attr("font-size", circleText.hexSize)
  .attr("font-weight", circleText.weight)
  .text(d => d.hex);

const legend = svg.append("g")
  .attr("transform", `translate(0, ${legendY})`);

legend.selectAll("circle")
  .data(statusGuide)
  .enter()
  .append("circle")
  .attr("cx", d => d.x)
  .attr("cy", 0)
  .attr("r", 6)
  .attr("fill", d => d.color);

const legendLabels = legend.selectAll("text")
  .data(statusGuide)
  .enter()
  .append("text")
  .attr("x", d => d.x)
  .attr("y", 24)
  .attr("text-anchor", "middle")
  .attr("fill", storyColors.textPrimary)
  .text(d => d.label);
applyText(legendLabels, type.label);

const source = svg.append("text")
  .attr("x", marginX)
  .attr("y", 654)
  .attr("fill", storyColors.textPrimary)
  .text("Source: OPTN National Data - Waitlist & Transplants.");
applyText(source, type.caption);

const prototypeCredit = svg.append("text")
  .attr("x", marginX)
  .attr("y", 674)
  .attr("fill", storyColors.textPrimary)
  .text("Visualization prototype by Justin Locke.");
applyText(prototypeCredit, type.caption);

const typeSlide = createSlide("Life Flow typography style test");

const typeMainTitle = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 104)
  .attr("fill", storyColors.textPrimary)
  .text("Life Flow");
applyText(typeMainTitle, type.mainTitle);

const typeSceneTitle = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 139)
  .attr("fill", storyColors.textPrimary)
  .text("Typography scale for narrative scenes");
applyText(typeSceneTitle, type.sceneTitle);

typeSlide.append("line")
  .attr("x1", marginX)
  .attr("x2", width - marginX)
  .attr("y1", 178)
  .attr("y2", 178)
  .attr("stroke", storyColors.weatheredBrass)
  .attr("stroke-width", 1);

const typeBody = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 250)
  .attr("fill", storyColors.textPrimary);
applyText(typeBody, type.body);

typeBody.selectAll("tspan")
  .data([
    "A quiet editorial frame for showing movement through a fragile system.",
    "Text should feel calm, human, legible, and made for slow looking."
  ])
  .enter()
  .append("tspan")
  .attr("x", marginX)
  .attr("dy", (d, i) => i === 0 ? 0 : type.body.size * type.body.lineHeight)
  .text(d => d);

const typeLabel = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 385)
  .attr("fill", storyColors.textPrimary)
  .text("DATA LABEL");
applyText(typeLabel, type.label);

const typeValue = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 413)
  .attr("fill", storyColors.textPrimary)
  .text("121,601");
applyText(typeValue, type.dataValue);

const typeSpecRows = [
  { text: "Title: Book Antiqua Bold, 24px", y: 104, style: type.mainTitle },
  { text: "Scene title: Book Antiqua Regular, 16px", y: 139, style: type.sceneTitle },
  { text: "Body: Georgia Regular, 14px", y: 250, x1: 610, style: type.body },
  { text: "Label: Calisto MT Regular, 11px", y: 385, style: type.label },
  { text: "Data value: Calisto MT Bold, 14px", y: 413, style: type.dataValue },
  { text: "Caption/source: Calisto MT Italic, 10px", y: 628, style: type.caption }
];

typeSlide.append("g")
  .selectAll("line")
  .data(typeSpecRows)
  .enter()
  .append("line")
  .attr("x1", d => d.x1 || 520)
  .attr("x2", 735)
  .attr("y1", d => d.y - 4)
  .attr("y2", d => d.y - 4)
  .attr("stroke", statusColors.waiting)
  .attr("stroke-width", 1);

const typeSpec = typeSlide.append("g")
  .selectAll("text")
  .data(typeSpecRows)
  .enter()
  .append("text")
  .attr("x", 755)
  .attr("y", d => d.y)
  .attr("fill", storyColors.textPrimary)
  .attr("font-family", d => d.style.family)
  .attr("font-size", d => d.style.size)
  .attr("font-weight", d => d.style.weight)
  .attr("font-style", d => d.style.style)
  .text(d => d.text);

const typeSource = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 654)
  .attr("fill", storyColors.textPrimary)
  .text("Source: OPTN National Data - Waitlist & Transplants.");
applyText(typeSource, type.caption);

const typePrototypeCredit = typeSlide.append("text")
  .attr("x", marginX)
  .attr("y", 674)
  .attr("fill", storyColors.textPrimary)
  .text("Visualization prototype by Justin Locke.");
applyText(typePrototypeCredit, type.caption);

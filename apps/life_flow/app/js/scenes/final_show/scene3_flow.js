import { organColors, storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import {
  createStage,
  drawHeader,
  drawSource,
  applyType,
  renderPlaceholder,
  STAGE
} from "./show_helpers.js";

const DATA_PATH = "data/optn_transplants_clean.csv";
const DONOR_TYPES = ["Deceased Donor", "Living Donor"];
const DONOR_COLORS = {
  "Deceased Donor": storyColors.deepSlateHarbor,
  "Living Donor": storyColors.weatheredBrass
};
const MAX_ORGANS = 8;

export function runScene3() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  if (!d3.sankey) {
    renderPlaceholder(container, {
      sceneLabel: "Scene 3",
      title: "What happens between donation and transplant?",
      subtitle: "Donor type to organ flow.",
      note: "Placeholder: d3-sankey failed to load \u2014 check the CDN script in final_show.html."
    });
    return;
  }

  d3.csv(DATA_PATH)
    .then(rows => {
      rows.forEach(d => {
        d.year = +d.year;
        d.transplants = +d.transplants;
        d.donor_type = d.donor_type ? d.donor_type.trim() : "";
        d.organ = d.organ ? d.organ.trim() : "";
      });
      render(container, rows);
    })
    .catch(err => {
      console.error("Scene 3 CSV load error:", err);
      renderPlaceholder(container, {
        sceneLabel: "Scene 3",
        title: "What happens between donation and transplant?",
        subtitle: "Donor type to organ flow.",
        note: "Placeholder: connect donor \u2192 organ flow data here."
      });
    });
}

function pickYear(rows) {
  const byYear = d3.rollup(
    rows.filter(d => DONOR_TYPES.includes(d.donor_type) && d.organ !== "All Organs"),
    v => d3.sum(v, d => d.transplants),
    d => d.year
  );
  const years = [...byYear.keys()].filter(y => byYear.get(y) > 0).sort((a, b) => a - b);
  if (!years.length) return null;
  const latest = years[years.length - 1];
  const prev = years[years.length - 2];
  // Guard against a partial most-recent year.
  if (prev && byYear.get(latest) < 0.6 * byYear.get(prev)) return prev;
  return latest;
}

function render(container, rows) {
  const year = pickYear(rows);
  const svg = createStage(container);

  drawHeader(svg, {
    sceneLabel: "Scene 3",
    title: "What happens between donation and transplant?",
    subtitle: year
      ? `Donor type to organ, ${year} U.S. transplants`
      : "Donor type to organ flow"
  });

  if (!year) {
    drawSource(svg, "Source: OPTN National Data \u2014 no donor/organ rows available.");
    return;
  }

  const slice = rows.filter(d =>
    d.year === year &&
    DONOR_TYPES.includes(d.donor_type) &&
    d.organ !== "All Organs" &&
    d.transplants > 0
  );

  // Keep the largest organs, fold the rest into "Other organs".
  const organTotals = d3.rollups(slice, v => d3.sum(v, d => d.transplants), d => d.organ)
    .sort((a, b) => b[1] - a[1]);
  const keep = new Set(organTotals.slice(0, MAX_ORGANS).map(d => d[0]));
  const organName = o => (keep.has(o) ? o : "Other organs");

  const linkMap = d3.rollup(
    slice,
    v => d3.sum(v, d => d.transplants),
    d => d.donor_type,
    d => organName(d.organ)
  );

  const nodeIds = new Set();
  const links = [];
  for (const [donor, organs] of linkMap) {
    nodeIds.add(donor);
    for (const [organ, value] of organs) {
      nodeIds.add(organ);
      links.push({ source: donor, target: organ, value });
    }
  }

  const nodes = [...nodeIds].map(id => ({ id, name: id }));

  const sankey = d3.sankey()
    .nodeId(d => d.id)
    .nodeAlign(d3.sankeyJustify)
    .nodeWidth(16)
    .nodePadding(16)
    .extent([
      [STAGE.contentLeft, STAGE.contentTop + 18],
      [STAGE.contentRight - 132, STAGE.contentBottom]
    ]);

  const graph = sankey({
    nodes: nodes.map(d => ({ ...d })),
    links: links.map(d => ({ ...d }))
  });

  const colorFor = id =>
    DONOR_COLORS[id] || organColors[id] || storyColors.deepAshStone;

  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => colorFor(d.target.id))
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", d => Math.max(1, d.width));

  const node = svg.append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g");

  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => Math.max(1, d.y1 - d.y0))
    .attr("fill", d => colorFor(d.id))
    .attr("rx", 2);

  node.append("text")
    .each(function (d) {
      const isSource = d.x0 < STAGE.width / 2;
      const sel = d3.select(this)
        .attr("x", isSource ? d.x0 - 8 : d.x1 + 8)
        .attr("y", (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", isSource ? "end" : "start")
        .attr("fill", storyColors.textPrimary);
      applyType(sel, typography.label);
      sel.text(`${d.name}  ${d3.format(",")(d.value || 0)}`);
    });

  drawSource(svg, `Source: OPTN National Data \u2014 ${year} transplants by donor type and organ.`);
}

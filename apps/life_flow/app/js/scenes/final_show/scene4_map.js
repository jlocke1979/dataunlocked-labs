import { storyColors } from "../../constants/colors.js";
import { typography } from "../../constants/typography.js";
import { renderPlaceholder } from "./_show_helpers.js";

// Reuse the existing Assignment 05 spatial app verbatim via an iframe so the
// final show populates without porting its ~3,400-line renderer.
const APP_SRC = "../assignments/assignment_05_spatial/app/index.html";
const NODES_CSV = "../assignments/assignment_05_spatial/data/processed/all_nodes_with_coordinates.csv";

export function runScene4() {
  const container = d3.select("#viz");
  container.selectAll("*").remove();

  // Confirm the spatial data path resolves (and satisfy logging requirement).
  d3.csv(NODES_CSV)
    .then(rows => {
      console.log("[Scene 4] map node data loaded:", NODES_CSV);
      console.log("[Scene 4] row count:", rows.length);
      console.log("[Scene 4] first row:", rows[0]);
    })
    .catch(err => {
      console.warn("[Scene 4] node data could not be loaded for logging:", err);
    });

  const wrap = container
    .append("div")
    .style("box-sizing", "border-box")
    .style("width", "100%")
    .style("height", "100vh")
    .style("background", storyColors.museumWhite)
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("padding", "24px 40px");

  wrap.append("div")
    .style("font-family", typography.label.family)
    .style("font-size", `${typography.label.size}px`)
    .style("letter-spacing", "0.12em")
    .style("color", storyColors.textMuted)
    .text("SCENE 4");

  wrap.append("div")
    .style("font-family", typography.mainTitle.family)
    .style("font-size", `${typography.mainTitle.size}px`)
    .style("font-weight", typography.mainTitle.weight)
    .style("color", storyColors.textPrimary)
    .text("Where does transplantation happen?");

  wrap.append("div")
    .style("font-family", typography.sceneTitle.family)
    .style("font-size", `${typography.sceneTitle.size}px`)
    .style("color", storyColors.textSecondary)
    .style("margin-bottom", "12px")
    .text("Transplant system sites and flow volume by geography");

  const iframe = wrap.append("iframe")
    .attr("src", APP_SRC)
    .attr("title", "Transplant geography prototype")
    .style("flex", "1 1 auto")
    .style("width", "100%")
    .style("border", `1px solid ${storyColors.divider}`)
    .style("border-radius", "6px")
    .style("background", storyColors.museumWhite);

  iframe.on("load", () => console.log("[Scene 4] map prototype iframe loaded:", APP_SRC));
  iframe.on("error", () => {
    console.error("[Scene 4] map iframe failed to load:", APP_SRC);
    container.selectAll("*").remove();
    renderPlaceholder(container, {
      sceneLabel: "Scene 4",
      title: "Where does transplantation happen?",
      subtitle: "Transplant geography prototype.",
      note: "Scene in progress: transplant geography prototype"
    });
  });
}

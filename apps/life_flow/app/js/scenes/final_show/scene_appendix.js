import { runScene1 } from "./scene1_need_over_time.js";
import { OPTN_NATIONAL_DATA_SOURCE } from "./scene_references.js";

/** Archived need-over-time zoom sequence (may return to main spine later). */
export function runAppendix() {
  return runScene1({
    sceneLabel: "Appendix",
    sourceNote: OPTN_NATIONAL_DATA_SOURCE
  });
}

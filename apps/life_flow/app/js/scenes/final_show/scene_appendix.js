import { runScene1 } from "./scene1_need_over_time.js";

/** Archived Assignment 01 “need has grown” zoom sequence (may return to main spine later). */
export function runAppendix() {
  return runScene1({
    sceneLabel: "Appendix",
    sourceNote:
      "Source: OPTN national data, 1988\u20132025. Assignment 01 temporal zoom (archived from main spine)."
  });
}

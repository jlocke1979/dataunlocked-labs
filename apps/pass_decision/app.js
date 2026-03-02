import {
  generateCostCurve,
  findBreakEven
} from "/engine/pricing_engine.js";


// --------------------
// INPUTS (temporary)
// --------------------
const inputs = {
  greenFee: 25,
  cartFee: 15,
  cartUsageRate: 0.5,
  membershipCost: 1200
};


// --------------------
// RUN ENGINE
// --------------------
const curve = generateCostCurve(inputs, 120);
const breakEven = findBreakEven(inputs);

console.log("Break-even:", breakEven);


// --------------------
// SHOW RESULT
// --------------------
document.getElementById("output").innerHTML = `
  <h3>✅ Engine Connected</h3>
  <p>Break-even rounds: <strong>${breakEven}</strong></p>
`;


// --------------------
// CHART
// --------------------
const width = 600;
const height = 400;
const margin = 40;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const x = d3.scaleLinear()
  .domain([0, d3.max(curve, d => d.rounds)])
  .range([margin, width - margin]);

const y = d3.scaleLinear()
  .domain([
    0,
    d3.max(curve, d =>
      Math.max(d.paygCost, d.memberCost))
  ])
  .range([height - margin, margin]);


// Pay-as-you-go
svg.append("path")
  .datum(curve)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2)
  .attr("d", d3.line()
    .x(d => x(d.rounds))
    .y(d => y(d.paygCost))
  );


// Membership
svg.append("path")
  .datum(curve)
  .attr("fill", "none")
  .attr("stroke", "green")
  .attr("stroke-width", 2)
  .attr("d", d3.line()
    .x(d => x(d.rounds))
    .y(d => y(d.memberCost))
  );


// Axes
svg.append("g")
  .attr("transform",
    `translate(0,${height-margin})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .attr("transform",
    `translate(${margin},0)`)
  .call(d3.axisLeft(y));

// --------------------
// BREAK EVEN DOT
// --------------------
const breakPoint = curve.find(
  d => d.rounds === breakEven
);

svg.append("circle")
  .attr("cx", x(breakPoint.rounds))
  .attr("cy", y(breakPoint.paygCost))
  .attr("r", 6)
  .attr("fill", "red");

svg.append("text")
  .attr("x", x(breakPoint.rounds) + 8)
  .attr("y", y(breakPoint.paygCost) - 8)
  .text(`Break-even: ${breakEven}`)
  .style("font-size", "12px");


import { SAMPLE, C } from "../data.js";
import { stage, showTip, hideTip, axStyle } from "../ui.js";

export function renderSeatempLine(el) {
  const { svg, w, h } = stage(el);
  svg.selectAll("*").remove();

  const color = C.ember;
  const data = SAMPLE.anomaliesSst;
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([64, w - 26]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.value)).nice().range([h - 48, 36]);
  const defs = svg.append("defs");
  const gradSst = defs.append("linearGradient").attr("id", "grad-sst").attr("x1", "0%").attr("y1", "100%").attr("x2", "0%").attr("y2", "0%");
  gradSst.selectAll("stop").data([{ o: "0%", c: "#fff4d4", op: .95 }, { o: "35%", c: "#ff7326", op: .8 }, { o: "75%", c: "#f9312f", op: .4 }, { o: "100%", c: "#ab1324", op: 0 }]).join("stop").attr("offset", d => d.o).attr("stop-color", d => d.c).attr("stop-opacity", d => d.op);
  const wipeClipId = "wipe-clip";
  defs.append("clipPath").attr("id", wipeClipId).append("rect").attr("x", 64).attr("y", 0).attr("width", 0).attr("height", h).transition().duration(1400).ease(d3.easeCubicInOut).attr("width", w - 64);
  const drawLayer = svg.append("g").attr("clip-path", `url(#${wipeClipId})`);
  drawLayer.append("path").datum(data).attr("fill", "url(#grad-sst)").attr("d", d3.area().x(d => x(d.year)).y1(d => y(d.value)).y0(h - 48).curve(d3.curveMonotoneX));
  svg.append("line").attr("x1", 64).attr("x2", w - 26).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "rgba(230,215,184,.4)");
  drawLayer.append("path").datum(data).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.4).attr("d", d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));

  const bubbles = drawLayer.append("g").selectAll("circle.ember").data(d3.range(35)).join("circle").attr("class", "ember").attr("cx", () => 64 + Math.random() * (w - 90)).attr("cy", h - 48).attr("r", () => Math.random() * 3 + 1.5).attr("fill", () => Math.random() > .4 ? "#ff7326" : "#f9312f").attr("opacity", 0);
  function floatUp() {
    const startX = d3.select(this).attr("cx");
    d3.select(this).attr("cy", h - 48).attr("opacity", .9).transition().duration(() => 1500 + Math.random() * 2500).ease(d3.easeQuadOut).attr("cy", () => 36 + Math.random() * (h / 2)).attr("cx", () => +startX + (Math.random() - .5) * 45).attr("opacity", 0).on("end", floatUp);
  }
  bubbles.each(floatUp);

  svg.append("g").attr("transform", `translate(0,${h - 48})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d"))).call(axStyle);
  svg.append("g").attr("transform", "translate(64,0)").call(d3.axisLeft(y).ticks(5)).call(axStyle);
  svg.append("text").attr("x", 64).attr("y", 22).attr("font-size", 15).attr("fill", C.mist).text("Sea surface temperature anomalies (1990-2024)");
  svg.append("text").attr("x", 64 + (w - 90) / 2).attr("y", h - 8).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Year");
  svg.append("text").attr("transform", `translate(15,${36 + (h - 84) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("°C above baseline");
  const cross = svg.append("g").style("opacity", 0).style("pointer-events", "none");
  cross.append("line").attr("y1", 36).attr("y2", h - 48).attr("stroke", color);
  const dot = cross.append("circle").attr("r", 5).attr("fill", color);
  svg.append("rect").attr("x", 64).attr("y", 36).attr("width", w - 90).attr("height", h - 84).attr("fill", "transparent").style("cursor", "crosshair").on("mousemove", function (ev) {
    const yr = Math.round(x.invert(d3.pointer(ev, svg.node())[0]));
    const d = data.find(r => r.year === yr);
    if (!d) return;
    cross.style("opacity", 1).select("line").attr("x1", x(d.year)).attr("x2", x(d.year));
    dot.attr("cx", x(d.year)).attr("cy", y(d.value));
    showTip(ev, `<b>${d.year}</b><br>${d.value.toFixed(2)} °C above baseline`);
  }).on("mouseleave", () => {
    cross.style("opacity", 0);
    hideTip();
  });
}

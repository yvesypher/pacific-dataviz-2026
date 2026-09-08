import { SAMPLE, C } from "../data.js";
import { stage, showTip, hideTip, axStyle } from "../ui.js";

export function renderRainfallLine(el) {
  const { svg, w, h } = stage(el);
  svg.selectAll("*").remove();

  const color = C.rain;
  const data = SAMPLE.anomaliesRain;
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([64, w - 26]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.value)).nice().range([h - 48, 36]);
  const defs = svg.append("defs");
  const wipeClipId = "wipe-clip";
  defs.append("clipPath").attr("id", wipeClipId).append("rect").attr("x", 64).attr("y", 0).attr("width", 0).attr("height", h).transition().duration(1400).ease(d3.easeCubicInOut).attr("width", w - 64);
  const drawLayer = svg.append("g").attr("clip-path", `url(#${wipeClipId})`);
  svg.append("line").attr("x1", 64).attr("x2", w - 26).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "rgba(230,215,184,.4)");
  drawLayer.append("path").datum(data).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.4).attr("d", d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));

  const rainClipId = "rain-clip";
  defs.append("clipPath").attr("id", rainClipId).append("path").datum(data).attr("d", d3.area().x(d => x(d.year)).y1(d => y(d.value)).y0(h - 48).curve(d3.curveMonotoneX));
  const rainLayer = drawLayer.append("g").attr("clip-path", `url(#${rainClipId})`);
  const drops = rainLayer.selectAll("line.rain").data(d3.range(70)).join("line").attr("class", "rain").attr("x1", () => 64 + Math.random() * (w - 90)).attr("y1", () => 36 + Math.random() * 50).attr("opacity", 0).attr("stroke", color).attr("stroke-width", 1.2);
  function rainFall() {
    const drop = d3.select(this);
    const nx = 64 + Math.random() * (w - 90);
    drop.attr("x1", nx).attr("x2", nx + 2).attr("y1", 36).attr("y2", 46).attr("opacity", .7).transition().duration(() => 350 + Math.random() * 400).ease(d3.easeLinear).attr("y1", h - 48).attr("y2", h - 38).attr("opacity", 0).on("end", rainFall);
  }
  drops.each(rainFall);
  const flash = drawLayer.append("rect").attr("x", 64).attr("y", 36).attr("width", w - 90).attr("height", h - 84).attr("fill", "white").attr("opacity", 0).style("pointer-events", "none").attr("clip-path", `url(#${rainClipId})`);
  function strike() {
    flash.transition().delay(() => 2e3 + Math.random() * 4e3).duration(40).attr("opacity", .35).transition().duration(40).attr("opacity", 0).transition().duration(40).attr("opacity", .2).transition().duration(400).attr("opacity", 0).on("end", strike);
  }
  strike();

  svg.append("g").attr("transform", `translate(0,${h - 48})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d"))).call(axStyle);
  svg.append("g").attr("transform", "translate(64,0)").call(d3.axisLeft(y).ticks(5)).call(axStyle);
  svg.append("text").attr("x", 64).attr("y", 22).attr("font-size", 15).attr("fill", C.mist).text("Rainfall anomalies (1990-2024)");
  svg.append("text").attr("x", 64 + (w - 90) / 2).attr("y", h - 8).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Year");
  svg.append("text").attr("transform", `translate(15,${36 + (h - 84) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("mm from normal");
  const cross = svg.append("g").style("opacity", 0).style("pointer-events", "none");
  cross.append("line").attr("y1", 36).attr("y2", h - 48).attr("stroke", color);
  const dot = cross.append("circle").attr("r", 5).attr("fill", color);
  svg.append("rect").attr("x", 64).attr("y", 36).attr("width", w - 90).attr("height", h - 84).attr("fill", "transparent").style("cursor", "crosshair").on("mousemove", function (ev) {
    const yr = Math.round(x.invert(d3.pointer(ev, svg.node())[0]));
    const d = data.find(r => r.year === yr);
    if (!d) return;
    cross.style("opacity", 1).select("line").attr("x1", x(d.year)).attr("x2", x(d.year));
    dot.attr("cx", x(d.year)).attr("cy", y(d.value));
    showTip(ev, `<b>${d.year}</b><br>${d.value.toFixed(0)} mm from normal`);
  }).on("mouseleave", () => {
    cross.style("opacity", 0);
    hideTip();
  });
}

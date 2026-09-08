import { SAMPLE, C } from "../data.js";
import { stage, showTip, hideTip, axStyle } from "../ui.js";

export function renderSealevelLine(el) {
  const { svg, w, h } = stage(el);
  svg.selectAll("*").remove();

  const color = C.lagoon;
  const data = SAMPLE.anomaliesSea;
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([64, w - 26]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.value)).nice().range([h - 48, 36]);
  const defs = svg.append("defs");
  const gradSea = defs.append("linearGradient").attr("id", "grad-sea").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
  gradSea.selectAll("stop").data([{ o: "0%", c: C.lagoon, op: .7 }, { o: "100%", c: "#05202f", op: .1 }]).join("stop").attr("offset", d => d.o).attr("stop-color", d => d.c).attr("stop-opacity", d => d.op);
  const wipeClipId = "wipe-clip";
  defs.append("clipPath").attr("id", wipeClipId).append("rect").attr("x", 64).attr("y", 0).attr("width", 0).attr("height", h).transition().duration(1400).ease(d3.easeCubicInOut).attr("width", w - 64);
  const drawLayer = svg.append("g").attr("clip-path", `url(#${wipeClipId})`);
  drawLayer.append("path").datum(data).attr("fill", "url(#grad-sea)").attr("d", d3.area().x(d => x(d.year)).y1(d => y(d.value)).y0(h - 48).curve(d3.curveMonotoneX));
  svg.append("line").attr("x1", 64).attr("x2", w - 26).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "rgba(230,215,184,.4)");
  drawLayer.append("path").datum(data).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.4).attr("d", d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));

  const seaClipId = "sea-clip";
  defs.append("clipPath").attr("id", seaClipId).append("path").datum(data).attr("d", d3.area().x(d => x(d.year)).y1(d => y(d.value)).y0(h - 48).curve(d3.curveMonotoneX));
  const waveLayer = drawLayer.append("g").attr("clip-path", `url(#${seaClipId})`).style("mix-blend-mode", "screen");
  const bands = [
    { yFrac: .1, amp: 6, len: 50, speed: 1300, c: C.shallow, top: .3, band: 74 },
    { yFrac: .28, amp: 9, len: 66, speed: 980, c: C.lagoon, top: .34, band: 88 },
    { yFrac: .46, amp: 7, len: 40, speed: 720, c: C.foam, top: .2, band: 60 },
    { yFrac: .62, amp: 11, len: 78, speed: 1100, c: C.turq, top: .38, band: 100 },
    { yFrac: .78, amp: 8, len: 52, speed: 640, c: C.lagoon, top: .3, band: 70 },
    { yFrac: .92, amp: 13, len: 94, speed: 1450, c: C.shallow, top: .32, band: 110 }
  ];
  bands.forEach((b, i) => {
    const gradId = `wave-grad-1-${i}`;
    const grad = defs.append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    grad.selectAll("stop").data([{ o: "0%", c: b.c, op: b.top }, { o: "55%", c: b.c, op: b.top * .35 }, { o: "100%", c: b.c, op: 0 }]).join("stop").attr("offset", d => d.o).attr("stop-color", d => d.c).attr("stop-opacity", d => d.op);
    const baseY = 36 + (h - 84) * b.yFrac;
    const totalW = w - 64 + b.len * 2;
    const pts = d3.range(0, totalW + b.len, 4).map(px => [px, baseY + Math.sin(px / b.len * Math.PI * 2) * b.amp]);
    const area = d3.area().curve(d3.curveBasis).x(d => d[0]).y0(d => d[1]).y1(d => d[1] + b.band);
    const path = waveLayer.append("path").attr("fill", `url(#${gradId})`).attr("d", area(pts)).attr("transform", `translate(${64 - b.len},0)`);
    (function loop() {
      path.attr("transform", `translate(${64 - b.len},0)`).transition().duration(b.speed).ease(d3.easeLinear).attr("transform", `translate(${64},0)`).on("end", loop);
    })();
  });

  svg.append("g").attr("transform", `translate(0,${h - 48})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d"))).call(axStyle);
  svg.append("g").attr("transform", "translate(64,0)").call(d3.axisLeft(y).ticks(5)).call(axStyle);
  svg.append("text").attr("x", 64).attr("y", 22).attr("font-size", 15).attr("fill", C.mist).text("Sea level anomalies (1990-2024)");
  svg.append("text").attr("x", 64 + (w - 90) / 2).attr("y", h - 8).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Year");
  svg.append("text").attr("transform", `translate(15,${36 + (h - 84) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("mm above baseline");
  const cross = svg.append("g").style("opacity", 0).style("pointer-events", "none");
  cross.append("line").attr("y1", 36).attr("y2", h - 48).attr("stroke", color);
  const dot = cross.append("circle").attr("r", 5).attr("fill", color);
  svg.append("rect").attr("x", 64).attr("y", 36).attr("width", w - 90).attr("height", h - 84).attr("fill", "transparent").style("cursor", "crosshair").on("mousemove", function (ev) {
    const yr = Math.round(x.invert(d3.pointer(ev, svg.node())[0]));
    const d = data.find(r => r.year === yr);
    if (!d) return;
    cross.style("opacity", 1).select("line").attr("x1", x(d.year)).attr("x2", x(d.year));
    dot.attr("cx", x(d.year)).attr("cy", y(d.value));
    showTip(ev, `<b>${d.year}</b><br>${d.value.toFixed(0)} mm above baseline`);
  }).on("mouseleave", () => {
    cross.style("opacity", 0);
    hideTip();
  });
}

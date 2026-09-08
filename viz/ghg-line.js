import { PICT, SAMPLE, C } from "../data.js";
import { repaint, selectedIsos, isSelected, toggleSelect } from "../state.js";
import { stage, showTip, hideTip, axStyle } from "../ui.js";

export function renderGhgLine(el) {
  const { svg, w, h, chrome } = stage(el, { chrome: true, chromePosition: "bottom", chromeOffset: 100 });
  svg.selectAll("*").remove();
  chrome.innerHTML = "";

  const data = SAMPLE.ghg_series.map(d => ({ ...d, logValue: Math.log10(Math.max(d.value, .05)) }));

  const ghgCountries = Array.from(new Set(data.map(d => d.country)));
  const ghgPalette = [
    C.ember, C.lagoon, C.sand, C.rain, C.dune, "#e15b8f", C.shallow,
    C.turq, C.sea, C.foam, "#b48ebd", "#a4c2f4", "#f6b26b", "#ffd966",
    "#93c47d", "#76a5af", "#8e7cc3", "#e06666", "#c9daf8", "#d9d2e9", "#ead1dc"
  ];

  const ghgColor = d3.scaleOrdinal().domain(ghgCountries).range(ghgPalette);
  const isoOf = name => PICT.find(p => p.name === name)?.iso ?? name;

  ghgCountries.forEach(name => {
    const iso = isoOf(name);
    const b = document.createElement("button");
    b.setAttribute("aria-pressed", isSelected(iso));
    if (selectedIsos.size > 0 && !isSelected(iso)) b.classList.add("dim");
    b.innerHTML = `<i class="swatch" style="background:${ghgColor(name)}"></i>${name}`;
    b.onclick = ev => {
      toggleSelect(iso, ev.shiftKey);
      repaint(["events", "drivers", "response"]);
    };
    chrome.appendChild(b);
  });

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([64, w - 26]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.logValue)).nice().range([h - 48, 36]);
  svg.append("g").attr("transform", `translate(0,${h - 48})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d"))).call(axStyle);
  svg.append("g").attr("transform", "translate(64,0)").call(d3.axisLeft(y).ticks(6)).call(axStyle);
  const drawLayer = svg.append("g");
  const grouped = d3.group(data, d => d.country);
  const line = d3.line().x(d => x(d.year)).y(d => y(d.logValue)).curve(d3.curveMonotoneX);
  const styleLines = () => {
    drawLayer.selectAll("path").attr("class", d => "mark" + (selectedIsos.size && !isSelected(isoOf(d[0].country)) ? " dim" : "")).attr("stroke", d => ghgColor(d[0].country)).attr("stroke-width", d => isSelected(isoOf(d[0].country)) ? 3.4 : 2.4).filter(d => isSelected(isoOf(d[0].country))).raise();
  };
  Array.from(grouped.entries()).forEach(([name, values]) => {
    const p = drawLayer.append("path").datum(values).attr("fill", "none").attr("stroke", ghgColor(name)).attr("stroke-width", 2.4).style("pointer-events", "none").attr("d", line);
    const L = p.node().getTotalLength();
    p.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).transition().duration(1200).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
  });
  styleLines();
  svg.append("text").attr("x", 64).attr("y", 22).attr("font-size", 15).attr("fill", C.mist).text("CO₂ emission per capita (1970-2024)");
  svg.append("text").attr("x", 64 + (w - 90) / 2).attr("y", h - 8).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Year");
  svg.append("text").attr("transform", `translate(15,${36 + (h - 84) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("CO₂ emission per capita (in log transformation)");
  const cross = svg.append("g").style("opacity", 0).style("pointer-events", "none");
  cross.append("line").attr("y1", 36).attr("y2", h - 48).attr("stroke", "rgba(240,248,246,.3)");
  const dot = cross.append("circle").attr("r", 5).attr("fill", C.sand);

  svg.append("rect").attr("x", 64).attr("y", 36).attr("width", w - 90).attr("height", h - 84).attr("fill", "transparent").style("cursor", "crosshair").on("mousemove", function (ev) {
    const yr = Math.round(x.invert(d3.pointer(ev, svg.node())[0]));
    const vals = data.filter(r => r.year === yr);
    if (!vals.length) return;
    const my = d3.pointer(ev, svg.node())[1];
    const valY = y.invert(my);
    let closest = vals[0];
    let minDist = Infinity;
    vals.forEach(v => {
      const dist = Math.abs(v.logValue - valY);
      if (dist < minDist) { minDist = dist; closest = v; }
    });
    cross.style("opacity", 1).select("line").attr("x1", x(yr)).attr("x2", x(yr));
    dot.attr("cx", x(yr)).attr("cy", y(closest.logValue));
    drawLayer.selectAll("path").attr("class", d => "mark" + (d[0].country !== closest.country ? " dim" : "")).attr("stroke-width", d => d[0].country === closest.country ? 3.4 : 2.4).attr("stroke", d => ghgColor(d[0].country)).filter(d => d[0].country === closest.country).raise();
    showTip(ev, `<b>${closest.country} · ${yr}</b><br>${closest.value.toFixed(1)} tonnes of CO₂ emission<br>(log(${closest.value.toFixed(1)}) = ${closest.logValue.toFixed(2)})`);
  }).on("mouseleave", () => {
    cross.style("opacity", 0);
    hideTip();
    styleLines();
  }).on("click", ev => {
    const yr = Math.round(x.invert(d3.pointer(ev, svg.node())[0]));
    const vals = data.filter(r => r.year === yr);
    if (vals.length) {
      const my = d3.pointer(ev, svg.node())[1];
      const valY = y.invert(my);
      let closest = vals[0], minDist = Infinity;
      vals.forEach(v => {
        const dist = Math.abs(v.logValue - valY);
        if (dist < minDist) { minDist = dist; closest = v; }
      });
      const pxDist = Math.abs(y(closest.logValue) - my);
      if (pxDist <= 14) {
        toggleSelect(isoOf(closest.country), ev.shiftKey);
        repaint(["events", "drivers", "response"]);
        return;
      }
    }
    if (!selectedIsos.size) return;
    selectedIsos.clear();
    repaint(["events", "drivers", "response"]);
  });
}

import { SAMPLE, HAZ_COLOR, C, fmt } from "../data.js";
import { PLOTS, state, HAZARDS, hazardFilter, toggleHazard } from "../state.js";
import { stage, showTip, hideTip, T, axStyle } from "../ui.js";

export function renderEventsWaffle(el, step) {
  const { svg, w, h, chrome } = stage(el, { chrome: true, chromePosition: "bottom", chromeOffset: 55 });
  chrome.innerHTML = "";
  if (el.__eventsMode !== "waffle") svg.selectAll("*").remove();
  el.__eventsMode = "waffle";

  const [minYr, maxYr] = d3.extent(SAMPLE.events, d => d.year);
  const years = d3.range(minYr, maxYr + 1);

  HAZARDS.forEach(t => {
    const b = document.createElement("button");
    const isFilterActive = hazardFilter.size < HAZARDS.length;
    b.setAttribute("aria-pressed", isFilterActive && hazardFilter.has(t));
    if (isFilterActive && !hazardFilter.has(t)) b.classList.add("dim");
    b.innerHTML = `<i class="swatch" style="background:${HAZ_COLOR[t]}"></i>${t}`;
    b.onclick = ev => {
      toggleHazard(t, ev.shiftKey);
      PLOTS.events(el, state.events ?? 0);
    };
    chrome.appendChild(b);
  });

  const left = 40, base = h - 40, top = 42;
  const colW = (w - left - 12) / years.length;
  const active = HAZARDS.filter(t => hazardFilter.has(t));
  const cells = [];
  years.forEach((y, yi) => {
    let k = 0;
    active.forEach(type => {
      const evs = SAMPLE.events.filter(e => e.year === y && e.type === type);
      const n = Math.round(d3.sum(evs, e => e.affected) / 1e4);
      for (let i = 0; i < Math.min(n, 260); i++, k++) cells.push({
        key: `${y}-${type}-${i}`, y, yi, type, idx: k, n, country: evs[i]?.country ?? ""
      });
    });
  });
  const maxStack = d3.max(cells, c => c.idx) + 1 || 1;
  const cw = Math.max(2.5, Math.min(7, colW / 4.2));
  const perRow = Math.max(2, Math.floor((colW - 2) / (cw + 1)));
  const rows = Math.ceil(maxStack / perRow) || 1;
  const ch = Math.max(2, Math.min(cw, (base - top) / rows - 1));
  const geom = c => ({
    x: left + c.yi * colW + c.idx % perRow * (cw + 1),
    y: base - Math.floor(c.idx / perRow) * (ch + 1) - ch,
    w: cw, h: ch, r: 1
  });
  const fill = c => HAZ_COLOR[c.type];

  svg.selectAll("rect.blank-catcher").data([0]).join("rect")
    .attr("class", "blank-catcher").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "transparent")
    .lower()
    .on("click", () => {
      if (hazardFilter.size === HAZARDS.length) return;
      HAZARDS.forEach(x => hazardFilter.add(x));
      PLOTS.events(el, state.events ?? 0);
    });

  const g = svg.selectAll("g.plot").data([0]).join("g").attr("class", "plot");
  g.selectAll("rect").data(cells, d => d.key).join(
    enter => enter.append("rect").attr("class", "mark").attr("x", c => geom(c).x).attr("y", base).attr("width", c => geom(c).w).attr("height", 0).attr("rx", c => geom(c).r).attr("fill", fill).attr("opacity", 0)
      .call(s => s.transition(T()).delay(c => c.yi * 8).attr("y", c => geom(c).y).attr("height", c => geom(c).h).attr("opacity", .94)),
    update => update.call(s => s.transition(T()).delay(c => c.idx * 1.4 + c.yi * 6).attr("x", c => geom(c).x).attr("y", c => geom(c).y).attr("width", c => geom(c).w).attr("height", c => geom(c).h).attr("rx", c => geom(c).r).attr("fill", fill).attr("opacity", .94)),
    exit => exit.call(s => s.transition(T()).attr("y", base).attr("height", 0).attr("opacity", 0).remove())
  ).on("click", (ev, c) => {
    ev.stopPropagation();
    toggleHazard(c.type, ev.shiftKey);
    PLOTS.events(el, state.events ?? 0);
  }).on("mousemove", (ev, c) => showTip(ev, `<b>${c.y} · ${c.type}</b><br>${fmt(c.n * 1e4)} people affected`)).on("mouseleave", hideTip);

  const ax = svg.selectAll("g.ax").data([0]).join("g").attr("class", "ax").attr("transform", `translate(0,${h - 32})`);
  ax.call(d3.axisBottom(d3.scaleLinear().domain([minYr, maxYr]).range([left + colW / 2, left + colW * (years.length - .5)])).ticks(6).tickFormat(d3.format("d"))).call(axStyle);
  svg.selectAll("text.unit").data([0]).join("text").attr("class", "unit").attr("x", left).attr("y", 14).attr("font-size", 15).attr("fill", C.mist).text("Number of people affected by disasters");
  svg.selectAll("text.unit-sub").data([0]).join("text").attr("class", "unit-sub").attr("x", left).attr("y", 30).attr("font-size", 11.5).attr("fill", C.mist).text("One square = 10,000 people affected");
  svg.selectAll("text.axis-x").data([0]).join("text").attr("class", "axis-x").attr("x", left + (w - left - 12) / 2).attr("y", h - 8).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Year");
  svg.selectAll("text.axis-y").data([0]).join("text").attr("class", "axis-y").attr("transform", `translate(13,${top + (base - top) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Number of people affected (×10,000)");
}

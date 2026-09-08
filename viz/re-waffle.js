import { SAMPLE, C } from "../data.js";
import { repaint, selectedIsos, isSelected, toggleSelect, renewState } from "../state.js";
import { stage, showTip, hideTip } from "../ui.js";

export function renderReWaffle(el) {
  const isDesktopLayout = !matchMedia("(max-width:860px)").matches;
  if (isDesktopLayout) {
    el.style.aspectRatio = "auto";
    el.style.height = "90svh";
    el.style.maxHeight = "90svh";
  } else {
    el.style.aspectRatio = "";
    el.style.height = "";
    el.style.maxHeight = "";
  }

  const { svg, w, h, chrome } = stage(el, { chrome: true, chromePosition: "bottom", chromeOffset: 40 });
  svg.selectAll("*").remove();

  let sliderRow = chrome.querySelector(".slider-row");
  if (!sliderRow) {
    chrome.innerHTML = "";
    sliderRow = document.createElement("div");
    sliderRow.className = "slider-row";
    sliderRow.style.display = "flex";
    sliderRow.style.alignItems = "center";
    sliderRow.style.gap = "10px";
    sliderRow.style.width = "100%";
    chrome.appendChild(sliderRow);
  }

  const years = Array.from(new Set(SAMPLE.renew.map(d => d.year))).sort((a, b) => a - b);
  const minYr = years[0], maxYr = years[years.length - 1];
  if (renewState.year == null || renewState.year < minYr || renewState.year > maxYr) renewState.year = maxYr;

  const countries = [];
  const seenIso = new Set();
  SAMPLE.renew.forEach(d => {
    if (!seenIso.has(d.iso)) {
      seenIso.add(d.iso);
      countries.push({ iso: d.iso, name: d.name });
    }
  });
  const byIso = d3.group(SAMPLE.renew, d => d.iso);
  byIso.forEach(rows => rows.sort((a, b) => a.year - b.year));
  const valueForYear = (iso, year) => {
    const rows = byIso.get(iso);
    if (!rows || !rows.length) return 0;
    let best = rows[0], bestDiff = Math.abs(rows[0].year - year);
    rows.forEach(r => {
      const diff = Math.abs(r.year - year);
      if (diff < bestDiff) { best = r; bestDiff = diff; }
    });
    return best.value;
  };
  const displayPct = v => v > 0 && v < 1 ? 1 : Math.round(v);

  if (!sliderRow.querySelector("input")) {
    const yearLabel = document.createElement("span");
    yearLabel.className = "year-label";
    yearLabel.style.color = "var(--ember)";
    yearLabel.style.fontSize = "13px";
    yearLabel.style.minWidth = "36px";
    yearLabel.textContent = renewState.year;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = minYr;
    slider.max = maxYr;
    slider.step = 1;
    slider.value = renewState.year;
    slider.style.flex = "1";
    slider.setAttribute("aria-label", "Select year");
    slider.oninput = () => {
      renewState.year = +slider.value;
      yearLabel.textContent = renewState.year;
      renderReWaffle(el);
    };
    sliderRow.appendChild(yearLabel);
    sliderRow.appendChild(slider);
  } else {
    const slider = sliderRow.querySelector("input");
    const yearLabel = sliderRow.querySelector(".year-label");
    if (+slider.value !== renewState.year) slider.value = renewState.year;
    if (yearLabel) yearLabel.textContent = renewState.year;
  }

  const rows = countries.map(c => ({ ...c, value: valueForYear(c.iso, renewState.year) }));
  const maxCols = w < 460 ? 3 : w < 700 ? 4 : w < 960 ? 5 : 6;
  const cols = Math.min(maxCols, rows.length);
  const nRows = Math.ceil(rows.length / cols);
  const padTop = 52;
  const cellW = (w - 16) / cols, cellH = (h - padTop - 10) / nRows;
  const waffleSize = Math.min(cellW - 30, cellH - 50, 96);
  const grid = 10, sq = waffleSize / grid - 1.4;
  const leftEdge = 8 + (cellW - waffleSize) / 2;

  svg.selectAll("rect.blank-catcher").data([0]).join("rect").attr("class", "blank-catcher").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "transparent")
    .lower()
    .on("click", () => {
      if (!selectedIsos.size) return;
      selectedIsos.clear();
      repaint(["events", "response"]);
    });

  svg.append("text").attr("x", leftEdge).attr("y", 18).attr("font-size", 15).attr("fill", C.mist).text(`Renewable energy share in the total final energy consumption in ${renewState.year}`);
  svg.append("text").attr("x", leftEdge).attr("y", h - 8).attr("font-size", 11.5).attr("fill", C.mist).text("Each square is one percentage point (values under 1% still show one square)");

  const cell = svg.selectAll("g.waffle-cell").data(rows, d => d.iso).join("g").attr("class", d => "waffle-cell" + (selectedIsos.size && !isSelected(d.iso) ? " dim" : "")).attr("transform", (d, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const cx = 8 + c * cellW + (cellW - waffleSize) / 2;
    const cy = padTop + r * cellH;
    return `translate(${cx},${cy})`;
  }).style("cursor", "pointer").on("click", (ev, d) => {
    ev.stopPropagation();
    toggleSelect(d.iso, ev.shiftKey);
    repaint(["events", "response"]);
  }).on("mousemove", (ev, d) => showTip(ev, `<b>${d.name}</b><br>${displayPct(d.value)}% of ${renewState.year} total energy consumption`)).on("mouseleave", hideTip);
  cell.append("text").attr("x", waffleSize / 2).attr("y", -10).attr("text-anchor", "middle").attr("font-size", 12.5).attr("fill", d => isSelected(d.iso) ? C.sand : C.foam).text(d => d.name);
  cell.append("text").attr("x", waffleSize / 2).attr("y", waffleSize + 18).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 600).attr("fill", d => isSelected(d.iso) ? C.sand : C.ember).text(d => displayPct(d.value) + "%");
  cell.each(function (d) {
    const filled = displayPct(d.value);
    const squares = d3.range(100).map(i => ({
      x: i % grid * (sq + 1.4), y: Math.floor(i / grid) * (sq + 1.4), on: i < filled
    }));
    d3.select(this).selectAll("rect").data(squares).join("rect").attr("x", s => s.x).attr("y", s => waffleSize - sq - s.y).attr("width", sq).attr("height", sq).attr("rx", 1).attr("fill", s => s.on ? isSelected(d.iso) ? C.sand : C.ember : "rgba(240,248,246,.1)");
  });
}

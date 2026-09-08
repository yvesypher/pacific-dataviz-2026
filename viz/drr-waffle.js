import { SAMPLE, C } from "../data.js";
import { repaint, selectedIsos, isSelected, toggleSelect } from "../state.js";
import { stage, showTip, hideTip } from "../ui.js";

export function renderDrrWaffle(el) {
  el.style.aspectRatio = "";
  el.style.height = "";
  el.style.maxHeight = "";

  const { svg, w, h } = stage(el);
  svg.selectAll("*").remove();

  const rows = [...SAMPLE.drr].sort((a, b) => b.value - a.value);
  const maxCols = w < 460 ? 3 : w < 700 ? 4 : 4;
  const cols = Math.min(maxCols, rows.length);
  const nRows = Math.ceil(rows.length / cols);
  const padTop = 52;
  const cellW = (w - 16) / cols, cellH = (h - padTop - 10) / nRows;
  const waffleSize = Math.min(cellW - 30, cellH - 50, 96);
  const grid = 10, sq = waffleSize / grid - 1.4;
  const leftEdge = 8 + (cellW - waffleSize) / 2;

  svg.append("rect").attr("class", "blank-catcher").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "transparent")
    .lower()
    .on("click", () => {
      if (!selectedIsos.size) return;
      selectedIsos.clear();
      repaint(["events", "response"]);
    });

  svg.append("text").attr("x", leftEdge).attr("y", 18).attr("font-size", 15).attr("fill", C.mist).text("Proportions of local governments with active DRR strategies in 2021");
  svg.append("text").attr("x", leftEdge).attr("y", h - 8).attr("font-size", 11.5).attr("fill", C.mist).text("Each square is one percentage point");
  const cell = svg.selectAll("g.waffle-cell").data(rows, d => d.iso).join("g").attr("class", d => "waffle-cell" + (selectedIsos.size && !isSelected(d.iso) ? " dim" : "")).attr("transform", (d, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const cx = 8 + c * cellW + (cellW - waffleSize) / 2;
    const cy = padTop + r * cellH;
    return `translate(${cx},${cy})`;
  }).style("cursor", "pointer").on("click", (ev, d) => {
    ev.stopPropagation();
    toggleSelect(d.iso, ev.shiftKey);
    repaint(["events", "response"]);
  }).on("mousemove", (ev, d) => showTip(ev, `<b>${d.name}</b><br>${d.value.toFixed(1)}% of local governments`)).on("mouseleave", hideTip);
  cell.append("text").attr("x", waffleSize / 2).attr("y", -10).attr("text-anchor", "middle").attr("font-size", 12.5).attr("fill", d => isSelected(d.iso) ? C.sand : C.foam).text(d => d.name);
  cell.append("text").attr("x", waffleSize / 2).attr("y", waffleSize + 18).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 600).attr("fill", d => isSelected(d.iso) ? C.sand : C.ember).text(d => d.value.toFixed(0) + "%");
  cell.each(function (d) {
    const filled = Math.round(d.value);
    const squares = d3.range(100).map(i => ({
      x: i % grid * (sq + 1.4), y: Math.floor(i / grid) * (sq + 1.4), on: i < filled
    }));
    d3.select(this).selectAll("rect").data(squares).join("rect").attr("x", s => s.x).attr("y", s => waffleSize - sq - s.y).attr("width", sq).attr("height", sq).attr("rx", 1).attr("fill", s => s.on ? isSelected(d.iso) ? C.sand : C.ember : "rgba(240,248,246,.1)");
  });
}

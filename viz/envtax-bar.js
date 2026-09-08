import { SAMPLE, C } from "../data.js";
import { repaint, selectedIsos, isSelected, toggleSelect } from "../state.js";
import { stage, showTip, hideTip, T, axStyle } from "../ui.js";

export function renderEnvtaxBar(el) {
  el.style.aspectRatio = "";
  el.style.height = "";
  el.style.maxHeight = "";

  const { svg, w, h } = stage(el);
  svg.selectAll("*").remove();

  const rows = [...SAMPLE.envtax].sort((a, b) => b.value - a.value);
  const y2 = d3.scaleBand().domain(rows.map(d => d.name)).range([28, h - 46]).paddingInner(.32).paddingOuter(.08);
  const x2 = d3.scaleLinear().domain([0, d3.max(rows, d => d.value)]).nice().range([176, w - 46]);

  svg.append("rect").attr("class", "blank-catcher").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "transparent")
    .lower()
    .on("click", () => {
      if (!selectedIsos.size) return;
      selectedIsos.clear();
      repaint(["events", "response"]);
    });

  svg.selectAll("rect.mark").data(rows, d => d.iso).join("rect").attr("class", d => "mark" + (selectedIsos.size && !isSelected(d.iso) ? " dim" : "")).attr("x", 176).attr("y", d => y2(d.name)).attr("height", y2.bandwidth()).attr("rx", 2).attr("fill", d => isSelected(d.iso) ? C.sand : C.ember).attr("width", 0).style("cursor", "pointer").on("click", (ev, d) => {
    ev.stopPropagation();
    toggleSelect(d.iso, ev.shiftKey);
    repaint(["events", "response"]);
  }).on("mousemove", (ev, d) => showTip(ev, `<b>${d.name}</b><br>${d.value.toFixed(2)}% of GDP`)).on("mouseleave", hideTip).transition(T()).attr("width", d => Math.max(1.5, x2(d.value) - 176));
  svg.selectAll("text.lab").data(rows, d => d.iso).join("text").attr("class", "lab").attr("x", 166).attr("y", d => y2(d.name) + y2.bandwidth() / 2 + 5).attr("text-anchor", "end").attr("font-size", 13.5).attr("fill", d => isSelected(d.iso) ? C.sand : C.foam).text(d => d.name);
  svg.selectAll("text.val").data(rows, d => d.iso).join("text").attr("class", "val").attr("y", d => y2(d.name) + y2.bandwidth() / 2 + 5).attr("font-size", 12.5).attr("fill", C.mist).text(d => d.value.toFixed(2) + "%").transition(T()).attr("x", d => x2(d.value) + 8);
  svg.append("g").attr("transform", `translate(0,${h - 46})`).call(d3.axisBottom(x2).ticks(5)).call(axStyle);
  svg.append("text").attr("x", 176).attr("y", 14).attr("font-size", 15).attr("fill", C.mist).text("Environmental tax revenue (% of GDP) in 2020");
  svg.append("text").attr("x", 176 + (w - 176 - 46) / 2).attr("y", h - 6).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Environmental tax revenue (% of GDP)");
  svg.append("text").attr("transform", `translate(15,${(28 + (h - 46)) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Country");
}

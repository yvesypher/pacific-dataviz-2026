import { SAMPLE, C } from "../data.js";
import { repaint, selectedIsos, isSelected, toggleSelect } from "../state.js";
import { stage, showTip, hideTip, T, axStyle } from "../ui.js";

export function renderEconlossBar(el) {
  const { svg, w, h, chrome } = stage(el, { chrome: true, chromePosition: "bottom", chromeOffset: 55 });
  chrome.innerHTML = "";
  if (el.__eventsMode !== "loss") svg.selectAll("*").remove();
  el.__eventsMode = "loss";

  const rows = [...SAMPLE.loss].sort((a, b) => b.valueM - a.valueM);
  const y = d3.scaleBand().domain(rows.map(d => d.name)).range([28, h - 46]).paddingInner(.32).paddingOuter(.08);
  const x = d3.scaleLinear().domain([0, d3.max(rows, d => d.valueM)]).nice().range([176, w - 40]);

  svg.selectAll("rect.blank-catcher").data([0]).join("rect").attr("class", "blank-catcher").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "transparent")
    .lower()
    .on("click", () => {
      if (!selectedIsos.size) return;
      selectedIsos.clear();
      repaint(["events", "response"]);
    });

  svg.selectAll("rect.mark").data(rows, d => d.iso).join("rect").attr("class", d => "mark" + (selectedIsos.size && !isSelected(d.iso) ? " dim" : "")).attr("x", 176).attr("y", d => y(d.name)).attr("height", y.bandwidth()).attr("rx", 2).attr("fill", d => isSelected(d.iso) ? C.sand : C.ember).attr("width", 0).style("cursor", "pointer").on("click", (ev, d) => {
    ev.stopPropagation();
    toggleSelect(d.iso, ev.shiftKey);
    repaint(["events", "response"]);
  }).on("mousemove", (ev, d) => showTip(ev, `<b>${d.name}</b><br>${d.valueM.toFixed(1)} million USD annual loss averaged by ${d.nYears}-year data since 2010`)).on("mouseleave", hideTip).transition(T()).attr("width", d => Math.max(1.5, x(d.valueM) - 176));
  svg.selectAll("text.lab").data(rows, d => d.iso).join("text").attr("class", "lab").attr("x", 166).attr("y", d => y(d.name) + y.bandwidth() / 2 + 5).attr("text-anchor", "end").attr("font-size", 13.5).attr("fill", d => isSelected(d.iso) ? C.sand : C.foam).text(d => d.name);
  svg.append("g").attr("transform", `translate(0,${h - 46})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => "$" + d + "M")).call(axStyle);
  svg.append("text").attr("x", 176).attr("y", 14).attr("font-size", 15).attr("fill", C.mist).text("Direct disaster annual economic loss on average");
  svg.append("text").attr("x", 176 + (w - 176 - 40) / 2).attr("y", h - 6).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Average annual loss (million USD)");
  svg.append("text").attr("transform", `translate(15,${(28 + (h - 46)) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", C.mist).text("Country");
}

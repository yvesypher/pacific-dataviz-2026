import { PICT, C, fmt } from "../data.js";
import { geo } from "../state.js";
import { stage, showTip, hideTip } from "../ui.js";

export function renderMap(el, step) {
  const { svg, w, h } = stage(el);
  svg.selectAll("*").remove();
  const proj = d3.geoEquirectangular().rotate([-195, 0]).fitExtent([[20, 20], [w - 20, h - 38]], {
    type: "MultiPoint",
    coordinates: PICT.map(d => [d.lon, d.lat])
  });
  const path = d3.geoPath(proj);
  svg.append("path").attr("d", path(d3.geoGraticule().step([20, 20])())).attr("fill", "none").attr("stroke", "rgba(159,230,220,.12)").attr("stroke-width", .7);
  svg.append("path").attr("d", path({
    type: "LineString",
    coordinates: [[100, 0], [180, 0], [260, 0]]
  })).attr("fill", "none").attr("stroke", "rgba(230,215,184,.26)").attr("stroke-dasharray", "3 6");
  if (geo.LAND) svg.append("path").attr("d", path(geo.LAND)).attr("fill", "rgba(230,215,184,.55)").attr("stroke", "rgba(230,215,184,.9)").attr("stroke-width", .5);
  const shade = d3.scaleLinear().domain(d3.extent(PICT, d => Math.log10(d.ratio))).range([.28, .62]);
  const BLUE = "31,162,180";
  const HILITE = "240,248,246";
  if (geo.EEZ) {
    svg.append("g").selectAll("path").data(geo.EEZ.features).join("path").attr("class", "mark eez-zone").attr("data-iso", f => f.properties.iso).attr("d", path).attr("fill", f => {
      const p = PICT.find(x => x.iso === f.properties.iso);
      if (step === 0) return "transparent";
      if (!p) return `rgba(${BLUE},.35)`;
      return `rgba(${BLUE},${shade(Math.log10(p.ratio)).toFixed(3)})`;
    }).attr("stroke", step === 0 ? "transparent" : `rgba(${BLUE},.7)`).attr("stroke-width", .9).style("transition", "fill .18s ease, stroke .18s ease, stroke-width .18s ease").on("mousemove", function (ev, f) {
      const p = PICT.find(x => x.iso === f.properties.iso);
      if (!p) return;
      d3.select(this).attr("fill", `rgba(${HILITE},.28)`).attr("stroke", `rgba(${HILITE},.95)`).attr("stroke-width", 1.8).raise();
      showTip(ev, `<b>${p.name}</b><br>Land ${fmt(p.land)} km²<br>` + `Ocean ${fmt(p.eez)},000 km²<br>${fmt(p.ratio)} km² of sea per km² of land`);
    }).on("mouseleave", function (ev, f) {
      const p = PICT.find(x => x.iso === f.properties.iso);
      d3.select(this).attr("fill", step === 0 ? "transparent" : p ? `rgba(${BLUE},${shade(Math.log10(p.ratio)).toFixed(3)})` : `rgba(${BLUE},.35)`).attr("stroke", step === 0 ? "transparent" : `rgba(${BLUE},.7)`).attr("stroke-width", .9);
      hideTip();
    });
  } else {
    const circle = d3.geoCircle().radius(3.33);
    svg.append("g").selectAll("path").data(PICT).join("path").attr("class", "mark").attr("d", d => path(circle.center([d.lon, d.lat])())).attr("fill", `rgba(${BLUE},.08)`).attr("stroke", `rgba(${BLUE},.3)`).attr("stroke-width", .7).attr("opacity", step === 0 ? 0 : 1);
  }
  const labelPos = PICT.map(p => {
    let cx, cy;
    if (geo.EEZ) {
      const feats = geo.EEZ.features.filter(f => f.properties.iso === p.iso);
      if (feats.length) {
        const biggest = feats.reduce((a, b) => Math.abs(d3.geoArea(a)) > Math.abs(d3.geoArea(b)) ? a : b);
        [cx, cy] = path.centroid(biggest);
      }
    }
    if (cx == null || !Number.isFinite(cx)) {
      [cx, cy] = proj([p.lon, p.lat]);
    }
    return { ...p, cx, cy };
  });
  const nodes = labelPos.map(p => ({
    ...p, x: p.cx, y: p.cy - 8, rx: Math.max(16, p.name.length * 3)
  }));
  d3.forceSimulation(nodes).force("x", d3.forceX(d => d.cx).strength(.4)).force("y", d3.forceY(d => d.cy - 8).strength(.7)).force("collide", d3.forceCollide(d => d.rx).strength(.95).iterations(4)).stop().tick(220);
  svg.append("g").attr("class", "country-labels").selectAll("text").data(nodes).join("text").attr("x", d => d.x).attr("y", d => d.y).attr("text-anchor", "middle").attr("pointer-events", "none").attr("font-size", 10).attr("font-family", "'Public Sans',sans-serif").attr("fill", C.foam).attr("stroke", "rgba(4,24,35,.85)").attr("stroke-width", 3).attr("paint-order", "stroke").text(d => d.name);
}

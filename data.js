import { repaint, geo } from "./state.js";

export const PICT = [];

export async function loadPict(url = "data/countries.json") {
  const rows = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
  rows.forEach(r => PICT.push({ ...r, ratio: (r.eez * 1e3) / r.land }));
  return PICT;
}

export const HAZ_COLOR = {
  Meteorological: "#e8894a",
  Hydrological: "#57d8cf",
  Climatological: "#d4b47a",
  Geophysical: "#1fa2b4",
  Biological: "#a9d8ef"
};

export const C = {
  abyss: "#05202f", deep: "#0a3a54", sea: "#0f6a86", turq: "#1fa2b4",
  lagoon: "#57d8cf", shallow: "#9fe6dc", rain: "#a9d8ef", sand: "#e6d7b8",
  dune: "#d4b47a", ember: "#e8894a", foam: "#f0f8f6", mist: "rgba(240,248,246,.6)"
};

export const fmt = n => d3.format(",")(Math.round(n));

export const SAMPLE = {
  events: [], anomaliesSst: [], anomaliesSea: [], anomaliesRain: [],
  ghg_series: [], loss: [], drr: [], renew: [], envtax: []
};

export function initDataLoaders() {
  fetch("data/land-10m.json").then(r => r.json()).then(gj => {
    geo.LAND = gj;
    repaint(["map"]);
  }).catch(e => console.error("Coastlines unavailable.", e));

  fetch("data/pict-eez-final.geojson").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(gj => {
    geo.EEZ = gj;
    const summed = {};
    gj.features.forEach(f => {
      const iso = f.properties.iso;
      if (!iso || !f.properties.AREA_KM2) return;
      summed[iso] = (summed[iso] ?? 0) + f.properties.AREA_KM2;
    });
    PICT.forEach(p => {
      if (summed[p.iso]) { p.eez = summed[p.iso] / 1e3; p.ratio = p.eez * 1e3 / p.land; }
    });
    repaint(["map"]);
  }).catch(e => console.error("EEZ layer unavailable.", e));

  fetch("data/events.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(rows => {
    SAMPLE.events = rows;
    repaint(["events"]);
  }).catch(e => console.error("Real disaster data unavailable.", e));

  fetch("data/anomalies.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(d => {
    SAMPLE.anomaliesSst = d.sst;
    SAMPLE.anomaliesSea = d.sea;
    SAMPLE.anomaliesRain = d.rain;
    repaint(["drivers"]);
  }).catch(e => console.error("Real climate-anomaly data unavailable.", e));

  fetch("data/governance.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(d => {
    SAMPLE.loss = d.loss;
    SAMPLE.drr = d.drr;
    SAMPLE.renew = d.renew;
    SAMPLE.envtax = d.envtax;
    repaint(["events", "response"]);
  }).catch(e => console.error("Real governance data unavailable.", e));

  fetch("data/ghg_emissions.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(d => {
    SAMPLE.ghg_series = d;
    repaint(["drivers"]);
  }).catch(e => console.error("Real GHG data unavailable.", e));
}
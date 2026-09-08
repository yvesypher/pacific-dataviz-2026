import { PLOTS, state, repaint, geo } from "./state.js";

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

let seed = 42;
export const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;

export const SAMPLE = {
  events: [], anomaliesSst: [], anomaliesSea: [], anomaliesRain: [],
  ghg_series: [], loss: [], drr: [], renew: [], envtax: []
};

export function buildPlaceholderSample() {
  const HAZARDS = ["Meteorological", "Hydrological", "Climatological", "Geophysical", "Biological"];

  const EVENTS = [];
  d3.range(1995, 2025).forEach(year => {
    const n = 3 + Math.floor(rnd() * 11);
    d3.range(n).forEach(() => {
      const type = rnd() < .46 ? "Meteorological" : HAZARDS[1 + Math.floor(rnd() * 4)];
      EVENTS.push({
        year, type,
        country: PICT[Math.floor(rnd() * PICT.length)].name,
        affected: Math.round(Math.pow(10, 2.4 + rnd() * 3.5))
      });
    });
  });
  SAMPLE.events = EVENTS;

  SAMPLE.anomaliesSst = d3.range(1990, 2025).map(y => ({ year: y, value: (y - 1990) * .018 + (rnd() - .5) * .22 }));
  SAMPLE.anomaliesSea = d3.range(1990, 2025).map(y => ({ year: y, value: (y - 1990) * 3.9 + (rnd() - .5) * 38 }));
  SAMPLE.anomaliesRain = d3.range(1990, 2025).map(y => ({ year: y, value: (rnd() - .5) * (1 + (y - 1990) * .05) * 220 }));

  SAMPLE.ghg_series = (() => {
    const res = [];
    const countries = ["Fiji", "Vanuatu", "Samoa", "Tonga", "Papua New Guinea", "Palau", "New Caledonia"];
    d3.range(1970, 2025).forEach(y => {
      countries.forEach((c, i) => {
        let base = .5 + i * .2;
        if (c === "Palau") base = 50 + (y - 1970) * 1.5;
        else if (c === "New Caledonia") base = 15 + (y - 1970) * .2;
        else base = base + (y - 1970) * .03 + (Math.random() - .5) * .2;
        res.push({ year: y, country: c, value: Math.max(0, base) });
      });
    });
    return res;
  })();

  SAMPLE.loss = [
    { iso: "FJ", name: "Fiji", valueM: 12.4, nYears: 5 },
    { iso: "VU", name: "Vanuatu", valueM: 8.1, nYears: 4 },
    { iso: "TO", name: "Tonga", valueM: 5.6, nYears: 3 },
    { iso: "SB", name: "Solomon Islands", valueM: 3.2, nYears: 3 },
    { iso: "WS", name: "Samoa", valueM: 2.9, nYears: 2 },
    { iso: "PG", name: "Papua New Guinea", valueM: 1.8, nYears: 3 }
  ];

  SAMPLE.drr = [
    { iso: "VU", name: "Vanuatu", value: 72, year: 2021 },
    { iso: "TV", name: "Tuvalu", value: 64, year: 2022 },
    { iso: "MH", name: "Marshall Islands", value: 41, year: 2022 },
    { iso: "KI", name: "Kiribati", value: 22, year: 2021 },
    { iso: "FM", name: "Micronesia (FS)", value: 9, year: 2021 },
    { iso: "WS", name: "Samoa", value: 5, year: 2023 },
    { iso: "FJ", name: "Fiji", value: 0, year: 2022 },
    { iso: "NR", name: "Nauru", value: 0, year: 2022 },
    { iso: "PG", name: "Papua New Guinea", value: 0, year: 2020 }
  ];

  SAMPLE.renew = (() => {
    const targets = [
      { iso: "PG", name: "Papua New Guinea", start: 34, end: 48 },
      { iso: "SB", name: "Solomon Islands", start: 41, end: 47 },
      { iso: "KI", name: "Kiribati", start: 21, end: 39 },
      { iso: "WS", name: "Samoa", start: 26, end: 29 },
      { iso: "VU", name: "Vanuatu", start: 16, end: 26 },
      { iso: "FJ", name: "Fiji", start: 19, end: 25 },
      { iso: "MH", name: "Marshall Islands", start: 6, end: 11 },
      { iso: "NC", name: "New Caledonia", start: 3, end: 9 }
    ];
    const res = [];
    targets.forEach(t => {
      d3.range(2000, 2023).forEach(y => {
        const frac = (y - 2000) / 22;
        const base = t.start + (t.end - t.start) * frac;
        const noise = (rnd() - .5) * 3;
        res.push({ iso: t.iso, name: t.name, year: y, value: Math.max(0, +(base + noise).toFixed(1)) });
      });
    });
    return res;
  })();

  SAMPLE.envtax = [
    { iso: "SB", name: "Solomon Islands", value: 3.6, year: 2020 },
    { iso: "FJ", name: "Fiji", value: .4, year: 2020 },
    { iso: "WS", name: "Samoa", value: .15, year: 2008 },
    { iso: "NR", name: "Nauru", value: .14, year: 2020 },
    { iso: "PG", name: "Papua New Guinea", value: .01, year: 2020 }
  ];
}

export function initDataLoaders() {
  fetch("data/land-10m.json").then(r => r.json()).then(gj => {
    geo.LAND = gj;
    PLOTS.map(document.getElementById("fig-map"), state.map ?? 0);
  }).catch(() => console.warn("Coastlines unavailable — map falls back to markers only."));

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
    PLOTS.map(document.getElementById("fig-map"), state.map ?? 0);
  }).catch(e => console.warn("EEZ layer unavailable — map falls back to circle markers.", e));

  fetch("data/events.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(rows => {
    SAMPLE.events = rows;
    repaint(["events"]);
  }).catch(e => console.warn("Real disaster data unavailable — showing placeholder events.", e));

  fetch("data/anomalies.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(d => {
    SAMPLE.anomaliesSst = d.sst;
    SAMPLE.anomaliesSea = d.sea;
    SAMPLE.anomaliesRain = d.rain;
    repaint(["drivers"]);
  }).catch(e => console.warn("Real climate-anomaly data unavailable — showing placeholder curves.", e));

  fetch("data/governance.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(d => {
    SAMPLE.loss = d.loss;
    SAMPLE.drr = d.drr;
    SAMPLE.renew = d.renew;
    SAMPLE.envtax = d.envtax;
    repaint(["events", "response"]);
  }).catch(e => console.warn("Real governance data unavailable — showing placeholder bars.", e));

  fetch("data/ghg_emissions.json").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(d => {
    SAMPLE.ghg_series = d;
    repaint(["drivers"]);
  }).catch(e => console.warn("Real GHG data unavailable — showing placeholder curve.", e));
}

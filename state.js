export const PLOTS = {};
export const FIGS = { map: "fig-map", events: "fig-events", drivers: "fig-drivers", response: "fig-response" };

export const state = {};

export const revealed = new Set();

export function repaint(keys) {
  (keys ?? Object.keys(FIGS)).forEach(v => {
    const el = document.getElementById(FIGS[v]);
    if (!el) return;
    const step = state[v] ?? 0;
    state[v] = step;
    if (!revealed.has(v + ":" + step)) return;
    PLOTS[v](el, step);
  });
}

export const geo = { LAND: null, EEZ: null };

/* cross-chart country selection */
export const selectedIsos = new Set();
export const isSelected = iso => selectedIsos.has(iso);

export const toggleSelect = (iso, additive) => {
  if (additive) {
    selectedIsos.has(iso) ? selectedIsos.delete(iso) : selectedIsos.add(iso);
  } else if (selectedIsos.size === 1 && selectedIsos.has(iso)) {
    selectedIsos.clear();
  } else {
    selectedIsos.clear();
    selectedIsos.add(iso);
  }
};

/* hazard-type filter */
export const HAZARDS = ["Meteorological", "Hydrological", "Climatological", "Geophysical", "Biological"];
export const hazardFilter = new Set(HAZARDS);

export const toggleHazard = (type, additive) => {
  if (additive) {
    hazardFilter.has(type) ? hazardFilter.delete(type) : hazardFilter.add(type);
    if (!hazardFilter.size) HAZARDS.forEach(x => hazardFilter.add(x));
  } else if (hazardFilter.size === 1 && hazardFilter.has(type)) {
    HAZARDS.forEach(x => hazardFilter.add(x));
  } else {
    hazardFilter.clear();
    hazardFilter.add(type);
  }
};

/* waffle year slider */
export const renewState = { year: null };

document.addEventListener("keydown", ev => {
  if (ev.key !== "Escape") return;
  let changed = false;
  if (selectedIsos.size) { selectedIsos.clear(); changed = true; }
  if (hazardFilter.size !== HAZARDS.length) { HAZARDS.forEach(x => hazardFilter.add(x)); changed = true; }
  if (changed) repaint();
});

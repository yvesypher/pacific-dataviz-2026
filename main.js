import { loadPict, initDataLoaders } from "./data.js";
import { PLOTS, repaint } from "./state.js";
import { initScrollEngine, initWaves } from "./ui.js";

import { renderMap } from "./viz/map.js";
import { renderEventsBar } from "./viz/events-bar.js";
import { renderEventsWaffle } from "./viz/events-waffle.js";
import { renderEconlossBar } from "./viz/econloss-bar.js";
import { renderSeatempLine } from "./viz/seatemp-line.js";
import { renderSealevelLine } from "./viz/sealevel-line.js";
import { renderRainfallLine } from "./viz/rainfall-line.js";
import { renderGhgLine } from "./viz/ghg-line.js";
import { renderEnvtaxBar } from "./viz/envtax-bar.js";
import { renderReWaffle } from "./viz/re-waffle.js";
import { renderDrrWaffle } from "./viz/drr-waffle.js";

PLOTS.map = renderMap;

PLOTS.events = (el, step) => {
  if (step === 3) return renderEconlossBar(el);
  if (step === 2) return renderEventsWaffle(el, step);
  return renderEventsBar(el, step);
};

PLOTS.drivers = (el, step) => {
  if (step === 3) return renderGhgLine(el);
  if (step === 2) return renderRainfallLine(el);
  if (step === 1) return renderSealevelLine(el);
  return renderSeatempLine(el);
};

PLOTS.response = (el, step) => {
  if (step === 2) return renderDrrWaffle(el);
  if (step === 1) return renderReWaffle(el);
  return renderEnvtaxBar(el);
};

(async function bootstrap() {
  await loadPict();
  initScrollEngine();
  initWaves();
  repaint();
  initDataLoaders();
})();

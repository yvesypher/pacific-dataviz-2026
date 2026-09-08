import { FIGS, PLOTS, state, revealed, repaint } from "./state.js";

/* tooltip */
export const tip = document.getElementById("tip");

export function showTip(ev, html) {
  tip.innerHTML = html;
  tip.style.left = ev.clientX + "px";
  tip.style.top = ev.clientY - 10 + "px";
  tip.style.opacity = "1";
}
export const hideTip = () => tip.style.opacity = "0";
document.addEventListener("scroll", hideTip, { passive: true });

/* chart canvas setup */
export function stage(el, opts = {}) {
  const w = el.clientWidth || 640;

  if (el.__stage && el.__stage.w === w && el.__stage.chromeOn === !!opts.chrome && el.__stage.chromePos === opts.chromePosition) return el.__stage;

  el.innerHTML = "";

  const chromeOffset = opts.chromeOffset !== undefined ? opts.chromeOffset : (opts.chrome ? 30 : 0);
  const h = (el.clientHeight || 480) - chromeOffset;

  let chrome = null;

  if (opts.chrome && opts.chromePosition !== "bottom") {
    chrome = document.createElement("div");
    chrome.className = "chrome";
    el.appendChild(chrome);
  }

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  if (opts.chrome && opts.chromePosition === "bottom") {
    chrome = document.createElement("div");
    chrome.className = "chrome";
    chrome.style.marginTop = "14px";
    el.appendChild(chrome);
  }

  el.__stage = { svg, w, h, chrome, chromeOn: !!opts.chrome, chromePos: opts.chromePosition };
  return el.__stage;
}

export function clearStages() {
  Object.values(FIGS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.__stage = null;
  });
}

export const T = () => d3.transition().duration(750).ease(d3.easeCubicInOut);

export const axStyle = g => {
  g.selectAll("text").attr("fill", "rgba(240,248,246,.6)").attr("font-size", 12);
  g.selectAll(".domain,.tick line").attr("stroke", "rgba(159,230,220,.22)");
};

/* scroll engine */
export function initScrollEngine() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const stepEl = e.target;
      const viz = stepEl.parentElement.dataset.viz, step = +stepEl.dataset.step;
      stepEl.parentElement.querySelectorAll(".step").forEach(s => s.classList.toggle("is-active", s === stepEl));
      const key = viz + ":" + step;
      const firstReveal = !revealed.has(key);
      if (state[viz] === step && !firstReveal) return;
      revealed.add(key);
      state[viz] = step;
      PLOTS[viz](document.getElementById(FIGS[viz]), step);
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  document.querySelectorAll(".step").forEach(s => io.observe(s));

  const wavesEl = document.getElementById("waves");
  new IntersectionObserver(es => es.forEach(e =>
    wavesEl.classList.toggle("hidden", e.isIntersecting)),
    { rootMargin: "-10% 0px -10% 0px" }
  ).observe(document.getElementById("sec-map"));

  const rail = document.getElementById("rail");
  const sections = [...document.querySelectorAll("[data-label]")];

  sections.forEach(sec => {
    const b = document.createElement("button");
    b.title = sec.dataset.label;
    b.setAttribute("aria-label", sec.dataset.label);
    b.onclick = () => sec.scrollIntoView({ behavior: "smooth" });
    rail.appendChild(b);
  });

  const railIo = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = sections.indexOf(e.target);
    [...rail.children].forEach((b, j) => b.setAttribute("aria-current", i === j));
  }), { rootMargin: "-50% 0px -50% 0px" });

  sections.forEach(s => railIo.observe(s));

  addEventListener("resize", debounce(() => { clearStages(); repaint(); }, 220));
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* animated wave bg */
export function initWaves() {
  const cv = document.getElementById("waves"), ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  let t = 0;
  const bands = [
    { y: .42, a: .15, c: "159,230,220" },
    { y: .5, a: .12, c: "87,216,207" },
    { y: .58, a: .13, c: "230,215,184" },
    { y: .66, a: .09, c: "31,162,180" },
    { y: .74, a: .08, c: "212,180,122" }
  ];
  function size() {
    cv.width = innerWidth * devicePixelRatio;
    cv.height = innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  function draw() {
    const w = innerWidth, h = innerHeight, drift = scrollY * .0014;
    ctx.clearRect(0, 0, w, h);
    bands.forEach((b, k) => {
      ctx.beginPath();
      const base = h * b.y;
      for (let px = 0; px <= w; px += 7) {
        const yy = base + Math.sin(px * .0045 + t * .55 + k * .6 + drift) * (8 + k * 1.3);
        px ? ctx.lineTo(px, yy) : ctx.moveTo(px, yy);
      }
      ctx.strokeStyle = `rgba(${b.c},${b.a})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    if (!reduce) requestAnimationFrame(() => { t += .006; draw(); });
  }
  size();
  draw();
  addEventListener("resize", () => { size(); if (reduce) draw(); });
  if (reduce) addEventListener("scroll", draw, { passive: true });
}

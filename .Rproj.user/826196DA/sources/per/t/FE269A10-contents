library(readxl)
library(dplyr)
library(jsonlite)

# ── Configuration ─────────────────────────────────────────────────────
args <- commandArgs(trailingOnly = TRUE)

in_path  <- if (length(args) >= 1) args[1] else "data/disaster_oceania.xlsx"
out_path <- if (length(args) >= 2) args[2] else "data/events.json"

PICT_NAMES <- c(
  PNG = "Papua New Guinea",
  SLB = "Solomon Islands",
  VUT = "Vanuatu",
  NCL = "New Caledonia",
  FJI = "Fiji",
  TON = "Tonga",
  WSM = "Samoa",
  ASM = "American Samoa",
  NIU = "Niue",
  COK = "Cook Islands",
  PYF = "French Polynesia",
  WLF = "Wallis and Futuna",
  TKL = "Tokelau",
  TUV = "Tuvalu",
  KIR = "Kiribati",
  NRU = "Nauru",
  MHL = "Marshall Islands",
  FSM = "Micronesia (FS)",
  PLW = "Palau",
  GUM = "Guam",
  MNP = "N. Mariana Islands",
  PCN = "Pitcairn"
)

# ── Read data ─────────────────────────────────────────────────────────
raw <- read_excel(in_path, sheet = "EM-DAT Data")

cat(sprintf("Read %d rows from '%s'\n", nrow(raw), in_path))

# ── Clean and aggregate ──────────────────────────────────────────────
events <- raw |>
  filter(ISO %in% names(PICT_NAMES)) |>
  mutate(
    country = unname(PICT_NAMES[ISO]),
    affected_count = coalesce(`Total Affected`, `No. Affected`, 0)
  ) |>
  filter(
    !is.na(`Start Year`),
    !is.na(`Disaster Subgroup`)
  ) |>
  group_by(
    year = `Start Year`,
    country,
    type = `Disaster Subgroup`
  ) |>
  summarise(
    affected = sum(affected_count, na.rm = TRUE),
    event_count = n(),
    .groups = "drop"
  ) |>
  arrange(year, country, type)

# ── Export ────────────────────────────────────────────────────────────
cat(sprintf("Final grouped event count: %d\n", nrow(events)))

write_json(
  events,
  out_path,
  auto_unbox = TRUE,
  pretty = TRUE
)

cat(sprintf("Wrote %s\n", out_path))

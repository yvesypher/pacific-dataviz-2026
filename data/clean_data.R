library(readxl)
library(dplyr)
library(jsonlite)
library(readr)

args <- commandArgs(trailingOnly = TRUE)

PATHS <- list(
  disaster_in = if (length(args) >= 1) args[1] else "data/disaster_oceania.xlsx",
  disaster_out = if (length(args) >= 2) args[2] else "data/events.json",
  sst_in = if (length(args) >= 3) args[3] else "data/seasurfacetemp_anomalies.csv",
  sea_in = if (length(args) >= 4) args[4] else "data/sealevel_anomalies.csv",
  rain_in = if (length(args) >= 5) args[5] else "data/rainfall_anomalies.csv",
  climate_out = if (length(args) >= 6) args[6] else "data/anomalies.json",
  ghg_in = if (length(args) >= 7) args[7] else "data/greenhouse_gaz_emission_per_capita.csv",
  ghg_out = if (length(args) >= 8) args[8] else "data/ghg_emissions.json"
)

PICT_NAMES <- c(
  PNG = "Papua New Guinea", SLB = "Solomon Islands", VUT = "Vanuatu",
  NCL = "New Caledonia", FJI = "Fiji", TON = "Tonga", WSM = "Samoa",
  ASM = "American Samoa", NIU = "Niue", COK = "Cook Islands",
  PYF = "French Polynesia", WLF = "Wallis and Futuna", TKL = "Tokelau",
  TUV = "Tuvalu", KIR = "Kiribati", NRU = "Nauru", MHL = "Marshall Islands",
  FSM = "Micronesia (FS)", PLW = "Palau", GUM = "Guam", MNP = "N. Mariana Islands",
  PCN = "Pitcairn"
)

PICT_ISO2 <- c(
  "PG", "SB", "VU", "NC", "FJ", "TO", "WS", "AS", "NU", "CK", "PF", 
  "WF", "TK", "TV", "KI", "NR", "MH", "FM", "PW", "GU", "MP", "PN"
)

#### Disaster events ####

raw_events <- read_excel(PATHS$disaster_in, sheet = "EM-DAT Data")
cat(sprintf("Read %d rows from '%s'\n", nrow(raw_events), PATHS$disaster_in))

events <- raw_events |>
  filter(ISO %in% names(PICT_NAMES)) |>
  mutate(
    country = unname(PICT_NAMES[ISO]),
    affected_count = coalesce(`Total Affected`, `No. Affected`, 0)
  ) |>
  filter(!is.na(`Start Year`), !is.na(`Disaster Subgroup`)) |>
  group_by(year = `Start Year`, country, type = `Disaster Subgroup`) |>
  summarise(
    affected = sum(affected_count, na.rm = TRUE),
    event_count = n(),
    .groups = "drop"
  ) |>
  arrange(year, country, type)

cat(sprintf("Final grouped event count: %d\n", nrow(events)))
write_json(events, PATHS$disaster_out, auto_unbox = TRUE, pretty = TRUE)
cat(sprintf("Wrote %s\n", PATHS$disaster_out))


#### Climate anomalies ####

read_pdh <- function(path) {
  read.csv(path, stringsAsFactors = FALSE) |>
    filter(GEO_PICT %in% PICT_ISO2, !is.na(OBS_VALUE), OBS_VALUE != "") |>
    transmute(
      iso = GEO_PICT,
      year = as.integer(TIME_PERIOD),
      value = as.numeric(OBS_VALUE)
    )
}

regional_mean <- function(data) {
  data |>
    group_by(year) |>
    summarise(value = mean(value, na.rm = TRUE), .groups = "drop") |>
    arrange(year)
}

summarise_series <- function(data, name) {
  cat(sprintf("%-8s: %d years (%d–%d)\n", name, nrow(data), min(data$year), max(data$year)))
}

sst  <- read_pdh(PATHS$sst_in) |> regional_mean()
sea  <- read_pdh(PATHS$sea_in) |> regional_mean() |> mutate(value = value * 1000)
rain <- read_pdh(PATHS$rain_in) |> regional_mean()

summarise_series(sst, "SST")
summarise_series(sea, "Sea level")
summarise_series(rain, "Rainfall")

climate_result <- list(
  sst = sst |> select(year, value),
  sea = sea |> select(year, value),
  rain = rain |> select(year, value)
)

write_json(climate_result, PATHS$climate_out, auto_unbox = TRUE, pretty = TRUE, digits = 4)
cat(sprintf("Wrote %s\n", PATHS$climate_out))


#### Greenhouse gas emissions ####

raw_ghg <- read_csv(PATHS$ghg_in, show_col_types = FALSE)

emissions <- raw_ghg |>
  filter(!is.na(TIME_PERIOD), !is.na(OBS_VALUE)) |>
  group_by(year = TIME_PERIOD) |>
  summarise(
    mean_value = mean(OBS_VALUE, na.rm = TRUE),
    median_value = median(OBS_VALUE, na.rm = TRUE),
    .groups = "drop"
  ) |>
  arrange(year)

cat(sprintf("Read %d rows, aggregated to %d years.\n", nrow(raw_ghg), nrow(emissions)))
write_json(emissions, PATHS$ghg_out, auto_unbox = TRUE, pretty = TRUE)
cat(sprintf("Wrote %s\n", PATHS$ghg_out))
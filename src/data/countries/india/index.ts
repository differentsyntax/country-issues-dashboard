import geo from "./geo.json";
import indicators from "./indicators.json";
import type { CountryPackage, RegionProps, IndicatorsDataset } from "@/lib/types";

export const india: CountryPackage = {
  id: "IN",
  name: "India",
  flag: "🇮🇳",
  geo: geo as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProps>,
  dataset: indicators as unknown as IndicatorsDataset,
};

import geo from "./geo.json";
import issues from "./issues.json";
import type { CountryPackage, RegionProps, IssuesDataset } from "@/lib/types";

export const india: CountryPackage = {
  id: "IN",
  name: "India",
  flag: "🇮🇳",
  geo: geo as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProps>,
  dataset: issues as unknown as IssuesDataset,
};

import { geoMercator, geoPath } from "d3-geo";
import { activeCountry } from "./countries";
import type { RegionProps } from "./types";

export const statesGeo = activeCountry.geo;

export const MAP_WIDTH = 560;
export const MAP_HEIGHT = 620;

export const projection = geoMercator().fitExtent(
  [
    [12, 12],
    [MAP_WIDTH - 12, MAP_HEIGHT - 12],
  ],
  statesGeo
);

export const pathGenerator = geoPath(projection);

export function centroidFor(key: string): [number, number] | null {
  const feature = statesGeo.features.find((f: GeoJSON.Feature<GeoJSON.Geometry, RegionProps>) => f.properties.st_nm === key);
  if (!feature) return null;
  return pathGenerator.centroid(feature);
}

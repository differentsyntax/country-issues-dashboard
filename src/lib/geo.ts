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
  const [x, y] = pathGenerator.centroid(feature);
  // Round to 2 decimals: plenty of precision for a 560x620 viewBox, and it
  // keeps this value identical between server and client. Unlike the `d`
  // attribute built via d3-path (which rounds internally by default),
  // .centroid() returns raw floats straight out of the Mercator projection's
  // trig math, which can differ in the last bit between Node's V8 and the
  // browser's V8 — enough to fail React hydration on the small-territory
  // marker dots that use this value.
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

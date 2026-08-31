import { india } from "@/data/countries/india";
import type { CountryPackage } from "./types";

/**
 * Registry of available countries. Add a new one by creating
 * src/data/countries/<code>/{geo.json,issues.json,index.ts} (use the india
 * package as a template — same field shapes) and listing its export here.
 */
export const COUNTRIES: CountryPackage[] = [india];

export const DEFAULT_COUNTRY_ID = india.id;

export function getCountry(id: string = DEFAULT_COUNTRY_ID): CountryPackage {
  return COUNTRIES.find((c) => c.id === id) ?? india;
}

// Single active country for this build. Once a second country is added,
// swap this for a store-backed selection (see README "Adding another
// country") and thread `activeCountry` through the components that
// currently import from lib/data.ts and lib/geo.ts directly.
export const activeCountry = getCountry();

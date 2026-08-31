import {
  Briefcase,
  CircleDot,
  School,
  ShieldAlert,
  Stethoscope,
  Wallet,
  Wind,
  type LucideIcon,
} from "lucide-react";

// Explicit id -> component map, rather than a wildcard `import * as Icons`
// with a dynamic lookup. A dynamic lookup can't be statically analyzed by
// the bundler, so it defeats tree-shaking and pulls the entire lucide-react
// library (4000+ icons) into the client bundle. Keep this list in sync with
// the `icon` ids used in each country's indicators.json (`meta.indicators`).
const ICONS: Record<string, LucideIcon> = {
  "briefcase": Briefcase,
  "wallet": Wallet,
  "shield-alert": ShieldAlert,
  "school": School,
  "stethoscope": Stethoscope,
  "wind": Wind,
};

export function resolveIcon(iconId: string): LucideIcon {
  return ICONS[iconId] ?? CircleDot;
}

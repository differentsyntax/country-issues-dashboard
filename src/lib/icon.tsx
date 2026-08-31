import {
  Briefcase,
  Building2,
  CircleDot,
  CloudRain,
  Droplet,
  Gavel,
  IdCard,
  Landmark,
  Map,
  Road,
  School,
  ShieldAlert,
  ShoppingBasket,
  Stethoscope,
  Train,
  Trash2,
  TrendingUp,
  Wallet,
  Wheat,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Explicit id -> component map, rather than a wildcard `import * as Icons`
// with a dynamic lookup. A dynamic lookup can't be statically analyzed by
// the bundler, so it defeats tree-shaking and pulls the entire lucide-react
// library (4000+ icons) into the client bundle. Keep this list in sync with
// the `icon` ids used in each country's issues.json (`meta.categories`).
const ICONS: Record<string, LucideIcon> = {
  "briefcase": Briefcase,
  "building": Building2,
  "cloud-rain": CloudRain,
  "droplet": Droplet,
  "gavel": Gavel,
  "id-card": IdCard,
  "landmark": Landmark,
  "map": Map,
  "road": Road,
  "school": School,
  "shield-alert": ShieldAlert,
  "shopping-basket": ShoppingBasket,
  "stethoscope": Stethoscope,
  "train": Train,
  "trash": Trash2,
  "trending-up": TrendingUp,
  "wallet": Wallet,
  "wheat": Wheat,
  "wind": Wind,
  "zap": Zap,
};

export function resolveIcon(iconId: string): LucideIcon {
  return ICONS[iconId] ?? CircleDot;
}

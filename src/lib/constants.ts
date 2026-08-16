import { CityColor, CityDefinition } from "./types";

export const DEFAULT_CITIES: CityDefinition[] = [
  { id: "new-york", name: "New York", color: "blue" },
  { id: "washington", name: "Washington", color: "blue" },
  { id: "london", name: "London", color: "blue" },
  { id: "jacksonville", name: "Jacksonville", color: "yellow" },
  { id: "sao-paulo", name: "São Paulo", color: "yellow" },
  { id: "lagos", name: "Lagos", color: "yellow" },
  { id: "tripoli", name: "Tripoli", color: "black" },
  { id: "cairo", name: "Cairo", color: "black" },
  { id: "istanbul", name: "Istanbul", color: "black" },
];

export const DEFAULT_CARDS_PER_CITY = 3;

export const INITIAL_SETUP_DRAW_COUNT = 9;

export const COLOR_CONFIG: Record<
  CityColor,
  { bg: string; border: string; text: string; label: string }
> = {
  blue: {
    bg: "bg-blue-100",
    border: "border-blue-500",
    text: "text-blue-800",
    label: "Blue",
  },
  yellow: {
    bg: "bg-yellow-100",
    border: "border-yellow-500",
    text: "text-yellow-800",
    label: "Yellow",
  },
  black: {
    bg: "bg-gray-200",
    border: "border-gray-700",
    text: "text-gray-900",
    label: "Black",
  },
  red: {
    bg: "bg-red-100",
    border: "border-red-500",
    text: "text-red-800",
    label: "Red",
  },
};

export const COLOR_ORDER: CityColor[] = ["blue", "yellow", "black", "red"];

export const STORAGE_KEY_GAME = "pandemic-tracker-game";
export const STORAGE_KEY_CAMPAIGN = "pandemic-tracker-campaign";

export function getInfectionRate(epidemicCount: number): number {
  if (epidemicCount <= 2) return 2;
  if (epidemicCount <= 4) return 3;
  if (epidemicCount <= 6) return 4;
  return 5;
}

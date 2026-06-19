export type CityColor = "blue" | "yellow" | "black" | "red";

export interface CityDefinition {
  id: string;
  name: string;
  color: CityColor;
}

export interface CityCardEntry {
  cityId: string;
}

export interface DeckSection {
  id: string;
  cards: CityCardEntry[];
  drawnFromHere: string[];
}

export interface GameState {
  sections: DeckSection[];
  discardPile: string[];
  removedCards: string[];
  epidemicCount: number;
  history: GameAction[];
}

export interface CampaignConfig {
  cities: CityDefinition[];
  cardsPerCity: Record<string, number>;
}

export type GameAction =
  | { type: "DRAW_CARD"; cityId: string; sectionId: string }
  | {
      type: "EPIDEMIC";
      bottomCardCityId: string;
      newSectionId: string;
      previousDiscardPile: string[];
    }
  | { type: "REMOVE_CARD"; cityId: string };

export interface CityProbability {
  cityId: string;
  name: string;
  color: CityColor;
  totalCardsInDeck: number;
  cardsInDiscard: number;
  cardsRemoved: number;
  probability: number;
  sectionIndex: number | null;
  cardsBySection: {
    sectionIndex: number;
    count: number;
  }[];
}

import {
  CampaignConfig,
  CityCardEntry,
  CityProbability,
  DeckSection,
  GameAction,
  GameState,
} from "./types";
import { DEFAULT_CARDS_PER_CITY, getInfectionRate } from "./constants";

export function createInitialDeck(config: CampaignConfig): GameState {
  const cards: CityCardEntry[] = [];
  for (const city of config.cities) {
    const count = config.cardsPerCity[city.id] ?? DEFAULT_CARDS_PER_CITY;
    for (let i = 0; i < count; i++) {
      cards.push({ cityId: city.id });
    }
  }

  return {
    sections: [
      {
        id: crypto.randomUUID(),
        cards,
        drawnFromHere: [],
      },
    ],
    discardPile: [],
    removedCards: [],
    epidemicCount: 0,
    history: [],
  };
}

function getRemainingCards(section: DeckSection): CityCardEntry[] {
  const drawnCounts: Record<string, number> = {};
  for (const cityId of section.drawnFromHere) {
    drawnCounts[cityId] = (drawnCounts[cityId] ?? 0) + 1;
  }

  const remaining: CityCardEntry[] = [];
  const usedCounts: Record<string, number> = {};
  for (const card of section.cards) {
    usedCounts[card.cityId] = (usedCounts[card.cityId] ?? 0) + 1;
    if ((usedCounts[card.cityId] ?? 0) <= (drawnCounts[card.cityId] ?? 0)) {
      continue;
    }
    remaining.push(card);
  }
  return remaining;
}

export function getSectionRemainingCount(section: DeckSection): number {
  return getRemainingCards(section).length;
}

export function getCityCountInSection(
  section: DeckSection,
  cityId: string
): number {
  const remaining = getRemainingCards(section);
  return remaining.filter((c) => c.cityId === cityId).length;
}

export function drawCard(state: GameState, cityId: string): GameState {
  let targetSectionIndex = -1;
  for (let i = 0; i < state.sections.length; i++) {
    if (getCityCountInSection(state.sections[i], cityId) > 0) {
      targetSectionIndex = i;
      break;
    }
  }

  if (targetSectionIndex === -1) {
    return state;
  }

  const targetSection = state.sections[targetSectionIndex];
  const newSections = state.sections.map((s, i) => {
    if (i !== targetSectionIndex) return s;
    return {
      ...s,
      drawnFromHere: [...s.drawnFromHere, cityId],
    };
  });

  const updatedSections = newSections.filter(
    (s) => getSectionRemainingCount(s) > 0
  );

  const action: GameAction = {
    type: "DRAW_CARD",
    cityId,
    sectionId: targetSection.id,
  };

  return {
    ...state,
    sections: updatedSections,
    discardPile: [cityId, ...state.discardPile],
    history: [...state.history, action],
  };
}

export function epidemic(
  state: GameState,
  bottomCardCityId: string,
  cardsToRemove: string[] = []
): GameState {
  const bottomSectionIndex = state.sections.length - 1;
  if (bottomSectionIndex < 0) return state;

  const bottomSection = state.sections[bottomSectionIndex];
  if (getCityCountInSection(bottomSection, bottomCardCityId) === 0) {
    return state;
  }

  const updatedBottomSection: DeckSection = {
    ...bottomSection,
    drawnFromHere: [...bottomSection.drawnFromHere, bottomCardCityId],
  };

  const discardWithBottom = [bottomCardCityId, ...state.discardPile];

  const stillToRemove = [...cardsToRemove];
  const keptDiscard: string[] = [];
  const removedCardIds: string[] = [];
  for (const cityId of discardWithBottom) {
    const idx = stillToRemove.indexOf(cityId);
    if (idx !== -1) {
      stillToRemove.splice(idx, 1);
      removedCardIds.push(cityId);
    } else {
      keptDiscard.push(cityId);
    }
  }

  const newSectionId = crypto.randomUUID();
  const newTopSection: DeckSection = {
    id: newSectionId,
    cards: keptDiscard.map((cityId) => ({ cityId })),
    drawnFromHere: [],
  };

  const middleSections = state.sections.slice(0, bottomSectionIndex);
  const newSections = [
    newTopSection,
    ...middleSections,
    updatedBottomSection,
  ].filter((s) => getSectionRemainingCount(s) > 0);

  const action: GameAction = {
    type: "EPIDEMIC",
    bottomCardCityId,
    newSectionId,
    previousDiscardPile: [...state.discardPile],
    removedCardIds,
  };

  return {
    ...state,
    sections: newSections,
    discardPile: [],
    removedCards: [...state.removedCards, ...removedCardIds],
    epidemicCount: state.epidemicCount + 1,
    history: [...state.history, action],
  };
}

export function removeCard(state: GameState, cityId: string): GameState {
  const idx = state.discardPile.indexOf(cityId);
  if (idx === -1) return state;

  const newDiscard = [...state.discardPile];
  newDiscard.splice(idx, 1);

  const action: GameAction = { type: "REMOVE_CARD", cityId };

  return {
    ...state,
    discardPile: newDiscard,
    removedCards: [...state.removedCards, cityId],
    history: [...state.history, action],
  };
}

export function undoLastAction(state: GameState): GameState {
  if (state.history.length === 0) return state;

  const lastAction = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  switch (lastAction.type) {
    case "DRAW_CARD": {
      const { cityId, sectionId } = lastAction;
      const discardIdx = state.discardPile.indexOf(cityId);
      const newDiscard = [...state.discardPile];
      if (discardIdx !== -1) newDiscard.splice(discardIdx, 1);

      let sectionFound = false;
      const newSections = state.sections.map((s) => {
        if (s.id !== sectionId) return s;
        sectionFound = true;
        const drawnIdx = s.drawnFromHere.lastIndexOf(cityId);
        const newDrawn = [...s.drawnFromHere];
        if (drawnIdx !== -1) newDrawn.splice(drawnIdx, 1);
        return { ...s, drawnFromHere: newDrawn };
      });

      if (!sectionFound) {
        const restoredSection: DeckSection = {
          id: sectionId,
          cards: [{ cityId }],
          drawnFromHere: [],
        };

        let insertIndex = 0;
        for (let i = 0; i < state.history.length - 1; i++) {
          const h = state.history[i];
          if (h.type === "EPIDEMIC" && h.newSectionId === sectionId) {
            break;
          }
          if (h.type === "DRAW_CARD" && h.sectionId === sectionId) {
            restoredSection.cards.push({ cityId: h.cityId });
          }
        }
        for (const h of newHistory) {
          if (h.type === "DRAW_CARD" && h.sectionId === sectionId) {
            restoredSection.drawnFromHere.push(h.cityId);
          }
        }

        const sectionOrder = buildSectionOrder(newHistory);
        insertIndex = findSectionInsertIndex(
          newSections,
          sectionId,
          sectionOrder
        );
        newSections.splice(insertIndex, 0, restoredSection);
      }

      return {
        ...state,
        sections: newSections,
        discardPile: newDiscard,
        history: newHistory,
      };
    }

    case "EPIDEMIC": {
      const { bottomCardCityId, newSectionId, previousDiscardPile, removedCardIds } =
        lastAction;

      const newSections = state.sections
        .filter((s) => s.id !== newSectionId)
        .map((s, _i, arr) => {
          const isBottom = s === arr[arr.length - 1];
          if (!isBottom) return s;
          const drawnIdx = s.drawnFromHere.lastIndexOf(bottomCardCityId);
          if (drawnIdx === -1) return s;
          const newDrawn = [...s.drawnFromHere];
          newDrawn.splice(drawnIdx, 1);
          return { ...s, drawnFromHere: newDrawn };
        });

      let restoredBottomSection = false;
      const finalSections = [...newSections];
      if (newSections.length === 0 || !restoredBottomSection) {
        const bottomNeedsRestore = !newSections.some((s) => {
          const remaining = getRemainingCards(s);
          return remaining.length > 0;
        });
        if (bottomNeedsRestore && newSections.length === 0) {
          const restoredSection: DeckSection = {
            id: "restored-" + crypto.randomUUID(),
            cards: [{ cityId: bottomCardCityId }],
            drawnFromHere: [],
          };
          finalSections.push(restoredSection);
          restoredBottomSection = true;
        }
      }

      const newRemoved = [...state.removedCards];
      for (const cityId of removedCardIds) {
        const idx = newRemoved.lastIndexOf(cityId);
        if (idx !== -1) newRemoved.splice(idx, 1);
      }

      return {
        ...state,
        sections: finalSections.length > 0 ? finalSections : newSections,
        discardPile: previousDiscardPile,
        removedCards: newRemoved,
        epidemicCount: state.epidemicCount - 1,
        history: newHistory,
      };
    }

    case "REMOVE_CARD": {
      const { cityId } = lastAction;
      const removedIdx = state.removedCards.lastIndexOf(cityId);
      const newRemoved = [...state.removedCards];
      if (removedIdx !== -1) newRemoved.splice(removedIdx, 1);

      return {
        ...state,
        discardPile: [...state.discardPile, cityId],
        removedCards: newRemoved,
        history: newHistory,
      };
    }

    default:
      return state;
  }
}

function buildSectionOrder(history: GameAction[]): string[] {
  const order: string[] = [];
  for (const h of history) {
    if (h.type === "EPIDEMIC") {
      order.unshift(h.newSectionId);
    }
  }
  return order;
}

function findSectionInsertIndex(
  sections: DeckSection[],
  sectionId: string,
  sectionOrder: string[]
): number {
  const targetOrderIdx = sectionOrder.indexOf(sectionId);
  if (targetOrderIdx === -1) return sections.length;

  for (let i = 0; i < sections.length; i++) {
    const sIdx = sectionOrder.indexOf(sections[i].id);
    if (sIdx > targetOrderIdx) {
      return i;
    }
  }
  return sections.length;
}

function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

function probMissFromSection(
  sectionSize: number,
  cityCount: number,
  draws: number
): number {
  if (draws <= 0 || cityCount <= 0) return 1;
  if (draws >= sectionSize) return cityCount > 0 ? 0 : 1;
  return (
    binomialCoefficient(sectionSize - cityCount, draws) /
    binomialCoefficient(sectionSize, draws)
  );
}

export function calculateProbabilities(
  state: GameState,
  config: CampaignConfig
): CityProbability[] {
  const infectionRate = getInfectionRate(state.epidemicCount);

  return config.cities.map((city) => {
    const cardsBySection: { sectionIndex: number; count: number }[] = [];
    let totalCardsInDeck = 0;
    let firstSectionIndex: number | null = null;

    for (let i = 0; i < state.sections.length; i++) {
      const count = getCityCountInSection(state.sections[i], city.id);
      if (count > 0) {
        cardsBySection.push({ sectionIndex: i, count });
        totalCardsInDeck += count;
        if (firstSectionIndex === null) firstSectionIndex = i;
      }
    }

    const cardsInDiscard = state.discardPile.filter(
      (id) => id === city.id
    ).length;
    const cardsRemoved = state.removedCards.filter(
      (id) => id === city.id
    ).length;

    let drawsRemaining = infectionRate;
    let probMiss = 1;

    for (let i = 0; i < state.sections.length && drawsRemaining > 0; i++) {
      const section = state.sections[i];
      const sectionSize = getSectionRemainingCount(section);
      if (sectionSize === 0) continue;

      const cityCount = getCityCountInSection(section, city.id);
      const drawsFromSection = Math.min(drawsRemaining, sectionSize);

      probMiss *= probMissFromSection(sectionSize, cityCount, drawsFromSection);
      drawsRemaining -= drawsFromSection;
    }

    return {
      cityId: city.id,
      name: city.name,
      color: city.color,
      totalCardsInDeck,
      cardsInDiscard,
      cardsRemoved,
      probability: 1 - probMiss,
      sectionIndex: firstSectionIndex,
      cardsBySection,
    };
  });
}

export function getBottomSectionCities(state: GameState): string[] {
  if (state.sections.length === 0) return [];
  const bottomSection = state.sections[state.sections.length - 1];
  const remaining = getRemainingCards(bottomSection);
  const uniqueCities = [...new Set(remaining.map((c) => c.cityId))];
  return uniqueCities;
}

export function getDrawableCities(state: GameState): string[] {
  const allCities = new Set<string>();
  for (const section of state.sections) {
    const remaining = getRemainingCards(section);
    for (const card of remaining) {
      allCities.add(card.cityId);
    }
  }
  return [...allCities];
}

export function getTotalCardsInDeck(state: GameState): number {
  return state.sections.reduce(
    (sum, s) => sum + getSectionRemainingCount(s),
    0
  );
}

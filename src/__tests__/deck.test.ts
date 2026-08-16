import {
  createInitialDeck,
  drawCard,
  epidemic,
  removeCard,
  undoLastAction,
  calculateProbabilities,
  getSectionRemainingCount,
  getCityCountInSection,
  getBottomSectionCities,
  getDrawableCities,
  getTotalCardsInDeck,
} from "../lib/deck";
import { getInfectionRate } from "../lib/constants";
import { CampaignConfig } from "../lib/types";

const testConfig: CampaignConfig = {
  cities: [
    { id: "new-york", name: "New York", color: "blue" },
    { id: "washington", name: "Washington", color: "blue" },
    { id: "london", name: "London", color: "blue" },
    { id: "jacksonville", name: "Jacksonville", color: "yellow" },
    { id: "sao-paulo", name: "São Paulo", color: "yellow" },
    { id: "lagos", name: "Lagos", color: "yellow" },
    { id: "tripoli", name: "Tripoli", color: "black" },
    { id: "cairo", name: "Cairo", color: "black" },
    { id: "istanbul", name: "Istanbul", color: "black" },
  ],
  cardsPerCity: {},
};

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

describe("createInitialDeck", () => {
  it("creates a deck with 27 cards in 1 section", () => {
    const state = createInitialDeck(testConfig);
    expect(state.sections).toHaveLength(1);
    expect(state.sections[0].cards).toHaveLength(27);
    expect(state.sections[0].drawnFromHere).toHaveLength(0);
    expect(state.discardPile).toHaveLength(0);
    expect(state.removedCards).toHaveLength(0);
    expect(state.epidemicCount).toBe(0);
    expect(state.history).toHaveLength(0);
  });

  it("creates 3 cards per city by default", () => {
    const state = createInitialDeck(testConfig);
    const nyCards = state.sections[0].cards.filter(
      (c) => c.cityId === "new-york"
    );
    expect(nyCards).toHaveLength(3);
  });

  it("respects custom card counts", () => {
    const config: CampaignConfig = {
      cities: [{ id: "test-city", name: "Test City", color: "red" }],
      cardsPerCity: { "test-city": 5 },
    };
    const state = createInitialDeck(config);
    expect(state.sections[0].cards).toHaveLength(5);
  });
});

describe("drawCard", () => {
  it("draws a card from the top section and adds to discard", () => {
    const state = createInitialDeck(testConfig);
    const newState = drawCard(state, "new-york");

    expect(newState.discardPile).toEqual(["new-york"]);
    expect(getCityCountInSection(newState.sections[0], "new-york")).toBe(2);
    expect(getSectionRemainingCount(newState.sections[0])).toBe(26);
  });

  it("records the action in history", () => {
    const state = createInitialDeck(testConfig);
    const newState = drawCard(state, "new-york");

    expect(newState.history).toHaveLength(1);
    expect(newState.history[0].type).toBe("DRAW_CARD");
  });

  it("removes exhausted sections", () => {
    const config: CampaignConfig = {
      cities: [{ id: "only-city", name: "Only", color: "blue" }],
      cardsPerCity: { "only-city": 1 },
    };
    let state = createInitialDeck(config);
    state = drawCard(state, "only-city");

    expect(state.sections).toHaveLength(0);
    expect(state.discardPile).toEqual(["only-city"]);
  });

  it("returns unchanged state if city not in deck", () => {
    const state = createInitialDeck(testConfig);
    const newState = drawCard(state, "nonexistent");
    expect(newState).toBe(state);
  });

  it("draws from the topmost section containing the city", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = drawCard(state, "london");

    state = epidemic(state, "cairo");

    expect(state.sections.length).toBeGreaterThanOrEqual(2);
    const topSection = state.sections[0];
    expect(
      getCityCountInSection(topSection, "new-york")
    ).toBe(1);

    state = drawCard(state, "new-york");
    expect(getCityCountInSection(state.sections[0], "new-york")).toBe(0);
  });
});

describe("epidemic", () => {
  it("creates a new top section from discard + bottom card", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = drawCard(state, "london");

    const discardBefore = [...state.discardPile];
    state = epidemic(state, "cairo");

    expect(state.epidemicCount).toBe(1);
    expect(state.discardPile).toHaveLength(0);

    const topSection = state.sections[0];
    const topCityIds = topSection.cards.map((c) => c.cityId).sort();
    const expectedIds = ["cairo", ...discardBefore].sort();
    expect(topCityIds).toEqual(expectedIds);
  });

  it("draws from the bottom section", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");

    state = epidemic(state, "cairo");

    const bottomSection = state.sections[state.sections.length - 1];
    expect(getCityCountInSection(bottomSection, "cairo")).toBe(2);
  });

  it("increments epidemic count", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = epidemic(state, "cairo");
    expect(state.epidemicCount).toBe(1);

    state = drawCard(state, "new-york");
    state = epidemic(state, "london");
    expect(state.epidemicCount).toBe(2);
  });

  it("returns unchanged state if bottom city not available", () => {
    const state = createInitialDeck(testConfig);
    const newState = epidemic(state, "nonexistent");
    expect(newState).toBe(state);
  });

  it("removes specified cards from the discard pile before shuffling", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = drawCard(state, "london");

    state = epidemic(state, "cairo", ["new-york"]);

    expect(state.removedCards).toEqual(["new-york"]);
    const topSection = state.sections[0];
    const topCityIds = topSection.cards.map((c) => c.cityId).sort();
    expect(topCityIds).toEqual(["cairo", "london"]);
  });

  it("can remove the newly drawn bottom card itself", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");

    state = epidemic(state, "cairo", ["cairo"]);

    expect(state.removedCards).toEqual(["cairo"]);
    const topSection = state.sections[0];
    const topCityIds = topSection.cards.map((c) => c.cityId);
    expect(topCityIds).toEqual(["new-york"]);
  });

  it("undo restores discard pile and removed cards", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = drawCard(state, "london");
    const beforeEpidemic = state;

    state = epidemic(state, "cairo", ["new-york"]);
    state = undoLastAction(state);

    expect(state.discardPile).toEqual(beforeEpidemic.discardPile);
    expect(state.removedCards).toEqual(beforeEpidemic.removedCards);
    expect(state.epidemicCount).toBe(beforeEpidemic.epidemicCount);
  });
});

describe("removeCard", () => {
  it("moves a card from discard to removed", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");

    state = removeCard(state, "new-york");

    expect(state.discardPile).toHaveLength(0);
    expect(state.removedCards).toEqual(["new-york"]);
  });

  it("records the action in history", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = removeCard(state, "new-york");

    const lastAction = state.history[state.history.length - 1];
    expect(lastAction.type).toBe("REMOVE_CARD");
  });

  it("returns unchanged state if city not in discard", () => {
    const state = createInitialDeck(testConfig);
    const newState = removeCard(state, "new-york");
    expect(newState).toBe(state);
  });
});

describe("undoLastAction", () => {
  it("undoes a draw card", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = undoLastAction(state);

    expect(state.discardPile).toHaveLength(0);
    expect(getSectionRemainingCount(state.sections[0])).toBe(27);
    expect(getCityCountInSection(state.sections[0], "new-york")).toBe(3);
    expect(state.history).toHaveLength(0);
  });

  it("undoes an epidemic", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = drawCard(state, "london");
    const beforeEpidemic = state;

    state = epidemic(state, "cairo");
    expect(state.epidemicCount).toBe(1);

    state = undoLastAction(state);
    expect(state.epidemicCount).toBe(0);
    expect(state.discardPile).toEqual(beforeEpidemic.discardPile);
    expect(state.sections.length).toBe(beforeEpidemic.sections.length);
  });

  it("undoes a remove card", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = removeCard(state, "new-york");

    state = undoLastAction(state);
    expect(state.removedCards).toHaveLength(0);
    expect(state.discardPile).toContain("new-york");
  });

  it("returns unchanged state if no history", () => {
    const state = createInitialDeck(testConfig);
    const newState = undoLastAction(state);
    expect(newState).toBe(state);
  });
});

describe("getInfectionRate", () => {
  it("returns 2 for 0-2 epidemics", () => {
    expect(getInfectionRate(0)).toBe(2);
    expect(getInfectionRate(1)).toBe(2);
    expect(getInfectionRate(2)).toBe(2);
  });

  it("returns 3 for 3-4 epidemics", () => {
    expect(getInfectionRate(3)).toBe(3);
    expect(getInfectionRate(4)).toBe(3);
  });

  it("returns 4 for 5-6 epidemics", () => {
    expect(getInfectionRate(5)).toBe(4);
    expect(getInfectionRate(6)).toBe(4);
  });

  it("returns 5 for 7+ epidemics", () => {
    expect(getInfectionRate(7)).toBe(5);
    expect(getInfectionRate(10)).toBe(5);
  });
});

describe("calculateProbabilities", () => {
  it("calculates correct initial probabilities", () => {
    const state = createInitialDeck(testConfig);
    const probs = calculateProbabilities(state, testConfig);

    const nyProb = probs.find((p) => p.cityId === "new-york")!;
    expect(nyProb.totalCardsInDeck).toBe(3);
    expect(nyProb.sectionIndex).toBe(0);

    // P(drawing at least one NY) = 1 - C(24,2)/C(27,2)
    const expected = 1 - binom(24, 2) / binom(27, 2);
    expect(nyProb.probability).toBeCloseTo(expected, 10);
  });

  it("shows 0 probability for cities not in deck", () => {
    const config: CampaignConfig = {
      cities: [
        { id: "a", name: "A", color: "blue" },
        { id: "b", name: "B", color: "red" },
      ],
      cardsPerCity: { a: 3, b: 3 },
    };
    let state = createInitialDeck(config);
    state = drawCard(state, "a");
    state = drawCard(state, "a");
    state = drawCard(state, "a");

    const probs = calculateProbabilities(state, config);
    const aProb = probs.find((p) => p.cityId === "a")!;
    expect(aProb.totalCardsInDeck).toBe(0);
    expect(aProb.probability).toBe(0);
  });

  it("updates probabilities after epidemic", () => {
    let state = createInitialDeck(testConfig);
    state = drawCard(state, "new-york");
    state = drawCard(state, "london");
    state = epidemic(state, "cairo");

    const probs = calculateProbabilities(state, testConfig);

    // After epidemic: top section has 3 cards (new-york, london, cairo)
    // Drawing 2 from 3 cards, P(new-york) = 1 - C(2,2)/C(3,2) = 1 - 1/3 = 2/3
    const nyProb = probs.find((p) => p.cityId === "new-york")!;
    expect(nyProb.probability).toBeCloseTo(2 / 3, 10);
    expect(nyProb.sectionIndex).toBe(0);

    // Washington is NOT in the top section, it's in section 1 (original)
    const waProb = probs.find((p) => p.cityId === "washington")!;
    expect(waProb.sectionIndex).toBe(1);
    // P(washington) from top section = miss (no washington in top)
    // But we only draw 2, and top has 3 cards, so we don't reach section 1
    expect(waProb.probability).toBe(0);
  });

  it("calculates cross-section probabilities", () => {
    const config: CampaignConfig = {
      cities: [
        { id: "a", name: "A", color: "blue" },
        { id: "b", name: "B", color: "red" },
      ],
      cardsPerCity: { a: 2, b: 2 },
    };
    let state = createInitialDeck(config);
    // Draw a, then epidemic with b from bottom
    state = drawCard(state, "a");
    state = epidemic(state, "b");

    // Top section: [a, b] (2 cards), bottom section: [a, b, b] minus drawn → [a, b] (wait, let's trace)
    // Initial: section0 = [a, a, b, b]
    // Draw a: section0 = [a(drawn), a, b, b], discard = [a]
    // Epidemic: bottom draw b from section0 → section0.drawnFromHere = [a, b]
    //   remaining in section0 = [a, b]
    //   discard becomes [b, a]
    //   new top section = [b, a] (2 cards)
    //   section0 remaining = [a, b] (2 cards)
    // infection rate = 2 (0 epidemics wait, now 1 epidemic)
    // Draw 2 cards: top section has 2 cards, so all draws come from top
    // P(a from top) = 1 - C(1,2)/C(2,2) = 1 - 0/1 = 1? No.
    // C(2-1, 2) / C(2, 2) = C(1,2)/C(2,2) = 0/1 = 0
    // P(miss a) = 0, P(a) = 1
    // That's because we draw all 2 cards from a 2-card section that contains a
    const probs = calculateProbabilities(state, config);
    const aProb = probs.find((p) => p.cityId === "a")!;
    expect(aProb.probability).toBe(1);
  });
});

describe("utility functions", () => {
  it("getBottomSectionCities returns cities in bottom section", () => {
    const state = createInitialDeck(testConfig);
    const cities = getBottomSectionCities(state);
    expect(cities).toHaveLength(9);
  });

  it("getDrawableCities returns all cities with cards in deck", () => {
    const state = createInitialDeck(testConfig);
    const cities = getDrawableCities(state);
    expect(cities).toHaveLength(9);
  });

  it("getTotalCardsInDeck returns correct count", () => {
    let state = createInitialDeck(testConfig);
    expect(getTotalCardsInDeck(state)).toBe(27);

    state = drawCard(state, "new-york");
    expect(getTotalCardsInDeck(state)).toBe(26);
  });
});

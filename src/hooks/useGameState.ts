"use client";

import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  createInitialDeck,
  drawCard,
  epidemic,
  removeCard,
  undoLastAction,
  calculateProbabilities,
  getTotalCardsInDeck,
} from "../lib/deck";
import { getInfectionRate, STORAGE_KEY_GAME, STORAGE_KEY_CAMPAIGN, DEFAULT_CITIES, DEFAULT_CARDS_PER_CITY } from "../lib/constants";
import { CampaignConfig, CityProbability, GameState } from "../lib/types";

const defaultCampaign: CampaignConfig = {
  cities: DEFAULT_CITIES,
  cardsPerCity: Object.fromEntries(
    DEFAULT_CITIES.map((c) => [c.id, DEFAULT_CARDS_PER_CITY])
  ),
};

export function useGameState() {
  const [campaignConfig, setCampaignConfig, campaignHydrated] = useLocalStorage<CampaignConfig>(
    STORAGE_KEY_CAMPAIGN,
    defaultCampaign
  );

  const [gameState, setGameState, gameHydrated] = useLocalStorage<GameState>(
    STORAGE_KEY_GAME,
    createInitialDeck(defaultCampaign)
  );

  const hydrated = campaignHydrated && gameHydrated;

  const probabilities: CityProbability[] = useMemo(
    () => calculateProbabilities(gameState, campaignConfig),
    [gameState, campaignConfig]
  );

  const infectionRate = useMemo(
    () => getInfectionRate(gameState.epidemicCount),
    [gameState.epidemicCount]
  );

  const totalCardsInDeck = useMemo(
    () => getTotalCardsInDeck(gameState),
    [gameState]
  );

  const handleDrawCard = useCallback(
    (cityId: string) => {
      setGameState((prev) => drawCard(prev, cityId));
    },
    [setGameState]
  );

  const handleEpidemic = useCallback(
    (bottomCardCityId: string) => {
      setGameState((prev) => epidemic(prev, bottomCardCityId));
    },
    [setGameState]
  );

  const handleRemoveCard = useCallback(
    (cityId: string) => {
      setGameState((prev) => removeCard(prev, cityId));
    },
    [setGameState]
  );

  const handleUndo = useCallback(() => {
    setGameState((prev) => undoLastAction(prev));
  }, [setGameState]);

  const handleNewGame = useCallback(() => {
    setGameState(createInitialDeck(campaignConfig));
  }, [setGameState, campaignConfig]);

  const canUndo = gameState.history.length > 0;

  const lastAction = canUndo
    ? gameState.history[gameState.history.length - 1]
    : null;

  return {
    hydrated,
    gameState,
    campaignConfig,
    setCampaignConfig,
    probabilities,
    infectionRate,
    totalCardsInDeck,
    drawCard: handleDrawCard,
    triggerEpidemic: handleEpidemic,
    removeCard: handleRemoveCard,
    undo: handleUndo,
    newGame: handleNewGame,
    canUndo,
    lastAction,
  };
}

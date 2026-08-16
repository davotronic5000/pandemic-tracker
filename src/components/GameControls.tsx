"use client";

import { useState } from "react";
import { CampaignConfig, CityProbability, GameAction, GameState } from "../lib/types";
import { EpidemicCounter } from "./EpidemicCounter";
import { DrawCardModal } from "./DrawCardModal";
import { EpidemicFlow } from "./EpidemicFlow";
import { DiscardPile } from "./DiscardPile";
import { RemovedCards } from "./RemovedCards";
import { NewGameDialog } from "./NewGameDialog";
import { CityConfigModal } from "./CityConfigModal";
import { getTotalCardsInDeck } from "../lib/deck";
import { INITIAL_SETUP_DRAW_COUNT } from "../lib/constants";

interface GameControlsProps {
  gameState: GameState;
  campaignConfig: CampaignConfig;
  probabilities: CityProbability[];
  infectionRate: number;
  canUndo: boolean;
  lastAction: GameAction | null;
  onDrawCard: (cityId: string) => void;
  onEpidemic: (bottomCardCityId: string, cardsToRemove?: string[]) => void;
  onRemoveCard: (cityId: string) => void;
  onUndo: () => void;
  onNewGame: () => void;
  onSaveCampaign: (config: CampaignConfig) => void;
}

export function GameControls({
  gameState,
  campaignConfig,
  probabilities,
  infectionRate,
  canUndo,
  lastAction,
  onDrawCard,
  onEpidemic,
  onRemoveCard,
  onUndo,
  onNewGame,
  onSaveCampaign,
}: GameControlsProps) {
  const [showDraw, setShowDraw] = useState(false);
  const [showEpidemic, setShowEpidemic] = useState(false);
  const [showNewGame, setShowNewGame] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [cardsDrawnThisTurn, setCardsDrawnThisTurn] = useState(0);
  const [initialSetupDrawn, setInitialSetupDrawn] = useState(0);

  const totalCards = getTotalCardsInDeck(gameState);

  const handleDraw = (cityId: string) => {
    onDrawCard(cityId);
    const newDrawn = cardsDrawnThisTurn + 1;
    if (newDrawn >= infectionRate) {
      setCardsDrawnThisTurn(0);
      setShowDraw(false);
    } else {
      setCardsDrawnThisTurn(newDrawn);
    }
  };

  const handleInitialSetupDraw = (cityId: string) => {
    onDrawCard(cityId);
    const newDrawn = initialSetupDrawn + 1;
    if (newDrawn >= INITIAL_SETUP_DRAW_COUNT) {
      setInitialSetupDrawn(0);
      setShowInitialSetup(false);
    } else {
      setInitialSetupDrawn(newDrawn);
    }
  };

  const getUndoLabel = (): string => {
    if (!lastAction) return "Undo";
    switch (lastAction.type) {
      case "DRAW_CARD": {
        const city = campaignConfig.cities.find(
          (c) => c.id === lastAction.cityId
        );
        return `Undo: Drew ${city?.name ?? lastAction.cityId}`;
      }
      case "EPIDEMIC":
        return "Undo: Epidemic";
      case "REMOVE_CARD": {
        const city = campaignConfig.cities.find(
          (c) => c.id === lastAction.cityId
        );
        return `Undo: Removed ${city?.name ?? lastAction.cityId}`;
      }
      default:
        return "Undo";
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      <EpidemicCounter
        epidemicCount={gameState.epidemicCount}
        infectionRate={infectionRate}
      />

      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
        <span className="text-sm text-gray-500">Cards in deck: </span>
        <span className="text-lg font-bold text-gray-800">{totalCards}</span>
        <span className="text-sm text-gray-500 ml-2">
          ({gameState.sections.length} section
          {gameState.sections.length !== 1 ? "s" : ""})
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setCardsDrawnThisTurn(0);
            setShowDraw(true);
          }}
          disabled={totalCards === 0}
          className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Draw Cards
        </button>
        <button
          onClick={() => setShowEpidemic(true)}
          disabled={totalCards === 0}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white font-bold text-lg active:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ☣ Epidemic
        </button>
      </div>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-full py-3 rounded-xl bg-gray-200 text-gray-700 font-medium active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        {getUndoLabel()}
      </button>

      <DiscardPile
        discardPile={gameState.discardPile}
        campaignConfig={campaignConfig}
        onRemoveCard={onRemoveCard}
      />

      <RemovedCards
        removedCards={gameState.removedCards}
        campaignConfig={campaignConfig}
      />

      <div className="flex gap-3 mt-auto pt-4">
        <button
          onClick={() => setShowNewGame(true)}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium active:bg-gray-200 text-sm"
        >
          New Game
        </button>
        <button
          onClick={() => setShowConfig(true)}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium active:bg-gray-200 text-sm"
        >
          ⚙ Cities
        </button>
      </div>

      {showDraw && (
        <DrawCardModal
          probabilities={probabilities}
          remaining={infectionRate - cardsDrawnThisTurn}
          onDraw={handleDraw}
          onClose={() => {
            setShowDraw(false);
            setCardsDrawnThisTurn(0);
          }}
        />
      )}

      {showInitialSetup && (
        <DrawCardModal
          probabilities={probabilities}
          remaining={INITIAL_SETUP_DRAW_COUNT - initialSetupDrawn}
          title="Infect Step: Initial Setup"
          onDraw={handleInitialSetupDraw}
          onClose={() => {
            setShowInitialSetup(false);
            setInitialSetupDrawn(0);
          }}
        />
      )}

      {showEpidemic && (
        <EpidemicFlow
          gameState={gameState}
          campaignConfig={campaignConfig}
          onEpidemic={onEpidemic}
          onClose={() => setShowEpidemic(false)}
        />
      )}

      {showNewGame && (
        <NewGameDialog
          onConfirm={() => {
            onNewGame();
            setInitialSetupDrawn(0);
            setShowInitialSetup(true);
          }}
          onClose={() => setShowNewGame(false)}
        />
      )}

      {showConfig && (
        <CityConfigModal
          campaignConfig={campaignConfig}
          onSave={onSaveCampaign}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}

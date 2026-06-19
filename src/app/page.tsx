"use client";

import { useGameState } from "../hooks/useGameState";
import { CityList } from "../components/CityList";
import { GameControls } from "../components/GameControls";

export default function Home() {
  const {
    hydrated,
    gameState,
    campaignConfig,
    setCampaignConfig,
    probabilities,
    infectionRate,
    drawCard,
    triggerEpidemic,
    removeCard,
    undo,
    newGame,
    canUndo,
    lastAction,
  } = useGameState();

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="w-[60%] border-r border-gray-200 overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-10">
          <h1 className="text-lg font-bold text-gray-800">
            Pandemic Tracker
          </h1>
          <p className="text-xs text-gray-500">
            Infection deck probabilities
          </p>
        </div>
        <CityList probabilities={probabilities} />
      </div>

      <div className="w-[40%] flex flex-col overflow-hidden">
        <GameControls
          gameState={gameState}
          campaignConfig={campaignConfig}
          probabilities={probabilities}
          infectionRate={infectionRate}
          canUndo={canUndo}
          lastAction={lastAction}
          onDrawCard={drawCard}
          onEpidemic={triggerEpidemic}
          onRemoveCard={removeCard}
          onUndo={undo}
          onNewGame={newGame}
          onSaveCampaign={setCampaignConfig}
        />
      </div>
    </div>
  );
}

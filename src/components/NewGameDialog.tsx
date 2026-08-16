"use client";

interface NewGameDialogProps {
  onConfirm: () => void;
  onClose: () => void;
}

export function NewGameDialog({ onConfirm, onClose }: NewGameDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm m-4 p-6">
        <h2 className="text-lg font-bold mb-2">Start New Game?</h2>
        <p className="text-sm text-gray-600 mb-6">
          This will reset the current game and start the Infect Step of
          setup, where you&apos;ll draw 9 cards from the infection deck. Your
          city configuration will be preserved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 font-medium text-gray-700 active:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-blue-600 font-medium text-white active:bg-blue-700"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

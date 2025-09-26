import React from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import { CloseIcon, LibraryIcon, PlusIcon } from '../ui/icons';
import { DEFAULT_PLAYBOOK_LIBRARY } from '../../constants';

const PlaybookLibraryPopup: React.FC = () => {
  const { dispatch } = useUIContext();
  const { dispatch: tacticsDispatch } = useTacticsContext();

  const handleAddPlay = (play: (typeof DEFAULT_PLAYBOOK_LIBRARY)[0]) => {
    tacticsDispatch({ type: 'ADD_LIBRARY_PLAY_TO_PLAYBOOK', payload: play });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message: `"${play.name}" added and loaded!`, type: 'success' },
    });
    dispatch({ type: 'CLOSE_MODAL' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-teal-400 flex items-center">
            <LibraryIcon className="w-5 h-5 mr-2" />
            Playbook Library
          </h2>
          <button
            onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-grow overflow-y-auto space-y-2">
          {DEFAULT_PLAYBOOK_LIBRARY.map(play => (
            <div
              key={play.id}
              className="group flex items-center justify-between p-3 bg-gray-700/50 rounded-md"
            >
              <div>
                <p className="font-semibold text-white">{play.name}</p>
                <p className="text-xs text-gray-400">
                  {play.category} - For {play.formationId}
                </p>
              </div>
              <button
                onClick={() => handleAddPlay(play)}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded text-sm flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" /> Add to Playbook
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaybookLibraryPopup;

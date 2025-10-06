import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useUIContext } from '../../hooks';
import { CloseIcon } from '../ui/icons';

const TUTORIAL_STEPS = [
  {
    selector: 'header',
    text: 'Welcome to Astral Turf! This is the main header where you can manage files, your franchise, and general settings.',
  },
  {
    selector: '[class*="LeftSidebar"]',
    text: 'The Left Sidebar is your command center for managing formations, playbook, and your roster of players.',
  },
  {
    selector: '[class*="RightSidebar"]',
    text: 'The Right Sidebar provides AI-powered analysis of your tactics and allows you to adjust team-wide strategies.',
  },
  {
    selector: '[class*="Dugout"]',
    text: 'The Dugout at the bottom shows your benched players. Drag players from the roster or the field to the dugout to bench them.',
  },
  {
    selector: '[class*="TacticalToolbar"]',
    text: 'Use the Tactical Toolbar to draw plays, add text, and control animations on the field.',
  },
  {
    selector: '[data-testid="header-franchise-button"]',
    text: 'Click the Franchise menu to access all career mode features like finances, transfers, and training. Good luck, Gaffer!',
  },
];

const InteractiveTutorialPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const {
    tutorial: { step },
  } = uiState;
  const [highlightStyle, setHighlightStyle] = useState({});
  const prevStepRef = useRef(step);

  const currentStep = TUTORIAL_STEPS[step];

  useLayoutEffect(() => {
    const calculateStyle = () => {
      const element = document.querySelector(currentStep.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightStyle({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          transition: prevStepRef.current !== step ? 'all 0.3s ease-in-out' : 'none',
        });
      } else {
        setHighlightStyle({ display: 'none' });
      }
    };
    calculateStyle();
    window.addEventListener('resize', calculateStyle);
    prevStepRef.current = step;

    return () => window.removeEventListener('resize', calculateStyle);
  }, [step, currentStep.selector]);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      dispatch({ type: 'SET_TUTORIAL_STEP', payload: step + 1 });
    } else {
      dispatch({ type: 'END_TUTORIAL' });
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      dispatch({ type: 'SET_TUTORIAL_STEP', payload: step - 1 });
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'END_TUTORIAL' });
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 animate-fade-in-scale"
        style={{ animationDuration: '0.3s' }}
      ></div>
      {/* Highlight Box */}
      <div
        className="absolute border-4 border-teal-400 rounded-lg shadow-2xl"
        style={{
          ...highlightStyle,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
          pointerEvents: 'none',
        }}
      ></div>
      {/* Tutorial Text Box */}
      <div
        className="absolute p-4 w-full max-w-sm rounded-lg shadow-xl bg-slate-800 text-white pointer-events-auto animate-fade-in-scale"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animationDuration: '0.5s',
        }}
      >
        <p className="text-sm mb-4">{currentStep.text}</p>
        <div className="flex justify-between items-center">
          <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-white">
            Skip Tutorial
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {step + 1} / {TUTORIAL_STEPS.length}
            </span>
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-sm"
              >
                Prev
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded-md text-sm"
            >
              {step === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTutorialPopup;

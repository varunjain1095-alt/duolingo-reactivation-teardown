/**
 * INTERNAL DEVELOPER TOOLING ONLY — NOT A USER-FACING SHIPPED FEATURE
 * Scoped strictly to development/debugging environments (gated via ?dev=true URL flag).
 */

import React from 'react';
import { Play, RefreshCw, Compass } from 'lucide-react';

export default function DevControlPanel({
  selectedPersona,
  onChangePersona,
  currentScreen,
  onChangeScreen,
  engineSource,
  onReplayModal,
  onTriggerTour,
  onResetBadge,
  badgeState
}) {
  return (
    <div className="relative w-full z-40 bg-[#09151a] border-b border-[#2b404d] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg font-sans">
      {/* Left: Engine & Persona Selection */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 font-black uppercase text-[#ff9600]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff9600] animate-pulse"></span>
          <span>[DEV ONLY TOOLING] Reactivation Engine</span>
        </div>

        <span className="text-gray-600">|</span>

        {/* Persona Select */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold">Persona:</span>
          <button
            onClick={() => onChangePersona('broad')}
            className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
              selectedPersona === 'broad'
                ? 'bg-amber-500 text-amber-950 shadow'
                : 'bg-[#18262d] text-gray-300 hover:text-white border border-[#2b404d]'
            }`}
          >
            Tim (Broad Tier)
          </button>
          <button
            onClick={() => onChangePersona('narrow')}
            className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
              selectedPersona === 'narrow'
                ? 'bg-[#1cb0f6] text-white shadow'
                : 'bg-[#18262d] text-gray-300 hover:text-white border border-[#2b404d]'
            }`}
          >
            John (Narrow Tier)
          </button>
        </div>

        <span className="text-gray-600">|</span>

        {/* Screen View Toggle */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold">Target View:</span>
          <button
            onClick={() => onChangeScreen('home')}
            className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
              currentScreen === 'home'
                ? 'bg-[#58cc02] text-white'
                : 'bg-[#18262d] text-gray-300 hover:text-white border border-[#2b404d]'
            }`}
          >
            Screen A (Home Path)
          </button>
          <button
            onClick={() => onChangeScreen('practice')}
            className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
              currentScreen === 'practice'
                ? 'bg-duo-blue text-white'
                : 'bg-[#18262d] text-gray-300 hover:text-white border border-[#2b404d]'
            }`}
          >
            Screen B (Practice + Rewind)
          </button>
        </div>
      </div>

      {/* Right: Triggers & Engine Source */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-[#18262d] border border-[#2b404d] text-gray-300 font-mono text-[10px]">
          Engine: <strong className="text-[#1cb0f6]">{engineSource}</strong>
        </span>

        <span className="px-2 py-0.5 rounded-full bg-[#18262d] border border-[#2b404d] text-gray-300 font-mono text-[10px]">
          Badge: <strong className={badgeState === 'active' ? 'text-[#58cc02]' : 'text-gray-400'}>{badgeState}</strong>
        </span>

        {/* Action Triggers */}
        <button
          onClick={onReplayModal}
          className="px-2.5 py-1 rounded-lg bg-[#202f36] hover:bg-[#2c3f4a] text-white font-extrabold border border-[#2b404d] transition-all flex items-center gap-1 cursor-pointer"
          title="Replay Duo Reintroduction Modal"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Replay Modal</span>
        </button>

        <button
          onClick={onTriggerTour}
          className="px-2.5 py-1 rounded-lg bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold transition-all flex items-center gap-1 shadow cursor-pointer"
          title="Launch Spotlight Joyride Tour"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Joyride</span>
        </button>

        <button
          onClick={onResetBadge}
          className="px-2.5 py-1 rounded-lg bg-[#202f36] hover:bg-[#2c3f4a] text-gray-300 hover:text-white font-extrabold border border-[#2b404d] transition-all flex items-center gap-1 cursor-pointer"
          title="Reset Persistent Tour Badge"
        >
          <Compass className="w-3 h-3" />
          <span>Reset Badge</span>
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Compass, Settings, Shield, Volume2, User, ChevronRight, X, Sparkles } from 'lucide-react';

export default function SettingsMoreModal({
  isOpen,
  onClose,
  onOpenTourMenu
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans select-none">
      <div className="relative w-full max-w-md bg-[#18262d] border-2 border-[#2b404d] rounded-3xl p-6 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#2b404d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-[#c52ce9]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold leading-tight">Settings & Features</h3>
              <p className="text-xs text-gray-400 font-bold">Preferences & Tour Replay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Tour Replay Option (Spec Section 7.3 persistent fallback) */}
        <div className="mb-4">
          <div className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
            Re-Onboarding & UI Exploration
          </div>
          <button
            onClick={() => {
              onClose();
              if (onOpenTourMenu) onOpenTourMenu();
            }}
            className="w-full text-left p-4 rounded-2xl bg-[#202f36] border-2 border-[#58cc02] hover:bg-[#253740] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#58cc02]/20 text-[#58cc02] flex items-center justify-center flex-shrink-0">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-[#58cc02] transition-colors flex items-center gap-1.5">
                  <span>Replay UI Tour</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
                </div>
                <div className="text-xs text-gray-400 font-bold mt-0.5">
                  Launch Complete, Half, or Custom Tour anytime
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Other Duolingo Settings */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">
            General Preferences
          </div>

          <div className="p-3.5 rounded-2xl bg-[#202f36] border border-[#2b404d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Sound Effects & Pronunciation</span>
            </div>
            <span className="text-xs font-black text-[#58cc02]">ON</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#202f36] border border-[#2b404d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold">Streak Shield Auto-Recovery</span>
            </div>
            <span className="text-xs font-black text-[#58cc02]">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

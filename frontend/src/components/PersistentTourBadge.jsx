import React, { useState } from 'react';
import { Compass, CheckSquare, Square, Play, Sparkles, X, ChevronRight, Check } from 'lucide-react';

export default function PersistentTourBadge({
  badgeState = 'active', // "not_yet_shown" | "active" | "expired"
  badgeOptions,
  onLaunchCompleteTour,
  onLaunchHalfTour,
  onLaunchCustomTour
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'custom'

  if (badgeState === 'expired' || badgeState === 'not_yet_shown') {
    return null;
  }

  const customItems = badgeOptions?.custom_tour?.selectable_items || [];
  const completeCount = badgeOptions?.complete_tour?.spotlight_sequence?.length || 0;
  const halfCount = badgeOptions?.half_tour?.spotlight_sequence?.length || 0;

  const toggleFeature = (featureId) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFeatures.size === customItems.length) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(customItems.map((i) => i.feature_id)));
    }
  };

  const handleStartCustom = () => {
    if (selectedFeatures.size === 0) return;
    const selectedIds = Array.from(selectedFeatures);
    setIsModalOpen(false);
    onLaunchCustomTour(selectedIds);
  };

  return (
    <>
      {/* Persistent Floating Bottom-Right Badge */}
      <div className="fixed bottom-20 right-4 z-40 animate-bounce">
        <button
          onClick={() => {
            setActiveTab('menu');
            setIsModalOpen(true);
          }}
          className="bg-[#58cc02] hover:bg-[#46a302] text-white px-4 py-2.5 rounded-full font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-2xl border-2 border-white/20 active:scale-95 transition-all cursor-pointer"
          style={{ boxShadow: '0 4px 14px rgba(88, 204, 2, 0.4), 0 3px 0 0 #3d8b02' }}
          id="persistent-tour-badge"
          aria-label="Take tour of the new UI features"
        >
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>Take tour of the new UI features</span>
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
        </button>
      </div>

      {/* Tour Selection Modal (3 Options: Complete / Half / Custom) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#18262d] border-2 border-[#2b404d] rounded-3xl p-6 text-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#58cc02]/20 text-[#58cc02]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold leading-tight">Explore Updated Features</h3>
                  <p className="text-xs text-gray-400 font-bold">Choose how you'd like to tour</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option Selection State */}
            {activeTab === 'menu' ? (
              <div className="flex flex-col gap-3 py-2">
                {/* 1. Complete Tour */}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onLaunchCompleteTour();
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-[#202f36] border-2 border-[#2b404d] hover:border-[#1cb0f6] hover:bg-[#253740] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#1cb0f6] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white group-hover:text-[#1cb0f6] transition-colors">
                        1. Complete Tour
                      </div>
                      <div className="text-xs text-gray-400 font-bold mt-0.5">
                        Walk through all {completeCount} updated & new features
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                {/* 2. Half Tour */}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onLaunchHalfTour();
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-[#202f36] border-2 border-[#2b404d] hover:border-[#58cc02] hover:bg-[#253740] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#58cc02] flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white group-hover:text-[#58cc02] transition-colors">
                        2. Half Tour (Quick Intro)
                      </div>
                      <div className="text-xs text-gray-400 font-bold mt-0.5">
                        Top {halfCount} highest-priority mutation & workflow highlights
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                {/* 3. Custom Tour */}
                <button
                  onClick={() => {
                    setSelectedFeatures(new Set(customItems.map((i) => i.feature_id)));
                    setActiveTab('custom');
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-[#202f36] border-2 border-[#2b404d] hover:border-[#ff9600] hover:bg-[#253740] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#ff9600] flex items-center justify-center flex-shrink-0">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white group-hover:text-[#ff9600] transition-colors">
                        3. Custom Tour (Select Items)
                      </div>
                      <div className="text-xs text-gray-400 font-bold mt-0.5">
                        Pick & choose specific features to spotlight
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            ) : (
              /* Custom Tour Checkbox Selector UI */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#2b404d]">
                  <span className="text-xs font-black uppercase text-gray-400">
                    Select Features to Tour ({selectedFeatures.size}/{customItems.length})
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-[#1cb0f6] hover:underline cursor-pointer"
                  >
                    {selectedFeatures.size === customItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                  {customItems.map((item) => {
                    const isSelected = selectedFeatures.has(item.feature_id);
                    return (
                      <div
                        key={item.feature_id}
                        onClick={() => toggleFeature(item.feature_id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#202f36] border-[#58cc02]'
                            : 'bg-[#18262d] border-[#2b404d] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="mt-0.5 text-[#58cc02]">
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-extrabold text-white capitalize">
                            {item.feature_id.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-gray-300 font-medium leading-tight mt-0.5">
                            {item.one_liner}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Navigation for Custom Tour */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#2b404d]">
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="px-4 py-2.5 rounded-xl border-2 border-[#2b404d] text-xs font-extrabold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartCustom}
                    disabled={selectedFeatures.size === 0}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer ${
                      selectedFeatures.size > 0
                        ? 'bg-[#58cc02] hover:bg-[#46a302] text-white active:translate-y-0.5'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    style={selectedFeatures.size > 0 ? { boxShadow: '0 3px 0 0 #3d8b02' } : {}}
                  >
                    <span>Launch Custom Tour ({selectedFeatures.size})</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

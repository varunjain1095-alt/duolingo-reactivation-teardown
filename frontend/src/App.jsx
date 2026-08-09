import React, { useState, useEffect, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import PracticeScreen from './components/PracticeScreen';
import DuoReintroModal from './components/DuoReintroModal';
import SpotlightTour from './components/SpotlightTour';
import PersistentTourBadge from './components/PersistentTourBadge';
import RevisionLessonModal from './components/RevisionLessonModal';
import SettingsMoreModal from './components/SettingsMoreModal';
import DevControlPanel from './components/DevControlPanel';
import { MOCK_PERSONA_PAYLOADS, fetchReactivationEvaluation } from './api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Parse URL query parameters for dev mode (?dev=true) and demo persona URLs (?persona=tim / ?persona=john)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isDevMode = urlParams.get('dev') === 'true' || urlParams.get('debug') === '1';
  const personaQuery = urlParams.get('persona')?.toLowerCase();
  
  const initialPersona = (personaQuery === 'john' || personaQuery === 'narrow') ? 'narrow' : 'broad';

  // App Navigation & Persona State
  const [personaTier, setPersonaTier] = useState(initialPersona); // 'broad' | 'narrow'
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'practice' | 'league' | 'feed' | 'more'
  const [engineResult, setEngineResult] = useState(null);
  const [engineSource, setEngineSource] = useState('Connecting to engine.py...');
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Tour States
  const [isDuoModalOpen, setIsDuoModalOpen] = useState(true);
  const [isJoyrideRunning, setIsJoyrideRunning] = useState(false);
  const [currentSpotlightSequence, setCurrentSpotlightSequence] = useState([]);
  const [badgeState, _setBadgeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('duo_badge_state');
      if (saved) return saved;
    }
    return 'not_yet_shown';
  });

  const setBadgeState = useCallback((newState, callerName = 'UNKNOWN') => {
    _setBadgeState((prev) => {
      const resolved = typeof newState === 'function' ? newState(prev) : newState;
      console.log(`[setBadgeState LOG] Called by '${callerName}' -> Transitioning from '${prev}' to '${resolved}'`);
      if (typeof window !== 'undefined') {
        localStorage.setItem('duo_badge_state', resolved);
      }
      return resolved;
    });
  }, []);

  const [isRevisionLessonOpen, setIsRevisionLessonOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reassuranceToast, setReassuranceToast] = useState(null);

  // Fetch payload directly from FastAPI decision engine (engine.py)
  const loadPayload = useCallback(async (tier) => {
    setIsLoading(true);
    setApiError(null);
    const rawPayload = MOCK_PERSONA_PAYLOADS[tier] || MOCK_PERSONA_PAYLOADS.broad;
    const { data, source, error } = await fetchReactivationEvaluation(rawPayload);

    if (error || !data) {
      setApiError(error || 'Failed to reach FastAPI decision engine.');
      setEngineSource('Error: Unreachable');
      setIsLoading(false);
      return;
    }

    setEngineResult(data);
    setEngineSource(source);
    setCurrentSpotlightSequence(data.spotlight_sequence || []);
    // Preserve user-driven badge state ('active' / 'expired') if set during current session or stored in localStorage
    setBadgeState((prev) => {
      if (prev === 'expired') return 'expired';
      if (prev === 'active') return 'active';
      return data.badge_state || 'not_yet_shown';
    }, 'loadPayload');
    setIsLoading(false);
  }, [setBadgeState]);

  useEffect(() => {
    loadPayload(personaTier);
  }, [personaTier, loadPayload]);

  // Handle Tab navigation
  const handleSelectTab = (tab) => {
    if (tab === 'more') {
      setIsSettingsOpen(true);
    } else {
      setCurrentScreen(tab);
    }
  };

  // Unified Safe Tour Launcher (Guarantees clean state transition & reset)
  const launchTour = useCallback((sequence) => {
    if (!sequence || sequence.length === 0) {
      console.warn('[launchTour] Empty sequence provided, ignoring.');
      return;
    }
    setIsJoyrideRunning(false);
    setCurrentSpotlightSequence([...sequence]);
    setTimeout(() => {
      setIsJoyrideRunning(true);
    }, 50);
  }, []);

  // Handle Mascot Modal "Continue" action
  const handleModalContinue = () => {
    const sequenceToRun = engineResult?.spotlight_sequence || currentSpotlightSequence || [];
    console.log('[handleModalContinue] Triggered. Sequence count:', sequenceToRun.length);
    setIsDuoModalOpen(false);
    launchTour(sequenceToRun);
  };

  // Handle Mascot Modal "Skip" action (Phase 4 route)
  const handleModalSkip = () => {
    setIsDuoModalOpen(false);
    setIsJoyrideRunning(false);
    // 1. Activate persistent badge
    setBadgeState('active', 'handleModalSkip');
    // 2. Render Duo brief reassurance toast
    setReassuranceToast('Tour available anytime via badge; disappears once taken.');
    // 3. Route to Revision Lesson
    setIsRevisionLessonOpen(true);

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setReassuranceToast(null);
    }, 6000);
  };

  // Handle Tour Completion / Finish (Spec §7.3 strict requirement)
  const handleTourEnd = ({ status }) => {
    console.log('[handleTourEnd] Status received:', status);
    setIsJoyrideRunning(false);
    // Strict Spec §7.3 requirement: badge ONLY expires upon actual full tour completion ('finished').
    // If the user skips/dismisses midway ('skipped') or closes the 3-option modal without touring,
    // badge_state remains 'active' to preserve the fallback path for Mechanic Mutation safety.
    if (status === 'finished') {
      setBadgeState('expired', 'handleTourEnd');
    }
  };

  // Tour Badge Actions (Phase 4)
  const handleLaunchCompleteTour = () => {
    const seq = engineResult?.badge_options?.complete_tour?.spotlight_sequence || engineResult?.spotlight_sequence || [];
    console.log('[handleLaunchCompleteTour] Launching complete tour, items:', seq.length);
    launchTour(seq);
  };

  const handleLaunchHalfTour = () => {
    const seq = engineResult?.badge_options?.half_tour?.spotlight_sequence || [];
    console.log('[handleLaunchHalfTour] Launching half tour, items:', seq.length);
    launchTour(seq);
  };

  const handleLaunchCustomTour = (selectedFeatureIds) => {
    const allAvailable = engineResult?.badge_options?.complete_tour?.spotlight_sequence || engineResult?.spotlight_sequence || [];
    const selectedSet = new Set(selectedFeatureIds);
    const customSeq = allAvailable.filter(item => selectedSet.has(item.feature_id));
    console.log('[handleLaunchCustomTour] Selected IDs:', selectedFeatureIds, 'Matched items:', customSeq.length);
    launchTour(customSeq);
  };

  return (
    <div className="min-h-screen bg-[#0b1317] text-white font-sans font-bold select-none relative overflow-x-hidden">
      {/* Dev-Only Tooling (Mounted strictly when ?dev=true is active) */}
      {isDevMode && (
        <DevControlPanel
          selectedPersona={personaTier}
          onChangePersona={(tier) => {
            setPersonaTier(tier);
            setIsDuoModalOpen(true);
            setIsJoyrideRunning(false);
          }}
          currentScreen={currentScreen}
          onChangeScreen={setCurrentScreen}
          engineSource={engineSource}
          onReplayModal={() => {
            setIsDuoModalOpen(true);
            setIsJoyrideRunning(false);
          }}
          onTriggerTour={() => {
            setIsDuoModalOpen(false);
            const seq = engineResult?.spotlight_sequence || currentSpotlightSequence || [];
            launchTour(seq);
          }}
          onResetBadge={() => setBadgeState('active', 'DevControlPanel_Reset')}
          badgeState={badgeState}
        />
      )}

      {/* Mobile-Width Viewport Container Frame (iPhone Pro Max width, centered with desktop letterboxing) */}
      <div className="mobile-frame relative w-full max-w-[430px] min-h-screen mx-auto bg-app-bg shadow-[0_0_60px_rgba(0,0,0,0.75)] border-x border-[#233540] [transform:translateZ(0)] flex flex-col">
        {/* Explicit Backend Error Banner (if FastAPI engine is unreachable) */}
        {apiError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border-2 border-red-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-[90%]">
            <AlertCircle className="w-6 h-6 text-red-300 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-extrabold uppercase text-red-200">FastAPI Decision Engine Offline</div>
              <div className="text-gray-300 font-medium">{apiError}</div>
            </div>
            <button
              onClick={() => loadPayload(personaTier)}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Screen Render Switcher */}
        {currentScreen === 'home' || currentScreen === 'league' || currentScreen === 'feed' || currentScreen === 'more' ? (
          <HomeScreen
            currentTab={currentScreen}
            onSelectTab={handleSelectTab}
            onStartLesson={() => setIsRevisionLessonOpen(true)}
          />
        ) : (
          <PracticeScreen
            currentTab={currentScreen}
            onSelectTab={handleSelectTab}
            onStartRewind={() => setIsRevisionLessonOpen(true)}
            onStartVideoCall={() => {
              alert("Starting Lily Video Call interactive speaking session!");
            }}
          />
        )}

        {/* Duo Mascot Reintroduction Modal (Phase 3.2) */}
        {!isLoading && engineResult && (
          <DuoReintroModal
            isOpen={isDuoModalOpen}
            payload={engineResult}
            personaTier={personaTier}
            onContinue={handleModalContinue}
            onSkip={handleModalSkip}
          />
        )}

        {/* React Joyride Spotlight Tour (Phase 3.3) */}
        <SpotlightTour
          run={isJoyrideRunning}
          spotlightSequence={currentSpotlightSequence}
          onTourEnd={handleTourEnd}
        />

        {/* Persistent Bottom-Right Tour Badge (Phase 4.2) */}
        <PersistentTourBadge
          badgeState={badgeState}
          badgeOptions={engineResult?.badge_options}
          onLaunchCompleteTour={handleLaunchCompleteTour}
          onLaunchHalfTour={handleLaunchHalfTour}
          onLaunchCustomTour={handleLaunchCustomTour}
        />

        {/* Settings / More Modal (Phase 4.3 fallback access) */}
        <SettingsMoreModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenTourMenu={() => {
            setBadgeState('active', 'SettingsMoreModal_Replay');
            handleLaunchCompleteTour();
          }}
        />

        {/* Revision Lesson Route (Skip Path & Start Action) */}
        <RevisionLessonModal
          isOpen={isRevisionLessonOpen}
          onClose={() => setIsRevisionLessonOpen(false)}
          onComplete={() => {
            setIsRevisionLessonOpen(false);
          }}
          toastMessage={reassuranceToast}
        />
      </div>
    </div>
  );
}

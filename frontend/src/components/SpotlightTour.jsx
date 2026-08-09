import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { Sparkles, RefreshCw, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';

export default function SpotlightTour({
  run,
  spotlightSequence = [],
  onTourEnd,
  onStepChange
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const helpersRef = useRef(null);

  // Reset to step 0 and auto-advance past beacon phase when tour becomes active
  useEffect(() => {
    if (run) {
      setStepIndex(0);
      const timer = setTimeout(() => {
        const beaconBtn = document.querySelector('.react-joyride__beacon');
        if (beaconBtn) {
          beaconBtn.click();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [run]);

  // Convert engine spotlight_sequence items to React Joyride steps
  const steps = useMemo(() => {
    return spotlightSequence.map((item, index) => {
      let badgeLabel = '✨ New Feature';
      let badgeColor = 'bg-blue-500/20 text-[#1cb0f6] border-blue-500/40';
      let IconComponent = Sparkles;

      if (item.type === 'mechanic_mutation') {
        badgeLabel = '🔄 Mechanic Update (High Priority)';
        badgeColor = 'bg-pink-500/20 text-[#ff4b91] border-pink-500/40';
        IconComponent = RefreshCw;
      } else if (item.type === 'workflow_match') {
        badgeLabel = '🎯 Familiar Workflow';
        badgeColor = 'bg-emerald-500/20 text-[#58cc02] border-emerald-500/40';
        IconComponent = CheckCircle;
      }

      return {
        target: item.target_element,
        content: item.message,
        title: item.feature_id,
        badgeLabel,
        badgeColor,
        IconComponent,
        disableBeacon: true,
        placement: 'auto',
        data: { ...item, stepIndex: index }
      };
    });
  }, [spotlightSequence]);

  // Eval 5.1: Missing DOM Target Fallback in React Joyride
  // Detects missing target node, skips step silently, and prevents white-screen crashes
  const validSteps = useMemo(() => {
    if (typeof document === 'undefined') return steps;
    return steps.filter(step => {
      try {
        const selector = step.target;
        if (!selector || typeof selector !== 'string') return false;
        const el = document.querySelector(selector);
        return el !== null;
      } catch (err) {
        console.warn(`[Eval 5.1 Fallback] Target element "${step.target}" not found in DOM, safely skipping.`);
        return false;
      }
    });
  }, [steps, run]);

  // Generate a dynamic key based on sequence and run state so Joyride remounts cleanly on every new tour
  const tourKey = useMemo(() => {
    const ids = spotlightSequence.map((s) => s.feature_id).join('_');
    return `${run ? 'active' : 'inactive'}-${ids}-${spotlightSequence.length}`;
  }, [run, spotlightSequence]);

  const handleJoyrideCallback = (data) => {
    const { status, action, index, type } = data;
    console.log('[Joyride Callback]', { type, action, index, status, currentStepIndex: stepIndex });

    // Auto-advance past beacon phase directly to tooltip card (BEACON event only)
    if (type === EVENTS.BEACON || type === 'beacon') {
      if (helpersRef.current && typeof helpersRef.current.next === 'function') {
        try {
          helpersRef.current.next();
        } catch (e) {
          // ignore
        }
      }
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      console.log(`[Step Index Change] Action: ${action}, Previous Index: ${index}, New Index: ${nextIndex}`);
      setStepIndex(nextIndex);
      if (onStepChange) {
        onStepChange(nextIndex);
      }
    }

    // Strict Spec §7.3 requirement: badge ONLY expires upon actual full tour completion ('finished').
    // Differentiate genuine full completion from general tour termination (e.g. user dismisses or skips midway).
    // In react-joyride, clicking the primary button on the last step emits STATUS.FINISHED or index === validSteps.length - 1 with next action.
    const isLastStepPrimaryClick = index === validSteps.length - 1 && (action === ACTIONS.NEXT || action === 'next' || type === EVENTS.TOUR_END || type === 'tour:end');
    const isExplicitlyFinished = (status === STATUS.FINISHED || status === 'finished' || isLastStepPrimaryClick) && action !== ACTIONS.CLOSE && action !== 'close' && action !== ACTIONS.SKIP && action !== 'skip';
    const isTerminated = isExplicitlyFinished || status === STATUS.SKIPPED || status === 'skipped' || action === ACTIONS.CLOSE || action === 'close' || action === ACTIONS.SKIP || action === 'skip' || type === EVENTS.TOUR_END || type === 'tour:end';

    if (isTerminated) {
      console.log('[Joyride End Triggered]', { status, action, type, isExplicitlyFinished });
      if (onTourEnd) {
        onTourEnd({ status: isExplicitlyFinished ? 'finished' : 'skipped', action });
      }
    }
  };

  // Custom Duolingo-themed tooltip
  const TooltipComponent = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    size
  }) => {
    const { badgeLabel, badgeColor, IconComponent, content } = step;

    const isLastStep = index + 1 === size;
    const displayContent = isLastStep
      ? `${content} To revisit these new UI additions, you can jump to Settings and click on Replay UI Tour.`
      : content;

    return (
      <div
        {...tooltipProps}
        className="relative max-w-sm w-80 sm:w-96 bg-[#18262d] border-2 border-[#2b404d] rounded-2xl p-5 text-white shadow-2xl z-50 font-sans select-none animate-scaleUp"
      >
        {/* Header with Type Pill & Step Count */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${badgeColor}`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{badgeLabel}</span>
          </div>
          <span className="text-xs font-black text-gray-400">
            {index + 1} / {size}
          </span>
        </div>

        {/* Mascot Mini Voice */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#58cc02] border-2 border-white flex-shrink-0 flex items-center justify-center shadow">
            <span className="text-lg">🦉</span>
          </div>
          <div className="flex-1 text-sm font-bold text-gray-100 leading-snug">
            {displayContent}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2b404d]/50">
          {index > 0 ? (
            <button
              {...backProps}
              className="px-3 py-2 rounded-xl text-xs font-extrabold text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              {...closeProps}
              className="px-3 py-2 rounded-xl text-xs font-extrabold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}

          <button
            {...primaryProps}
            onClick={(e) => {
              if (isLastStep) {
                console.log('[TooltipComponent] Got It clicked on last step!');
                if (onTourEnd) {
                  onTourEnd({ status: 'finished', action: 'next' });
                }
              } else if (primaryProps && primaryProps.onClick) {
                primaryProps.onClick(e);
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#58cc02] hover:bg-[#46a302] text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow active:translate-y-0.5 transition-all cursor-pointer"
            style={{ boxShadow: '0 3px 0 0 #3d8b02' }}
          >
            <span>{isLastStep ? 'Got It!' : 'Next'}</span>
            {!isLastStep && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  if (!run || validSteps.length === 0) return null;

  return (
    <Joyride
      key={tourKey}
      steps={validSteps}
      run={run}
      continuous
      disableBeacon
      getHelpers={(helpers) => {
        helpersRef.current = helpers;
      }}
      beaconComponent={() => null}
      scrollToFirstStep
      showProgress
      showSkipButton
      disableOverlayClose
      tooltipComponent={TooltipComponent}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#18262d',
          backgroundColor: '#18262d',
          overlayColor: 'rgba(9, 21, 26, 0.75)',
          primaryColor: '#58cc02',
          textColor: '#ffffff',
          zIndex: 10000
        },
        spotlight: {
          borderRadius: 16,
          boxShadow: '0 0 0 9999px rgba(9, 21, 26, 0.75), 0 0 15px rgba(88, 204, 2, 0.8)'
        }
      }}
    />
  );
}

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, X, Volume2, ShieldAlert, Award } from 'lucide-react';

export default function RevisionLessonModal({
  isOpen,
  onClose,
  onComplete,
  toastMessage
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  if (!isOpen) return null;

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);
    setXpEarned(20);
  };

  const handleFinish = () => {
    setIsAnswerChecked(false);
    setSelectedOption(null);
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131f24] text-white select-none animate-fadeIn">
      {/* Toast Notification (Duo brief reassurance) */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#18262d] border-2 border-[#1cb0f6] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideDown max-w-md">
          <div className="w-8 h-8 rounded-full bg-[#58cc02] flex items-center justify-center text-sm font-bold flex-shrink-0">
            🦉
          </div>
          <p className="text-xs sm:text-sm font-bold leading-tight text-gray-200">
            {toastMessage}
          </p>
        </div>
      )}

      {/* Main Revision Lesson Card */}
      <div className="relative w-full max-w-lg bg-[#18262d] border-2 border-[#2b404d] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#58cc02] animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-widest text-[#58cc02]">
              Revision Lesson: Unit 3 Quick Warmup
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#202f36] h-3 rounded-full overflow-hidden mb-6 border border-[#2b404d]">
          <div
            className="bg-[#58cc02] h-full rounded-full transition-all duration-500"
            style={{ width: isAnswerChecked ? '100%' : '50%' }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-3">Translate this sentence</h2>
          <div className="flex items-center gap-3 p-4 bg-[#202f36] border border-[#2b404d] rounded-2xl">
            <button className="p-2.5 rounded-xl bg-[#1cb0f6] text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer">
              <Volume2 className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold">"El café está muy caliente."</span>
          </div>
        </div>

        {/* Multiple Choice Options */}
        <div className="flex flex-col gap-3 mb-6">
          {[
            { id: 0, text: 'The coffee is very hot.' },
            { id: 1, text: 'The water is cold today.' },
            { id: 2, text: 'I would like a warm tea.' }
          ].map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => !isAnswerChecked && setSelectedOption(option.id)}
                disabled={isAnswerChecked}
                className={`w-full p-4 rounded-2xl border-2 text-left font-extrabold text-sm transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1cb0f6]/20 border-[#1cb0f6] text-[#1cb0f6]'
                    : 'bg-[#202f36] border-[#2b404d] text-white hover:border-gray-500'
                }`}
              >
                <span>{option.text}</span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1cb0f6]" />}
              </button>
            );
          })}
        </div>

        {/* Bottom Action Footer */}
        {isAnswerChecked ? (
          <div className="pt-4 border-t border-[#2b404d] flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 text-[#58cc02]">
              <Award className="w-6 h-6" />
              <div>
                <div className="text-sm font-black uppercase">Nicely Done!</div>
                <div className="text-xs text-gray-300 font-bold">+20 XP Revision Complete</div>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="px-6 py-3 rounded-2xl bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow cursor-pointer active:translate-y-0.5"
              style={{ boxShadow: '0 4px 0 0 #3d8b02' }}
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheck}
            disabled={selectedOption === null}
            className={`w-full py-4 rounded-2xl font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedOption !== null
                ? 'bg-[#58cc02] hover:bg-[#46a302] text-white active:translate-y-0.5'
                : 'bg-[#202f36] text-gray-500 cursor-not-allowed border border-[#2b404d]'
            }`}
            style={selectedOption !== null ? { boxShadow: '0 4px 0 0 #3d8b02' } : {}}
          >
            <span>Check Answer</span>
          </button>
        )}
      </div>
    </div>
  );
}

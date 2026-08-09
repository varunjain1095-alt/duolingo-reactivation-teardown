import React from 'react';
import { Award, Zap, BookOpen, Flame, Sparkles, ArrowRight, X } from 'lucide-react';

export default function DuoReintroModal({
  isOpen,
  payload,
  personaTier = 'broad',
  onContinue,
  onSkip
}) {
  if (!isOpen || !payload) return null;

  const { user_name, lapse_duration_days, stats = {}, tone = 'celebratory' } = payload.reintroduction_payload || {};
  const isCelebratory = tone === 'celebratory';
  const userName = user_name || (personaTier === 'broad' ? 'Tim' : 'John');
  const lapseDays = lapse_duration_days || (personaTier === 'broad' ? 730 : 365);
  const yearPhrasing = lapseDays >= 700 ? 'about 2 years' : 'about 1 year';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#18262d] border-2 border-[#2b404d] rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isCelebratory ? 'bg-amber-400' : 'bg-blue-400'
          }`}
        ></div>

        {/* Close / Skip button in corner */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Skip to Lesson"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Duo Mascot & Speech Bubble */}
        <div className="flex flex-col items-center mb-6 relative z-10 w-full">
          {/* Animated Duo Avatar */}
          <div className="relative mb-4 group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#58cc02] border-4 border-[#46a302] flex items-center justify-center shadow-lg relative transform group-hover:scale-105 transition-transform">
              <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 100 100">
                {/* Eyes */}
                <circle cx="35" cy="42" r="14" fill="white" />
                <circle cx="65" cy="42" r="14" fill="white" />
                <circle cx="37" cy="43" r="7" fill="#1b2327" />
                <circle cx="67" cy="43" r="7" fill="#1b2327" />
                <circle cx="39" cy="40" r="2.5" fill="white" />
                <circle cx="69" cy="40" r="2.5" fill="white" />
                {/* Beak */}
                <polygon points="50,48 40,62 60,62" fill="#ff9600" />
                <polygon points="50,52 42,62 58,62" fill="#e08500" />
              </svg>
              {/* Tone Sparkle Badge */}
              <div
                className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-[#18262d] ${
                  isCelebratory ? 'bg-amber-400 text-amber-950 animate-bounce' : 'bg-[#1cb0f6]'
                }`}
              >
                {isCelebratory ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* Speech Bubble Voiced by Duo */}
          <div className="relative bg-white text-[#18262d] font-extrabold text-center px-5 py-3.5 rounded-2xl max-w-sm shadow-md">
            <p className="text-sm sm:text-base leading-snug">
              Welcome back, {userName}! It's been {lapseDays} days since you last visited. Let me take you through the new Duolingo features since the last time you used the app.
            </p>
            {/* Bubble Arrow Tail */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"></div>
          </div>
        </div>

        {/* Persona Tier Subtitle */}
        <div className="text-center mb-6 z-10">
          <span
            className={`inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1 ${
              isCelebratory
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}
          >
            {isCelebratory ? '🌟 Welcome Back Learner! Milestone Summary' : '⚡ Quick Re-Orientation'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            {isCelebratory ? 'Look at how far you came!' : 'Your Learning Foundations'}
          </h2>
        </div>

        {/* Historical Stats Grid (Spec Section 8.4 stats) */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 z-10">
          {/* Lessons Completed */}
          <div className="bg-[#202f36] border border-[#2b404d] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-[#1cb0f6]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black leading-none">{stats.lessons_completed ?? 0}</div>
              <div className="text-xs text-gray-400 font-bold uppercase mt-1">Lessons Done</div>
            </div>
          </div>

          {/* Streak Length */}
          <div className="bg-[#202f36] border border-[#2b404d] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-[#ff9600]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black leading-none">{stats.streak_length ?? 0} Days</div>
              <div className="text-xs text-gray-400 font-bold uppercase mt-1">Streak Record</div>
            </div>
          </div>

          {/* League Wins */}
          <div className="bg-[#202f36] border border-[#2b404d] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-500/20 text-[#ffd900]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black leading-none">{stats.league_wins ?? 0}</div>
              <div className="text-xs text-gray-400 font-bold uppercase mt-1">League Wins</div>
            </div>
          </div>

          {/* Words Learned */}
          <div className="bg-[#202f36] border border-[#2b404d] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-[#58cc02]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black leading-none">{stats.words_learned ?? 0}</div>
              <div className="text-xs text-gray-400 font-bold uppercase mt-1">Words Mastered</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full z-10">
          {/* Skip Button */}
          <button
            onClick={onSkip}
            className="flex-1 py-3.5 px-5 rounded-2xl border-2 border-[#2b404d] text-gray-300 font-extrabold text-sm uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all cursor-pointer text-center"
          >
            Skip to Lesson
          </button>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 transition-all"
            style={{ boxShadow: '0 4px 0 0 #3d8b02' }}
          >
            <span>Continue Tour</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

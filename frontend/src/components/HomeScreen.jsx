import React from 'react';

export default function HomeScreen({ currentTab, onSelectTab, onStartLesson }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-app-bg text-white font-sans font-bold select-none relative">
      {/* BEGIN: Top Status Bar */}
      <header className="flex justify-between items-center px-4 py-3 bg-app-bg z-20 sticky top-0 border-b border-[#2a373c]/30">
        {/* Course/Language Select */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="flag-icon border-2 border-transparent">
            <div className="bg-[#009246]"></div>
            <div className="bg-white"></div>
            <div className="bg-[#ce2b37]"></div>
          </div>
          <span className="text-white text-lg tracking-tight">11</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {/* Base Streak Counter */}
          <div
            className="flex items-center gap-1.5 opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
            id="streak-indicator"
            title="Current Streak: 0 Days"
          >
            <svg className="w-6 h-6 fill-current text-[#ff9600]" viewBox="0 0 24 24">
              <path d="M11.666 1.458C11.536 1.135 11.233 1 10.916 1a1 1 0 0 0-.909.584C8.618 4.708 6 7.618 6 11.5c0 3.86 2.873 6.5 6 6.5 3.09 0 6-2.618 6-6.5 0-3.921-2.656-6.848-4.045-8.318A7.834 7.834 0 0 0 11.666 1.458zm-1.04 11.542a1 1 0 1 1 2-1 3 3 0 0 0-3 3 1 1 0 1 1-2-1 5.006 5.006 0 0 1 5-5z" />
            </svg>
            <span className="text-white text-base">0</span>
          </div>

          {/* Streak Shield Feature Badge */}
          <div
            className="flex items-center cursor-pointer relative hover:scale-110 transition-transform"
            id="streak-shield-icon"
            title="Streak Shield Active: Protects streak from missed days"
          >
            <svg className="w-5 h-5 fill-current text-[#1cb0f6]" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>

          {/* Gems */}
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
            id="gems-indicator"
            title="Gems Balance: 2312"
          >
            <svg className="w-6 h-6 fill-current text-gem-blue" viewBox="0 0 24 24">
              <path d="M12 2l8.5 5.5v9L12 22l-8.5-5.5v-9L12 2zm0 2.8L5.5 8.7v6.6l6.5 4.2 6.5-4.2V8.7L12 4.8z" />
            </svg>
            <span className="text-gem-blue text-base">2312</span>
          </div>

          {/* Energy / Lives */}
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
            id="energy-indicator"
            title="Energy System: Daily refill lives"
          >
            <svg className="w-6 h-6 fill-current text-[#ff4b91]" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-[#ff4b91] text-base">25</span>
          </div>
        </div>
      </header>
      {/* END: Top Status Bar */}

      {/* BEGIN: Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto relative pb-28 pt-4 px-4 flex flex-col items-center hide-scrollbar">
        {/* Course Update Banner */}
        <div
          className="w-full max-w-md bg-card-blue rounded-2xl p-4 mb-8 relative shadow-card transition-all hover:brightness-105 cursor-pointer"
          id="course-update-banner"
        >
          <div className="text-white/80 text-xs font-extrabold tracking-wider uppercase mb-1">
            Section 2, Extra Unit 1
          </div>
          <div className="text-white text-xl font-extrabold leading-tight">
            Course update: Learn new words
          </div>
        </div>

        {/* Node Path Container */}
        <div className="relative w-full max-w-sm flex flex-col items-center mt-4">
          {/* Active Node (START) */}
          <div className="relative z-10 flex flex-col items-center mb-8" id="lesson-path-active-node">
            {/* Speech Bubble */}
            <div
              className="bg-white rounded-lg px-4 py-2 mb-3 relative shadow-sm animate-bounce cursor-pointer"
              style={{ boxShadow: '0 4px 0 0 #e5e7eb' }}
              onClick={onStartLesson}
            >
              <span className="text-[#1cb0f6] text-sm font-extrabold tracking-widest uppercase">Start</span>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
            </div>

            {/* Node Circle Button */}
            <button
              onClick={onStartLesson}
              className="w-[88px] h-[88px] rounded-full bg-[#1cb0f6] flex items-center justify-center relative active:translate-y-2 active:shadow-none transition-all cursor-pointer hover:scale-105"
              style={{ boxShadow: '0 8px 0 0 #1899d6' }}
              aria-label="Start Lesson"
            >
              <div className="absolute inset-2 rounded-full border-4 border-white/20"></div>
              <svg className="w-10 h-10 fill-current text-white z-10 relative top-1" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          </div>

          {/* Inactive Milestone Nodes */}
          <div className="relative w-full flex flex-col items-center gap-4 py-4 opacity-90">
            {/* Node 2 (Right offset) */}
            <div className="relative z-10 w-full flex justify-center translate-x-12 mb-4">
              <button
                className="w-[72px] h-[72px] rounded-full bg-node-gray flex items-center justify-center relative cursor-not-allowed opacity-75"
                style={{ boxShadow: '0 6px 0 0 #2c3940' }}
              >
                <svg className="w-8 h-8 fill-current text-[#4b5e69]" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            </div>

            {/* Node 3 (Dumbbell - Further right) */}
            <div className="relative z-10 w-full flex justify-center translate-x-16 mb-4">
              <button
                id="dumbbell-node-btn"
                className="w-[72px] h-[72px] rounded-full bg-node-gray flex items-center justify-center relative cursor-not-allowed opacity-75"
                style={{ boxShadow: '0 6px 0 0 #2c3940' }}
              >
                <svg className="w-8 h-8 fill-current text-[#4b5e69]" viewBox="0 0 24 24">
                  <path d="M20.5 8.5h-1v-2h-3v2h-1v-2h-3v2h-2v-2h-3v2h-1v-2h-3v2h-1v7h1v2h3v-2h1v2h3v-2h2v2h3v-2h1v2h3v-2h1v-7zm-14 5H5v-3h1.5v3zm3.5 0h-2v-3h2v3zm4.5 0h-3v-3h3v3zm3.5 0h-2v-3h2v3zm2.5 0h-1.5v-3h1.5v3z" />
                </svg>
              </button>
            </div>

            {/* Node 4 (Chest - Center) */}
            <div className="relative z-10 w-full flex justify-center mb-4">
              <button
                className="w-[88px] h-[72px] rounded-xl bg-[#2c3940] flex items-center justify-center relative overflow-hidden cursor-not-allowed opacity-75"
                style={{ boxShadow: '0 6px 0 0 #1b2327' }}
              >
                <div className="absolute top-0 w-full h-1/2 bg-[#37464f] border-b-4 border-[#1b2327]"></div>
                <div className="absolute w-[60%] h-4 bg-[#1b2327] rounded-full top-1/2 -translate-y-1/2 z-10"></div>
                <div className="absolute w-6 h-6 bg-[#4b5e69] rounded-full top-1/2 -translate-y-1/2 z-20 border-4 border-[#1b2327]"></div>
                <div className="absolute left-3 w-4 h-full bg-[#1b2327]"></div>
                <div className="absolute right-3 w-4 h-full bg-[#1b2327]"></div>
              </button>
            </div>

            {/* Node 5 (Headphones - Left offset) */}
            <div className="relative z-10 w-full flex justify-center -translate-x-4 mb-4">
              <button
                className="w-[72px] h-[72px] rounded-full bg-node-gray flex items-center justify-center relative cursor-not-allowed opacity-75"
                style={{ boxShadow: '0 6px 0 0 #2c3940' }}
              >
                <svg className="w-8 h-8 fill-current text-[#4b5e69]" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z" />
                </svg>
              </button>
            </div>

            {/* Node 6 (Left offset further) */}
            <div className="relative z-10 w-full flex justify-center -translate-x-12 mb-4">
              <button
                className="w-[72px] h-[72px] rounded-full bg-node-gray flex items-center justify-center relative cursor-not-allowed opacity-75"
                style={{ boxShadow: '0 6px 0 0 #2c3940' }}
              >
                <svg className="w-8 h-8 fill-current text-[#4b5e69]" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* END: Main Content Area */}

      {/* BEGIN: Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-[#09151a] border-t border-[#2a373c] px-2 pb-safe z-30 h-[72px]">
        <ul className="flex justify-around items-center h-full">
          {/* Home Tab */}
          <li className="flex-1 flex justify-center" id="nav-home">
            <button
              onClick={() => onSelectTab('home')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform active:scale-95 ${
                currentTab === 'home' ? 'bg-nav-active-bg shadow-nav-active' : 'text-[#77858f] hover:text-white'
              }`}
              aria-label="Home"
            >
              <svg className={`w-8 h-8 fill-current ${currentTab === 'home' ? 'text-[#1cb0f6]' : ''}`} viewBox="0 0 24 24">
                <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
              </svg>
            </button>
          </li>

          {/* Practice Tab */}
          <li className="flex-1 flex justify-center" id="nav-practice">
            <button
              onClick={() => onSelectTab('practice')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform active:scale-95 ${
                currentTab === 'practice' ? 'bg-nav-active-bg shadow-nav-active border-2 border-duo-blue' : 'text-[#77858f] hover:text-white'
              }`}
              aria-label="Practice"
            >
              <svg className={`w-8 h-8 fill-current ${currentTab === 'practice' ? 'text-[#1cb0f6]' : ''}`} viewBox="0 0 24 24">
                <path d="M6 5v14H4V5h2m14 0v14h-2V5h2M2 9v6H0V9h2m22 0v6h-2V9h2M17 11H7v2h10v-2z" />
              </svg>
            </button>
          </li>

          {/* League Tab */}
          <li className="flex-1 flex justify-center" id="nav-league">
            <button
              onClick={() => onSelectTab('league')}
              className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95 text-[#f89a2b] hover:opacity-90"
              aria-label="League"
            >
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
            </button>
          </li>

          {/* Feed Tab */}
          <li className="flex-1 flex justify-center" id="nav-feed">
            <button
              onClick={() => onSelectTab('feed')}
              className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95 text-[#ff4b4b] hover:opacity-90"
              aria-label="Feed"
            >
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </li>

          {/* Learn / Bird Tab */}
          <li className="flex-1 flex justify-center" id="nav-bird">
            <button
              onClick={() => onSelectTab('home')}
              className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95 text-[#58cc02] hover:opacity-90"
              aria-label="Learn"
            >
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" fill="#58cc02" />
                <circle cx="9" cy="10" r="2.5" fill="white" />
                <circle cx="15" cy="10" r="2.5" fill="white" />
                <circle cx="9.5" cy="10" r="1.2" fill="#1b2327" />
                <circle cx="14.5" cy="10" r="1.2" fill="#1b2327" />
                <polygon points="12,11 10,14 14,14" fill="#ff9600" />
              </svg>
            </button>
          </li>

          {/* More Tab */}
          <li className="flex-1 flex justify-center" id="nav-more">
            <button
              onClick={() => onSelectTab('more')}
              className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95 text-[#c52ce9] hover:opacity-90"
              aria-label="More"
            >
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2.5" />
                <circle cx="12" cy="12" r="2.5" />
                <circle cx="19" cy="12" r="2.5" />
              </svg>
            </button>
          </li>
        </ul>
      </nav>
      {/* END: Bottom Navigation Bar */}
    </div>
  );
}

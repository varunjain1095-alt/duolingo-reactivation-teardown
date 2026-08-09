import React from 'react';

export default function PracticeScreen({ currentTab, onSelectTab, onStartRewind, onStartVideoCall }) {
  return (
    <div className="bg-duo-dark min-h-screen text-white select-none pb-24 font-sans relative">
      {/* BEGIN: Header Section */}
      <header className="bg-duo-blue pt-12 pb-6 px-4 fixed top-0 w-full z-10 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
      </header>
      {/* END: Header Section */}

      {/* BEGIN: Main Content */}
      <main className="pt-24">
        {/* Top Blue Area Background */}
        <div className="bg-duo-blue h-[280px] absolute top-0 left-0 w-full -z-10"></div>

        {/* BEGIN: Unit Rewind Card */}
        <section className="px-4 mt-2 relative z-0">
          <div
            className="bg-duo-card-blue rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-[240px] shadow-duo-card transition-transform hover:scale-[1.01]"
            id="unit-rewind-card"
          >
            <div className="w-3/5 z-10">
              <h2 className="text-xl font-extrabold mb-2 text-white">Unit Rewind</h2>
              <p className="text-white/90 text-sm font-bold leading-tight mb-6">
                Keep your memory fresh with this review of Unit 3!
              </p>
              <button
                onClick={onStartRewind}
                className="bg-white text-duo-blue font-extrabold tracking-wider text-sm py-3 px-6 rounded-xl shadow-duo-button uppercase active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50 cursor-pointer"
                id="unit-rewind-start-button"
              >
                Start +20 XP
              </button>
            </div>

            {/* Mascot Illustration */}
            <div className="absolute bottom-0 right-0 w-[180px] h-[180px] pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="xMidYMax meet" viewBox="0 0 100 100">
                {/* Background Coin */}
                <ellipse cx="50" cy="85" fill="#ffc800" rx="40" ry="12"></ellipse>
                <ellipse cx="50" cy="83" fill="#ffd900" rx="40" ry="12"></ellipse>
                {/* Bird */}
                <circle cx="55" cy="50" fill="#58cc02" r="30"></circle>
                {/* Eyes */}
                <path d="M45 40 Q50 35 55 40" fill="none" stroke="white" strokeLinecap="round" strokeWidth="4"></path>
                <path d="M65 40 Q70 35 75 40" fill="none" stroke="white" strokeLinecap="round" strokeWidth="4"></path>
                {/* Beak */}
                <polygon fill="#ff9600" points="55,45 65,45 60,55"></polygon>
                {/* Props */}
                <circle cx="25" cy="30" fill="#8975ff" r="15"></circle>
                <circle cx="85" cy="40" fill="#ff7bb4" r="15"></circle>
              </svg>
            </div>
          </div>
        </section>
        {/* END: Unit Rewind Card */}

        {/* BEGIN: Conversation Section */}
        <section className="px-4 mt-8" data-purpose="conversation-section">
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-duo-gray font-extrabold tracking-widest text-sm uppercase">Conversation</h3>
            <span className="bg-gradient-to-r from-teal-400 to-purple-500 text-white font-black italic text-xs px-2 py-1 rounded">
              SUPER
            </span>
          </div>
          <div
            onClick={onStartVideoCall}
            className="bg-duo-dark-card border-2 border-duo-dark-border rounded-2xl p-4 flex justify-between items-center relative cursor-pointer hover:border-purple-400 transition-colors"
            id="video-call-btn"
          >
            <span className="font-extrabold text-xl">Video Call</span>
            <div className="w-16 h-16 bg-purple-400 rounded-full flex items-center justify-center border-4 border-duo-dark shadow-inner">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path>
              </svg>
            </div>
            <div className="absolute -top-3 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md border-2 border-duo-dark shadow">
              NEW
            </div>
          </div>
        </section>
        {/* END: Conversation Section */}

        {/* BEGIN: Skill Practice Section */}
        <section className="px-4 mt-8" data-purpose="skill-practice-section">
          <h3 className="text-duo-gray font-extrabold tracking-widest text-sm uppercase mb-3 px-1">Skill Practice</h3>
          <div className="flex flex-col gap-3">
            {/* Mistakes */}
            <div className="bg-duo-dark-card border-2 border-duo-dark-border rounded-2xl p-4 flex justify-between items-center relative cursor-pointer hover:border-orange-400 transition-colors">
              <span className="font-extrabold text-xl">Mistakes</span>
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center border-4 border-duo-dark">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="absolute -top-3 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-duo-dark shadow">
                30+
              </div>
            </div>

            {/* Words */}
            <div className="bg-duo-dark-card border-2 border-duo-dark-border rounded-2xl p-4 flex justify-between items-center relative cursor-pointer hover:border-blue-400 transition-colors">
              <span className="font-extrabold text-xl">Words</span>
              <div className="w-16 h-16 bg-blue-500 rounded-lg transform rotate-12 flex items-center justify-center border-4 border-duo-dark relative z-10 shadow">
                <div className="absolute w-full h-full bg-blue-400 rounded-lg -rotate-12 -z-10 -ml-2 -mt-2"></div>
              </div>
              <div className="absolute -top-3 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md border-2 border-duo-dark shadow z-20">
                NEW
              </div>
            </div>

            {/* Listen */}
            <div className="bg-duo-dark-card border-2 border-duo-dark-border rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-blue-400 transition-colors">
              <span className="font-extrabold text-xl">Listen</span>
              <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center border-4 border-duo-dark">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                </svg>
              </div>
            </div>
          </div>
        </section>
        {/* END: Skill Practice Section */}
      </main>
      {/* END: Main Content */}

      {/* BEGIN: Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-[#09151a] border-t-2 border-duo-dark-border flex justify-around items-center h-20 px-2 z-30" data-purpose="bottom-nav">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className="p-2 flex flex-col items-center justify-center w-12 h-12 text-[#77858f] hover:text-white"
          id="nav-home"
          aria-label="Home"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"></path>
          </svg>
        </button>

        {/* Practice (Active) */}
        <button
          onClick={() => onSelectTab('practice')}
          className={`p-2 flex flex-col items-center justify-center w-12 h-12 border-2 border-duo-blue rounded-xl text-[#1cb0f6] ${
            currentTab === 'practice' ? 'bg-nav-active-bg' : ''
          }`}
          id="nav-practice"
          aria-label="Practice"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M6 5v14H4V5h2m14 0v14h-2V5h2M2 9v6H0V9h2m22 0v6h-2V9h2M17 11H7v2h10v-2z"></path>
          </svg>
        </button>

        {/* League */}
        <button
          onClick={() => onSelectTab('league')}
          className="p-2 flex flex-col items-center justify-center w-12 h-12 text-[#f89a2b] hover:opacity-90"
          id="nav-league"
          aria-label="League"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"></path>
          </svg>
        </button>

        {/* Feed */}
        <button
          onClick={() => onSelectTab('feed')}
          className="p-2 flex flex-col items-center justify-center w-12 h-12 text-[#ff4b4b] hover:opacity-90"
          id="nav-feed"
          aria-label="Feed"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
          </svg>
        </button>

        {/* Bird */}
        <button
          onClick={() => onSelectTab('home')}
          className="p-2 flex flex-col items-center justify-center w-12 h-12 text-[#58cc02] hover:opacity-90"
          id="nav-bird"
          aria-label="Learn"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="#58cc02"></circle>
            <circle cx="9" cy="10" r="2.5" fill="white"></circle>
            <circle cx="15" cy="10" r="2.5" fill="white"></circle>
            <circle cx="9.5" cy="10" r="1.2" fill="#1b2327"></circle>
            <circle cx="14.5" cy="10" r="1.2" fill="#1b2327"></circle>
            <polygon points="12,11 10,14 14,14" fill="#ff9600"></polygon>
          </svg>
        </button>

        {/* More */}
        <button
          onClick={() => onSelectTab('more')}
          className="p-2 flex flex-col items-center justify-center w-12 h-12 text-[#c52ce9] hover:opacity-90"
          id="nav-more"
          aria-label="More"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2.5"></circle>
            <circle cx="12" cy="12" r="2.5"></circle>
            <circle cx="19" cy="12" r="2.5"></circle>
          </svg>
        </button>
      </nav>
      {/* END: Bottom Navigation */}
    </div>
  );
}

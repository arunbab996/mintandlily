import { useState } from 'react';
import CSAgent from './components/CSAgent.jsx';
import ReviewIntelligence from './components/ReviewIntelligence.jsx';
import { LogoFull } from './components/Logo.jsx';

const TABS = [
  {
    id: 'cs',
    label: 'CS Agent',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'reviews',
    label: 'Review Intelligence',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('cs');

  return (
    <div className="min-h-screen bg-cream flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top nav */}
      <header className="bg-white border-b border-border-col flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* Real logo */}
          <LogoFull className="h-6 w-auto flex-shrink-0" />

          {/* Tabs */}
          <nav className="flex items-center gap-0.5 bg-cream border border-border-col rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-ink shadow-sm border border-border-col'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-sage' : 'text-muted/50'}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 text-xs font-body text-muted flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block animate-pulse" />
            Live
          </div>
        </div>
      </header>

      {/* Content */}
      <main
        className="flex-1 max-w-5xl w-full mx-auto flex flex-col"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {activeTab === 'cs' ? <CSAgent /> : <ReviewIntelligence />}
        </div>
      </main>
    </div>
  );
}

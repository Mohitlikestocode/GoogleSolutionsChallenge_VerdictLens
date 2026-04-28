/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navigation';
import { Landing } from './components/Landing';
import { VictimFlow } from './components/VictimFlow';
import { AuditorFlow } from './components/AuditorFlow';
import { Report } from './components/Report';
import { Repair } from './components/Repair';
import { AuditMode } from './types';
import { useAuditStore } from './store/useAuditStore';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'victim' | 'auditor' | 'results' | 'repair'>('landing');
  const [systemStatus, setSystemStatus] = useState<{using_groq: boolean, model: string} | null>(null);
  const status = useAuditStore(state => state.status);
  const progress = useAuditStore(state => state.progress ?? 0);
  const mode = useAuditStore(state => state.mode);

  // Sync state with URL on load and back/forward
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (['victim', 'auditor', 'results', 'repair'].includes(path)) {
        setCurrentScreen(path as any);
      } else {
        setCurrentScreen('landing');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/system_status`)
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.error("Could not fetch system status", err));
  }, []);

  const navigateTo = (screen: 'landing' | 'victim' | 'auditor' | 'results' | 'repair') => {
    const path = screen === 'landing' ? '/' : `/${screen}`;
    window.history.pushState({}, '', path);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      <Navbar onNavigate={navigateTo} currentScreen={currentScreen} systemStatus={systemStatus} />

      {status !== 'idle' && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
          <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.22em] text-neutral-500 mb-2">
            <div className="flex items-center gap-2">
              <span>Audit Progress</span>
              {systemStatus?.using_groq && (
                <span className="text-emerald-500/80 font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/5">Groq Powered</span>
              )}
            </div>
            <span>{progress}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <AnimatePresence mode="wait">
          {currentScreen === 'landing' && (
            <Landing onSelectMode={(mode) => {
              navigateTo(mode === AuditMode.VICTIM ? 'victim' : 'auditor');
            }} />
          )}
          
          {currentScreen === 'victim' && (
            <VictimFlow onComplete={() => navigateTo('results')} />
          )}
          
          {currentScreen === 'auditor' && (
            <AuditorFlow onComplete={() => navigateTo('results')} />
          )}
          
          {currentScreen === 'results' && (
            <Report onRepair={() => navigateTo('repair')} />
          )}
          
          {currentScreen === 'repair' && (
            <Repair onBack={() => navigateTo('results')} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer metadata */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-neutral-800/50 mt-20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <span className="font-medium text-neutral-400">VerdictLens</span>
          <span>·</span>
          <span>The AI that judges you is being judged back.</span>
        </div>
        <div className="flex gap-8 text-neutral-500 text-xs uppercase tracking-widest font-medium">
          <span>GDPR Compliant</span>
          <span>EEOC Aligned</span>
          <span>Open Source</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { Shield, Home, Target, Search, BarChart3, Wrench } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  onNavigate: (screen: 'landing' | 'victim' | 'auditor' | 'results' | 'repair') => void;
  currentScreen: string;
  systemStatus: {using_groq: boolean, model: string} | null;
}

export function Navbar({ onNavigate, currentScreen, systemStatus }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('landing')}
        >
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Verdict<span className="text-violet-500">Lens</span></span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <NavItem 
            active={currentScreen === 'landing'} 
            onClick={() => onNavigate('landing')}
            icon={<Home size={14} />}
            label="Home"
          />
          <NavItem 
            active={currentScreen === 'victim'} 
            onClick={() => onNavigate('victim')}
            icon={<Target size={14} />}
            label="Victim Mode"
          />
          <NavItem 
            active={currentScreen === 'auditor'} 
            onClick={() => onNavigate('auditor')}
            icon={<Search size={14} />}
            label="Auditor Mode"
          />
          <NavItem 
            active={currentScreen === 'results'} 
            onClick={() => onNavigate('results')}
            icon={<BarChart3 size={14} />}
            label="Report"
          />
          <NavItem 
            active={currentScreen === 'repair'} 
            onClick={() => onNavigate('repair')}
            icon={<Wrench size={14} />}
            label="Repair"
          />
        </div>

        <div className="flex items-center gap-4">
          {systemStatus && (
            <div className={cn(
              "hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border",
              systemStatus.using_groq 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                systemStatus.using_groq ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}></div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {systemStatus.using_groq ? `Groq: ${systemStatus.model}` : 'Deterministic Fallback'}
              </span>
            </div>
          )}
          <button className="text-xs px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors">
            Connect LLM
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
        active 
          ? "bg-neutral-900 text-white shadow-[0_0_20px_rgba(139,92,246,0.1)] border border-neutral-800" 
          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShieldAlert, Terminal, ArrowRight, Activity, Users, Scale } from 'lucide-react';
import { AuditMode } from '../types';
import { useAuditStore } from '../store/useAuditStore';

interface LandingProps {
  onSelectMode: (mode: AuditMode) => void;
}

export function Landing({ onSelectMode }: LandingProps) {
  const setMode = useAuditStore(state => state.setMode);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleModeSelection = (mode: AuditMode) => {
    setMode(mode);
    onSelectMode(mode);
  };

  return (
    <div className="py-12 md:py-24">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20 relative"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <span className="text-violet-500 font-mono text-sm tracking-widest uppercase mb-4 block">AI Fairness Auditing</span>
        <h1 className="text-5xl md:text-8xl font-semibold tracking-tighter mb-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent leading-[1.1]">
          The AI that judges you<br />
          is being <span className="relative inline-block text-white">
            judged back.
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.8, duration: 1, ease: "circOut" }}
              className="absolute -bottom-2 left-0 h-1.5 bg-violet-600 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)]"
            />
          </span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mt-8">
          LLM-powered decision systems are making hiring, lending, and medical calls at scale. VerdictLens reveals whether they treat everyone equally.
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-2 gap-8"
      >
        <SelectionCard
          variant={item}
          icon={<ShieldAlert size={32} className="text-rose-500" />}
          title="I was judged"
          description="An AI made a decision about you. Find out if it would have decided differently if you were someone else."
          cta="Test my situation"
          onClick={() => handleModeSelection(AuditMode.VICTIM)}
          stats={[
            { label: "Detected Bias", value: "3.2k+", color: "text-rose-500" },
            { label: "Active Probes", value: "1.5m", color: "text-neutral-400" }
          ]}
        />

        <SelectionCard
          variant={item}
          icon={<Terminal size={32} className="text-violet-500" />}
          title="I built the judge"
          description="Your AI is making decisions about people. Find out if it's treating everyone the same — before it causes harm."
          cta="Audit my system"
          onClick={() => handleModeSelection(AuditMode.AUDITOR)}
          stats={[
            { label: "Prompts Audited", value: "180+", color: "text-violet-500" },
            { label: "Repair Accuracy", value: "94%", color: "text-neutral-400" }
          ]}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-neutral-800/50 pt-16"
      >
        <StatRow 
          icon={<Activity size={18} className="text-rose-500" />}
          value="35%"
          desc="more rejections for equivalent Black applicants in AI hiring tools"
        />
        <StatRow 
          icon={<Scale size={18} className="text-amber-500" />}
          value="34%"
          desc="higher facial recognition error rate for darker-skinned women"
        />
        <StatRow 
          icon={<Users size={18} className="text-violet-500" />}
          value="$13k"
          desc="extra lifetime interest cost from biased credit algorithms"
        />
      </motion.div>
    </div>
  );
}

function SelectionCard({ icon, title, description, cta, onClick, stats, variant }: any) {
  return (
    <motion.div
      variants={variant}
      whileHover={{ y: -8 }}
      className="group p-8 bg-neutral-900/50 border border-neutral-800 rounded-3xl hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-300 cursor-pointer flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <div className="mb-8 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl w-fit group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-2xl font-medium mb-3">{title}</h3>
        <p className="text-neutral-400 leading-relaxed mb-8">{description}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-8 border-t border-neutral-800/50">
        <div className="flex gap-6">
          {stats.map((s: any, i: number) => (
            <div key={i}>
              <div className={`text-xl font-mono font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform">
          <ArrowRight size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ icon, value, desc }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <div className="text-3xl font-mono font-medium mb-1">{value}</div>
        <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

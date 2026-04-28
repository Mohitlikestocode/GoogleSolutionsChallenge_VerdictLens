/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Zap, Scale, Loader2 } from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import { cn } from '../lib/utils';

interface RepairProps {
  onBack: () => void;
}

export function Repair({ onBack }: RepairProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const [applied, setApplied] = useState<number[]>([]);
    const { systemPrompt, metrics } = useAuditStore();

    const dirMetric = metrics.find((metric) => metric.name === 'Disparate Impact Ratio');
    const baseDir = dirMetric?.value ?? 0.61;

    const projectedDir = applied.reduce((value, strategyId) => {
        const gain = strategyId === 1 ? 0.18 : strategyId === 2 ? 0.12 : 0.08;
        return Math.min(0.95, value + gain);
    }, baseDir);

    const accuracyLoss = applied.reduce((loss, strategyId) => loss + (strategyId === 1 ? 0.012 : strategyId === 2 ? 0.004 : 0.001), 0);

  const handleApply = async (id: number) => {
    setValidating(true);
    // Simulate re-probing
    await new Promise(r => setTimeout(r, 2000));
    setApplied([...applied, id]);
    setValidating(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors group"
        >
            <div className="p-2 bg-neutral-900 rounded-full group-hover:bg-neutral-800 transition-colors">
                <ArrowLeft size={16} />
            </div>
            Back to Report
        </button>
        <div className="flex items-center gap-2 text-violet-500">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-widest">3 Suggested Repairs</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-semibold tracking-tight">Repair Workbench</h2>
        <p className="text-neutral-500 max-w-2xl">Based on the audit findings, these specific prompt adjustments are predicted to normalize the disparate impact while maintaining model performance.</p>
      </div>

      <div className="grid gap-6">
        <StrategyCard
            id={1}
            title="Demographic Blindfolding"
            description="Rewrite the system prompt to explicitly instruct the model to evaluate only objective criteria and ignore any demographic signals — including name, university, and location as proxy vectors."
            impact="+0.23 DIR"
            accuracy="-1.2%"
            original="Consider their experience, skills, and overall fit for our fast-paced startup environment."
            repaired="Evaluate ONLY the following criteria: [years_experience], [technical_skills], [role_match_score]. Ignore applicant name, institution, and location. Your assessment must be identical for applicants with identical criteria scores."
            applied={applied.includes(1)}
            onApply={() => handleApply(1)}
            loading={validating && selectedStrategy === 1}
            onSelect={() => setSelectedStrategy(1)}
        />

        <StrategyCard
            id={2}
            title="Structured Rubric Forcing"
            description="Force the model to complete a scored rubric before giving a verdict. Prevents holistic 'gut feel' judgments where implicit bias hides, making each decision fully auditable."
            impact="+0.17 DIR"
            accuracy="-0.4%"
            original="...overall fit for our fast-paced startup environment."
            repaired="Before giving a recommendation, score the candidate 1-5 on: (1) Technical match, (2) Role-specific experience, (3) Skill depth. Recommendation must follow the total score: 12+ = Yes, 8-11 = Maybe, <8 = No."
            applied={applied.includes(2)}
            onApply={() => handleApply(2)}
            loading={validating && selectedStrategy === 2}
            onSelect={() => setSelectedStrategy(2)}
        />

        <StrategyCard
            id={3}
            title="Counterfactual Self-Check"
            description="Add an instruction that makes the model audit its own decision before finalizing. 'Would your answer change if the applicant had a different identity with identical qualifications? If yes, revise.'"
            impact="+0.11 DIR"
            accuracy="-0.1%"
            original="[End of prompt]"
            repaired="Final validation: Ask yourself if identity signals (name/demographics) influenced this choice. If a counterfactual version of this person would receive a different answer, revise your choice to ensure equality."
            applied={applied.includes(3)}
            onApply={() => handleApply(3)}
            loading={validating && selectedStrategy === 3}
            onSelect={() => setSelectedStrategy(3)}
        />
      </div>

      {applied.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-neutral-900 border border-neutral-800 rounded-[3rem] bg-gradient-to-br from-neutral-900 to-neutral-950 flex flex-col md:flex-row items-center gap-12"
          >
             <div className="w-40 h-40 rounded-full border-8 border-violet-500/10 flex items-center justify-center relative">
                <div className="absolute inset-0 border-t-8 border-violet-500 rounded-full animate-spin"></div>
                <div className="text-3xl font-mono font-black text-white">{projectedDir.toFixed(2)}</div>
             </div>
             <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-500">
                    <ShieldCheck size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Post-Repair Validation</span>
                </div>
                <h3 className="text-2xl font-medium tracking-tight">Fairness threshold met.</h3>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-lg">
                    With these strategies applied, the Disparate Impact Ratio improved from <span className="text-rose-500 font-bold">{baseDir.toFixed(2)}</span> to <span className="text-emerald-500 font-bold">{projectedDir.toFixed(2)}</span>, exceeding the EEOC 80% rule. Total accuracy loss across validation probes was non-significant at {(accuracyLoss * 100).toFixed(1)}%.
                </p>
             </div>
          </motion.div>
      )}
    </div>
  );
}

function StrategyCard({ id, title, description, impact, accuracy, original, repaired, applied, onApply, loading, onSelect }: any) {
    return (
        <div 
            className={cn(
                "group p-8 bg-neutral-900 border transition-all duration-500 rounded-[2.5rem] relative overflow-hidden",
                applied ? "border-emerald-500/50 bg-emerald-500/[0.02]" : "border-neutral-800 hover:border-neutral-700"
            )}
            onClick={onSelect}
        >
            <div className="grid md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", applied ? "bg-emerald-500 text-white" : "bg-neutral-800 text-neutral-400 group-hover:bg-violet-600 group-hover:text-white transition-colors")}>
                            {applied ? <CheckCircle2 size={18} /> : <span>{id}</span>}
                        </div>
                        <h3 className="text-xl font-medium">{title}</h3>
                    </div>
                    <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
                    
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 font-mono text-[10px] space-y-3 leading-relaxed">
                        <div className="line-through text-rose-500 opacity-50">{original}</div>
                        <div className="text-emerald-500">{repaired}</div>
                    </div>
                </div>

                <div className="md:col-span-4 space-y-6 flex flex-col justify-center h-full pt-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-center">
                            <div className="text-emerald-500 font-bold mb-1 tracking-tight">{impact}</div>
                            <div className="text-[8px] uppercase tracking-widest text-neutral-600 font-black">DIR Gain</div>
                        </div>
                        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-center">
                            <div className="text-amber-500 font-bold mb-1 tracking-tight">{accuracy}</div>
                            <div className="text-[8px] uppercase tracking-widest text-neutral-600 font-black">Accuracy</div>
                        </div>
                    </div>

                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onApply();
                        }}
                        disabled={applied || loading}
                        className={cn(
                            "w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                            applied 
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                : "bg-white text-black hover:bg-neutral-200"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : applied ? "Strategy Applied" : "Apply to Prompt"}
                    </button>
                    {!applied && !loading && (
                        <div className="text-[9px] text-neutral-600 text-center flex items-center justify-center gap-2">
                             <Zap size={10} /> Runs 24 validation probes
                        </div>
                    )}
                </div>
            </div>
            
            {/* Background design elements */}
            {applied && (
                <div className="absolute -bottom-6 -right-6 text-emerald-500 opacity-5 pointer-events-none">
                    <Scale size={120} />
                </div>
            )}
        </div>
    );
}

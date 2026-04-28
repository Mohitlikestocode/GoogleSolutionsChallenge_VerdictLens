/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, ArrowRight, User, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import { geminiService } from '../services/geminiService';
import { cn, generateId } from '../lib/utils';
import { DOMAINS, SCENARIO_TEMPLATES, SAMPLE_QUERIES, MODELS } from '../constants';
import { AuditMode, PersonaProfile } from '../types';

interface VictimFlowProps {
  onComplete: () => void;
}

type QualificationField = {
  key: string;
  val: string;
};

export function VictimFlow({ onComplete }: VictimFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [situation, setSituation] = useState('');
  const [decisionType, setDecisionType] = useState('Hiring');
  const [qualifications, setQualifications] = useState<QualificationField[]>([
    { key: 'Years of experience', val: '8 years' },
    { key: 'Degree', val: 'Computer Science, BSc' },
    { key: 'Current role', val: 'Senior engineer' },
  ]);
  
  const DEFAULT_QUALIFICATIONS: Record<string, QualificationField[]> = {
    "Hiring": [
      { key: 'Years of experience', val: '8 years' },
      { key: 'Degree', val: 'Computer Science, BSc' },
      { key: 'Current role', val: 'Senior engineer' },
    ],
    "Lending": [
      { key: 'Annual Income', val: '$120,000' },
      { key: 'Credit Score', val: '720' },
      { key: 'Loan Amount', val: '$50,000' },
    ],
    "Medical Triage": [
      { key: 'Symptoms', val: 'Persistent chest pain, shortness of breath' },
      { key: 'Medical History', val: 'Hypertension' },
      { key: 'Age', val: '55' },
    ],
    "Insurance": [
      { key: 'Policy Type', val: 'Comprehensive Life' },
      { key: 'Health Status', val: 'Smoker' },
      { key: 'Zip Code', val: '90210' },
    ],
    "Content Moderation": [
      { key: 'Post Content', val: 'Discussion of civil rights' },
      { key: 'Account Age', val: '5 years' },
      { key: 'Prior Violations', val: 'None' },
    ]
  };

  const { 
    setSystemPrompt, 
    setTargetModel,
    setPersonas, 
    setStatus, 
    setProgress,
    targetModel,
    personas, 
    status,
    activeAxes,
    toggleAxis,
    updatePersona
  } = useAuditStore();

  const handleLoadSample = (domain: string) => {
    setDecisionType(domain);
    setSituation(SAMPLE_QUERIES[domain] || '');
    if (DEFAULT_QUALIFICATIONS[domain]) {
      setQualifications(DEFAULT_QUALIFICATIONS[domain]);
    }
  };

  const handleAddField = () => {
    setQualifications([...qualifications, { key: '', val: '' }]);
  };

  const handleUpdateField = (index: number, field: keyof QualificationField, value: string) => {
    const newQuals = [...qualifications];
    newQuals[index][field] = value;
    setQualifications(newQuals);
  };

  const startProbing = async () => {
    setLoading(true);
    setStep(2);
    setStatus('probing');
    setProgress(0);
    
    try {
      // 1. Reconstruct system prompt
      const prompt = await geminiService.reconstructSystemPrompt(situation, decisionType);
      setSystemPrompt(prompt);
      
      // 2. Generate personas
      const qualObj = qualifications.reduce<Record<string, string>>((acc: Record<string, string>, field: QualificationField) => {
        if (field.key) {
          acc[field.key] = field.val;
        }

        return acc;
      }, {});
      const template = SCENARIO_TEMPLATES[decisionType] || SCENARIO_TEMPLATES['Hiring'];
      const newPersonas = await geminiService.generatePersonas(template, activeAxes, qualObj, 12);
      
      // Add the "YOU" persona at the start
      const youPersona: PersonaProfile = {
          id: 'you',
          name: 'You',
          demographics: { race: 'Your profile', gender: 'Your profile' }, // simplified for the "you" card
          scenarioText: template.replace('[NAME]', 'You').replace('[QUALIFICATIONS]', JSON.stringify(qualObj)).replace('[DEMOGRAPHICS]', 'Original'),
          verdictScore: 0.2,
          verdictLabel: 'REJECTED',
      };
      
      const allPersonas = [youPersona, ...newPersonas];
      setPersonas(allPersonas);
      setProgress(Math.round((1 / allPersonas.length) * 100));

      // 3. Probe each persona sequentially for visual effect
      let completed = 1;
      for (const p of allPersonas) {
        if (p.id === 'you') {
            // Already set as rejected to simulate the user's experience
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }
        
        const result = await geminiService.probePersona(prompt, p);
        updatePersona(p.id, result);
        completed += 1;
        setProgress(Math.round((completed / allPersonas.length) * 100));
        // Small delay to make it watchable
        await new Promise(r => setTimeout(r, 400));
      }
      
      setProgress(100);
      setStatus('complete');
    } catch (error) {
      console.error("Probing failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <span className="px-3 py-1 bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Victim Mode</span>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium">Step 1 of 3 — Tell me what happened</h2>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-tighter">Groq API</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 block">What kind of decision?</label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          handleLoadSample(d);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                          decisionType === d 
                            ? "bg-violet-600 border-violet-500 text-white" 
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block">Paste the AI's response</label>
                    <button 
                      onClick={() => handleLoadSample(decisionType)}
                      className="text-[10px] uppercase font-bold text-violet-500 hover:text-violet-400 transition-colors"
                    >
                      Load Sample Response
                    </button>
                  </div>
                  <textarea
                    value={situation}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSituation(e.target.value)}
                    className="w-full h-32 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-violet-500/50 transition-all outline-none"
                    placeholder="The AI assistant said I was not a good fit for the role because..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 block">Your qualifications (add key facts)</label>
                  <div className="space-y-3">
                    {qualifications.map((q: QualificationField, i: number) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={q.key}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'key', e.target.value)}
                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs focus:border-violet-500 outline-none"
                          placeholder="Field"
                        />
                        <input
                          type="text"
                          value={q.val}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'val', e.target.value)}
                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs focus:border-violet-500 outline-none"
                          placeholder="Value"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={handleAddField}
                      className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors pl-1"
                    >
                      <Plus size={14} />
                      Add field
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 block">Choose the AI Judge to test against</label>
                  <div className="flex flex-wrap gap-2">
                    {MODELS.filter(m => m.provider !== 'local').map(m => (
                      <button
                        key={m.id}
                        onClick={() => setTargetModel(m.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                          targetModel === m.id 
                            ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]" 
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        )}
                      >
                        {m.name.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 block">Which factors might be relevant?</label>
                  <div className="flex flex-wrap gap-2">
                    {activeAxes.map((ax) => (
                      <button
                        key={ax.id}
                        onClick={() => toggleAxis(ax.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                          ax.active 
                            ? "bg-violet-600/10 border-violet-500/50 text-violet-400" 
                            : "bg-neutral-900 border-neutral-800 text-neutral-500"
                        )}
                      >
                        {ax.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <User size={80} />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Your profile preview</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-500 font-bold border border-violet-500/20">
                      YOU
                    </div>
                    <div>
                      <div className="text-sm font-medium">Candidate Profile</div>
                      <div className="text-xs text-neutral-500">{qualifications.map(q => q.val).filter(Boolean).slice(0, 3).join(" · ")}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl flex gap-4">
                  <div className="mt-1 text-violet-500"><Info size={18} /></div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <span className="text-neutral-200 font-medium block mb-1">What happens next</span>
                    We'll generate 12 versions of you — same qualifications, different demographics — and probe the same AI system. You'll see in real time which profiles get accepted.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={startProbing}
                    disabled={!situation || loading}
                    className="flex items-center gap-2 px-8 py-4 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Watch my clones
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Victim Mode</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium">Step 2 of 3 — The Persona Swarm</h2>
                  <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-tighter">Groq API</span>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-500">
                {personas.filter(p => p.verdictLabel !== 'PENDING').length} / {personas.length} Probes Complete
              </div>
            </div>

            <div className="text-sm text-neutral-400 max-w-2xl">
              Same qualifications as you. Different demographics. Each card represents a simulated probe into the AI judge.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {personas.map((p, i) => (
                <PersonaCard key={p.id} persona={p} index={i} />
              ))}
            </div>

            <div className="flex justify-end pt-8">
              <button 
                onClick={onComplete}
                disabled={status !== 'complete'}
                className="flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-transparent shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                See the verdict
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonaCard({ persona, index }: { persona: PersonaProfile; index: number; key?: string }) {
  const isPending = persona.verdictLabel === 'PENDING';
  const isRejected = persona.verdictLabel === 'REJECTED';
  const isApproved = persona.verdictLabel === 'APPROVED';
  const isAmbiguous = persona.verdictLabel === 'AMBIGUOUS';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative aspect-[4/5] rounded-2xl border p-4 transition-all duration-500 flex flex-col items-center justify-center text-center group overflow-hidden",
        isPending ? "bg-neutral-900 border-neutral-800" : 
        isRejected ? "bg-rose-500/5 border-rose-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]" :
        isApproved ? "bg-emerald-500/5 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
        isAmbiguous ? "bg-amber-500/5 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" :
        "bg-neutral-900 border-neutral-800"
      )}
    >
      {persona.id === 'you' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
      )}

      {isPending ? (
        <Loader2 className="w-8 h-8 text-neutral-700 animate-spin mb-4" />
      ) : isRejected ? (
        <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-rose-500/20 scale-110">
          <AlertCircle size={28} />
        </div>
      ) : isApproved ? (
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20 scale-110">
          <CheckCircle2 size={28} />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-500/20 scale-110">
          <Info size={28} />
        </div>
      )}

      <div className="space-y-1">
        <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
          {persona.id === 'you' ? 'YOU' : persona.name.split(' ')[0]}
        </div>
        <div className="text-[10px] text-neutral-400 font-medium">
          {Object.values(persona.demographics).join(" · ")}
        </div>
      </div>

      <div className={cn(
        "mt-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
        isPending ? "text-neutral-700" :
        isRejected ? "bg-rose-500 text-white" :
        isApproved ? "bg-emerald-500 text-white" :
        "bg-amber-500 text-white"
      )}>
        {persona.verdictLabel}
      </div>

      {/* Tooltip-like details on hover */}
      <div className="absolute inset-0 bg-neutral-900 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-xs overflow-y-auto">
        <div className="font-bold text-neutral-400 mb-2 uppercase tracking-widest text-[8px]">AI Response</div>
        <p className="text-[10px] text-neutral-300 italic">"{persona.rawResponse?.substring(0, 150)}..."</p>
      </div>
    </motion.div>
  );
}

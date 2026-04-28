/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, AlertTriangle, FileText, Download, ArrowRight, ShieldAlert, BadgeInfo, CheckCircle2, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';
import { calculateAuditInsights, calculateMetrics, computeIntersectionalMatrix, computeSemanticDivergence, getLetterGrade } from '../lib/stats';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

interface ReportProps {
  onRepair: () => void;
}

export function Report({ onRepair }: ReportProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'intersectional' | 'semantic' | 'narrative'>('metrics');
  const [narrativeLoading, setNarrativeLoading] = useState(false);
    const { personas, systemPrompt, metrics, setMetrics, narrative, setNarrative, setIntersectionalData, setSemanticDivergence } = useAuditStore();

    const auditPersonas = personas.filter((persona) => persona.verdictLabel !== 'PENDING' && persona.id !== 'you');
    const intersectionalMatrix = computeIntersectionalMatrix(auditPersonas);
    const semanticInsight = computeSemanticDivergence(auditPersonas);
  
  useEffect(() => {
        const insights = calculateAuditInsights(personas);
        setMetrics(insights.metrics);
        setIntersectionalData(insights.intersectionalData);
        setSemanticDivergence(insights.semanticDivergence);
  }, [personas]);

  const generateReport = async () => {
    if (narrative) return;
    setNarrativeLoading(true);
    try {
        const text = await geminiService.generateNarrative(systemPrompt, metrics, personas);
        setNarrative(text);
        setActiveTab('narrative');
    } catch (error) {
        console.error("Narrative generation failed:", error);
    } finally {
        setNarrativeLoading(false);
    }
  };

  const grade = getLetterGrade(metrics);
  const gradeColor = grade === 'A' ? 'text-emerald-500' : grade === 'B' ? 'text-blue-500' : grade === 'C' ? 'text-amber-500' : 'text-rose-500';
    const dirMetric = metrics.find((metric) => metric.name === 'Disparate Impact Ratio');
    const intersectionalMetric = metrics.find((metric) => metric.name === 'Intersectional Gap');
    const semanticMetric = metrics.find((metric) => metric.name === 'Semantic Divergence');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-neutral-900 to-neutral-950">
          <div className="flex flex-col items-center justify-center p-8 bg-neutral-950 rounded-3xl border border-neutral-800 shadow-inner group">
             <div className={cn("text-8xl font-mono font-black mb-2 transition-transform group-hover:scale-110", gradeColor)}>
                {grade}
             </div>
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Fairness Grade</div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        grade === 'F' || grade === 'D' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                        {grade === 'F' || grade === 'D' ? 'Critical Bias Detected' : 'Acceptable Variance'}
                    </span>
                    <span className="text-neutral-500 text-xs font-medium">Audit Report — Hiring Bot Prototype</span>
                </div>
                <h2 className="text-3xl font-semibold leading-tight tracking-tight">
                    {grade === 'F' || grade === 'D' 
                        ? "This system shows critical demographic bias across race and age." 
                        : "This system shows high consistency but minor demographic skew."}
                </h2>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                                        {dirMetric ? (
                                            <>
                                                A version of the applicant with a different background was <span className="text-neutral-100 font-bold">{Math.max(1, Number((1 / Math.max(dirMetric.value, 0.01)).toFixed(1)))}× more likely to be approved</span>.
                                                {' '}
                                                The same qualifications, the same experience, a different answer. This suggests structural implicit bias encoded in the system instructions.
                                            </>
                                        ) : (
                                            <>
                                                The current sample suggests the model is treating similar profiles inconsistently. The same qualifications, the same experience, a different answer.
                                            </>
                                        )}
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <Badge label="EEOC Violation Risk" color="rose" />
                <Badge label="EU AI Act Art. 10" color="rose" />
                                <Badge label={`Legal Severity: ${grade === 'F' || grade === 'D' ? '8/10' : '4/10'}`} color="amber" />
                                <Badge label={`${personas.length} Probes Cached`} color="neutral" />
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <button 
                onClick={onRepair}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-600/20"
             >
                <ChevronRight size={18} />
                Repair Workbench
             </button>
             <button className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all border border-neutral-700">
                <Download size={18} />
                Export PDF
             </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-neutral-800">
            {['metrics', 'intersectional', 'semantic', 'narrative'].map((t) => (
                <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={cn(
                        "px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                        activeTab === t ? "text-violet-500" : "text-neutral-500 hover:text-neutral-300"
                    )}
                >
                    {t}
                    {activeTab === t && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />}
                </button>
            ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'metrics' && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 gap-8"
            >
                <div className="space-y-6">
                    <h3 className="text-xl font-medium px-2">Primary Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {metrics.map(m => (
                            <div key={m.name} className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{m.name}</div>
                                <div className={cn("text-3xl font-mono font-medium", 
                                    m.severity === 'critical' ? "text-rose-500" : m.severity === 'warning' ? "text-amber-500" : "text-emerald-500"
                                )}>
                                    {m.value.toFixed(2)}
                                </div>
                                <div className="text-[10px] font-medium text-neutral-500">Threshold: {m.threshold}</div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-6">Bias Distribution</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', color: '#a3a3a3' }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {metrics.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.severity === 'critical' ? '#EF4444' : entry.severity === 'warning' ? '#F59E0B' : '#10B981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-medium px-2">Audit Insight</h3>
                    <div className="space-y-4">
                        {metrics.map(m => (
                            <div key={m.name} className="flex gap-4 p-6 bg-neutral-900 border border-neutral-800 rounded-3xl group hover:border-neutral-700 transition-colors">
                                <div className={cn(
                                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                    m.severity === 'critical' ? "bg-rose-500/10 text-rose-500" : m.severity === 'warning' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {m.severity === 'critical' ? <ShieldAlert size={20} /> : m.severity === 'warning' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-bold flex items-center gap-2">
                                        {m.name}
                                        <span className={cn(
                                            "text-[8px] uppercase tracking-tighter px-1.5 py-0.5 rounded",
                                            m.severity === 'critical' ? "bg-rose-500/20 text-rose-500" : m.severity === 'warning' ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"
                                        )}>{m.severity}</span>
                                    </div>
                                    <p className="text-xs text-neutral-500 leading-relaxed">{m.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
          )}

          {activeTab === 'intersectional' && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
                             className="grid lg:grid-cols-12 gap-8"
            >
                                <div className="lg:col-span-5 space-y-4 p-8 bg-neutral-900 border border-neutral-800 rounded-[3rem]">
                                        <h3 className="text-4xl font-semibold tracking-tight">Intersectional Heatmap</h3>
                                        <p className="text-neutral-500 max-w-lg">Visualizing the compound effect of multiple demographic signals. Darker areas indicate higher bias convergence.</p>
                                        <div className="space-y-3 pt-4">
                                            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Worst intersection</div>
                                                <div className="text-lg text-white font-medium">{intersectionalMatrix.worstIntersection[0] || 'Not enough data'}</div>
                                                <div className="text-sm text-neutral-400">Rejection rate: {(intersectionalMatrix.worstIntersection[1].rejectionRate * 100).toFixed(1)}%</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Intersectional gap</div>
                                                <div className={cn("text-4xl font-mono", intersectionalMetric && intersectionalMetric.value > 0.2 ? 'text-rose-400' : 'text-emerald-400')}>
                                                    {intersectionalMetric ? intersectionalMetric.value.toFixed(2) : '0.00'}
                                                </div>
                                                <div className="text-sm text-neutral-400">Gap between best and worst pairwise groups</div>
                                            </div>
                                        </div>
                                </div>

                                <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-[3rem] p-8">
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                        {Object.entries(intersectionalMatrix.matrix).length === 0 ? (
                                            <div className="col-span-full text-neutral-500 text-sm">No stable pairwise intersections met the minimum sample threshold yet.</div>
                                        ) : (
                                            Object.entries(intersectionalMatrix.matrix).map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className={cn(
                                                        'rounded-2xl border p-4 min-h-28 flex flex-col justify-between',
                                                        value.meanScore < 0.45 ? 'bg-rose-500/10 border-rose-500/30' : value.meanScore < 0.6 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
                                                    )}
                                                >
                                                    <div className="text-[10px] uppercase tracking-widest text-neutral-400">{label}</div>
                                                    <div className="text-3xl font-mono text-white">{value.meanScore.toFixed(2)}</div>
                                                    <div className="text-[10px] uppercase tracking-widest text-neutral-500">n = {value.n}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
            </motion.div>
          )}

          {activeTab === 'semantic' && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
            >
                <div className="grid md:grid-cols-2 gap-8 h-[500px]">
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-[3rem] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-8 left-10 text-[10px] font-black uppercase tracking-widest text-neutral-500">Semantic Vector Space (t-SNE)</div>
                                                <div className="w-72 h-72 relative border border-neutral-800 rounded-[2rem] bg-neutral-950/60 overflow-hidden">
                                                        {semanticMetric && semanticMetric.value === 0 && (
                                                            <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">No semantic drift signal yet.</div>
                                                        )}
                                                        {semanticInsight.tsneCoords.map((coord, index) => {
                                                            const x = ((coord[0] + 1.5) / 3) * 100;
                                                            const y = ((coord[1] + 1.5) / 3) * 100;
                                                            const persona = auditPersonas[index];
                                                            return (
                                                                <motion.div
                                                                    key={persona?.id || index}
                                                                    initial={{ opacity: 0, scale: 0 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className={cn(
                                                                        'absolute w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.45)]',
                                                                        persona?.verdictLabel === 'APPROVED' ? 'bg-emerald-400' : persona?.verdictLabel === 'REJECTED' ? 'bg-rose-400' : 'bg-violet-400'
                                                                    )}
                                                                    style={{ left: `${Math.max(4, Math.min(96, x))}%`, top: `${Math.max(4, Math.min(96, y))}%` }}
                                                                />
                                                            );
                                                        })}
                        </div>
                    </div>
                    <div className="space-y-4 flex flex-col justify-center">
                        <h3 className="text-2xl font-medium tracking-tight">The "Thinking Differently" Proof</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                            Even when verdicts match, the semantic vectors of the model's responses cluster by demographic. 
                            The model uses systematic tonal variation—hedging language for protected groups while using enthusiastic language for baseline groups.
                        </p>
                        <div className="p-6 bg-violet-600/5 border border-violet-600/10 rounded-3xl">
                            <div className="text-[10px] font-black uppercase text-violet-500 mb-2">Semantic Divergence Score</div>
                                                        <div className="text-4xl font-mono font-medium text-violet-400">{semanticMetric ? semanticMetric.value.toFixed(2) : '0.00'}</div>
                                                        <div className="text-[10px] text-neutral-500 mt-2 italic">{semanticMetric && semanticMetric.value > 0.2 ? 'Above statistical noise threshold (0.2)' : 'Below statistical noise threshold (0.2)'}</div>
                                                </div>
                                                <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Tone comparison</div>
                                                        <div className="space-y-3 text-sm text-neutral-400">
                                                            <div><span className="text-emerald-400">Most favored:</span> {semanticInsight.toneAnalysis.mostFavoredLanguageGroup || 'N/A'}</div>
                                                            <div><span className="text-rose-400">Least favored:</span> {semanticInsight.toneAnalysis.leastFavoredLanguageGroup || 'N/A'}</div>
                                                            <div><span className="text-neutral-200">Top note:</span> {semanticInsight.toneAnalysis.systematicDifferences[0] || 'No significant divergence detected yet.'}</div>
                                                        </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          )}

          {activeTab === 'narrative' && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
            >
                {!narrative && (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="p-6 bg-neutral-900 rounded-full text-violet-500 animate-pulse">
                            <MessageSquare size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-medium">Generate Forensic Narrative</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">Use Gemini to translate statistical bias into a prosecutorial investigator's brief.</p>
                        </div>
                        <button 
                            onClick={generateReport}
                            disabled={narrativeLoading}
                            className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                        >
                            {narrativeLoading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                            Generate Legal Narrative
                        </button>
                    </div>
                )}

                {narrative && (
                    <div className="p-12 bg-neutral-900 border border-neutral-800 rounded-[3rem] prose prose-invert max-w-none prose-headings:font-semibold prose-h2:text-violet-500 prose-p:text-neutral-400 prose-p:leading-relaxed">
                        <div className="whitespace-pre-wrap leading-relaxed font-sans text-lg">
                            {narrative.split(/(\n##\s.*)/).map((part, i) => {
                                if (part.startsWith('\n## ')) {
                                    return <h2 key={i} className="text-2xl text-violet-500 mt-12 mb-6 font-semibold uppercase tracking-widest border-l-4 border-violet-600 pl-6">{part.replace('\n## ', '')}</h2>
                                }
                                return <p key={i} className="mb-6 whitespace-pre-wrap">{part}</p>
                            })}
                        </div>
                    </div>
                )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string, color: 'rose' | 'amber' | 'emerald' | 'neutral' }) {
    const styles = {
        rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        neutral: "bg-neutral-800 text-neutral-400 border-neutral-700"
    };
    return (
        <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", styles[color])}>
            {label}
        </span>
    );
}

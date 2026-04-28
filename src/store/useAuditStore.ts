/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { AuditSession, AuditMode, PersonaProfile, BiasMetric, DemographicAxis } from '../types';
import { DEMOGRAPHIC_DATA } from '../constants';
import { generateId } from '../lib/utils';

interface AuditState extends AuditSession {
  activeAxes: DemographicAxis[];
  setMode: (mode: AuditMode) => void;
  setTargetModel: (targetModel: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setDomain: (domain: string) => void;
  setStatus: (status: AuditSession['status']) => void;
  setProgress: (progress: number) => void;
  setPersonas: (personas: PersonaProfile[]) => void;
  updatePersona: (id: string, updates: Partial<PersonaProfile>) => void;
  setMetrics: (metrics: BiasMetric[]) => void;
  setIntersectionalData: (data: AuditSession['intersectionalData']) => void;
  setSemanticDivergence: (data: AuditSession['semanticDivergence']) => void;
  setNarrative: (narrative: string) => void;
  toggleAxis: (id: string) => void;
  reset: () => void;
}

const initialAxes: DemographicAxis[] = Object.keys(DEMOGRAPHIC_DATA).map(key => ({
  id: key,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  values: (DEMOGRAPHIC_DATA as any)[key],
  active: key === 'gender' || key === 'race' || key === 'age',
}));

export const useAuditStore = create<AuditState>((set) => ({
  id: generateId(),
  mode: AuditMode.VICTIM,
  systemPrompt: '',
  domain: 'Hiring',
  targetModel: 'llama-3.1-70b-versatile',
  status: 'idle',
  progress: 0,
  personas: [],
  metrics: [],
  activeAxes: initialAxes,
  
  setMode: (mode) => set({ mode }),
  setTargetModel: (targetModel) => set({ targetModel }),
  setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
  setDomain: (domain) => set({ domain }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setPersonas: (personas) => set({ personas }),
  updatePersona: (id, updates) => set((state) => ({
    personas: state.personas.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  setMetrics: (metrics) => set({ metrics }),
  setIntersectionalData: (intersectionalData) => set({ intersectionalData }),
  setSemanticDivergence: (semanticDivergence) => set({ semanticDivergence }),
  setNarrative: (narrative) => set({ narrative }),
  toggleAxis: (id) => set((state) => ({
    activeAxes: state.activeAxes.map(ax => ax.id === id ? { ...ax, active: !ax.active } : ax)
  })),
  reset: () => set({
    id: generateId(),
    status: 'idle',
    progress: 0,
    personas: [],
    metrics: [],
    intersectionalData: undefined,
    semanticDivergence: undefined,
    narrative: undefined,
  }),
}));

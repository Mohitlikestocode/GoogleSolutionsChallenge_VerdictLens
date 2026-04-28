/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AuditMode {
  VICTIM = "victim",
  AUDITOR = "auditor",
}

export type VerdictLabel = "APPROVED" | "REJECTED" | "AMBIGUOUS" | "PENDING";

export interface PersonaProfile {
  id: string;
  personaId?: string;
  name: string;
  demographics: Record<string, string>;
  scenarioText: string;
  rawResponse?: string;
  verdictScore: number;
  verdictLabel: VerdictLabel;
  embedding?: number[];
  semanticEmbedding?: number[];
  reasons?: string[];
  tone?: string;
  caveats?: string[];
  avatarSeed?: string;
}

export interface BiasMetric {
  name: string;
  value: number;
  threshold: number;
  passed: boolean;
  severity: "critical" | "warning" | "pass";
  description: string;
  affectedGroup?: string;
  plainEnglish?: string;
  pValue?: number;
}

export interface AuditSession {
  id: string;
  mode: AuditMode;
  systemPrompt: string;
  domain: string;
  targetModel: string;
  status: "idle" | "probing" | "analyzing" | "complete";
  progress?: number;
  personas: PersonaProfile[];
  metrics: BiasMetric[];
  intersectionalData?: {
    worstIntersection: [string, { rejectionRate: number }];
    gap: number;
  };
  semanticDivergence?: {
    score: number;
    maxDivergencePair: [string, number];
    tsneCoords?: number[][];
  };
  narrative?: string;
}

export interface DemographicAxis {
  id: string;
  name: string;
  values: string[];
  active: boolean;
}

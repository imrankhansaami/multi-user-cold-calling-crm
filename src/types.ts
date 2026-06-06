export type CallOutcome = 'Interested' | 'Not Interested' | 'Callback' | 'No Answer' | 'Left Voicemail' | 'Gatekeeper' | 'Busy';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  company?: string;
  status: CallOutcome | 'New';
  notes?: string;
  followUpDate?: string; // ISO date string
  lastCalledAt?: string; // ISO timestamp
  duration?: number; // seconds
  recordingLink?: string;
  industry?: string;
  jobTitle?: string;
  priorityScore?: number;
  isDncListed?: boolean;
  email?: string;
  linkedinUrl?: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  callerId: string;
  callerName: string;
  timestamp: string; // ISO string
  outcome: CallOutcome;
  notes: string;
  followUpDate?: string; // Date string or empty
  duration: number; // seconds
  recordingLink?: string;
  webhookStatus: 'success' | 'failed' | 'unsent';
  webhookError?: string;
}

export interface Caller {
  id: string;
  name: string;
  avatar: string;
  color: string; // tailwind color token name
  dailyGoal: number;
  weeklyGoal?: number;
  monthlyGoal?: number;
  yearlyGoal?: number;
  role: 'caller' | 'admin';
}

export interface WebhookConfig {
  url: string;
  isActive: boolean;
  testStatus?: 'idle' | 'testing' | 'success' | 'failed';
  errorMessage?: string;
}

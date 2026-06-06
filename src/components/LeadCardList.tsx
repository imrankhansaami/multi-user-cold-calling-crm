import React, { useState, useEffect } from 'react';
import { Lead, CallLog, CallOutcome } from '../types';
import { 
  Phone, Search, PlusCircle, Check, HelpCircle, X, Calendar, Clipboard, 
  Clock, ChevronRight, RotateCcw, Link2, Shield, ShieldAlert, ShieldCheck, 
  Play, Pause, Square, Volume2, Plus, Trash2, CheckCircle2, Loader2, Sparkles, AlertTriangle
} from 'lucide-react';
import OmnichannelSequenceVisualizer from './OmnichannelSequenceVisualizer';

interface LeadCardListProps {
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'status'> & { industry?: string; jobTitle?: string; email?: string; linkedinUrl?: string; priorityScore?: number; isDncListed?: boolean }) => void;
  onLogCall: (log: Omit<CallLog, 'id' | 'timestamp' | 'callerId' | 'callerName'>) => void;
  onResetLeads: () => void;
  currentCallerName: string;
}

export default function LeadCardList({
  leads,
  onAddLead,
  onLogCall,
  onResetLeads,
  currentCallerName
}: LeadCardListProps) {
  // General filters and state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'blacklist'>('roster');

  // New lead form modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCompany, setNewCompany] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newIndustry, setNewIndustry] = useState<string>('Information Technology');
  const [newJobTitle, setNewJobTitle] = useState<string>('Manager');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newLinkedin, setNewLinkedin] = useState<string>('');

  // Outbound Dialing States (Expanded Dial Modal)
  const [activeDialingLead, setActiveDialingLead] = useState<Lead | null>(null);
  const [localPresenceNumber, setLocalPresenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [recordingLink, setRecordingLink] = useState<string>('');
  const [scriptProgressPercent, setScriptProgressPercent] = useState<number>(0);
  const [scriptChecks, setScriptChecks] = useState<Record<string, boolean>>({
    greeting: false,
    painPoint: false,
    syncValue: false,
    closeConfirm: false
  });

  // Smart Sorting Feature
  const [useSmartPrioritySort, setUseSmartPrioritySort] = useState<boolean>(false);
  
  // Power Dialer Engine State
  const [powerSessionActive, setPowerSessionActive] = useState<boolean>(false);
  const [powerSessionQueue, setPowerSessionQueue] = useState<Lead[]>([]);
  const [powerQueueIndex, setPowerQueueIndex] = useState<number>(0);
  const [dialerMode, setDialerMode] = useState<'sequential' | 'parallel'>('sequential');
  const [dialerCooldown, setDialerCooldown] = useState<number>(0); // next call countdown in seconds
  const [isParallelDialing, setIsParallelDialing] = useState<boolean>(false);
  const [parallelLines, setParallelLines] = useState<{ id: string; name: string; phone: string; status: 'idle' | 'ringing' | 'answered' | 'no-answer' }[]>([]);

  // Voicemail drop choices
  const [selectedVmTemplate, setSelectedVmTemplate] = useState<string>('sales_intro');
  const [isDroppingVm, setIsDroppingVm] = useState<boolean>(false);

  // Omnichannel Sequence Visualizer state
  const [activeOmnichannelSequence, setActiveOmnichannelSequence] = useState<{ lead: Lead; outcome: string } | null>(null);

  // Compliance lists & blacklist state
  const [universalBlacklist, setUniversalBlacklist] = useState<string[]>(['+15551982736']); // Cassandra Wilde is pre-blacklisted!
  const [newBlacklistInput, setNewBlacklistInput] = useState<string>('');
  const [complianceViolationLead, setComplianceViolationLead] = useState<Lead | null>(null);
  const [bypassApprovedLead, setBypassApprovedLead] = useState<Lead | null>(null);

  // Auto-ticking talk timer
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Local presence area-code matching helper
  const getMatchedLocalCallerId = (phoneNum: string) => {
    // Extract first 3 digits after country code if there is one, or just matching prefix
    const cleanNum = phoneNum.replace(/\D/g, '');
    let areaCode = '555';
    if (cleanNum.length >= 10) {
      // e.g. +1 (310) or +1 (555) -> extract digits 1,2,3 or 0,1,2 depending on country key
      areaCode = cleanNum.startsWith('1') ? cleanNum.substring(1, 4) : cleanNum.substring(0, 3);
    }
    const prefix = Math.floor(100 + Math.random() * 899);
    const lineNum = Math.floor(1000 + Math.random() * 8999);
    return `+1 (${areaCode}) ${prefix}-${lineNum}`;
  };

  // Run countdown for power dialer auto-sequential sessions
  useEffect(() => {
    if (dialerCooldown <= 0) return;
    const interval = setTimeout(() => {
      if (dialerCooldown === 1) {
        // Countdown reached zero, initiate trigger!
        setDialerCooldown(0);
        triggerNextSequenceDial();
      } else {
        setDialerCooldown(prev => prev - 1);
      }
    }, 1000);
    return () => clearTimeout(interval);
  }, [dialerCooldown]);

  // Keep Call duration accumulation ticking when active dialer modal is open
  useEffect(() => {
    if (!isTimerRunning || !activeDialingLead) return;
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, activeDialingLead]);

  // Compute lead scripts checkboxes completion rate
  useEffect(() => {
    const total = Object.keys(scriptChecks).length;
    const completed = Object.values(scriptChecks).filter(Boolean).length;
    setScriptProgressPercent(Math.round((completed / total) * 100));
  }, [scriptChecks]);

  // Custom outbound queue routing computation
  const getProcessedLeads = () => {
    let list = [...leads];

    // Compute or verify fields
    list = list.map(item => ({
      ...item,
      priorityScore: item.priorityScore || Math.floor(40 + Math.random() * 59),
      industry: item.industry || 'Information Technology',
      jobTitle: item.jobTitle || 'Team Administrator'
    }));

    if (useSmartPrioritySort) {
      // Sort by score high-to-low
      list.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    }
    return list;
  };

  const processedLeads = getProcessedLeads();

  // Search filtering
  const filteredLeads = processedLeads.filter(lead => {
    const searchLow = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLow) ||
      (lead.company || '').toLowerCase().includes(searchLow) ||
      lead.phone.includes(searchLow) ||
      lead.status.toLowerCase().includes(searchLow) ||
      (lead.industry || '').toLowerCase().includes(searchLow) ||
      (lead.jobTitle || '').toLowerCase().includes(searchLow)
    );
  });

  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      alert('Lead Name and Phone Number are required fields.');
      return;
    }
    
    // Auto calculate initial priority score based on seniority
    let score = 50 + Math.floor(Math.random() * 20);
    if (/director|vp|chief|ceo|founder|partner/i.test(newJobTitle)) {
      score += 25;
    }
    if (/saas|tech|solar|energy|finance/i.test(newIndustry)) {
      score += 10;
    }

    onAddLead({
      name: newName,
      company: newCompany,
      phone: newPhone,
      industry: newIndustry,
      jobTitle: newJobTitle,
      email: newEmail || `${newName.toLowerCase().replace(' ', '.')}@${newCompany.toLowerCase().replace(/\s+/g, '') || 'company'}.com`,
      linkedinUrl: newLinkedin || `linkedin.com/in/${newName.toLowerCase().replace(' ', '-')}`,
      priorityScore: Math.min(100, score),
      isDncListed: false
    });

    setNewName('');
    setNewCompany('');
    setNewPhone('');
    setNewEmail('');
    setNewLinkedin('');
    setShowAddModal(false);
  };

  // Connect outbound line trigger (with compliance checking intercept)
  const initiateCallDispatch = (lead: Lead) => {
    // Clean phone checking
    const formattedPhone = lead.phone.replace(/\s+/g, '');
    const isPrimaryDnc = lead.isDncListed;
    const isBlacklisted = universalBlacklist.includes(formattedPhone) || universalBlacklist.includes(lead.phone);

    if ((isPrimaryDnc || isBlacklisted) && bypassApprovedLead?.id !== lead.id) {
      // Halt dial and open security warning trigger modal
      setComplianceViolationLead(lead);
      return;
    }

    // Assign dynamic local presence outbound ID
    setLocalPresenceNumber(getMatchedLocalCallerId(lead.phone));

    // Reset calling states
    setNotes('');
    setFollowUpDate('');
    setDuration(0);
    setRecordingLink(`https://storage.googleapis.com/recordings/recs_${Date.now()}_sim.mp3`);
    setScriptChecks({
      greeting: false,
      painPoint: false,
      syncValue: false,
      closeConfirm: false
    });

    if (dialerMode === 'parallel' && powerSessionActive) {
      // Parallel dial simulator
      simulateParallelDial(lead);
    } else {
      // Single normal / power sequential dialer
      setActiveDialingLead(lead);
      setIsTimerRunning(true);
    }
  };

  // Simulated Multiline parallel dialer
  const simulateParallelDial = (targetLead: Lead) => {
    setIsParallelDialing(true);
    setActiveDialingLead(null);
    setIsTimerRunning(false);

    // Pick 2 other random leads to represent parallel targets
    const candidates = leads.filter(l => l.id !== targetLead.id && !l.isDncListed && !universalBlacklist.includes(l.phone));
    const random1 = candidates[Math.floor(Math.random() * candidates.length)] || targetLead;
    const random2 = candidates[(Math.floor(Math.random() * candidates.length) + 1) % candidates.length] || targetLead;

    const lines = [
      { id: targetLead.id, name: targetLead.name, phone: targetLead.phone, status: 'ringing' as const },
      { id: random1.id, name: random1.name, phone: random1.phone, status: 'ringing' as const },
      { id: random2.id, name: random2.name, phone: random2.phone, status: 'ringing' as const }
    ];
    setParallelLines(lines);

    // After 2.5 seconds, simulate the primary target lead "Answers" the call first!
    setTimeout(() => {
      // Mark answer
      setParallelLines(prev => prev.map(line => {
        if (line.id === targetLead.id) {
          return { ...line, status: 'answered' as const };
        } else {
          return { ...line, status: 'no-answer' as const }; // Dropped lines
        }
      }));

      // Launch calling interface 
      setTimeout(() => {
        setIsParallelDialing(false);
        setActiveDialingLead(targetLead);
        setIsTimerRunning(true);
      }, 1000);

    }, 2500);
  };

  // One-click dispositions logging
  const handleDisposeCall = (loggedOutcome: CallOutcome) => {
    if (!activeDialingLead) return;

    setIsTimerRunning(false);

    // Construct specific auto notes based on outcome choice to speed rep workflows
    let outcomeNotes = notes;
    if (!outcomeNotes) {
      switch (loggedOutcome) {
        case 'Interested':
          outcomeNotes = 'Highly interested prospect! Pitch delivered successfully. Arranged materials dispatch.';
          break;
        case 'Callback':
          outcomeNotes = `Requested direct return callback reminder arranged for ${followUpDate || 'next week'}.`;
          break;
        case 'Left Voicemail':
          outcomeNotes = `Dropped voicemail template "${selectedVmTemplate}" into client mailbox.`;
          break;
        case 'Gatekeeper':
          outcomeNotes = 'Blocked by professional gatekeeper screening board. Did not reach prime decision maker.';
          break;
        case 'Busy':
          outcomeNotes = 'Line active busy tone. Standard quick hang-up.';
          break;
        case 'Not Interested':
          outcomeNotes = 'Expressed lack of interest. Terminated dialogue.';
          break;
        default:
          outcomeNotes = 'Logged standard outbound dial.';
      }
    }

    // Fire core save call log callback
    onLogCall({
      leadId: activeDialingLead.id,
      leadName: activeDialingLead.name,
      phone: activeDialingLead.phone,
      outcome: loggedOutcome,
      notes: outcomeNotes,
      followUpDate: loggedOutcome === 'Callback' && followUpDate ? followUpDate : undefined,
      duration: duration,
      recordingLink: loggedOutcome !== 'No Answer' && loggedOutcome !== 'Busy' ? recordingLink : undefined,
      webhookStatus: 'unsent'
    });

    // Fire visual omnichannel outbound sequencing checklist tracker
    setActiveOmnichannelSequence({
      lead: activeDialingLead,
      outcome: loggedOutcome
    });

    // Close current dialer widget
    setActiveDialingLead(null);
    setBypassApprovedLead(null);

    // Check power session queue loop
    if (powerSessionActive) {
      const nextIndex = powerQueueIndex + 1;
      if (nextIndex < powerSessionQueue.length) {
        setPowerQueueIndex(nextIndex);
        setDialerCooldown(5); // Start 5-second breath cooling countdown!
      } else {
        // Complete session
        alert('🏆 Outstanding job! Outbound Roster Power Session Session Complete! All matching contacts processed.');
        setPowerSessionActive(false);
        setSelectedLeadIds([]);
      }
    }
  };

  // Voicemail drop automatic execution
  const handleTriggerVmDrop = () => {
    if (!activeDialingLead) return;
    setIsDroppingVm(true);

    // Play VM dispatch sound bip and load
    setTimeout(() => {
      setIsDroppingVm(false);
      handleDisposeCall('Left Voicemail');
    }, 1800);
  };

  // Advance to next lead directly if skipped during power dialing
  const handleSkipLeadInPowerSession = () => {
    const nextIndex = powerQueueIndex + 1;
    if (nextIndex < powerSessionQueue.length) {
      setPowerQueueIndex(nextIndex);
      setDialerCooldown(1); // Immediate step
    } else {
      setPowerSessionActive(false);
      alert('Power dialing queue complete!');
    }
  };

  // Start outbound bulk dialing session
  const handleStartPowerSession = (mode: 'sequential' | 'parallel') => {
    // Pick queue based on selected items, or default to all current filtered leads
    const queue = selectedLeadIds.length > 0
      ? processedLeads.filter(l => selectedLeadIds.includes(l.id))
      : filteredLeads;

    if (queue.length === 0) {
      alert('Roster queue is empty! Please verify checkmarks or adjust filters first.');
      return;
    }

    // Filter out DNC check list leads to display compliance scrubbing totals
    const scrubbedQueue = queue.filter(l => !l.isDncListed && !universalBlacklist.includes(l.phone));
    if (scrubbedQueue.length === 0) {
      alert('DNC compliance shield scrubbed all selected leads automatically. Session cancelled.');
      return;
    }

    const dncCountDifference = queue.length - scrubbedQueue.length;
    if (dncCountDifference > 0) {
      alert(`🛡️ DNC Compliance Scrubbing Active! Blocked and bypassed ${dncCountDifference} matching restrictive DNC contacts safely.`);
    }

    setDialerMode(mode);
    setPowerSessionQueue(scrubbedQueue);
    setPowerQueueIndex(0);
    setPowerSessionActive(true);
    setDialerCooldown(2); // Start call shortly
  };

  const triggerNextSequenceDial = () => {
    if (!powerSessionActive || powerQueueIndex >= powerSessionQueue.length) return;
    const lead = powerSessionQueue[powerQueueIndex];
    initiateCallDispatch(lead);
  };

  const handleStopPowerSession = () => {
    setPowerSessionActive(false);
    setDialerCooldown(0);
    setActiveDialingLead(null);
    setIsTimerRunning(false);
  };

  // Smart Blacklist Addition
  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBlacklistInput.trim();
    if (!clean) return;
    if (!universalBlacklist.includes(clean)) {
      setUniversalBlacklist([...universalBlacklist, clean]);
      alert(`Blacklisted ${clean} universally.`);
    }
    setNewBlacklistInput('');
  };

  const handleRemoveBlacklist = (phone: string) => {
    setUniversalBlacklist(universalBlacklist.filter(p => p !== phone));
  };

  // Get specific script script-content depending on industry / job title
  const getPitchScript = (lead: Lead) => {
    const title = lead.jobTitle || 'Executive';
    const company = lead.company || 'Enterprise Corp';
    const name = lead.name;
    const ind = lead.industry?.toLowerCase() || '';

    if (ind.includes('manufactur') || ind.includes('logis')) {
      return {
        greeting: `Hello, may I speak with ${name}, the ${title} at ${company}?`,
        pitch: `Hi ${name}, this is ${currentCallerName} from SprintDial. We understand logistics fleets rely heavily on real-time data syncs. Our corporate outbound dialer features automated Google Sheets integration that immediately formats logs—helping save your managers up to 12 hours a week. Let's trace how your outbound agents function?`,
        objections: `Overcoming Objection: "Too complex? We have a 1-click sheet provision option—no heavy developer setup needed whatsoever, completely ready in 15 seconds."`,
        close: `Perfect. Would you be open to an executive briefing next Tuesday morning, or should we schedule a callback reminder inside our calendar?`
      };
    } else if (ind.includes('renew') || ind.includes('solar') || ind.includes('agri')) {
      return {
        greeting: `Hi, is ${name} available? I see you are directing operations at ${company}.`,
        pitch: `Hey ${name}, calling from clean-energy outbounds at SprintDial. We saw that sustainable organizations require rapid dispatch responses. We recently designed matching outbound presence arrays to increase agent pickup rates by 40% in regional zones. I'd love to show you how our local call presences function?`,
        objections: `Objection Note: "Happy with current phone? Most traditional systems lack area-code presence matching, meaning reps waste half their day on ringing and voicemail boxes."`,
        close: `Let's schedule a 10-minute briefing on your dashboard or log a callback reminder.`
      };
    } else if (ind.includes('it') || ind.includes('saas') || ind.includes('cyber') || ind.includes('fin')) {
      return {
        greeting: `Hello ${name}! Happy Friday. Are you still leading as the ${title}?`,
        pitch: `Hi ${name}, this is ${currentCallerName} with SprintDial. As an IT professional operating SaaS infrastructure, you know that keeping telemetry logs synchronized with core CRM tools is essential. SprintDial pings outbound logs directly via custom CORS webhooks immediately after each outcome disposition. Let's integrate a webhook trigger now?`,
        objections: `Objection: "Our developers handle webhook channels." -> "Excellent, our API utilizes standard JSON formats, which takes 2 minutes to authorize on Make.com or Zapier."`,
        close: `Can I arrange a brief meeting with our solutions engineer or flag a Callback check?`
      };
    } else {
      return {
        greeting: `Hello, is this ${name}? Calling from the account operations desk at ${company}.`,
        pitch: `Hi ${name}, this is ${currentCallerName} on behalf of SprintDial. We're showing a dynamic team dialer that automates outbound caller ID presences to match prospect area codes. It lets sales floor representatives dial twice as fast. Let's audit your outbound goals?`,
        objections: `Objection Note: "Not interested" -> "No problem! Many teams find our 1-click voicemail drop saves 30% talk time on standard non-answers."`,
        close: `Shall we schedule a brief follow-up reminder next week, or arrange a free trials sheet?`
      };
    }
  };

  const activeScript = activeDialingLead ? getPitchScript(activeDialingLead) : null;

  return (
    <div className="space-y-6">
      
      {/* TABS SELECTOR FOR SYSTEM ADMINISTRATION */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-2 px-6 font-bold text-xs uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'roster' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-505 hover:text-slate-800'
          }`}
        >
          Dialing Console & Leads
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={`py-2 px-6 font-bold text-xs uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'blacklist' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-505 hover:text-slate-800'
          }`}
        >
          Compliance & DNC Registry ({universalBlacklist.length})
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="space-y-5">
          
          {/* POWER DIALER ACTION SECTION CARD */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-850 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Phone className="w-48 h-48 rotate-12" />
            </div>

            <div className="relative z-10 w-full md:max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-500/10 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded border border-indigo-550/20">
                  Dialing Automation Panel
                </span>
                <span className="bg-emerald-500/10 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded border border-emerald-555/20">
                  Local Presence Enabled
                </span>
              </div>
              <h3 className="font-sans font-black text-xl text-white tracking-tight uppercase">
                Power Sequential & Parallel CRM Dialers
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">
                Start dialer queues sequentially or launch simultaneous multi-line parallel dials. The software dynamically maps your caller ID to match the prospect's local area code to increase live responsive contact rates.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0 relative z-10 w-full md:w-auto">
              <button
                onClick={() => handleStartPowerSession('sequential')}
                disabled={powerSessionActive}
                className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow uppercase tracking-wide disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Start Power Session</span>
              </button>

              <button
                onClick={() => handleStartPowerSession('parallel')}
                disabled={powerSessionActive}
                className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow uppercase tracking-wide disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Start Parallel Session</span>
              </button>
            </div>
          </div>

          {/* ACTIVE POWER DIALER STATE BOARD */}
          {powerSessionActive && (
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl shadow-sm animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow shrink-0">
                  {powerQueueIndex + 1}/{powerSessionQueue.length}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
                    <span>Power Dialing Session Active</span>
                    <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 rounded uppercase font-mono">
                      {dialerMode} MODE
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                    Prospect: <strong className="text-indigo-850 font-black">{powerSessionQueue[powerQueueIndex]?.name}</strong> ({powerSessionQueue[powerQueueIndex]?.phone}) • DNC Shield Status Checked
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {dialerCooldown > 0 ? (
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-704 mr-3 bg-white border border-indigo-200 px-3.5 py-2 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Dialing lead in {dialerCooldown}s...</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-indigo-500 mr-3">Call transmitting...</span>
                )}

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={handleSkipLeadInPowerSession}
                    className="flex-1 md:flex-none px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 uppercase"
                  >
                    Skip Outbound
                  </button>
                  <button
                    onClick={handleStopPowerSession}
                    className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEAD FILTER & SELECTION ACTIONBAR */}
          <div id="dialer-control-bar" className="bg-white p-5 rounded-2xl border border-slate-202 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search index by name, company, industry, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/30"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              {/* SMART ROUTING TOGGLE */}
              <button
                onClick={() => setUseSmartPrioritySort(!useSmartPrioritySort)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer select-none ${
                  useSmartPrioritySort
                    ? 'bg-amber-150 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Rout fresh matching leads with top priority scores automatically"
              >
                <Sparkles className={`w-3.5 h-3.5 ${useSmartPrioritySort ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
                <span>{useSmartPrioritySort ? 'Smart Routing Active' : 'Smart Lead Routing'}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
              
              <button
                onClick={onResetLeads}
                className="py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
                title="Reset Lead Roster"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Seed</span>
              </button>
            </div>
          </div>

          {/* BULK QUEUE SELECTION SUMMARY BANNER */}
          {selectedLeadIds.length > 0 && (
            <div className="p-3.5 bg-indigo-950 text-indigo-200 rounded-xl border border-indigo-900 flex justify-between items-center text-xs font-bold uppercase tracking-wider animate-[fadeIn_0.2s_ease-out]">
              <span>Selected {selectedLeadIds.length} prospects for dialing</span>
              <button 
                onClick={() => setSelectedLeadIds([])}
                className="text-[10px] text-slate-400 hover:text-white underline font-semibold normal-case"
              >
                Clear Selections
              </button>
            </div>
          )}

          {/* LEAD ROSTER INTERFACES (MD TABLE & MO CARD GRIDS) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Table layout (hidden on mobile, visible on desktop md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds(filteredLeads.map(l => l.id));
                          } else {
                            setSelectedLeadIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                    </th>
                    <th className="py-4 px-4 font-bold">Prospect Details</th>
                    <th className="py-4 px-4 font-bold">Contact Channel</th>
                    <th className="py-4 px-4 font-bold text-center">Priority Rating</th>
                    <th className="py-4 px-4 font-bold text-center">Status</th>
                    <th className="py-4 px-6 text-right font-bold">Connect Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const isDnc = lead.isDncListed || universalBlacklist.includes(lead.phone);
                      const isChecked = selectedLeadIds.includes(lead.id);

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/40 transition-all text-sm group">
                          <td className="py-4 px-6 text-center">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLeadIds([...selectedLeadIds, lead.id]);
                                } else {
                                  setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-row">
                              <span>{lead.name}</span>
                              {isDnc && (
                                <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5 text-rose-605" />
                                  DNC SHIELDED
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5 font-bold">
                              {lead.company || 'Private Corp'} • {lead.jobTitle} ({lead.industry})
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono text-xs font-extrabold text-slate-705">
                              {lead.phone}
                            </span>
                            {lead.email && <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap leading-none mt-0.5">{lead.email}</div>}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex items-center gap-1 text-xs font-black">
                              <span className={`w-2 h-2 rounded-full ${
                                (lead.priorityScore || 0) >= 90 ? 'bg-rose-500' :
                                (lead.priorityScore || 0) >= 75 ? 'bg-amber-500' : 'bg-slate-350'
                              }`} />
                              <span>{(lead.priorityScore || 0)} Pts</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block text-[9px] uppercase font-black px-2.5 py-1 rounded border tracking-wider ${
                              lead.status === 'Interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              lead.status === 'Callback' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              lead.status === 'Left Voicemail' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              lead.status === 'Not Interested' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                              lead.status === 'New' ? 'bg-indigo-50/50 text-indigo-700 border-indigo-150' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => initiateCallDispatch(lead)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 active:bg-emerald-750 text-white font-bold text-xs rounded-xl shadow-xs transition-all tracking-wider uppercase group-hover:scale-[1.03] cursor-pointer ${
                                isDnc ? 'bg-rose-600 hover:bg-rose-504 active:bg-rose-800' : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{isDnc ? 'Compliance Override' : 'Dial'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        No leads found matching your search term. Click "Add Lead" to expand your roster!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Card layout (visible on mobile, hidden on desktop md+) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isDnc = lead.isDncListed || universalBlacklist.includes(lead.phone);
                return (
                  <div key={lead.id} className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{lead.name}</h4>
                        <p className="text-slate-500 text-xs mt-0.5 font-bold">
                          {lead.company || 'Private Corporation'} • {lead.jobTitle}
                        </p>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded border ${
                        lead.status === 'Interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        lead.status === 'Callback' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-550 border-slate-200'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {lead.phone}
                      </span>
                      
                      <button
                        onClick={() => initiateCallDispatch(lead)}
                        className={`py-2 p-4 text-white font-bold text-xs rounded-xl tracking-wider uppercase flex items-center gap-2 shadow-xs cursor-pointer ${
                          isDnc ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                      >
                        <Phone className="w-4 h-4 text-emerald-100" />
                        <span>{isDnc ? 'Bypass DNC' : 'Dial Line'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE BLACKLIST MANAGEMENT PANEL TAB */}
      {activeTab === 'blacklist' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-indigo-500 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Universal Account Compliance
            </span>
            <h3 className="font-sans font-black text-lg text-slate-905 uppercase tracking-wide mt-1">
              Restrictive Databases & Blacklist Scrubbing
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Maintain shielding numbers in your Universal Account Blacklist. All outbound dialing sessions will scrub connections against these phone records to protect you from regulatory compliancy penalties.
            </p>
          </div>

          <form onSubmit={handleAddBlacklist} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap gap-3 items-end md:max-w-2xl">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Register Restricted Outbound Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +15551982736"
                value={newBlacklistInput}
                onChange={(e) => setNewBlacklistInput(e.target.value)}
                className="w-full bg-white px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-hidden text-slate-900 focus:border-indigo-600"
                required
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
            >
              Add to Blacklist
            </button>
          </form>

          <div className="border border-slate-150 rounded-xl overflow-hidden md:max-w-xl">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              Universal Blacklist Shield Records ({universalBlacklist.length})
            </div>
            <div className="divide-y divide-slate-150">
              {universalBlacklist.map((phone, idx) => (
                <div key={idx} className="px-4 py-3 flex justify-between items-center bg-white text-xs font-mono font-bold text-slate-800">
                  <span>{phone}</span>
                  <button
                    onClick={() => handleRemoveBlacklist(phone)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="Remove restrict"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {universalBlacklist.length === 0 && (
                <div className="p-6 text-center text-slate-400 italic font-medium bg-white">
                  No listings registered. Your compliance blacklist database is empty.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MULTILINE PARALLEL DIALERS ANIMATION WINDOW */}
      {isParallelDialing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-[scaleIn_0.2s_ease-out]">
            <div className="text-center">
              <span className="flex h-3 w-3 relative mx-auto mb-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h4 className="font-sans font-black text-sm uppercase tracking-widest text-emerald-400">
                Multiline Parallel Dialer
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Simultaneous Trunk-Line Dialing Active</p>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              {parallelLines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 border-b border-slate-900/40 last:border-0 text-xs">
                  <div className="text-left">
                    <p className="font-bold text-white">{line.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">{line.phone}</p>
                  </div>
                  <div>
                    {line.status === 'ringing' && (
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/50 border border-indigo-900/40 px-2 py-0.5 rounded animate-pulse">
                        Ringing Line...
                      </span>
                    )}
                    {line.status === 'answered' && (
                      <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500 animate-bounce" /> ANSWERED
                      </span>
                    )}
                    {line.status === 'no-answer' && (
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 px-2 py-0.5 rounded">
                        Line Disconnect
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
              *The parallel dialer triggers 3 numbers simultaneously. Once the first prospect replies back, additional lines are hung up immediately and consolidated.
            </p>
          </div>
        </div>
      )}

      {/* COMPLIANCE WARNING/BLOCK ADVISORY INTERCEPT MODAL */}
      {complianceViolationLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="flex gap-3 items-start">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="text-left">
                <span className="text-[9px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded tracking-widest uppercase block w-max">
                  Compliance Shield Safeguard
                </span>
                <h4 className="font-sans font-black text-base text-slate-950 mt-1.5 uppercase tracking-tight">
                  Federal DNC / Blacklist Shield
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  The client number <strong className="font-mono text-indigo-700 font-black">{complianceViolationLead.phone}</strong> (assigned to {complianceViolationLead.name}) is present in either regional restrictive registries or your Universal Account Blacklist database. Calling without corporate approval carries penalties.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3">
              <button
                type="button"
                onClick={() => setComplianceViolationLead(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Cancel Call Dialing
              </button>
              <button
                type="button"
                onClick={() => {
                  setBypassApprovedLead(complianceViolationLead);
                  const targeted = complianceViolationLead;
                  setComplianceViolationLead(null);
                  setTimeout(() => initiateCallDispatch(targeted), 200);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Override</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE OUTBOUND ACTIVE TELEPHONY DIALING CONSOLE & WORKSPACE */}
      {activeDialingLead && activeScript && (
        <div id="fast-post-call-logger-drawer" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-150 overflow-hidden max-h-[95vh] flex flex-col animate-[slideUp_0.25s_ease-out]">
            
            {/* Call Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div className="text-left">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none block">
                    Telemetry Call Line Synchronized
                  </span>
                  <p className="text-xs text-slate-300 font-semibold mt-1">
                    Matched Presence ID: <strong className="font-mono text-white text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{localPresenceNumber}</strong> (Matched Local Area Code-Outbound ID)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 text-xs font-mono font-bold text-slate-100">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Talk time: {formatSeconds(duration)}</span>
                </div>
                <button
                  onClick={() => {
                    setActiveDialingLead(null);
                    setBypassApprovedLead(null);
                  }}
                  className="p-1 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split layout: Interactive Dynamic Pitch Scripts (Left) vs One-Click Wrap controls (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-y-auto flex-1 p-6 gap-6 max-h-[75vh]">
              
              {/* Dynamic script column */}
              <div className="lg:col-span-7 space-y-4 text-left overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Interactive Call Pitch Script
                    </h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                      Dynamic Script tailored to Industry: <span className="text-indigo-650 underline">{activeDialingLead.industry}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200">
                    <span>Checks:</span>
                    <span className="text-indigo-650 font-black">{scriptProgressPercent}% compliance</span>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  
                  {/* Step 1: Greeting */}
                  <div className="flex gap-3 items-start">
                    <input 
                      type="checkbox" 
                      id="check-g"
                      checked={scriptChecks.greeting}
                      onChange={(e) => setScriptChecks({ ...scriptChecks, greeting: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
                        1. Verification Introduction
                      </span>
                      <p className="text-xs text-slate-800 font-medium italic select-all leading-relaxed">
                        "{activeScript.greeting}"
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Value proposition */}
                  <div className="flex gap-3 items-start">
                    <input 
                      type="checkbox" 
                      id="check-p"
                      checked={scriptChecks.painPoint}
                      onChange={(e) => setScriptChecks({ ...scriptChecks, painPoint: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block leading-none mb-1">
                        2. Value Proposition & Core Pain point Pitch
                      </span>
                      <p className="text-xs text-slate-850 font-semibold leading-relaxed">
                        {activeScript.pitch}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Objections */}
                  <div className="flex gap-3 items-start">
                    <input 
                      type="checkbox" 
                      id="check-v"
                      checked={scriptChecks.syncValue}
                      onChange={(e) => setScriptChecks({ ...scriptChecks, syncValue: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest block leading-none mb-1">
                        3. Objection Handling
                      </span>
                      <p className="text-xs text-slate-700 font-medium">
                        {activeScript.objections}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Booking Close */}
                  <div className="flex gap-3 items-start">
                    <input 
                      type="checkbox" 
                      id="check-c"
                      checked={scriptChecks.closeConfirm}
                      onChange={(e) => setScriptChecks({ ...scriptChecks, closeConfirm: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block leading-none mb-1">
                        4. Trial / Meeting Confirm Closer
                      </span>
                      <p className="text-xs text-slate-750 font-bold leading-relaxed">
                        {activeScript.close}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Micro info */}
                <div className="p-3 bg-amber-50 border border-amber-100 text-slate-700 text-[11px] leading-relaxed rounded-xl font-medium">
                  <strong>Manager Script Compliance Note:</strong> Checking dialogue boxes registers compliance metrics. SprintDial tracks checkmark timelines as part of live performance ranking.
                </div>
              </div>

              {/* One click logger and follow up column */}
              <div className="lg:col-span-5 space-y-4 text-left pl-3 shrink-0">
                
                <div>
                  <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Prospect Details (Roster Record)
                  </h5>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start">
                    <div>
                      <p className="text-base font-black text-slate-900 leading-tight">{activeDialingLead.name}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{activeDialingLead.company || 'Private Corp'} • {activeDialingLead.jobTitle}</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-705 font-black uppercase px-2 py-1 rounded">
                      Rating: {(activeDialingLead.priorityScore || 80)} pts
                    </span>
                  </div>
                </div>

                {/* ONE CLICK ACTION LIST DISPOSITIONS AND TRUNKS */}
                <div>
                  <h5 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest block leading-none mb-2">
                    One-click dispositions logger
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDisposeCall('Interested')}
                      className="p-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-black transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
                    >
                      <span className="text-lg">📞</span>
                      <span>INTERESTED</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDisposeCall('Callback')}
                      className="p-3 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl font-black transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
                    >
                      <span className="text-lg">📅</span>
                      <span>CALLBACK / RECALL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDisposeCall('Gatekeeper')}
                      className="p-3 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-xl font-black transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
                    >
                      <span className="text-lg">🏢</span>
                      <span>GATEKEEPER DIAL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDisposeCall('Busy')}
                      className="p-3 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-xl font-black transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
                    >
                      <span className="text-lg">🚫</span>
                      <span>BUSY SIGN/HANG UP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDisposeCall('Not Interested')}
                      className="p-3 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 rounded-xl font-black transition-all flex flex-col items-center justify-center text-center gap-1 col-span-2 cursor-pointer"
                    >
                      <span className="text-lg">❌</span>
                      <span>EXPRESSED NOT INTERESTED</span>
                    </button>
                  </div>
                </div>

                {/* VOICEMAIL DROP MODULE */}
                <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-150 space-y-3">
                  <div>
                    <h5 className="text-xs font-extrabold text-purple-900 uppercase flex items-center gap-1.5 leading-none">
                      <Volume2 className="w-4 h-4 text-purple-600 shrink-0" />
                      Voicemail drop system
                    </h5>
                    <p className="text-[10px] text-purple-700 font-semibold mt-0.5">Pre-recorded audio loop drops onto line instantly</p>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={selectedVmTemplate}
                      onChange={(e) => setSelectedVmTemplate(e.target.value)}
                      className="flex-1 bg-white px-2.5 py-2 text-xs border border-purple-200 text-purple-900 font-bold focus:outline-hidden rounded-lg"
                    >
                      <option value="sales_intro">Voicemail Template A: Clean Introductory Pitch (12s)</option>
                      <option value="follow_closer">Voicemail Template B: Follow-up Account Incentive Offer (18s)</option>
                      <option value="compliance_scrub">Voicemail Template C: Meeting Confirmation Callback (10s)</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleTriggerVmDrop}
                      disabled={isDroppingVm}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black uppercase transition-colors shrink-0 flex items-center gap-1 shadow-xs cursor-pointer disabled:bg-slate-300"
                    >
                      {isDroppingVm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Drop VM</span>
                    </button>
                  </div>
                </div>

                {/* LOGS NOTES COMMENTS AND CALENDAR OUTSIDE ACTION BAR */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-650 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                      Add custom remarks (Before clicking Wrap Outcomes)
                    </label>
                    <textarea
                      placeholder="Add conversation notes here... (Optional, clicking outcomes automatically logs smart pitch templates)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/50 min-h-[50px] font-semibold text-slate-800"
                    />
                  </div>

                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 flex flex-row items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-amber-800 uppercase leading-none">
                        Callback Scheduler Calendar
                      </label>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 block">Used for callbacks outcome only</span>
                    </div>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="bg-white px-2 py-1 text-xs rounded border border-amber-250 text-slate-800 font-bold focus:outline-hidden"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* NEW PROSPECT ADD MODAL (EXPANDED TO ACCEPT CUSTOM INTEGRATIONS METADATA) */}
      {showAddModal && (
        <div id="add-lead-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-[scaleIn_0.2s_ease-out] max-h-[90vh]">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <span className="font-sans font-black text-sm tracking-wide uppercase text-indigo-400">Register Outbound Corporate Lead</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-805 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewLead} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Lead Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Jackson"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-indigo-600 font-semibold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Outbound Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +15551234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-indigo-600 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 font-sans">Corporate Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Stark Industries"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Industry Segment</label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:outline-hidden text-slate-800"
                  >
                    <option value="Information Technology">Information Technology / SaaS</option>
                    <option value="Logistics">Transportation & Logistics</option>
                    <option value="Renewable Energy">Renewable Energy & Solar Grid</option>
                    <option value="Real Estate">Property & Real Estate</option>
                    <option value="Finance">Capital Partners & Finance</option>
                    <option value="Construction">Construction / Renovation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-705 uppercase mb-1.5">Representative Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. VP Operations"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-indigo-600 font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-705 uppercase mb-1.5">Client Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-indigo-600 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 uppercase mb-1.5">LinkedIn Profile Link</label>
                <input
                  type="text"
                  placeholder="e.g. linkedin.com/in/prospectname"
                  value={newLinkedin}
                  onChange={(e) => setNewLinkedin(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:border-indigo-600 font-semibold"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-750 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs uppercase tracking-wider"
                >
                  Confirm Lead Outbound
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING OMNICHANNEL SEQUENCE EXECUTION TRACER SCREEN */}
      {activeOmnichannelSequence && (
        <OmnichannelSequenceVisualizer 
          lead={activeOmnichannelSequence.lead}
          outcome={activeOmnichannelSequence.outcome}
          onClose={() => setActiveOmnichannelSequence(null)}
        />
      )}

    </div>
  );
}

function formatSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

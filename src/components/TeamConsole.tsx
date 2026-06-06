import React, { useState, useEffect } from 'react';
import { Caller, CallLog } from '../types';
import { Users, ShieldAlert, Wifi, Terminal, RefreshCw, Zap } from 'lucide-react';
import LiveCallMonitoring from './LiveCallMonitoring';

interface TeamConsoleProps {
  callers: Caller[];
  selectedCaller: Caller;
  onSelectCaller: (caller: Caller) => void;
  logs: CallLog[];
  onAddSimulatedLog: (log: CallLog) => void;
}

export default function TeamConsole({
  callers,
  selectedCaller,
  onSelectCaller,
  logs,
  onAddSimulatedLog,
}: TeamConsoleProps) {
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  
  // Sort logs by newest first
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Background activity simulator - simulating other team members making calls in real-time
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      // Pick a random background caller (not the active one)
      const otherCallers = callers.filter(c => c.id !== selectedCaller.id);
      if (otherCallers.length === 0) return;
      const caller = otherCallers[Math.floor(Math.random() * otherCallers.length)];

      const firstNames = ['Liam', 'Sophia', 'James', 'Mia', 'Robert', 'Eva', 'Leo', 'Clara'];
      const lastNames = ['Smith', 'O-Connor', 'Lee', 'Vance', 'Miller', 'Reid', 'Nakamura'];
      const randomLeadName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const randomPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      
      const outcomes: ('Interested' | 'Not Interested' | 'Callback' | 'No Answer')[] = [
        'Interested', 'Not Interested', 'Callback', 'No Answer', 'No Answer', 'Not Interested'
      ];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      const notesMap = {
        'Interested': 'Decision-maker wants info sheet immediately. High priority.',
        'Not Interested': 'Not looking for solar solutions currently. Do not recall.',
        'Callback': 'Spoke briefly. Requested recall next Monday morning.',
        'No Answer': 'Voicemail or busy line.',
      };

      const newSimulatedLog: CallLog = {
        id: `log-sim-${Date.now()}`,
        leadId: `lead-sim-${Date.now()}`,
        leadName: randomLeadName,
        phone: randomPhone,
        callerId: caller.id,
        callerName: caller.name,
        timestamp: new Date().toISOString(),
        outcome,
        notes: notesMap[outcome],
        duration: outcome === 'No Answer' ? 0 : 15 + Math.floor(Math.random() * 120),
        recordingLink: outcome === 'Interested' ? 'https://storage.googleapis.com/recordings/sim_record.mp3' : undefined,
        webhookStatus: 'success',
      };

      onAddSimulatedLog(newSimulatedLog);
    }, 25000); // Trigger a simulated background call log every 25 seconds

    return () => clearInterval(interval);
  }, [simulationActive, callers, selectedCaller, onAddSimulatedLog]);

  const getOutcomeStyle = (outcome: string) => {
    switch (outcome) {
      case 'Interested':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Callback':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Not Interested':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCallerColorClass = (color: string) => {
    switch (color) {
      case 'orange': return 'bg-orange-500 text-white';
      case 'indigo': return 'bg-indigo-500 text-white';
      case 'emerald': return 'bg-emerald-500 text-white';
      case 'rose': return 'bg-rose-500 text-white';
      case 'cyan': return 'bg-cyan-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const forceSimulateCall = () => {
    const otherCallers = callers.filter(c => c.id !== selectedCaller.id);
    const caller = otherCallers.length > 0 
      ? otherCallers[Math.floor(Math.random() * otherCallers.length)]
      : selectedCaller;

    const companies = ['Hassan Energy', 'Krypton Devs', 'Sector 7 Logistics', 'Orbit Cybertech'];
    const fakeCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newSimulatedLog: CallLog = {
      id: `log-sim-manual-${Date.now()}`,
      leadId: `lead-sim-manual-${Date.now()}`,
      leadName: `${fakeCompany} Operator`,
      phone: randomPhone,
      callerId: caller.id,
      callerName: caller.name,
      timestamp: new Date().toISOString(),
      outcome: Math.random() > 0.4 ? 'Callback' : 'Interested',
      notes: 'Forced simulated background action. Standard webhook payload generated.',
      duration: 35 + Math.floor(Math.random() * 90),
      recordingLink: 'https://storage.googleapis.com/recordings/sim_manual.mp3',
      webhookStatus: 'success',
    };
    onAddSimulatedLog(newSimulatedLog);
  };

  return (
    <div className="space-y-6">
      {/* Caller Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div id="team-selector-header" className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wide">Switch active account</h3>
            <p className="text-xs text-slate-500">Pick a team member to access their dialer dashboard</p>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full text-emerald-700 text-xs font-semibold animate-pulse">
            <Wifi className="w-3.5 h-3.5" />
            <span>SIM Dialers Active</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {callers.map(caller => {
            const isSelected = caller.id === selectedCaller.id;
            // Get today's call count for this caller
            const todayStr = new Date().toISOString().split('T')[0];
            const callerTodayCalls = logs.filter(
              l => l.callerId === caller.id && new Date(l.timestamp).toISOString().split('T')[0] === todayStr
            ).length;

            return (
              <button
                key={caller.id}
                id={`caller-btn-${caller.id}`}
                onClick={() => onSelectCaller(caller)}
                className={`flex flex-col items-center p-4 rounded-xl border transition-all text-center relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/75 ring-3 ring-indigo-600/15'
                    : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Active Dot */}
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                )}
                
                <span className="text-3xl filter drop-shadow-xs">{caller.avatar}</span>
                <span className="text-xs font-bold text-slate-950 mt-2 block truncate w-full">{caller.name}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                  {caller.role}
                </span>

                {/* Micro visual progress metrics */}
                <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      caller.id === 'caller-1' ? 'bg-orange-500' :
                      caller.id === 'caller-2' ? 'bg-indigo-500' :
                      caller.id === 'caller-3' ? 'bg-emerald-500' :
                      caller.id === 'caller-4' ? 'bg-rose-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, (callerTodayCalls / caller.dailyGoal) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-605 mt-1.5">
                  {callerTodayCalls} / {caller.dailyGoal} Dials
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Switch */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-start md:items-center">
          <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Terminal className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-sm tracking-widest uppercase text-white flex items-center gap-1.5">
              Live Team Simulation Feed
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${simulationActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-lg leading-relaxed">
              Simulates calls from other team members. This generates local telemetry and triggers your active Webhook URL to show n8n, Make, or Zapier running in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulationActive(!simulationActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              simulationActive 
                ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40 hover:bg-amber-600/40' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {simulationActive ? 'Pause Sim Feed' : 'Activate Sim Feed'}
          </button>
          
          <button
            onClick={forceSimulateCall}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-705 flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Force Instant Log</span>
          </button>
        </div>
      </div>

      {/* 🎧 LIVE CALL MONITORING & COACHING DASHBOARD */}
      <LiveCallMonitoring callers={callers} selectedCaller={selectedCaller} />

      {/* Team Activity Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wide">Recent Call Logs Feed</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time synced activity stream across all mobile SIM callers</p>
        </div>

        <div className="mt-4 space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {sortedLogs.length > 0 ? (
            sortedLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

              const targetCaller = callers.find(c => c.id === log.callerId);
              const callerColor = targetCaller ? targetCaller.color : 'indigo';

              return (
                <div
                  key={log.id}
                  id={`log-item-${log.id}`}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-linear-to-r from-slate-50/20 to-white hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-start gap-4"
                >
                  <div className="flex gap-3 items-start">
                    {/* Caller Initial badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${getCallerColorClass(callerColor)}`}>
                      {log.callerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 flex-row">
                        <span className="font-bold text-slate-900 text-sm">{log.leadName}</span>
                        <span className="text-xs text-slate-400 font-medium">({log.phone})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getOutcomeStyle(log.outcome)}`}>
                          {log.outcome}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed font-semibold">
                        {log.notes || 'No notes taken during dial.'}
                      </p>
                      
                      {/* Sub row metrics */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Caller: {log.callerName}</span>
                        {log.duration > 0 && (
                          <span>Duration: {log.duration}s</span>
                        )}
                        {log.followUpDate && (
                          <span className="text-amber-600">
                            Followup: {new Date(log.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                        {log.recordingLink && (
                          <a 
                            href={log.recordingLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 underline lowercase font-normal"
                          >
                            Audio clip
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0">
                    <span className="text-xs font-bold text-slate-900">{formattedTime}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
                    
                    {log.webhookStatus === 'success' ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-bold mt-1.5 border border-emerald-200/50">
                        Sheets HTTP Synced
                      </span>
                    ) : log.webhookStatus === 'failed' ? (
                      <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm font-bold mt-1.5 border border-rose-200/50">
                        Webhook Error
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-sm font-bold mt-1.5 border border-slate-200/50">
                        Queued Client-Side
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm font-medium">No activity logs recorded. Switch to the Leads list to log dialers!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

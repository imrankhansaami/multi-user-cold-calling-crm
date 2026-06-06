import React, { useState, useEffect } from 'react';
import { Caller, CallLog } from '../types';
import { 
  Users, Volume2, Mic, Zap, MessageSquare, ShieldCheck, Play, Pause, 
  Sparkles, CheckCircle, Info, HeartPulse, Send 
} from 'lucide-react';

interface LiveCallMonitoringProps {
  callers: Caller[];
  selectedCaller: Caller;
}

interface MonitorSession {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  prospectName: string;
  prospectCompany: string;
  phone: string;
  duration: number; // in seconds
  status: 'Ringing' | 'Active' | 'Wrapping Up';
  topic: string;
}

export default function LiveCallMonitoring({ callers }: LiveCallMonitoringProps) {
  // Generate mock active callers
  const [activeSessions, setActiveSessions] = useState<MonitorSession[]>([]);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [monitoredCallerId, setMonitoredCallerId] = useState<string | null>(null);
  const [monitorMode, setMonitorMode] = useState<'listen' | 'whisper' | 'barge' | null>(null);
  const [whisperMessage, setWhisperMessage] = useState<string>('');
  const [whisperLogs, setWhisperLogs] = useState<string[]>([]);
  const [bargeAction, setBargeAction] = useState<string>('');
  
  // Seed initial active sessions
  useEffect(() => {
    const defaultSessions: MonitorSession[] = [
      {
        callerId: 'caller-1',
        callerName: 'Sarah Connor',
        callerAvatar: '👩‍💼',
        prospectName: 'James Carter',
        prospectCompany: 'Prime Capital Partners',
        phone: '+15558192039',
        duration: 82,
        status: 'Active',
        topic: 'Price objections handler'
      },
      {
        callerId: 'caller-2',
        callerName: 'Marcus Wright',
        callerAvatar: '👨‍💻',
        prospectName: 'Alex Thompson',
        prospectCompany: 'Nexus Logistics',
        phone: '+15550192834',
        duration: 124,
        status: 'Active',
        topic: 'SIM capacity expansion discussion'
      },
      {
        callerId: 'caller-4',
        callerName: 'Kyle Reese',
        callerAvatar: '🏃',
        prospectName: 'Diana Prince',
        prospectCompany: 'Themiscyra Antiquities',
        phone: '+15559483710',
        duration: 12,
        status: 'Ringing',
        topic: 'Cold introduction'
      }
    ];
    setActiveSessions(defaultSessions);

    // Keep active call duration ticking in background
    const interval = setInterval(() => {
      setActiveSessions(prev => 
        prev.map(session => {
          if (session.status === 'Active') {
            return { ...session, duration: session.duration + 1 };
          }
          return session;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartMonitor = (callerId: string, mode: 'listen' | 'whisper' | 'barge') => {
    setIsMonitoring(true);
    setMonitoredCallerId(callerId);
    setMonitorMode(mode);
    setWhisperLogs([]);
    setWhisperMessage('');
    setBargeAction('');
  };

  const handleStopMonitor = () => {
    setIsMonitoring(false);
    setMonitoredCallerId(null);
    setMonitorMode(null);
  };

  const handleSendWhisper = (msg?: string) => {
    const text = msg || whisperMessage;
    if (!text.trim()) return;
    
    setWhisperLogs(prev => [...prev, `Manager: "${text}"`]);
    setWhisperMessage('');
    
    // Simulate caller feedback
    setTimeout(() => {
      const activeSes = activeSessions.find(s => s.callerId === monitoredCallerId);
      const callerName = activeSes ? activeSes.callerName : 'Caller';
      const feedbacks = [
        "Headset pulsed. Received custom instruction. Activating objection pitch.",
        "Got it, boss. Mentioning the localized auto-syncing feature now.",
        "Understood. Asking them to review the pricing sheet on line 2.",
        "Adjusting tone. Tucking that in seamlessly."
      ];
      const randomFeed = feedbacks[Math.floor(Math.random() * feedbacks.length)];
      setWhisperLogs(prev => [...prev, `${callerName}: *[Acknowledged]* "${randomFeed}"`]);
    }, 1500);
  };

  const handleBargeAction = (action: string) => {
    setBargeAction(action);
    const session = activeSessions.find(s => s.callerId === monitoredCallerId);
    if (!session) return;
    
    const responses: Record<string, string> = {
      'pitch_trial': `Manager barged call: "Hi ${session.prospectName}, this is the Sales Operations Director. I noticed we're discussing trial limits. I will authorized an immediate standard 14-day zero-limit SIM trial for you right now."`,
      'address_compliance': `Manager barged call: "Hello ${session.prospectName}, this is compliance oversight. We want to confirm our secure recording and encryption standard for your corporate security roster."`,
      'book_meeting': `Manager barged call: "Hi ${session.prospectName}, jumping in with my representative. It looks like a great fit, I'd like to book an executive briefing for next week."`
    };
    
    setWhisperLogs(prev => [...prev, responses[action] || 'Manager took over transmitting audio']);
  };

  const activeMonitoredSession = activeSessions.find(s => s.callerId === monitoredCallerId);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-indigo-600 animate-[pulse_1.5s_infinite]" />
          <h3 className="font-sans font-black text-base text-slate-900 uppercase tracking-wide">
            Manager Live call Monitoring (Coach Console)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Oversight, listen-in, whisper coaching and full barge takeover for active client sessions
        </p>
      </div>

      {!isMonitoring ? (
        <div className="space-y-3">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            Active Representative Outbound Streams
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeSessions.map((session) => (
              <div 
                key={session.callerId}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{session.callerAvatar}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{session.callerName}</h4>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                          On call ({formatSeconds(session.duration)})
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider ${
                      session.status === 'Active' 
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                        : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  <div className="mt-3.5 p-2 bg-white border border-slate-150 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-405 leading-none">Prospect</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{session.prospectName}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{session.prospectCompany} • {session.phone}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic font-semibold">
                    Topic: {session.topic}
                  </p>
                </div>

                {/* Micro monitor controls */}
                <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => handleStartMonitor(session.callerId, 'listen')}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] uppercase transition-colors"
                  >
                    Listen
                  </button>
                  <button
                    onClick={() => handleStartMonitor(session.callerId, 'whisper')}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-[10px] uppercase transition-colors"
                  >
                    Whisper
                  </button>
                  <button
                    onClick={() => handleStartMonitor(session.callerId, 'barge')}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] uppercase transition-colors"
                  >
                    Barge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-900 animate-[fadeIn_0.22s_ease-out] relative overflow-hidden">
          {/* Active Audio Visualizer Background Glow */}
          <div className="absolute inset-0 bg-radial-at-t from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex fluid justify-between items-center border-b border-slate-900 pb-4 relative z-10 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">{activeMonitoredSession?.callerAvatar}</span>
              <div>
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-widest block leading-none">
                  Currently Monitoring Rep Streams
                </span>
                <h4 className="text-sm font-black text-white mt-1">
                  {activeMonitoredSession?.callerName} ➔ {activeMonitoredSession?.prospectName} ({activeMonitoredSession?.prospectCompany})
                </h4>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setMonitorMode('listen')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  monitorMode === 'listen' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Listen-in
              </button>
              <button 
                onClick={() => setMonitorMode('whisper')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  monitorMode === 'whisper' ? 'bg-amber-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Whisper Coach
              </button>
              <button 
                onClick={() => setMonitorMode('barge')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  monitorMode === 'barge' ? 'bg-rose-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Barge Takeover
              </button>
              <button 
                onClick={handleStopMonitor}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-[10px] font-bold uppercase"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Interactive monitoring modes screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            {/* Monitor Audio Waveform and Diagnostics */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Outbound Voice Decibel Stream</span>
                  {monitorMode === 'listen' && <span className="text-indigo-400 shrink-0">SILENT MONITOR ACTIVE</span>}
                  {monitorMode === 'whisper' && <span className="text-amber-400 shrink-0">WHISPER COACHING LINK ONLINE</span>}
                  {monitorMode === 'barge' && <span className="text-rose-400 shrink-0">BARGE ACTIVE (AGENT MUTED)</span>}
                </div>

                {/* Animated Pulsing Waveform Display */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center justify-center gap-1.5 h-32 overflow-hidden relative">
                  <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500">
                    DIALER-PORT: 3000 • DECODED CODY REC
                  </div>
                  
                  {/* Waveform Bars */}
                  {[1,2,3,4,3,2,1,2,3,4,5,4,3,2,3,4,3,2,1,2,3].map((height, i) => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full transition-all duration-150 ${
                        monitorMode === 'barge' 
                          ? 'bg-rose-500 animate-[pulse_0.4s_infinite]' 
                          : monitorMode === 'whisper' 
                          ? 'bg-amber-500 animate-[pulse_0.6s_infinite]' 
                          : 'bg-indigo-500 animate-[pulse_0.8s_infinite]'
                      }`}
                      style={{ 
                        height: `${height * (monitorMode === 'listen' ? 8 : monitorMode === 'whisper' ? 12 : 16)}px`,
                        animationDelay: `${i * 30}ms`
                      }} 
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-[11px] text-slate-400 leading-snug">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {monitorMode === 'listen' && "Listening silently. Outbound mic is deactivated. The client and representative cannot hear your operations."}
                  {monitorMode === 'whisper' && "Whisper link has been established. You can talk privately directly into Sarah Connor's ear. Prospect hears nothing."}
                  {monitorMode === 'barge' && "Barge Takeover completed. Representative Sarah Connor is muted, while your manager audio transmitter lines are fully patched."}
                </span>
              </div>
            </div>

            {/* Manager Coach interactions Panel */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex flex-col justify-between">
              {monitorMode === 'listen' && (
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Passive stream telemetries</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      This representative is conducting standard dialogue. There are no critical compliance triggers. Connection secure.
                    </p>
                    
                    <div className="mt-4 space-y-2.5 text-[11px] font-bold text-indigo-300">
                      <div className="flex justify-between p-2 bg-slate-950/40 rounded border border-slate-900">
                        <span>OBJECTION REGISTERED:</span>
                        <span className="text-white uppercase">Objection on Cost</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-950/40 rounded border border-slate-900">
                        <span>SIM SPEED PACKET:</span>
                        <span className="text-emerald-400">EXCELLENT (94 ms)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setMonitorMode('whisper')}
                    className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Switch to Active Whisper Coach</span>
                  </button>
                </div>
              )}

              {monitorMode === 'whisper' && (
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Headset Whisper Link (One-Way Vocals)</h5>
                    <div className="h-28 overflow-y-auto border border-slate-900 p-2 rounded-lg text-[11px] font-mono text-emerald-400 space-y-1 scrollbar-thin my-2">
                      {whisperLogs.length > 0 ? (
                        whisperLogs.map((log, idx) => <p key={idx} className="leading-snug">{log}</p>)
                      ) : (
                        <p className="text-slate-500 italic font-semibold">Send a direct advisory or click a quick suggestion to whisper directly...</p>
                      )}
                    </div>
                  </div>

                  {/* Preset quick coach advisor buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => handleSendWhisper("Pitch our 80% discounted roaming plan.")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded p-1.5 font-bold text-left truncate"
                    >
                      🗣️ Whisper: Roaming plan discount
                    </button>
                    <button 
                      onClick={() => handleSendWhisper("Acknowledge pain point and schedule follow-up.")}
                      className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded p-1.5 font-bold text-left truncate"
                    >
                      🗣️ Whisper: Ask for followup date
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom advisory to whisper..."
                      value={whisperMessage}
                      onChange={(e) => setWhisperMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendWhisper()}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleSendWhisper()}
                      className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg shrink-0 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {monitorMode === 'barge' && (
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-rose-400 uppercase tracking-widest block leading-none mb-1">
                      Barge Takeover Link Active
                    </h5>
                    <p className="text-[11px] text-slate-400 font-semibold mb-3">
                      Sarah Connor has been muted. Speak directly to Diana Prince using the operation panel below:
                    </p>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleBargeAction('pitch_trial')}
                        className={`w-full p-2.5 rounded-lg text-xs font-extrabold text-left transition-all ${
                          bargeAction === 'pitch_trial' ? 'bg-rose-900/30 text-rose-300 border border-rose-500' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        🚀 Push Authorized Enterprise Trial Account
                      </button>
                      <button
                        onClick={() => handleBargeAction('address_compliance')}
                        className={`w-full p-2.5 rounded-lg text-xs font-extrabold text-left transition-all ${
                          bargeAction === 'address_compliance' ? 'bg-rose-900/30 text-rose-300 border border-rose-500' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        🔒 Issue Compliance & Data Security Gdrive standard
                      </button>
                      <button
                        onClick={() => handleBargeAction('book_meeting')}
                        className={`w-full p-2.5 rounded-lg text-xs font-extrabold text-left transition-all ${
                          bargeAction === 'book_meeting' ? 'bg-rose-900/30 text-rose-300 border border-rose-500' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        📅 Book Direct Strategy Call with VP
                      </button>
                    </div>
                  </div>

                  {bargeAction && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 text-[10px] font-mono text-emerald-400 leading-normal">
                      <strong>Takeover Dispatch Log:</strong> Successfully broadcasted vocal packet over active trunk line! Response generated.
                    </div>
                  )}

                  <button
                    onClick={() => setMonitorMode('whisper')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase transition-colors"
                  >
                    Return to Whisper Mode (Hands-off)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Lead } from '../types';
import { Mail, MessageSquare, Linkedin, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface OmnichannelSequenceVisualizerProps {
  lead: Lead;
  outcome: string;
  onClose: () => void;
}

interface Step {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // simulated execution time in ms
}

export default function OmnichannelSequenceVisualizer({ lead, outcome, onClose }: OmnichannelSequenceVisualizerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Define steps based on call outcome
  const getStepsForOutcome = (status: string): Step[] => {
    const baseIconClass = "w-5 h-5";
    const sharedSteps: Step[] = [
      {
        id: 'call',
        name: 'Call Disposition Saved',
        description: `Logged outcome "${status}" to SprintDial Database`,
        icon: <CheckCircle2 className={`${baseIconClass} text-indigo-500`} />,
        duration: 800,
      }
    ];

    if (status === 'Interested') {
      return [
        ...sharedSteps,
        {
          id: 'email',
          name: 'Dispatched Personalized Pitch Email',
          description: `Sent proposal to ${lead.email || `${lead.name.toLowerCase().replace(' ', '.')}@company.com`} with customized SIM dialer pricing.`,
          icon: <Mail className={`${baseIconClass} text-emerald-500`} />,
          duration: 1500,
        },
        {
          id: 'sms',
          name: 'Sent SMS Follow-up Confirmation',
          description: `Dispatched text: "Great speaking with you, ${lead.name}! I've sent over the details."`,
          icon: <MessageSquare className={`${baseIconClass} text-purple-500`} />,
          duration: 1200,
        },
        {
          id: 'linkedin',
          name: 'LinkedIn Direct Message Drafted',
          description: `Prepared LinkedIn Connection & DM: "Hi ${lead.name}, let's connect regarding SprintDial..."`,
          icon: <Linkedin className={`${baseIconClass} text-blue-500`} />,
          duration: 1000,
        }
      ];
    } else if (status === 'Callback') {
      return [
        ...sharedSteps,
        {
          id: 'email',
          name: 'Calendar Invite & Confirmation Email',
          description: `Scheduled recall invitation for ${lead.followUpDate || 'the requested date'}.`,
          icon: <Mail className={`${baseIconClass} text-amber-500`} />,
          duration: 1400,
        },
        {
          id: 'sms',
          name: 'SMS Scheduler Notification Registered',
          description: `Set text reminder alert to trigger 30 minutes before callback.`,
          icon: <MessageSquare className={`${baseIconClass} text-blue-500`} />,
          duration: 1000,
        },
        {
          id: 'linkedin',
          name: 'LinkedIn Network Connection Sent',
          description: `Sent invitation to ${lead.name}'s professional profile.`,
          icon: <Linkedin className={`${baseIconClass} text-indigo-500`} />,
          duration: 1200,
        }
      ];
    } else {
      // Default / Not Interested
      return [
        ...sharedSteps,
        {
          id: 'email',
          name: 'Standard Thank You Email Dispatched',
          description: `Sent closing email: "Thank you for the conversation. Let us know if needs change."`,
          icon: <Mail className={`${baseIconClass} text-slate-500`} />,
          duration: 1200,
        },
        {
          id: 'crm',
          name: 'Nurture Database Re-routing',
          description: `Moved lead to low-frequency marketing list. Status preserved.`,
          icon: <CheckCircle2 className={`${baseIconClass} text-rose-500`} />,
          duration: 1000,
        }
      ];
    }
  };

  const steps = getStepsForOutcome(outcome);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const runSequence = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, steps[i].duration);
        });
        setCompletedSteps((prev) => [...prev, steps[i].id]);
      }
      // Finished all steps
      setCurrentStepIndex(steps.length);
    };

    runSequence();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const isCompleted = completedSteps.length === steps.length;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-5 overflow-hidden animate-[slideUp_0.3s_ease-out]">
      <div className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300" style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black tracking-widest uppercase block w-max mb-1">SprintDial Automation</span>
          <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-white">Omnichannel Sequence Active</h4>
          <p className="text-[10px] text-slate-400 font-medium">Automatic outreach for {lead.name}</p>
        </div>
        {!isCompleted ? (
          <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-900 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </span>
        ) : (
          <button 
            onClick={onClose}
            className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition-all"
          >
            Acknowledge
          </button>
        )}
      </div>

      <div className="space-y-3.5 my-4">
        {steps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          const isCurrent = currentStepIndex === idx;
          const isPending = idx > currentStepIndex;

          return (
            <div 
              key={step.id} 
              className={`flex items-start gap-3 transition-opacity duration-200 ${
                isPending ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {/* Left Connector Graphic */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  isDone 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : isCurrent 
                    ? 'bg-slate-800 border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/10' 
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : step.icon}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-[2px] h-6 my-1 ${
                    isDone ? 'bg-emerald-500/60' : 'bg-slate-800'
                  }`}></div>
                )}
              </div>

              {/* Step info description */}
              <div className="text-left py-0.5">
                <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-indigo-400' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                  {step.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug font-medium max-w-[280px]">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isCompleted && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center bg-slate-950/20 -mx-5 -mb-5 p-5">
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Outbound Sequences Executed
          </span>
          <button 
            onClick={onClose}
            className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-0.5 transition-colors"
          >
            <span>Close Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

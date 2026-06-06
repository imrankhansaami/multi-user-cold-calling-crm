import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { CallLog, Caller, CallOutcome } from '../types';
import { Phone, Users, CheckCircle, Clock } from 'lucide-react';

interface DashboardAnalyticsProps {
  logs: CallLog[];
  callers: Caller[];
  selectedCaller: Caller;
}

const OUTCOME_COLORS: Record<CallOutcome, string> = {
  'Interested': '#10B981', // green
  'Not Interested': '#64748B', // slate/gray
  'Callback': '#F59E0B', // amber
  'No Answer': '#3B82F6', // blue
  'Left Voicemail': '#8B5CF6', // purple
  'Gatekeeper': '#EC4899', // pink
  'Busy': '#EF4444', // red
};

export default function DashboardAnalytics({ logs, callers, selectedCaller }: DashboardAnalyticsProps) {
  // 1. Process outcomes for the selected user vs global team
  const today = new Date().toISOString().split('T')[0];
  
  const todayLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    return logDate === today;
  });

  const getAnalyticsForScope = (scope: 'individual' | 'team') => {
    const filteredLogs = scope === 'individual' 
      ? logs.filter(l => l.callerId === selectedCaller.id)
      : logs;

    const filteredTodayLogs = scope === 'individual'
      ? todayLogs.filter(l => l.callerId === selectedCaller.id)
      : todayLogs;

    // Call Outcomes distribution
    const outcomesCount: Record<CallOutcome, number> = {
      'Interested': 0,
      'Not Interested': 0,
      'Callback': 0,
      'No Answer': 0,
      'Left Voicemail': 0,
      'Gatekeeper': 0,
      'Busy': 0,
    };

    filteredLogs.forEach(l => {
      if (outcomesCount[l.outcome] !== undefined) {
        outcomesCount[l.outcome]++;
      }
    });

    const pieData = Object.entries(outcomesCount).map(([name, value]) => ({
      name,
      value,
    })).filter(item => item.value > 0);

    // Connected rate: Connected is anything that is NOT 'No Answer'
    const totalCalls = filteredLogs.length;
    const connectedCalls = filteredLogs.filter(l => l.outcome !== 'No Answer').length;
    const connectedRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;

    // Connected rate today specifically
    const totalCallsToday = filteredTodayLogs.length;
    const connectedCallsToday = filteredTodayLogs.filter(l => l.outcome !== 'No Answer').length;
    const connectedRateToday = totalCallsToday > 0 ? (connectedCallsToday / totalCallsToday) * 100 : 0;

    // Leads Qualified: Calls marked "Interested"
    const leadsQualified = filteredLogs.filter(l => l.outcome === 'Interested').length;
    const leadsQualifiedToday = filteredTodayLogs.filter(l => l.outcome === 'Interested').length;

    // Scheduled Follow-ups: Calls marked "Callback" with valid follow-up date
    const callbacks = filteredLogs.filter(l => l.outcome === 'Callback' && l.followUpDate).length;
    const callbacksToday = filteredTodayLogs.filter(l => l.outcome === 'Callback' && l.followUpDate).length;

    return {
      totalCalls,
      totalCallsToday,
      connectedRate,
      connectedRateToday,
      leadsQualified,
      leadsQualifiedToday,
      callbacks,
      callbacksToday,
      pieData,
    };
  };

  const indStats = getAnalyticsForScope('individual');
  const teamStats = getAnalyticsForScope('team');

  // Compute leaderboard: Call count today by caller
  const leaderboardData = callers.map(caller => {
    const callersTodayCalls = todayLogs.filter(l => l.callerId === caller.id).length;
    return {
      name: caller.name,
      calls: callersTodayCalls,
      percentage: Math.min(100, Math.floor((callersTodayCalls / caller.dailyGoal) * 100)),
      color: caller.color,
    };
  }).sort((a, b) => b.calls - a.calls);

  return (
    <div className="space-y-6">
      {/* Visual Metric Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div id="stat-ind-connected" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Connected Rate</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-950">{indStats.connectedRate.toFixed(1)}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Today: <span className="font-bold text-slate-700">{indStats.connectedRateToday.toFixed(0)}%</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div id="stat-team-connected" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Team Connected</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-950">{teamStats.connectedRate.toFixed(1)}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Today: <span className="font-bold text-slate-700">{teamStats.connectedRateToday.toFixed(0)}%</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div id="stat-leads-qualified" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Leads Qualified</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Phone className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-950">{indStats.leadsQualified}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Today: <span className="font-bold text-emerald-600">+{indStats.leadsQualifiedToday}</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div id="stat-followups" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Follow-ups</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-950">{indStats.callbacks}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Today: <span className="font-bold text-blue-600">+{indStats.callbacksToday}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Outcomes Pie / Donut Chart */}
        <div id="outcomes-distribution-chart" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wide">Call Outcomes Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Overall caller feedback distribution for {selectedCaller.name}</p>
          </div>
          <div className="h-64 w-full mt-4 flex items-center justify-center relative">
            {indStats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={indStats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {indStats.pieData.map((entry) => (
                       <Cell 
                         key={entry.name} 
                         fill={OUTCOME_COLORS[entry.name as CallOutcome] || '#CBD5E1'} 
                       />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10">
                <span className="text-slate-400 text-3xl block">📞</span>
                <p className="text-xs text-slate-500 mt-2 font-medium">No calls logged yet today. Click the "Leads" tab to start dialing!</p>
              </div>
            )}
            {indStats.pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total logged</span>
                <span className="text-3xl font-black text-slate-900">{indStats.totalCalls}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Leaderboard Volumetric Bar Chart */}
        <div id="volume-leaderboard-chart" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wide">Team Daily Volume</h3>
            <p className="text-xs text-slate-500 mt-0.5">Today's relative call contribution against caller sprint targets</p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leaderboardData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 700, fill: '#475569' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  formatter={(value) => [`${value} calls today`]}
                />
                <Bar dataKey="calls" radius={[0, 8, 8, 0]} barSize={20}>
                  {leaderboardData.map((entry, index) => {
                    const colorMap: Record<string, string> = {
                      orange: '#F59E0B',
                      indigo: '#6366F1',
                      emerald: '#10B981',
                      rose: '#F43F5E',
                      cyan: '#06B6D4',
                    };
                    return (
                      <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#3B82F6'} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

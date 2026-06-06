import React, { useState } from 'react';
import { CallLog, Caller } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Award, Calendar, Flame, Edit3, 
  Check, Percent, Zap, TrendingUp, Trophy
} from 'lucide-react';

interface GoalTrackerProps {
  logs: CallLog[];
  selectedCaller: Caller;
  onUpdateGoals: (daily: number, weekly: number, monthly: number, yearly: number) => void;
}

export default function GoalTracker({ logs, selectedCaller, onUpdateGoals }: GoalTrackerProps) {
  // Get default values or fallback
  const dGoal = selectedCaller.dailyGoal || 50;
  const wGoal = selectedCaller.weeklyGoal || 250;
  const mGoal = selectedCaller.monthlyGoal || 1000;
  const yGoal = selectedCaller.yearlyGoal || 12000;

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [tempDaily, setTempDaily] = useState(dGoal);
  const [tempWeekly, setTempWeekly] = useState(wGoal);
  const [tempMonthly, setTempMonthly] = useState(mGoal);
  const [tempYearly, setTempYearly] = useState(yGoal);

  // Time utilities based on Reference date (2026-06-06)
  const now = new Date('2026-06-06T02:31:36Z'); // reference date or fallback to new Date() if desired
  const todayStr = '2026-06-06';

  // State to filter reference date, let it default to now but allow full log count
  // Calculate periods
  const callerLogs = logs.filter(l => l.callerId === selectedCaller.id);

  // Count logs for current Day, Week, Month, Year
  const getLogsCount = (period: 'day' | 'week' | 'month' | 'year'): number => {
    const refYear = now.getFullYear();
    const refMonth = now.getMonth();
    const refDate = now.getDate();

    // Monday-Sunday calendar week calculation
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const distanceToMonday = (dayOfWeek + 6) % 7; 
    const monday = new Date(now);
    monday.setDate(refDate - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const SundayDate = new Date(monday);
    SundayDate.setDate(monday.getDate() + 7);

    return callerLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const logYear = logDate.getFullYear();
      const logMonth = logDate.getMonth();
      const logDay = logDate.getDate();

      if (period === 'day') {
        const dateStr = logDate.toISOString().split('T')[0];
        return dateStr === todayStr || (logYear === refYear && logMonth === refMonth && logDay === refDate);
      }
      if (period === 'week') {
        return logDate >= monday && logDate < SundayDate;
      }
      if (period === 'month') {
        return logYear === refYear && logMonth === refMonth;
      }
      if (period === 'year') {
        return logYear === refYear;
      }
      return false;
    }).length;
  };

  const dailyCount = getLogsCount('day');
  const weeklyCount = getLogsCount('week');
  const monthlyCount = getLogsCount('month');
  const yearlyCount = getLogsCount('year');

  // Compute percentages
  const dailyPercent = Math.min(100, Math.floor((dailyCount / dGoal) * 100));
  const weeklyPercent = Math.min(100, Math.floor((weeklyCount / wGoal) * 100));
  const monthlyPercent = Math.min(100, Math.floor((monthlyCount / mGoal) * 100));
  const yearlyPercent = Math.min(100, Math.floor((yearlyCount / yGoal) * 100));

  const handleSave = () => {
    onUpdateGoals(tempDaily, tempWeekly, tempMonthly, tempYearly);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempDaily(dGoal);
    setTempWeekly(wGoal);
    setTempMonthly(mGoal);
    setTempYearly(yGoal);
    setIsEditing(false);
  };

  const startEditing = () => {
    setTempDaily(dGoal);
    setTempWeekly(wGoal);
    setTempMonthly(mGoal);
    setTempYearly(yGoal);
    setIsEditing(true);
  };

  // Helper component for SVG Circle meter
  const ProgressRing = ({ percentage, colorClass }: { percentage: number; colorClass: string }) => {
    const radius = 34;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`${colorClass} transition-all duration-700 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xs font-black text-slate-850">
          {percentage}%
        </span>
      </div>
    );
  };

  return (
    <div id="goal-tracker-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      {/* Header section with toggle option */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg">
              <Trophy className="w-4 h-4" />
            </span>
            <h3 className="font-sans font-extrabold text-base text-slate-900 uppercase tracking-wide">
              Lead Target & Goal Centers
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track outbound KPI sprint targets for <span className="font-semibold text-slate-700">{selectedCaller.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {isEditing ? (
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modify Sprint Targets</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing-goals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-50 border border-dashed border-slate-250 p-4 rounded-xl mb-4 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {/* Daily Goal Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-500" /> Daily Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tempDaily}
                  onChange={(e) => setTempDaily(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-indigo-600 text-slate-900"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold uppercase">calls</span>
              </div>
            </div>

            {/* Weekly Goal Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" /> Weekly Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="2500"
                  value={tempWeekly}
                  onChange={(e) => setTempWeekly(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-indigo-600 text-slate-900"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold uppercase">calls</span>
              </div>
            </div>

            {/* Monthly Goal Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3 text-yellow-500" /> Monthly Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={tempMonthly}
                  onChange={(e) => setTempMonthly(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-indigo-600 text-slate-900"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold uppercase">calls</span>
              </div>
            </div>

            {/* Yearly Goal Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-indigo-500" /> Yearly Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={tempYearly}
                  onChange={(e) => setTempYearly(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-indigo-600 text-slate-900"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold uppercase">calls</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Grid of the 4 Goal Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Progress block */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/55 transition-colors gap-3">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#EF4444] bg-red-50 px-2 py-0.5 rounded-full inline-block">
              Daily Target
            </span>
            <div className="mt-1">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {dailyCount} <span className="text-xs text-slate-400 font-semibold uppercase">of {dGoal}</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                {dailyCount >= dGoal ? '✓ Target completed! 🔥' : `Need ${dGoal - dailyCount} more calls today`}
              </p>
            </div>
          </div>
          <ProgressRing percentage={dailyPercent} colorClass="text-red-500" />
        </div>

        {/* Weekly Progress block */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/55 transition-colors gap-3">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
              Weekly Target
            </span>
            <div className="mt-1">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {weeklyCount} <span className="text-xs text-slate-400 font-semibold uppercase">of {wGoal}</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                {weeklyCount >= wGoal ? '✓ Target completed! 🏆' : `Need ${wGoal - weeklyCount} more calls`}
              </p>
            </div>
          </div>
          <ProgressRing percentage={weeklyPercent} colorClass="text-indigo-600" />
        </div>

        {/* Monthly Progress block */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/55 transition-colors gap-3">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              Monthly Target
            </span>
            <div className="mt-1">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {monthlyCount} <span className="text-xs text-slate-400 font-semibold uppercase">of {mGoal}</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                {monthlyCount >= mGoal ? '✓ Target completed! 🎯' : `Need ${mGoal - monthlyCount} more calls`}
              </p>
            </div>
          </div>
          <ProgressRing percentage={monthlyPercent} colorClass="text-emerald-500" />
        </div>

        {/* Yearly Progress block */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/55 transition-colors gap-3">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
              Yearly Target
            </span>
            <div className="mt-1">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {yearlyCount} <span className="text-xs text-slate-400 font-semibold uppercase">of {yGoal}</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                {yearlyCount >= yGoal ? '✓ Target completed! 👑' : `Need ${yGoal - yearlyCount} more calls`}
              </p>
            </div>
          </div>
          <ProgressRing percentage={yearlyPercent} colorClass="text-amber-500" />
        </div>
      </div>

      {/* Interactive Insights Banner */}
      <div className="mt-4 bg-slate-50 border border-slate-100/80 rounded-xl p-3 flex sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 animate-[bounce_1.5s_infinite]" />
          <p className="text-xs text-slate-600 font-medium leading-normal">
            Pacing Index: <span className="font-bold text-slate-800">{selectedCaller.name}</span> currently has logged <span className="text-indigo-600 font-bold font-mono">{weeklyCount} calls</span> this calendar week. Keep dialing hot pipelines to accelerate yearly outbound KPIs!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">Reference Time: 2026-06-06 PST</span>
        </div>
      </div>
    </div>
  );
}

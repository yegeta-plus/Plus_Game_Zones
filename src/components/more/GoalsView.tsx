import React from 'react';
import { Target } from 'lucide-react';
import { Goal } from '../../types';
import { formatETB } from '../../lib/store';

export const GoalsView: React.FC<{ goals: Goal[] }> = ({ goals }) => {
  const sortedGoals = [...goals].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-[#22C55E]" />
          Savings Goals & Reserve Targets
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#8899BB]">Track business expansion funds & dividend pools</p>
      </div>

      <div className="space-y-3">
        {sortedGoals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          return (
            <div key={g.id} className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#8899BB] font-mono">{g.category}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{g.title}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-teal-600 dark:text-[#00D4AA]">{formatETB(g.currentAmount)}</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#8899BB]">of {formatETB(g.targetAmount)}</p>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-100 dark:bg-[#1C2333] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: g.color }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 dark:text-[#8899BB]">
                <span>Target Date: {g.targetDate}</span>
                <span className="font-bold text-slate-900 dark:text-white">{pct}% Funded</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

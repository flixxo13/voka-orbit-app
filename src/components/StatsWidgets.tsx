import { Zap, Target } from 'lucide-react';

export function StatsWidgets({ streak, completed, total }: { streak: number, completed: number, total: number }) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="flex gap-3 w-full max-w-md">
      {/* Streak Widget */}
      <div className="flex-1 bg-white dark:bg-[#1A1A35]/80 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-lg border border-white/10">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
          <Zap size={20} fill="currentColor" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-800 dark:text-white leading-none">
            {streak}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Days
          </div>
        </div>
      </div>

      {/* Session Widget */}
      <div className="flex-1 bg-white dark:bg-[#1A1A35]/80 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-lg border border-white/10">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={100}
              strokeDashoffset={100 - progress}
              className="text-orbit-purple"
            />
          </svg>
          <Target size={16} className="text-orbit-purple" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-800 dark:text-white leading-none">
            {completed}/{total}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Words
          </div>
        </div>
      </div>
    </div>
  );
}

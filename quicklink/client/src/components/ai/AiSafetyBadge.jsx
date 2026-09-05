import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export const AiSafetyBadge = ({ safetyScore = 100, isMalicious = false, reason = null }) => {
  if (isMalicious || safetyScore < 50) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg shadow-sm">
        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        <span>Flagged Suspicious ({safetyScore}/100)</span>
        {reason && (
          <span className="hidden sm:inline text-[10px] opacity-80 border-l border-rose-300 dark:border-rose-800 pl-1.5 ml-0.5">
            {reason}
          </span>
        )}
      </div>
    );
  }

  if (safetyScore < 80) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 rounded-lg shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span>Unverified ({safetyScore}/100)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-lg shadow-sm">
      <ShieldCheck className="w-4 h-4 text-emerald-500" />
      <span>AI Verified Safe ({safetyScore}/100)</span>
    </div>
  );
};

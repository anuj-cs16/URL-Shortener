import React from 'react';
import { Sparkles, Check, Tag } from 'lucide-react';

export const SmartAliasSuggestions = ({ aliases = [], category = '', tags = [], summary = '', onSelectAlias, selectedAlias, loading }) => {
  if (loading) {
    return (
      <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl animate-pulse">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Generating AI Slugs & Categorizing...</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-7 w-24 bg-indigo-200/50 dark:bg-indigo-800/40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!aliases || aliases.length === 0) return null;

  return (
    <div className="mt-3 p-3.5 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Suggested Slugs</span>
        </div>
        {category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full">
            <Tag className="w-2.5 h-2.5" />
            {category}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {aliases.map((alias) => {
          const isSelected = selectedAlias === alias;
          return (
            <button
              key={alias}
              type="button"
              onClick={() => onSelectAlias(alias)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
              <span>{alias}</span>
            </button>
          );
        })}
      </div>

      {summary && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
          &ldquo;{summary}&rdquo;
        </p>
      )}
    </div>
  );
};

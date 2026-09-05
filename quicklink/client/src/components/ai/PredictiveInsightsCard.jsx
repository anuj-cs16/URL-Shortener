import React, { useEffect, useState } from 'react';
import { aiApi } from '../../api/aiApi';
import { TrendingUp, Calendar, Clock, Lightbulb, Sparkles, AlertCircle } from 'lucide-react';

export const PredictiveInsightsCard = ({ shortCode }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shortCode) return;
    let isMounted = true;
    setLoading(true);

    aiApi
      .getUrlPredictions(shortCode)
      .then((res) => {
        if (isMounted && res.success) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load predictive insights.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shortCode]);

  if (loading) {
    return (
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
        <div className="h-10 w-32 bg-indigo-100 dark:bg-indigo-900/40 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded"></div>
          <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-slate-400" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/10 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Gemini Predictive Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">30-day forecast & engagement advice</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Forecast Card */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            30-Day Click Forecast
          </span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            ~{data.predictedClicksNext30Days} <span className="text-xs font-normal text-slate-500">clicks</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Based on historic trends & engagement</p>
        </div>

        {/* Optimal Timing */}
        <div className="md:col-span-2 p-4 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Best Times to Share
          </span>
          <div className="flex flex-wrap gap-2">
            {data.optimalPostingTimes?.map((slot, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 rounded-lg flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300"
              >
                <Calendar className="w-3 h-3 text-indigo-500" />
                <span>
                  {slot.dayOfWeek} at {slot.hourOfDay}:00
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded font-bold">
                  {slot.predictedEngagement}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketing Tips */}
      {data.recommendations?.length > 0 && (
        <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/30">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            AI Optimization Tips
          </h4>
          <ul className="space-y-1.5">
            {data.recommendations.map((tip, idx) => (
              <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

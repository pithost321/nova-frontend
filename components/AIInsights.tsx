
import React, { useState, useEffect } from 'react';
import { getAIInsights } from '../src/services/geminiService';
import { UserRole, PerformanceStats, TimePeriod } from '../types';

interface AIInsightsProps {
  role: UserRole;
  name: string;
  stats: PerformanceStats;
  period: TimePeriod;
}

const AIInsights: React.FC<AIInsightsProps> = ({ role, name, stats, period }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchInsight = async () => {
    setLoading(true);
    const result = await getAIInsights(role, name, stats, period);
    setInsight(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsight();
  }, [name, period]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-8 rounded-3xl mb-8 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-sm font-black text-blue-900 uppercase tracking-widest">NOVA Intelligence Insight</h2>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-blue-200/50 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-blue-200/50 rounded w-5/6 animate-pulse"></div>
        </div>
      ) : (
        <p className="text-slate-700 leading-relaxed italic font-medium">
          "{insight}"
        </p>
      )}
      
      <button 
        onClick={fetchInsight}
        className="mt-6 text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Regenerate Analysis
      </button>
    </div>
  );
};

export default AIInsights;

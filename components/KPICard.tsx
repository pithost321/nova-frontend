
/**
 * KPI Card Component
 *
 * Reusable card component for displaying Key Performance Indicator metrics.
 * Used across agent and team dashboards to present important business metrics
 * in a visually consistent and professional manner.
 */

import React from 'react';

interface KPICardProps {
  /** The label/title of the metric */
  label: string;
  /** The value to display (numeric or string) */
  value: string | number;
  /** Optional sub-text or additional information */
  subtext?: string;
  /** SVG icon element */
  icon: React.ReactNode;
  /** Tailwind color class for the icon background (e.g., 'bg-blue-600') */
  color: string;
}

/**
 * Renders a professional KPI metric card with icon, label, value, and optional subtext
 */
const KPICard: React.FC<KPICardProps> = ({ label, value, subtext, icon, color }) => {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 border border-current border-opacity-10`}>
          <div className={`w-6 h-6 ${color.replace('bg-', 'text-')}`}>
            {icon}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
          {label}
        </h3>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        {subtext && (
          <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;


import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = "blue" }) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-900/5",
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/5",
    red: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-950/20",
    yellow: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-900/5"
  };

  return (
    <div className={`bg-slate-900/70 border ${colorMap[color]} p-5 rounded-2xl flex items-center gap-5 transition-all hover:bg-slate-800/90 hover:-translate-y-0.5 shadow-md`}>
      <div className={`p-3.5 rounded-xl ${colorMap[color].split(' ')[0]} flex items-center justify-center bg-slate-800/80 border border-white/5`}>
        {React.cloneElement(icon as React.ReactElement, { width: 20, height: 20 })}
      </div>
      <div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-black text-white leading-none tracking-tight">{value}</h3>
          {trend && <span className="text-[9px] text-emerald-500 font-mono font-bold leading-none bg-emerald-500/10 px-1.5 py-0.5 rounded">{trend}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

'use client';

import React from 'react';
import { Shield, Smartphone, Brain } from 'lucide-react';

export default function ResponsibleSelector() {
  // 符合專案負責人選單_v1.1 的指定預設名單
  const sections = [
    { title: '應用科負責人', icon: <Smartphone className="w-4 h-4 text-sky-600" />, bg: 'border-sky-100 bg-sky-50/30', members: ['趙俊安', '邱仕翔'] },
    { title: '企劃科負責人', icon: <Shield className="w-4 h-4 text-indigo-600" />, bg: 'border-indigo-100 bg-indigo-50/30', members: ['任文燕'] },
    { title: '科技科負責人', icon: <Brain className="w-4 h-4 text-emerald-600" />, bg: 'border-emerald-100 bg-emerald-50/30', members: ['謝琇旻', '郭珊珊'] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {sections.map((sec, idx) => (
        <div key={idx} className={`border rounded-xl p-4 flex flex-col justify-between ${sec.bg}`}>
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
              {sec.icon}
              {sec.title}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sec.members.map((m, i) => (
                <span key={i} className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-sm">
                  {m}
                </span>
              ))}
            </div>
          </div>
          <button className="text-right text-[11px] font-bold text-slate-400 hover:text-indigo-600 mt-4 transition-colors">
            + 調整指派名單
          </button>
        </div>
      ))}
    </div>
  );
}
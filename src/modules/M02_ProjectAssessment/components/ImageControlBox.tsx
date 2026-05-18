'use client';

import React from 'react';
import { ImageIcon, Eye, UploadCloud } from 'lucide-react';

export default function ImageControlBox() {
  return (
    <div className="border border-slate-200/70 rounded-xl bg-white p-5 shadow-sm shadow-slate-100/40">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
        三、現況與目標流程圖對照 (As-Is vs To-Be)
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* As-Is Card */}
        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center min-h-[160px] relative group text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform mb-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-xs font-bold text-slate-700">As-Is 流程圖縮圖</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">asis_v1.png (1.2 MB)</div>
          
          <div className="flex items-center gap-2 mt-4">
            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 shadow-sm transition-colors">
              <Eye className="w-3 h-3" /> 檢視流程圖
            </button>
            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white text-slate-400 border border-slate-200/60 rounded-md cursor-not-allowed">
              <UploadCloud className="w-3 h-3" /> 替換
            </button>
          </div>
        </div>

        {/* To-Be Card */}
        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center min-h-[160px] relative group text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform mb-2">
            <ImageIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-xs font-bold text-slate-700">To-Be 流程圖縮圖</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">tobe_draft_v3.png (890 KB)</div>
          
          <div className="flex items-center gap-2 mt-4">
            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 shadow-sm transition-colors">
              <Eye className="w-3 h-3" /> 雙圖對照
            </button>
            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md hover:bg-indigo-100 shadow-sm transition-colors">
              <UploadCloud className="w-3 h-3" /> 上傳新圖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
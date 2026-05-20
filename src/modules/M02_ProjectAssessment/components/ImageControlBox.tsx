'use client';

import React, { useState } from 'react';
import { Eye, UploadCloud, X, Columns, Layout, Maximize2, AlertCircle } from 'lucide-react';

export default function ImageControlBox() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'COMPARE' | 'AS_IS' | 'TO_BE'>('COMPARE');

  return (
    <div className="border border-slate-200/80 bg-white rounded-xl p-5 shadow-sm select-none">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">四、現現況與目標流程圖對照 (As-Is / To-Be)</div>
      <div className="text-[10px] text-slate-400 font-medium mb-4 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-indigo-500" />
        提示規格：支援 <span className="font-mono bg-slate-50 border border-slate-200/50 px-1 rounded text-slate-600">JPG / PNG / WebP</span>，單張不超過 <span className="text-indigo-600 font-bold">2MB</span>
      </div>
      
      {/* 流程圖並排縮圖區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center text-center h-40 group hover:border-slate-300 transition-all">
          <span className="text-xs font-bold text-slate-700">As-Is 流程圖草圖</span>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">asis_v1.0.png (1.4MB)</span>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => { setViewMode('AS_IS'); setIsPreviewOpen(true); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm hover:bg-slate-50 cursor-pointer"><Eye className="w-3.5 h-3.5 text-slate-400" /> 檢視</button>
            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"><UploadCloud className="w-3.5 h-3.5" /> 上傳/替換</button>
          </div>
        </div>

        <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center text-center h-40 group hover:border-slate-300 transition-all">
          <span className="text-xs font-bold text-slate-700">To-Be 目標架構圖</span>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">尚未上傳檔案</span>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => { setViewMode('TO_BE'); setIsPreviewOpen(true); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm hover:bg-slate-50 cursor-pointer"><Eye className="w-3.5 h-3.5 text-slate-400" /> 檢視</button>
            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors cursor-pointer"><UploadCloud className="w-3.5 h-3.5" /> 上傳圖片</button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          高階高仿真流程圖檢視彈窗 (Lightbox Container)
          ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPreviewOpen(false)} />
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* 彈窗控制標頭 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-800">高級圖像審查交互中心</span>
                
                {/* 模式切換按鈕群 */}
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white shadow-sm">
                  <button 
                    onClick={() => setViewMode('COMPARE')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'COMPARE' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Columns className="w-3 h-3" /> 雙圖對照
                  </button>
                  <button 
                    onClick={() => setViewMode('AS_IS')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'AS_IS' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Layout className="w-3 h-3" /> 只看 As-Is
                  </button>
                  <button 
                    onClick={() => setViewMode('TO_BE')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'TO_BE' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Maximize2 className="w-3 h-3" /> 只看 To-Be
                  </button>
                </div>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg p-1 bg-white shadow-sm"><X className="w-4 h-4" /></button>
            </div>

            {/* 實體圖像仿真模擬渲染畫布 */}
            <div className="flex-1 bg-slate-900/5 p-6 overflow-auto flex gap-4 justify-center items-center">
              {(viewMode === 'COMPARE' || viewMode === 'AS_IS') && (
                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-white h-full flex flex-col items-center justify-center p-4 shadow-sm">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded bg-slate-50 mb-4">AS-IS CURRENT FLOW CANVAS</span>
                  <div className="w-24 h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">Excel 撈報表</div>
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                  <div className="w-24 h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-400 text-center p-1">手動匯入各通路 (落後7天)</div>
                </div>
              )}

              {(viewMode === 'COMPARE' || viewMode === 'TO_BE') && (
                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-indigo-50/20 h-full flex flex-col items-center justify-center p-4 shadow-sm">
                  <span className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest border border-indigo-100 px-2 py-0.5 rounded bg-indigo-50/50 mb-4">TO-BE TARGET ARCHITECTURE</span>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-14 bg-indigo-600 text-white rounded flex items-center justify-center text-[10px] font-bold text-center p-1 shadow-sm shadow-indigo-100">Kafka 即時流</div>
                    <div className="w-4 h-0.5 bg-indigo-300"></div>
                    <div className="w-24 h-14 bg-white border border-indigo-200 rounded flex items-center justify-center text-[10px] font-extrabold text-indigo-600 text-center p-1 shadow-sm">AI 即時模型矩陣 (響應 &lt;50ms)</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
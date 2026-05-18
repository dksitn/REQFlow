import React from 'react';
import StatCards from '@/modules/M01_ConsolidatedProjects/components/StatCards';
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import { Layers } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 bg-white p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
      {/* 頂部頁面標頭與權限宣告區 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            彙整全部專案
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            歡迎回來，<span className="text-slate-600 font-semibold">沈廷翼 Admin</span>。智金處目前所有評估與 POC 案件進度總覽。
          </p>
        </div>
        
        {/* 右上角極簡建立專案按鈕 */}
        <div>
          <button className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
            建立新專案案源
          </button>
        </div>
      </div>

      {/* 區塊 1：三大案型統計卡 */}
      <div className="mb-6">
        <StatCards />
      </div>

      {/* 區塊 2：專案總表 Data Grid */}
      <div>
        <ProjectTable />
      </div>
    </main>
  );
}
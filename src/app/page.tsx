import React from 'react';
import StatCards from '@/modules/M01_ConsolidatedProjects/components/StatCards';
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import AuditSidebar from '@/modules/M01_ConsolidatedProjects/components/AuditSidebar';

export default function Home() {
  return (
    <div className="flex-1 flex min-w-0 bg-white w-full">
      
      {/* 🛡️ 核心修復：移除 max-w-[1400px] 限制，改為 w-full 與 min-w-0
          這能確保右側欄收合為 0px 時，主畫面能毫無阻礙地流暢延展至螢幕最右側邊緣 */}
      <main className="flex-1 bg-white p-8 overflow-y-auto w-full min-w-0 transition-all duration-300 ease-in-out">
        
        {/* 頂部頁面標頭區 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">彙整全部專案</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              歡迎回來，<span className="text-slate-600 font-bold">沈廷翼 Admin</span>。智金處目前所有評估與 POC 案件進度總覽。
            </p>
          </div>
          <button className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] shrink-0">
            建立新專案案源
          </button>
        </div>

        {/* 區塊 1：動態加總統計看板 */}
        <div className="mb-6">
          <StatCards />
        </div>

        {/* 區塊 2：10 大欄位 Data Grid */}
        <div className="w-full overflow-hidden">
          <ProjectTable />
        </div>

      </main>

      {/* 右側異動紀錄側邊欄 (內含寬度收縮與懸浮控制把手) */}
      <AuditSidebar />

    </div>
  );
}
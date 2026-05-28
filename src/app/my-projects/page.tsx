'use client';

import React from 'react';
import StatCards from '@/modules/M01_ConsolidatedProjects/components/StatCards';
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import AuditSidebar from '@/modules/M01_ConsolidatedProjects/components/AuditSidebar';

export default function MyWorkspacePage() {
  // 模擬當前登入者身分
  const currentUser = '沈廷翼 Admin';

  return (
    <div className="flex-1 flex min-w-0 bg-white w-full">
      <main className="flex-1 bg-indigo-50/30 p-8 overflow-y-auto w-full min-w-0 transition-all duration-300">
        
        {/* 頂部標題區 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-100 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-900 tracking-tight">我的負責案件 (個人戰情室)</h1>
            <p className="text-xs text-indigo-400 font-medium mt-1">
              當前身份：<span className="text-indigo-600 font-bold">{currentUser}</span>。這裡僅顯示由您負責或建立的專案。
            </p>
          </div>
        </div>

        {/* 核心組件：加上 targetUser 開關！ */}
        <div className="mb-6">
          <StatCards targetUser={currentUser} />
        </div>

        <div className="w-full overflow-hidden border border-indigo-100/50 rounded-xl shadow-sm">
          <ProjectTable targetUser={currentUser} />
        </div>

      </main>

      <AuditSidebar />
    </div>
  );
}
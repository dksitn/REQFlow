'use client'; // 👈 加上 use client，因為我們需要控制彈窗狀態

import React, { useState } from 'react';
import StatCards from '@/modules/M01_ConsolidatedProjects/components/StatCards';
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import AuditSidebar from '@/modules/M01_ConsolidatedProjects/components/AuditSidebar';
import CreateProjectModal from '@/modules/M01_ConsolidatedProjects/components/CreateProjectModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 👈 用來觸發元件刷新的鑰匙

  // 當新增專案成功時，讓 refreshKey + 1，觸發表格跟統計卡重新撈取資料
  const handleProjectCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex-1 flex min-w-0 bg-white w-full">
      <main className="flex-1 bg-slate-50/10 p-8 overflow-y-auto w-full min-w-0 transition-all duration-300">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">彙整全部專案</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              歡迎回來，<span className="text-slate-600 font-bold">沈廷翼 Admin</span>。智金處目前所有評估與 POC 案件進度總覽。
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} // 👈 點擊開啟彈窗
            className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
          >
            建立新專案案源
          </button>
        </div>

        <div className="mb-6">
          <StatCards refreshKey={refreshKey} /> {/* 👈 傳入 refreshKey */}
        </div>

        <div className="w-full overflow-hidden">
          <ProjectTable refreshKey={refreshKey} /> {/* 👈 傳入 refreshKey */}
        </div>

      </main>

      <AuditSidebar />

      {/* 👈 掛載新建專案彈窗 */}
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
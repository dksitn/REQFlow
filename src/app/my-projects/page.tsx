import React from 'react';
import MyStatCards from '@/modules/M04_MyResponsibleProjects/components/MyStatCards';
import MyProjectTable from '@/modules/M04_MyResponsibleProjects/components/MyProjectTable';
import MyWorkspaceSidebar from '@/modules/M04_MyResponsibleProjects/components/MyWorkspaceSidebar';

export default function MyProjectsPage() {
  return (
    <div className="flex-1 flex min-w-0 bg-white w-full">
      
      {/* 流體延展主區塊 */}
      <main className="flex-1 bg-slate-50/10 p-8 overflow-y-auto w-full min-w-0 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的負責案件</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              個人戰術工作台：專注於 <span className="text-slate-600 font-bold">沈廷翼（應用科）</span> 當前參與與負責的案件進度。
            </p>
          </div>
        </div>

        <div className="mb-6">
          <MyStatCards />
        </div>

        <div className="w-full overflow-hidden">
          <MyProjectTable />
        </div>
      </main>

      {/* 右側個人看板 */}
      <MyWorkspaceSidebar />

    </div>
  );
}
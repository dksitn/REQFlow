import React from 'react';
import PermissionMatrix from '@/modules/M03_PermissionManagement/components/PermissionMatrix';

export default function PermissionsPage() {
  return (
    <div className="flex-1 flex min-w-0 bg-white w-full">
      <main className="flex-1 bg-slate-50/10 p-8 overflow-y-auto w-full min-w-0 transition-all duration-300">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">M03 權限管理中心</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              由 <span className="text-slate-600 font-bold">沈廷翼 Admin</span> 進行全局角色權限配置與同仁功能指派。
            </p>
          </div>
          <button className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]">
            匯出權限報表
          </button>
        </div>

        <div className="w-full">
          <PermissionMatrix />
        </div>

      </main>
    </div>
  );
}
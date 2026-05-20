'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, AlertCircle } from 'lucide-react';

export default function MyProjectTable() {
  // 嚴格遵守指定 6 大狀態與 11 位人名規範 (此處以沈廷翼視角)
  const myProjects = [
    { id: 'REQ-2026-001', name: '全通路會員智能推薦系統', unit: '消金暨信用卡總處', type: '評估案', status: '應用科評估完成', role: 'Project Owner', section: '應用科', lastUpdated: '2026-05-18', nextAlert: '2026-05-25', completeness: 85 },
    { id: 'REQ-2026-006', name: '核心系統微服務化架構檢視', unit: '資訊總部', type: 'POC案', status: '需求單位討論', role: 'Contributor', section: '應用科', lastUpdated: '2026-05-10', nextAlert: '2026-05-13', completeness: 20 },
    { id: 'REQ-2026-008', name: '海外分行洗錢防制系統升級', unit: '國際金融總處', type: '評估案', status: '需求單位送單', role: 'Auditor', section: '應用科', lastUpdated: '2026-05-17', nextAlert: '2026-05-24', completeness: 40 },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm shadow-slate-100/40 overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">專案編號</th>
              <th className="px-5 py-3.5">專案名稱</th>
              <th className="px-5 py-3.5">單位</th>
              <th className="px-5 py-3.5">案件類型</th>
              <th className="px-5 py-3.5">狀態</th>
              <th className="px-5 py-3.5">我的角色</th>
              <th className="px-5 py-3.5">所屬科別</th>
              <th className="px-5 py-3.5">最後更新</th>
              <th className="px-5 py-3.5">下次提醒</th>
              <th className="px-5 py-3.5">完整度</th>
              <th className="px-5 py-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-600">
            {myProjects.map((project) => {
              const isOverdue = new Date(project.nextAlert) < new Date('2026-05-20'); // 模擬超時檢查
              return (
                <tr key={project.id} className="hover:bg-slate-50/20 transition-colors group">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{project.id}</td>
                  <td className="px-5 py-4 font-bold text-slate-800 max-w-[150px] truncate">{project.name}</td>
                  <td className="px-5 py-4 text-slate-500 truncate max-w-[100px]">{project.unit}</td>
                  <td className="px-5 py-4"><span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60 text-[10px] font-bold">{project.type}</span></td>
                  <td className="px-5 py-4"><span className="bg-indigo-50/60 text-indigo-600 border border-indigo-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold">{project.status}</span></td>
                  <td className="px-5 py-4"><span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100 text-[10px] font-bold">{project.role}</span></td>
                  <td className="px-5 py-4 text-slate-500">{project.section}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{project.lastUpdated}</td>
                  <td className="px-5 py-4 font-mono text-[11px]">
                    <span className={isOverdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-400'}>
                      {isOverdue && <AlertCircle className="w-3 h-3" />} {project.nextAlert}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${project.completeness}%` }}></div>
                      </div>
                      <span className="font-mono text-slate-700 font-bold text-[10px]">{project.completeness}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/project/${project.id}`} className="inline-flex items-center gap-0.5 px-2 py-1 font-bold text-slate-600 bg-white border border-slate-200 rounded hover:text-indigo-600 hover:bg-indigo-50/40 shadow-sm transition-all group/btn">
                      評估 <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Shield, Check, X, Search, UserPlus } from 'lucide-react';

export default function PermissionMatrix() {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 嚴格對齊 4.4 節：5 大固定角色與 7 大權限矩陣
  const roles = ['Admin', 'Project Owner', 'Contributor', 'Viewer', 'Auditor'];
  const permissions = [
    { key: 'view_all', label: '查看全部專案', allowed: ['Admin', 'Project Owner', 'Viewer', 'Auditor'] },
    { key: 'edit_project', label: '編輯個別專案', allowed: ['Admin', 'Project Owner', 'Contributor'] },
    { key: 'change_status', label: '修改專案狀態', allowed: ['Admin', 'Project Owner'] },
    { key: 'manage_owners', label: '管理專案負責人', allowed: ['Admin', 'Project Owner'] },
    { key: 'manage_status_opt', label: '管理狀態選項', allowed: ['Admin'] },
    { key: 'manage_perms', label: '管理權限', allowed: ['Admin'] },
    { key: 'view_audit', label: '檢視修改留痕', allowed: ['Admin', 'Auditor', 'Project Owner'] },
  ];

  // 2. 嚴格對齊 4.4 節：11 位指定人員名單與科別
  const personnel = [
    { name: '沈廷翼', tag: 'Admin', role: 'Admin' },
    { name: '趙俊安', tag: '應用科', role: 'Project Owner' },
    { name: '邱仕翔', tag: '應用科', role: 'Contributor' },
    { name: '許志豪', tag: '應用科', role: 'Contributor' },
    { name: '呂易容', tag: '應用科', role: 'Viewer' },
    { name: '鄭雅方', tag: '應用科', role: 'Viewer' },
    { name: '任文燕', tag: '企劃科', role: 'Auditor' },
    { name: '李明穎', tag: '企劃科', role: 'Contributor' },
    { name: '謝琇旻', tag: '科技科', role: 'Project Owner' },
    { name: '郭珊珊', tag: '科技科', role: 'Contributor' },
    { name: '陳雨欣', tag: '科技科', role: 'Viewer' },
  ];

  const filteredPersonnel = personnel.filter(p => 
    p.name.includes(searchQuery) || p.tag.includes(searchQuery) || p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      
      {/* 區塊 1：角色權限矩陣 (Permission Matrix) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">核心角色權限矩陣</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5 border-r border-slate-100 w-1/4">系統功能權限</th>
                {roles.map(role => (
                  <th key={role} className="px-4 py-3.5 text-center w-[15%]">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-600">
              {permissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/20 transition-colors">
                  <td className="px-6 py-3 border-r border-slate-100 font-bold text-slate-700">{perm.label}</td>
                  {roles.map(role => {
                    const isAllowed = perm.allowed.includes(role);
                    return (
                      <td key={`${perm.key}-${role}`} className="px-4 py-3 text-center">
                        {isAllowed ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 區塊 2：人員角色指派名單 */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">智金處人員指派清單</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜尋姓名、科別或角色..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-slate-700 transition-all shadow-sm"
            />
          </div>
        </div>
        
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPersonnel.map((person, idx) => (
            <div key={idx} className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm hover:border-indigo-200 transition-colors group flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{person.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">{person.tag}</div>
                </div>
                <div className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  person.role === 'Admin' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  person.role === 'Project Owner' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                  'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {person.role}
                </div>
              </div>
              <div className="text-right">
                <button className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                  變更角色 →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
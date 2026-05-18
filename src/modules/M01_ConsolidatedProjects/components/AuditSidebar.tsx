'use client';

import React from 'react';
import { History, User, Calendar, FileText, ArrowRight } from 'lucide-react';

export default function AuditSidebar() {
  // 模擬符合 PRD m02_audit_logs 的操作留痕歷史紀錄
  const logs = [
    { id: 1, actor: '沈廷翼', action: '變更專案狀態', target: '全通路會員智能推薦系統', time: '10分鐘前', detail: '需求單位討論 → 應用科評估完成' },
    { id: 2, actor: '趙俊安', action: '更新文字評估', target: '全通路會員智能推薦系統', time: '1小時前', detail: '修改了「現行作業痛點」區塊內容' },
    { id: 3, actor: '任文燕', action: '上傳流程圖', target: '全通路會員智能推薦系統', time: '4小時前', detail: '更新了 To-Be 目標流程圖草稿' },
    { id: 4, actor: '沈廷翼', action: '建立新案源', target: 'AI 語音客服自動摘要模組', time: '昨日 16:30', detail: '指派邱仕翔、謝琇旻為專案負責人' },
  ];

  return (
    <div className="w-80 bg-white border-l border-slate-200/80 min-h-[calc(100vh-64px)] p-5 flex flex-col justify-between">
      <div>
        {/* 標頭 */}
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">智金處審計與變更留痕</h2>
        </div>

        {/* 留痕時光機列表 */}
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="text-xs group border-b border-slate-50 pb-3 last:border-0">
              <div className="flex items-center justify-between text-slate-400 mb-1 font-medium">
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <User className="w-3 h-3 text-slate-400" />
                  {log.actor}
                </span>
                <span className="font-mono text-[11px]">{log.time}</span>
              </div>
              <p className="text-slate-800 font-semibold mb-1 truncate">
                {log.action}：<span className="text-slate-500 font-medium">{log.target}</span>
              </p>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-500 font-mono scale-[0.98] origin-left line-clamp-2">
                {log.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部導引快照 */}
      <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-3 text-xs mt-4">
        <p className="font-semibold text-indigo-900 mb-1 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          自動稽核提示
        </p>
        <p className="text-indigo-700/80 font-medium leading-relaxed mb-2">
          當前系統全面啟動 RLS 與資料層審計。所有更動將自動與您的帳號進行強綁定留痕。
        </p>
        <button className="text-indigo-600 font-bold hover:text-indigo-700 inline-flex items-center gap-0.5">
          查看完整日誌系統
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { Clock, RotateCcw, Trash2, X, AlertCircle } from 'lucide-react';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecover: () => void;
}

export default function DraftRecoveryModal({ isOpen, onClose, onRecover }: DraftRecoveryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* 彈窗本體 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* 標頭區 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">系統偵測到未儲存的草稿備援</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 內容摘要與預覽 */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-800 leading-normal">
              提示：系統每 5 分鐘於背景安全暫存。恢復草稿僅會將內容放回編輯框中，不會自動覆蓋資料庫的正式資料，您仍須點擊「儲存」才會正式生效。
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
              <span className="font-bold text-slate-500">暫存區塊：<span className="text-slate-800">現行作業痛點</span></span>
              <span className="font-mono text-slate-400 font-bold">暫存時間：2026-05-20 18:45</span>
            </div>
            
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">版本內容預覽摘要</span>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto">
                現行消金會員推薦散落在各渠道系統，資料每週才更新一次。最新補件：且因分行通路與 App 標籤未即時連動，導致第一線臨櫃行銷發生資訊不對稱，黃金交叉銷售時間嚴重流失。
              </div>
            </div>
          </div>
        </div>

        {/* 功能控制按鈕 */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-2">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            放棄草稿
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={onRecover}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              恢復選取版本
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
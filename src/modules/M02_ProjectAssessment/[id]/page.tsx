'use client';

import React from 'react';
import BasicInfoCard from '../components/BasicInfoCard';
import ResponsibleSelector from '../components/ResponsibleSelector';
import AssessmentTextCards from '../components/AssessmentTextCards';
import ImageControlBox from '../components/ImageControlBox';
import AdvancedEvaluationGrid from '../components/AdvancedEvaluationGrid';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProjectAssessmentDetail() {
  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto max-w-[1300px] mx-auto w-full space-y-7 pb-24">
      {/* 頂部導航列 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">個別專案綜合評估</h1>
            <p className="text-[11px] text-slate-400 font-medium">
              審查人員：<span className="text-slate-600 font-semibold">沈廷翼 Admin</span>
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-1">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* 區塊 1：基本資料 */}
      <BasicInfoCard />

      {/* 區塊 2：三科別負責人標籤 */}
      <ResponsibleSelector />

      {/* 區塊 3：現況、痛點評估文字卡 */}
      <AssessmentTextCards />

      {/* 區塊 4：As-Is / To-Be 圖片 */}
      <ImageControlBox />

      {/* 區塊 5：下半段 2x2 進階矩陣 (不跳頁，同一路由垂直捲動) */}
      <div className="pt-4 border-t border-slate-100">
        <AdvancedEvaluationGrid />
      </div>
    </div>
  );
}
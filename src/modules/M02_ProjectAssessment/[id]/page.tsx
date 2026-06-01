export const runtime = 'edge'; // ⚡ 宣告使用 Cloudflare 邊緣運算引擎 (極速 SSR)

import React from 'react';
import { Metadata } from 'next';
import ProjectAssessmentClient from '@/modules/M02_ProjectAssessment/components/ProjectAssessmentClient';

// ----------------------------------------------------------------------
// 🔍 R6 教學：動態 SEO Metadata 產生器 (Google SEO 最佳實踐)
// Server Component 會在邊緣伺服器先執行這段，讓爬蟲抓到最正確的標題與描述
// ----------------------------------------------------------------------
type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const projectId = params.id;
  
  return {
    title: `專案評估：${projectId} | REQFlow 企業級專案管理系統`,
    description: `查看 ${projectId} 專案的 As-Is / To-Be 系統架構對照、現行痛點與評估狀態。REQFlow 專為智金處打造的高效架構。`,
    // Open Graph 標籤：讓這段網址貼到 Teams、Slack 或 Line 時，會產生漂亮的預覽卡片
    openGraph: {
      title: `專案評估：${projectId} | REQFlow`,
      description: `查看 ${projectId} 專案的深入架構評估與狀態追蹤。`,
      type: 'article',
    }
  };
}

// ----------------------------------------------------------------------
// 🧱 主頁面元件 (Server Component)
// 職責：處理路由參數、SEO、無障礙語意標籤，然後把複雜 UI 交給 Client Component
// ----------------------------------------------------------------------
export default function ProjectAssessmentPage({ params }: Props) {
  return (
    // 🏷️ R6 教學：語意化 HTML - 使用 <article> 或 <main> 幫助螢幕閱讀器與爬蟲理解這是核心內容
    <article className="w-full h-full flex flex-col bg-white">
      {/* 
        將所有的互動邏輯 (onClick, useState, Supabase 讀取) 
        隔離在 ProjectAssessmentClient 中，實現 Server / Client 完美解耦 
      */}
      <ProjectAssessmentClient />
    </article>
  );
}
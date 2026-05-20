import React from 'react';
import ProjectAssessmentClient from '@/modules/M02_ProjectAssessment/components/ProjectAssessmentClient';

// 🛡️ 這裡是伺服器端 (Server Component)，負責在編譯期產生靜態路徑，不允許有 'use client'
export function generateStaticParams() {
  return [
    { id: 'REQ-2026-001' },
    { id: 'REQ-2026-002' },
    { id: 'REQ-2026-003' },
    { id: 'REQ-2026-004' },
    { id: 'REQ-2026-006' },
    { id: 'REQ-2026-008' },
  ];
}

export default function ProjectAssessmentDetailPage() {
  // 將所有畫面與互動委託給客戶端元件 (Client Component) 渲染
  return <ProjectAssessmentClient />;
}
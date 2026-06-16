'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, Clock, FileDown, Building2, UserCircle, Target, Briefcase } from 'lucide-react';

// 引入你原本寫好的子元件 (使用絕對路徑以避免 Module not found)
import WorkflowEditor from '@/components/WorkflowEditor';
import ImpactAnalysis from '@/components/ImpactAnalysis';
import ArchitectureEditor from '@/components/ArchitectureEditor';
import EvaluationMatrix from '@/components/EvaluationMatrix';
import PersonnelSelector from '@/components/PersonnelSelector';

export default function ProjectEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [projectData, setProjectData] = useState<any>(null);
  const [statusDict, setStatusDict] = useState<any[]>([]); // 🚀 從資料庫讀取的動態狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // 控制頁籤切換
  const [activeTab, setActiveTab] = useState('impact');

  useEffect(() => {
    async function fetchData() {
      try {
        // 並行撈取專案資料與狀態字典
        const [projRes, statRes] = await Promise.all([
          supabase.from('m01_projects').select('*').eq('id', projectId).single(),
          supabase.from('m01_status_dict').select('*').order('sort_order', { ascending: true })
        ]);

        if (projRes.error) throw projRes.error;
        if (statRes.error) throw statRes.error;

        setProjectData(projRes.data);
        setStatusDict(statRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const handleUpdateField = (field: string, value: any) => {
    setProjectData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (newStatus: string) => {
    setProjectData((prev: any) => ({ ...prev, status_name_snapshot: newStatus }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const { error } = await supabase
        .from('m01_projects')
        .update({
          ...projectData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
      setSaveMessage('儲存成功！');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('儲存失敗:', error);
      setSaveMessage('儲存失敗，請重試。');
    } finally {
      setIsSaving(false);
    }
  };

  // 匯出 PDF 處理函式 (預設使用瀏覽器列印，你可以換成你原本的套件如 html2pdf)
  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <span className="font-bold tracking-widest text-sm">載入專案資料中...</span>
      </div>
    );
  }

  if (!projectData) {
    return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;
  }

  // 取得負責人字串
  const getResponsiblesString = (team: any) => {
    if (!team) return '未指定';
    const all = [...(team['應用科'] || []), ...(team['企劃科'] || []), ...(team['科技科'] || [])];
    return all.length > 0 ? all.join(', ') : '未指定';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans">
      
      {/* 🚀 頂部導覽與控制列 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm flex flex-col gap-4">
        
        {/* 上半部：標題與按鈕區 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[10px] md:text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">
                {projectData.project_code}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight line-clamp-1">
                {projectData.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {saveMessage && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
                <Check className="w-4 h-4" /> {saveMessage}
              </span>
            )}
            
            {/* 🚀 輸出 PDF 按鈕 */}
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden md:inline">輸出 PDF</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              儲存變更
            </button>
          </div>
        </div>

        {/* 🚀 下半部：專案屬性資訊列 (單位、負責人、時間) */}
        <div className="flex flex-wrap items-center gap-6 pl-12 text-sm font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            提案單位：<span className="text-slate-800">{projectData.department || '未填寫'}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-slate-400" />
            專案負責人：<span className="text-slate-800">{getResponsiblesString(projectData.team_members)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            最後更新：<span className="text-slate-800">{new Date(projectData.updated_at).toLocaleString('zh-TW')}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
        
        {/* 左側主內容區 (包含頁籤與動態渲染的元件) */}
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          
          {/* 🚀 頁籤 (Tabs) 切換列 */}
          <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px custom-scrollbar">
            <button onClick={() => setActiveTab('impact')} className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'impact' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              基本評估與影響
            </button>
            <button onClick={() => setActiveTab('workflow')} className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'workflow' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              業務流程
            </button>
            <button onClick={() => setActiveTab('architecture')} className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'architecture' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              系統架構圖
            </button>
            <button onClick={() => setActiveTab('matrix')} className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              綜合評估矩陣
            </button>
            <button onClick={() => setActiveTab('personnel')} className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'personnel' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              人員編制
            </button>
          </div>

          {/* 🚀 頁籤對應的內容區塊 */}
          <div className="mt-2 min-h-[500px]">
            {activeTab === 'impact' && (
              <ImpactAnalysis 
                people={projectData.impact_people_text}
                time={projectData.impact_time_text}
                benefit={projectData.impact_benefit_text}
                onChange={(field, val) => handleUpdateField(`impact_${field}_text`, val)} 
              />
            )}

            {activeTab === 'workflow' && (
              <WorkflowEditor 
                value={projectData.workflow_text} 
                onChange={(val) => handleUpdateField('workflow_text', val)} 
              />
            )}

            {activeTab === 'architecture' && (
              <ArchitectureEditor 
                asIs={projectData.image_as_is} 
                toBe={projectData.image_to_be} 
                onChange={(field, val) => handleUpdateField(`image_${field}`, val)} 
              />
            )}

            {activeTab === 'matrix' && (
              <EvaluationMatrix 
                business={projectData.eval_business}
                technical={projectData.eval_technical}
                kpi={projectData.eval_kpi}
                conclusion={projectData.eval_conclusion}
                onChange={(field, val) => handleUpdateField(`eval_${field}`, val)} 
              />
            )}

            {activeTab === 'personnel' && (
              <PersonnelSelector 
                value={projectData.team_members || {}} 
                onChange={(val) => handleUpdateField('team_members', val)} 
              />
            )}
          </div>
        </div>

        {/* 右側側邊設定區 */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          
          {/* 專案狀態控制卡片 */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800">專案狀態管理</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">目前階段</label>
                
                {/* 🚀 動態渲染資料庫撈下來的狀態字典 */}
                <select
                  value={projectData.status_name_snapshot}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {statusDict.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>

              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-slate-500">風險等級評估</label>
                <select
                  value={projectData.risk_level || '低'}
                  onChange={(e) => handleUpdateField('risk_level', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-bold outline-none cursor-pointer ${
                    projectData.risk_level === '高' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    projectData.risk_level === '中' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                >
                  <option value="低" className="text-emerald-600 font-bold bg-white">低 (Low)</option>
                  <option value="中" className="text-amber-600 font-bold bg-white">中 (Medium)</option>
                  <option value="高" className="text-rose-600 font-bold bg-white">高 (High)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 右側人員快速摘要 (選項功能) */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800">快速行動</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <button 
                onClick={() => setActiveTab('personnel')}
                className="w-full py-2.5 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
              >
                指派 / 修改專案成員
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
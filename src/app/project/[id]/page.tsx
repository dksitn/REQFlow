'use client';

// 🚀 關鍵修復：加入這行，告訴 Cloudflare 這個動態路由要在 Edge Runtime 執行
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, Clock, CheckSquare, Server, Target, Users } from 'lucide-react';

export default function ProjectEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [projectData, setProjectData] = useState<any>(null);
  const [statusDict, setStatusDict] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans">
      
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-wrap md:flex-nowrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] md:text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">{projectData.project_code}</span>
              <h1 className="text-base md:text-xl font-black text-slate-900 tracking-tight line-clamp-1">{projectData.name}</h1>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> 最後更新：{new Date(projectData.updated_at).toLocaleString('zh-TW')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
              <Check className="w-4 h-4" /> {saveMessage}
            </span>
          )}
          <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors active:scale-95 shrink-0">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            儲存變更
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
        
        <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-black text-slate-800">業務流程說明</h2>
              </div>
              <textarea 
                value={projectData.workflow_text || ''} 
                onChange={(e) => handleUpdateField('workflow_text', e.target.value)}
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                placeholder="請輸入業務流程說明..."
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-black text-slate-800">影響面評估</h2>
              </div>
              <div className="flex flex-col gap-3">
                <input value={projectData.impact_people_text || ''} onChange={(e) => handleUpdateField('impact_people_text', e.target.value)} placeholder="影響人員..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                <input value={projectData.impact_time_text || ''} onChange={(e) => handleUpdateField('impact_time_text', e.target.value)} placeholder="影響時間..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                <textarea value={projectData.impact_benefit_text || ''} onChange={(e) => handleUpdateField('impact_benefit_text', e.target.value)} placeholder="預期效益..." className="w-full h-16 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-500" />
              <h2 className="text-base font-black text-slate-800">系統架構圖 (As-Is / To-Be)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm">
                目前架構圖 (As-Is) 上傳區
              </div>
              <div className="h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm">
                未來架構圖 (To-Be) 上傳區
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800">專案狀態管理</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">目前階段</label>
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

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-black text-slate-800">專案負責人員</h3>
            </div>
            <div className="p-5 text-center text-xs font-bold text-slate-400 bg-slate-50/50">
              人員設定功能載入中...
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
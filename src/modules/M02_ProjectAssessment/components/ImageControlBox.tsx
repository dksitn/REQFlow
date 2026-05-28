'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

export default function ImageControlBox() {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理真實的檔案上傳邏輯
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. 產生一個不重複的隨機檔案名稱，避免覆蓋
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `diagrams/${fileName}`;

      // 2. 上傳到剛剛建立的 project-images Bucket
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. 上傳成功後，取得公開的圖片網址 (Public URL)
      const { data: publicUrlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      // 4. 更新畫面狀態，顯示剛上傳的圖片
      setImageUrl(publicUrlData.publicUrl);

    } catch (error) {
      console.error('上傳失敗:', error);
      alert('圖片上傳失敗！請檢查是否已在 Supabase 建立 project-images Bucket 並設定 Policies。');
    } finally {
      setIsUploading(false);
      // 清空 input，允許重複選取同一張圖
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    // 實務上可以在這裡加入刪除 Storage 檔案的 API: supabase.storage.from('project-images').remove([filePath])
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">As-Is / To-Be 系統架構對照</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* As-Is 現行架構 (已上傳範例) */}
        <div className="border border-slate-200 border-dashed rounded-xl p-2 bg-slate-50/50 flex flex-col items-center justify-center min-h-[220px] relative group overflow-hidden">
          {imageUrl ? (
            <>
              {/* 顯示真實上傳的圖片 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Uploaded Diagram" className="w-full h-full object-contain rounded-lg" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-slate-600 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* 隱藏的檔案上傳 Input */}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                {isUploading ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> : <ImageIcon className="w-5 h-5 text-indigo-600" />}
              </div>
              <p className="text-xs font-bold text-slate-600 mb-1">上傳流程圖或架構圖</p>
              <p className="text-[10px] text-slate-400 mb-4 text-center px-4">支援 PNG, JPG, GIF 格式，最大 5MB</p>
              <button 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? '雲端上傳中...' : <><Upload className="w-3.5 h-3.5" /> 選擇檔案</>}
              </button>
            </>
          )}
        </div>

        {/* To-Be 規劃架構 (佔位區) */}
        <div className="border border-slate-200 border-dashed rounded-xl p-2 bg-slate-50/50 flex flex-col items-center justify-center min-h-[220px] opacity-60">
           <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-500">To-Be 目標架構</p>
            <p className="text-[10px] text-slate-400 mt-1">等待需求釐清後上傳</p>
        </div>
      </div>
    </div>
  );
}
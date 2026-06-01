/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Pin, 
  Megaphone, 
  PlusCircle, 
  Calendar, 
  Eye, 
  ChevronRight,
  Sparkles,
  AlertOctagon,
  Users,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Notice, MemberProfile, NoticeCategory } from '../types';
import { Language, translations } from '../lib/translations';

interface NoticeBoardProps {
  notices: Notice[];
  currentProfile: MemberProfile | null;
  onAddNotice: (notice: Omit<Notice, 'id' | 'createdAt'>) => Promise<void>;
  lang: Language;
}

export default function NoticeBoard({ notices, currentProfile, onAddNotice, lang }: NoticeBoardProps) {
  if (!currentProfile) return null;

  const t = translations[lang];
  const isBN = lang === 'BN';
  const isAdmin = currentProfile.role === 'admin';
  const [filterCategory, setFilterCategory] = useState<NoticeCategory | 'all'>('all');
  
  // Notice posting form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('announcement');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting: Pinned first, then by date descending
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredNotices = sortedNotices.filter(notice => 
    filterCategory === 'all' || notice.category === filterCategory
  );

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return alert(isBN ? 'নোটিশের শিরোনাম ও বিস্তারিত প্রদান করুন!' : 'Please fill in the title and description details!');
    }

    setIsSubmitting(true);
    try {
      await onAddNotice({
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: `${currentProfile.name} (${isAdmin ? (isBN ? 'অর্থদল প্রধান' : 'Finance Lead') : (isBN ? 'সদস্য' : 'Member')})`,
        isPinned
      });
      setTitle('');
      setContent('');
      setIsPinned(false);
      setShowForm(false);
    } catch (err) {
      alert(isBN ? 'নোটিশ পাবলিশ করতে সমস্যা হয়েছে।' : 'Error publishing bulletin notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get color configurations for different categories
  const getCategoryStyles = (cat: NoticeCategory) => {
    switch (cat) {
      case 'emergency':
        return { label: t.noticeLabelEmergency, color: 'bg-rose-50 border-rose-200 text-rose-800', icon: AlertOctagon };
      case 'meeting':
        return { label: t.noticeLabelMeeting, color: 'bg-indigo-50 border-indigo-200 text-indigo-800', icon: Users };
      case 'financial':
        return { label: t.noticeLabelFinancial, color: 'bg-emerald-50 border-emerald-250 text-emerald-800', icon: TrendingUp };
      default:
        return { label: t.noticeLabelGeneral, color: 'bg-slate-50 border-slate-200 text-slate-800', icon: FileText };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h3 className="font-extrabold text-gray-900 text-base">{t.noticeBoardTitle}</h3>
          <p className="text-xs text-gray-400">{t.noticeBoardSub}</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t.btnWriteNotice}</span>
          </button>
        )}
      </div>

      {/* Write a New Notice (Admin Toggle Form) */}
      {showForm && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md animate-fade-in text-left space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm">{t.noticeFormHeader}</h4>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-xs text-gray-400 hover:text-gray-700 font-bold cursor-pointer"
            >
              {t.noticeFormClose}
            </button>
          </div>

          <form onSubmit={handlePostNotice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.noticeTitleLabel}</label>
              <input
                type="text"
                placeholder={isBN ? 'উদা: জরুরি সাধারণ মিটিং নোটিশ' : 'e.g., General Co-op Financial Briefing'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.noticeCategoryLabel}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="announcement">{t.noticeCatGeneral}</option>
                  <option value="meeting">{t.noticeCatMeeting}</option>
                  <option value="financial">{t.noticeCatFinancial}</option>
                  <option value="emergency">{t.noticeCatEmergency}</option>
                </select>
              </div>

              {/* Pin toggle */}
              <div className="flex items-center space-x-2.5 sm:pt-6">
                <input
                  type="checkbox"
                  id="is-pinned-checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded-sm focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is-pinned-checkbox" className="text-xs font-bold text-gray-700 cursor-pointer flex items-center space-x-1">
                  <Pin className="h-4 w-4 text-emerald-600 rotate-45" />
                  <span>{t.noticePinLabel}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.noticeContentLabel}</label>
              <textarea
                placeholder={t.noticeContentPlaceholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-medium text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? t.btnPublishing : t.btnPublishNotice}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category selector filtering list */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-gray-800 text-white font-bold'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          {t.noticesAll}
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('emergency')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterCategory === 'emergency'
              ? 'bg-rose-600 text-white font-bold'
              : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-105'
          }`}
        >
          {t.noticesEmergency}
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('meeting')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterCategory === 'meeting'
              ? 'bg-indigo-600 text-white font-bold'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-150 hover:bg-indigo-100'
          }`}
        >
          {t.noticesMeeting}
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('financial')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterCategory === 'financial'
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-150 hover:bg-emerald-100'
          }`}
        >
          {t.noticesFinancial}
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('announcement')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterCategory === 'announcement'
              ? 'bg-slate-700 text-white font-bold'
              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t.noticesGeneral}
        </button>
      </div>

      {/* Grid List of Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.length === 0 ? (
          <div className="md:col-span-2 py-16 border border-dashed border-gray-100 text-center rounded-2xl bg-white">
            <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-gray-400 font-medium">{t.noNotice}</p>
          </div>
        ) : (
          filteredNotices.map((not) => {
            const styles = getCategoryStyles(not.category);
            const CatIcon = styles.icon;
            
            return (
              <div 
                key={not.id} 
                className={`bg-white rounded-2xl border transition-all hover:shadow-xs p-5 space-y-4 flex flex-col justify-between text-left relative ${
                  not.isPinned ? 'border-emerald-500 shadow-emerald-50/50 shadow-sm' : 'border-gray-100'
                }`}
              >
                {/* Pinned decoration flag */}
                {not.isPinned && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                    <Pin className="h-3.5 w-3.5 rotate-45 animate-pulse" />
                    <span>{t.noticePinnedBadge}</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  {/* Category Pill Tag */}
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${styles.color}`}>
                      <CatIcon className="h-3 w-3 mr-0.5" />
                      <span>{styles.label}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(not.createdAt).toLocaleDateString(isBN ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-extrabold text-gray-900 text-sm leading-snug">
                    {not.title}
                  </h4>

                  {/* Format Content breaks */}
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold whitespace-pre-line">
                    {not.content}
                  </p>
                </div>

                {/* Footer sign author */}
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10.5px]">
                  <span className="text-gray-400 font-medium">{t.publishedBy}</span>
                  <span className="font-extrabold text-emerald-800">{not.authorName}</span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

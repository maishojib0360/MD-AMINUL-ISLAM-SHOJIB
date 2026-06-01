/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw, LogIn, Database, Languages } from 'lucide-react';
import { MemberProfile } from '../types';
import { isFirebaseAvailable } from '../lib/firebaseConfig';
import { Language, translations } from '../lib/translations';

interface HeaderProps {
  currentProfile: MemberProfile | null;
  members: MemberProfile[];
  onSelectProfile: (m: MemberProfile) => void;
  onResetDatabase: () => void;
  lang: Language;
  onChangeLang: (l: Language) => void;
  isAuthenticated: boolean;
  onSignOut: () => void;
}

export default function Header({ 
  currentProfile, 
  members, 
  onSelectProfile, 
  onResetDatabase,
  lang,
  onChangeLang,
  isAuthenticated,
  onSignOut
}: HeaderProps) {
  const t = translations[lang];

  // Sort members to put Farhan (Admin) first for ease of discovery, followed by regular members
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <header className="bg-white border-b border-rose-50/10 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Amader Shopno Family Fund Logo" 
                className="h-12 w-12 rounded-xl object-cover border border-emerald-500 shadow-md shadow-emerald-500/10" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                {t.appName}
              </h1>
              <p className="text-xs text-emerald-600 font-semibold">{t.appSubName}</p>
              <p className="text-[11px] text-gray-500 font-medium italic mt-0.5">
                {lang === 'BN' 
                  ? '“একতাবদ্ধ সঞ্চয়ে সমৃদ্ধি, সুদৃঢ় হোক পারিবারিক বন্ধন”' 
                  : '“Unity in savings, prosperity in family bonds”'}
              </p>
            </div>
          </div>

          {/* Controls & Switching Section */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => onChangeLang('BN')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  lang === 'BN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => onChangeLang('EN')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  lang === 'EN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                EN
              </button>
            </div>

            {/* Database Engine Indicator */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-mono text-gray-600">
              <Database className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>{t.enginePlaceholder} {isFirebaseAvailable ? 'Cloud Firestore' : 'Local Storage'}</span>
            </div>

            {/* Quick Reset Trigger */}
            <button
              onClick={onResetDatabase}
              title={t.resetData}
              className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-gray-200"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Simulator Dropdown */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
              <span className="text-xs text-gray-500 px-2 font-medium hidden sm:inline">{t.simulatorLabel}</span>
              <select
                id="simulator-select"
                className="bg-transparent text-xs text-gray-800 font-medium py-1 px-1 focus:ring-0 focus:outline-hidden cursor-pointer max-w-[180px] sm:max-w-xs"
                value={currentProfile?.uid || ''}
                onChange={(e) => {
                  const selected = members.find(m => m.uid === e.target.value);
                  if (selected) onSelectProfile(selected);
                }}
              >
                {sortedMembers.map(m => (
                  <option key={m.uid} value={m.uid}>
                    [{m.memberId || m.uid}] {m.name} ({m.role === 'admin' ? t.financeTeam : t.generalMember})
                  </option>
                ))}
              </select>
            </div>

            {/* Logged Info badge */}
            {currentProfile && (
              <div className="flex items-center bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg space-x-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <div className="text-left text-xs">
                  <div className="font-bold text-emerald-950 leading-none">{currentProfile.name}</div>
                  <div className="text-[10px] text-emerald-700 leading-tight font-mono font-bold">
                    {currentProfile.memberId || currentProfile.uid} • {currentProfile.role === 'admin' ? t.financeTeam : t.generalMember}
                  </div>
                </div>
              </div>
            )}

            {/* Logout trigger button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center"
              >
                {lang === 'BN' ? 'লগআউট' : 'Sign Out'}
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

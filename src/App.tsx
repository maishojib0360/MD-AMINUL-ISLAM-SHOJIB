/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserSquare2, 
  Coins, 
  Bell, 
  ShieldAlert, 
  TrendingUp, 
  Wallet,
  X,
  Sparkles,
  PlusCircle,
  FolderLock
} from 'lucide-react';
import { dbService, safeLocalStorage } from './lib/dbService';
import { MemberProfile, Transaction, Investment, Notice, FundStats } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KYCModule from './components/KYCModule';
import TransactionPortlet from './components/TransactionPortlet';
import NoticeBoard from './components/NoticeBoard';
import Auth from './components/Auth';
import { Language, translations } from './lib/translations';

export default function App() {
  // Language configuration state
  const [lang, setLang] = useState<Language>('BN');
  const t = translations[lang];
  const isBN = lang === 'BN';

  // Primary state models
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<FundStats>({
    totalCapital: 0,
    activeInvestmentsTotal: 0,
    liquidCash: 0,
    activeMembersCount: 0,
    pendingTransactionsCount: 0
  });

  // Navigation states
  const [activeSection, setActiveSection] = useState<'dashboard' | 'kyc' | 'ledger' | 'notices'>('dashboard');
  
  // Current Simulation Profile state
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal triggers
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [newInvTitle, setNewInvTitle] = useState('');
  const [newInvAmount, setNewInvAmount] = useState<number>(100000);
  const [newInvRate, setNewInvRate] = useState<number>(8.5);
  const [newInvCategory, setNewInvCategory] = useState('FDR');
  const [newInvMaturity, setNewInvMaturity] = useState('Ongoing');

  // Load and refresh core models
  const syncState = async () => {
    setIsLoading(true);
    try {
      const allMembers = await dbService.getMembers();
      const allTxs = await dbService.getTransactions();
      const allInvs = await dbService.getInvestments();
      const allNotices = await dbService.getNotices();
      const latestStats = await dbService.getFundStats();

      setMembers(allMembers);
      setTransactions(allTxs);
      setInvestments(allInvs);
      setNotices(allNotices);
      setStats(latestStats);

      // Select default simulation member (Farhan Admin or Sumaiya Member)
      if (!currentProfile && allMembers.length > 0) {
        const defaultProfile = allMembers.find(m => m.role === 'admin') || allMembers[0];
        setCurrentProfile(defaultProfile);
      } else if (currentProfile) {
        // Keeps simulation swap updated in case of KYC modifications
        const refetched = allMembers.find(m => m.uid === currentProfile.uid);
        if (refetched) {
          setCurrentProfile(refetched);
        }
      }
    } catch (err) {
      console.error("Database sync failed: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncState();
  }, []);

  // Authentication status logic
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const handleLoginSuccess = (member: MemberProfile) => {
    setCurrentProfile(member);
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = async (newMember: MemberProfile) => {
    await dbService.updateMember(newMember.uid, newMember);
    await syncState();
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  // Simulation controls
  const handleSelectProfile = (m: MemberProfile) => {
    setCurrentProfile(m);
    setIsAuthenticated(true);
  };

  // Profile KYC update
  const handleSaveKYC = async (updatedData: Partial<MemberProfile>) => {
    if (!currentProfile) return;
    await dbService.updateMember(currentProfile.uid, updatedData);
    await syncState();
  };

  // Reset database simulator
  const handleResetDatabase = async () => {
    const confirmMsg = isBN 
      ? 'আপনি কি টেস্ট ডাটা পুনরায় আগের অবস্থায় ফিরিয়ে নিতে চান (Reset) ?' 
      : 'Are you sure you want to reset the simulation test data back to default?';
    if (confirm(confirmMsg)) {
      safeLocalStorage.removeItem('ff_members');
      safeLocalStorage.removeItem('ff_transactions');
      safeLocalStorage.removeItem('ff_investments');
      safeLocalStorage.removeItem('ff_notices');
      window.location.reload();
    }
  };

  // Submit payment deposit slip
  const handleAddTransaction = async (txData: Omit<Transaction, 'id' | 'submittedAt' | 'status'>) => {
    await dbService.addTransaction(txData);
    await syncState();
  };

  // Approved Ledger entries
  const handleApproveTransaction = async (id: string, notes: string) => {
    if (!currentProfile) return;
    await dbService.updateTransaction(id, {
      status: 'approved',
      approvedBy: currentProfile.uid,
      approvalNotes: notes,
      approvedAt: new Date().toISOString()
    });
    await syncState();
  };

  // Rejected Ledger entries
  const handleRejectTransaction = async (id: string, notes: string) => {
    if (!currentProfile) return;
    await dbService.updateTransaction(id, {
      status: 'rejected',
      approvedBy: currentProfile.uid,
      approvalNotes: notes,
      approvedAt: new Date().toISOString()
    });
    await syncState();
  };

  // Add Notice Billboard entries
  const handleAddNotice = async (noticeData: Omit<Notice, 'id' | 'createdAt'>) => {
    await dbService.addNotice(noticeData);
    await syncState();
  };

  // Deploy target capital investments
  const handleCreateInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvTitle.trim()) {
      return alert(isBN ? 'বিনিয়োগের নাম প্রদান করুন!' : 'Please enter investment name!');
    }
    if (newInvAmount <= 0 || newInvAmount > stats.liquidCash) {
      const errorMsg = isBN
        ? `অপর্যাপ্ত ফান্ড! বিনিয়োগের পরিমাণ তরল লিকুইড ক্যাশ (${stats.liquidCash}৳) এর চেয়ে বেশি হতে পারবে না।`
        : `Insufficient funds! Investment principal cannot exceed liquid cash (৳${stats.liquidCash.toLocaleString()}).`;
      return alert(errorMsg);
    }

    try {
      await dbService.addInvestment({
        title: newInvTitle.trim(),
        amount: newInvAmount,
        expectedReturnRate: newInvRate,
        startDate: new Date().toISOString().split('T')[0],
        maturityDate: newInvMaturity,
        status: 'active',
        currentValuation: newInvAmount,
        category: newInvCategory
      });
      setShowInvestmentModal(false);
      setNewInvTitle('');
      setNewInvAmount(100000);
      await syncState();
    } catch (err) {
      alert(isBN ? 'বিনিয়োগ করতে সমস্যা হয়েছে।' : 'Error executing investment deploy.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root">
      
      {/* Dynamic Header */}
      <Header 
        currentProfile={currentProfile} 
        members={members} 
        onSelectProfile={handleSelectProfile}
        onResetDatabase={handleResetDatabase}
        lang={lang}
        onChangeLang={setLang}
        isAuthenticated={isAuthenticated}
        onSignOut={handleSignOut}
      />

      {/* Main Core Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col justify-center">

        {!isAuthenticated ? (
          <div className="flex justify-center items-center py-6">
            <Auth 
              members={members} 
              onLoginSuccess={handleLoginSuccess}
              onRegisterSuccess={handleRegisterSuccess}
              lang={lang}
            />
          </div>
        ) : (
          <>
            {/* Global Pending tasks audit bar alert for finance team admins */}
            {currentProfile?.role === 'admin' && stats.pendingTransactionsCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold text-amber-900 group animate-fade-in">
                <div className="flex items-center space-x-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span>{t.pendingTasksAlert.replace('{count}', stats.pendingTransactionsCount.toString())}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveSection('ledger')}
                  className="text-amber-850 hover:text-amber-955 font-bold underline cursor-pointer"
                >
                  {t.auditNow} &rarr;
                </button>
              </div>
            )}

            {/* Segment Navigation tab bar section */}
            <div className="flex items-center space-x-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xs">
              
              <button
                type="button"
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSection === 'dashboard' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'
                }`}
              >
                <LayoutDashboard className="h-4.5 w-4.5" />
                <span>{t.navDashboard}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('kyc')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSection === 'kyc' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'
                }`}
              >
                <UserSquare2 className="h-4.5 w-4.5" />
                <span>{t.navKyc}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('ledger')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSection === 'ledger' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'
                }`}
              >
                <Coins className="h-4.5 w-4.5" />
                <span>{t.navLedger}</span>
                {stats.pendingTransactionsCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white font-mono text-[9.5px] font-black px-1.5 py-0.1 rounded-full">
                    {stats.pendingTransactionsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('notices')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSection === 'notices' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'
                }`}
              >
                <Bell className="h-4.5 w-4.5" />
                <span>{t.navNotices}</span>
              </button>

            </div>

            {/* Loader panel active during dynamic reloads */}
            {isLoading && (
              <div className="flex items-center justify-center py-20 text-xs font-semibold text-gray-500">
                <span className="inline-block w-5 h-5 border-2 border-t-emerald-600 border-gray-200 rounded-full animate-spin mr-2"></span>
                <span>{t.syncing}</span>
              </div>
            )}

            {/* Section Rendering Router */}
            {!isLoading && (
              <div className="space-y-6">
                
                {activeSection === 'dashboard' && (
                  <Dashboard 
                    stats={stats} 
                    investments={investments} 
                    members={members} 
                    onAddInvestmentClick={() => setShowInvestmentModal(true)}
                    isAdmin={currentProfile?.role === 'admin'}
                    lang={lang}
                  />
                )}

                {activeSection === 'kyc' && (
                  <KYCModule 
                    profile={currentProfile} 
                    onSaveKYC={handleSaveKYC}
                    lang={lang}
                  />
                )}

                {activeSection === 'ledger' && (
                  <TransactionPortlet 
                    transactions={transactions} 
                    currentProfile={currentProfile} 
                    onAddTransaction={handleAddTransaction}
                    onApproveTransaction={handleApproveTransaction}
                    onRejectTransaction={handleRejectTransaction}
                    lang={lang}
                  />
                )}

                {activeSection === 'notices' && (
                  <NoticeBoard 
                    notices={notices} 
                    currentProfile={currentProfile} 
                    onAddNotice={handleAddNotice}
                    lang={lang}
                  />
                )}

              </div>
            )}
          </>
        )}

      </main>

      {/* Admin Deploys Assets: Investment Modal dialog block */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full shadow-2xl p-6 relative space-y-4">
            
            <button 
              type="button"
              onClick={() => setShowInvestmentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-150 text-left">
              <FolderLock className="h-5.5 w-5.5 text-emerald-600 font-bold" />
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm">{t.modalInvTitle}</h4>
                <p className="text-[10px] text-gray-400">{t.modalInvSub}</p>
              </div>
            </div>

            <form onSubmit={handleCreateInvestmentSubmit} className="space-y-4 text-xs font-semibold text-left">
              <div>
                <label className="block text-gray-700 font-bold mb-1">{t.modalInvNameLabel}</label>
                <input
                  type="text"
                  placeholder={t.modalInvNamePlaceholder}
                  value={newInvTitle}
                  onChange={(e) => setNewInvTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">{t.modalInvAmountLabel}</label>
                  <input
                    type="number"
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-250 border-gray-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-gray-800"
                    max={stats.liquidCash}
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {t.modalInvMaxText.replace('{cash}', isBN ? stats.liquidCash.toLocaleString('bn-BD') : stats.liquidCash.toLocaleString('en-US'))}
                  </span>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">{t.modalInvRateLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newInvRate}
                    onChange={(e) => setNewInvRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-250 border-gray-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">{t.modalInvCategoryLabel}</label>
                  <select
                    value={newInvCategory}
                    onChange={(e) => setNewInvCategory(e.target.value)}
                    className="w-full bg-white border border-gray-250 border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="FDR">{isBN ? 'FDR অ্যাকাউন্ট' : 'FDR Account'}</option>
                    <option value="Savings Certificate">{isBN ? 'সঞ্চয়পত্র' : 'Savings Certificate'}</option>
                    <option value="SME Loan">{isBN ? 'পারিবারিক ব্যবসা লোন' : 'Family Business SME Loan'}</option>
                    <option value="Gold">{isBN ? 'স্বর্ণ সামগ্রী' : 'Gold Instruments'}</option>
                    <option value="Other">{isBN ? 'অন্যান্য স্কিম' : 'Other Schemes'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">{t.modalInvMaturityLabel}</label>
                  <input
                    type="text"
                    value={newInvMaturity}
                    onChange={(e) => setNewInvMaturity(e.target.value)}
                    placeholder={isBN ? 'উদা: 5-Year Term অথবা Ongoing' : 'e.g., 5-Year Term or Ongoing'}
                    className="w-full bg-white border border-gray-250 border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  {t.modalInvBtnRelease}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Trust Signatory Bottom Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-medium space-y-1">
        <p>{t.footerCop}</p>
        <p className="text-[10px] text-gray-300 font-medium">{t.footerSub}</p>
      </footer>

    </div>
  );
}

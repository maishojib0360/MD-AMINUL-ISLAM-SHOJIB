/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Briefcase, 
  Users, 
  FileCheck, 
  Percent, 
  Calendar,
  AlertCircle,
  PlusCircle,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { FundStats, Investment, MemberProfile } from '../types';
import { Language, translations } from '../lib/translations';

interface DashboardProps {
  stats: FundStats;
  investments: Investment[];
  members: MemberProfile[];
  onAddInvestmentClick?: () => void;
  isAdmin: boolean;
  lang: Language;
}

export default function Dashboard({ stats, investments, members, onAddInvestmentClick, isAdmin, lang }: DashboardProps) {
  const t = translations[lang];
  const isBN = lang === 'BN';
  
  // Format numbers to BDT Currency with local style
  const formatBDT = (num: number) => {
    if (isBN) {
      return new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
  };

  const dpsKey = isBN ? 'অনুমোদিত DPS' : 'Approved DPS';
  const targetKey = isBN ? 'টার্গেট' : 'Target';

  // 1. Generate historical chart data (e.g. last 6 months)
  // Let's generate nice progress stats: 50 members * 2000 BDT = 100,000 BDT monthly goal.
  const chartData = [
    { month: isBN ? 'জানুয়ারি' : 'Jan', [dpsKey]: 94000, [targetKey]: 100000 },
    { month: isBN ? 'ফেব্রুয়ারি' : 'Feb', [dpsKey]: 96000, [targetKey]: 100000 },
    { month: isBN ? 'মার্চ' : 'Mar', [dpsKey]: 98000, [targetKey]: 100000 },
    { month: isBN ? 'এপ্রিল' : 'Apr', [dpsKey]: 92000, [targetKey]: 100000 },
    { month: isBN ? 'মে' : 'May', [dpsKey]: 98000, [targetKey]: 100000 },
    { month: isBN ? 'জুন (চলতি)' : 'Jun (Current)', [dpsKey]: 86000, [targetKey]: 100000 },
  ];

  // 2. Investment allocation data for Pie Chart
  const pieData = [
    ...investments.map(inv => ({
      name: inv.title.split(' ')[0] || inv.category, 
      value: inv.amount
    })),
    { name: t.liquidBal, value: stats.liquidCash }
  ];

  const COLORS = ['#0d9488', '#0284c7', '#4f46e5', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        
        {/* Total Capital */}
        <div id="kpi-total-capital" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.kpiTotalCapital}</span>
            <div className="text-2xl font-black text-gray-950 font-mono">
              {formatBDT(stats.totalCapital)}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">{t.kpiTotalCapitalSub}</p>
          </div>
          <div className="bg-teal-50 text-teal-600 p-2.5 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Invested Capital */}
        <div id="kpi-invested" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.kpiInvested}</span>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {formatBDT(stats.activeInvestmentsTotal)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium font-semibold">
              {t.kpiInvestedSub.replace('{percent}', ((stats.activeInvestmentsTotal / stats.totalCapital) * 100).toFixed(1))}
            </p>
          </div>
          <div className="bg-sky-50 text-sky-600 p-2.5 rounded-xl">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Liquid Cash */}
        <div id="kpi-liquid" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-medium">{t.kpiLiquid}</span>
            <div className="text-2xl font-black text-indigo-950 font-mono">
              {formatBDT(stats.liquidCash)}
            </div>
            <p className="text-[11px] text-indigo-600 font-medium">{t.kpiLiquidSub}</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        {/* Active Members count */}
        <div id="kpi-members" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.kpiMembers}</span>
            <div className="text-2xl font-black text-gray-900 font-mono">
              {stats.activeMembersCount}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">{t.kpiMembersSub}</p>
          </div>
          <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Graphs Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{t.chartTitle}</h3>
              <p className="text-xs text-gray-400">{t.chartSub}</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-teal-600 font-semibold">
                <span className="w-2.5 h-2.5 bg-teal-500 rounded-xs mr-1"></span>{t.chartCollected}
              </span>
              <span className="flex items-center text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-xs mr-1"></span>{t.chartTarget}
              </span>
            </div>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`৳${value.toLocaleString(isBN ? 'bn-BD' : 'en-US')}`, '']}
                  contentStyle={{ background: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey={dpsKey} stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDps)" />
                <Area type="monotone" dataKey={targetKey} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={1.5} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Allocation Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{t.portfolioTitle}</h3>
            <p className="text-xs text-gray-400">{t.portfolioSub}</p>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `৳${Number(value).toLocaleString(isBN ? 'bn-BD' : 'en-US')}`} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute text-center text-xs">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">{t.investmentTotalLabel}</span>
              <span id="capital-sum-badge" className="text-base font-black text-gray-905 font-mono">{formatBDT(stats.totalCapital).split('.')[0]}</span>
            </div>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[140px] text-[11px]">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full block flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-gray-600 font-medium truncate">{entry.name}</span>
                </div>
                <span className="font-bold text-gray-900 font-mono whitespace-nowrap">
                  {((entry.value / stats.totalCapital) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Active Investments Ledger details */}
      <div id="investments-box" className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{t.investmentTableTitle}</h3>
            <p className="text-xs text-gray-500">{t.investmentTableSub}</p>
          </div>
          {isAdmin && onAddInvestmentClick && (
            <button
              onClick={onAddInvestmentClick}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{t.btnNewInvestment}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.tableHeaderScheme}</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.tableHeaderCategory}</th>
                <th scope="col" className="px-5 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.tableHeaderPrincipal}</th>
                <th scope="col" className="px-5 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.tableHeaderReturn}</th>
                <th scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.tableHeaderMaturity}</th>
                <th scope="col" className="px-5 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.tableHeaderValuation}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              {investments.map((inv) => {
                const growthVal = inv.currentValuation - inv.amount;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-900 max-w-xs truncate">
                      {inv.title}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-medium">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono text-[10px]">
                        {inv.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-950 font-mono">
                      {formatBDT(inv.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black font-mono">
                        <Percent className="h-3 w-3 mr-0.5" />
                        {inv.expectedReturnRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-medium">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{inv.startDate} (~{inv.maturityDate})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-emerald-800 font-mono">{formatBDT(inv.currentValuation)}</span>
                        {growthVal > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center bg-emerald-50 px-1.5 py-0.2 rounded-sm mt-0.5 animate-pulse">
                            <ArrowUpRight className="h-3 w-3 mr-0.2" />
                            +{growthVal.toLocaleString(isBN ? 'bn-BD' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

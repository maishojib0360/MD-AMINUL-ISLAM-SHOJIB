/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  Search, 
  Filter, 
  Coins, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Send,
  User,
  QrCode,
  MapPin
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Transaction, MemberProfile, TransactionStatus } from '../types';
import { Language, translations } from '../lib/translations';

interface TransactionPortletProps {
  transactions: Transaction[];
  currentProfile: MemberProfile | null;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  onApproveTransaction: (id: string, notes: string) => Promise<void>;
  onRejectTransaction: (id: string, notes: string) => Promise<void>;
  lang: Language;
}

export default function TransactionPortlet({
  transactions,
  currentProfile,
  onAddTransaction,
  onApproveTransaction,
  onRejectTransaction,
  lang
}: TransactionPortletProps) {
  if (!currentProfile) return null;

  const t = translations[lang];
  const isBN = lang === 'BN';
  const isAdmin = currentProfile.role === 'admin';

  // State managers
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New DPS submit form state
  const [amount, setAmount] = useState<number>(2000);
  const [monthYear, setMonthYear] = useState<string>('June 2026');
  const [gateway, setGateway] = useState<string>('bKash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false);
  const [slipSuccess, setSlipSuccess] = useState('');
  const [gpsLocation, setGpsLocation] = useState<string>('');
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

  const fetchCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      alert(isBN 
        ? "আপনার ব্রাউজার বা ডিভাইস লোকেশন সমর্থন করে না।" 
        : "Your device or browser does not support Geolocation retrieval.");
      return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        const accuracy = position.coords.accuracy.toFixed(1);
        setGpsLocation(`Lat: ${lat}, Lon: ${lon} (±${accuracy}m)`);
        setIsFetchingLocation(false);
      },
      (error) => {
        console.error("Geolocation retrieval error:", error);
        setIsFetchingLocation(false);
        let errorMsg = isBN 
          ? "লোকেশন পাওয়া যায়নি। অনুগ্রহ করে ডিভাইসের জিপিএস চালু করুন এবং ব্রাউজারে অনুমতি দিন।"
          : "Could not retrieve location. Please check if GPS is enabled and browser permission is granted.";
          
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = isBN 
            ? "লোকেশন পারমিশন প্রত্যাখ্যান করা হয়েছে। ব্রাউজার সিটিংসে পারমিশন চেক করুন।"
            : "Location permission denied. Please enable permission in browser settings.";
        }
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Admin approval note modal-level states
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // --- QR Scanner Section and State ---
  const [isScannerActive, setIsScannerActive] = useState(false);
  const qrcodeInstanceRef = useRef<Html5Qrcode | null>(null);

  // Parse transaction ID intelligently from scanned string or URL link
  const extractTransactionIdfromText = (text: string): string | null => {
    if (!text) return null;

    // 1. Try URL parsing first if it is a link
    try {
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const urlObj = new URL(text);
        const params = ['trxID', 'trx', 'txid', 'tx', 'transaction_id', 'id', 'txnId', 'ref', 'reference'];
        for (const p of params) {
          const val = urlObj.searchParams.get(p);
          if (val && val.match(/^[A-Z0-9]{8,15}$/i)) {
            return val.toUpperCase();
          }
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    // 2. Specific key-value matchers
    const patternList = [
      /(?:TrxID|trxID|Trx\s*ID|Txn\s*ID|Transaction\s*ID|txn_id|trx_id|TID|txid|id)[\s:\-=]*([A-Z0-9]{8,15})/i,
      /ট্রানজেকশন\s*আইডি[\s:\-=]*([A-Z0-9a-zA-Z]{8,15})/
    ];

    for (const regex of patternList) {
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    // 3. Match generic bKash / Nagad alphanumeric txn ID patterns
    // e.g. "BK9Z103XQR" or "AH67Y92S8D" (typically 8 to 12 chars upper case alphanumeric with numbers and letters)
    const words = text.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^A-Za-z0-9]/g, '');
      if (cleaned.length >= 8 && cleaned.length <= 12) {
        const isAlphanumeric = /^[A-Z0-9]+$/i.test(cleaned);
        const hasDigit = /[0-9]/.test(cleaned);
        const hasLetter = /[A-Z]/i.test(cleaned);
        const isIgnoredWord = /^(AMOUNT|NAGAD|BKASH|JUNE|MAY|APRIL|MARCH|FEBRUARY|JANUARY|SUCCESS|REPAYMENT|PAYMENT|LEDGER|MEMBER|PORT)$/i.test(cleaned);
        
        if (isAlphanumeric && hasDigit && hasLetter && !isIgnoredWord) {
          return cleaned.toUpperCase();
        }
      }
    }

    return null;
  };

  const handleQrCodeSuccess = (decodedText: string) => {
    const extractedId = extractTransactionIdfromText(decodedText);
    
    if (extractedId) {
      setTransactionId(extractedId);
      
      // Auto-detect payment operator based on keywords/patterns
      const lowerText = decodedText.toLowerCase();
      if (lowerText.includes('bkash') || extractedId.startsWith('BK')) {
        setGateway('bKash');
      } else if (lowerText.includes('nagad') || lowerText.includes('nagadpay')) {
        setGateway('Nagad');
      }

      stopScanner();
      
      alert(isBN 
        ? `সফলভাবে ট্রানজেকশন আইডি (${extractedId}) স্ক্যান করা হয়েছে!` 
        : `Successfully scanned and auto-filled Transaction ID: ${extractedId}`
      );
    } else {
      const trimmed = decodedText.trim();
      // Simple raw fallback
      if (trimmed && trimmed.length >= 8 && trimmed.length <= 15 && /^[A-Z0-9]+$/i.test(trimmed)) {
        setTransactionId(trimmed.toUpperCase());
        stopScanner();
        alert(isBN 
          ? `আইডিটি সফলভাবে স্ক্যান করা হয়েছে: ${trimmed.toUpperCase()}` 
          : `ID scanned successfully: ${trimmed.toUpperCase()}`
        );
      } else {
        alert(isBN
          ? "সঠিক ট্রানজেকশন আইডি সনাক্ত করা যায়নি। অনুগ্রহ করে রসিদের কিউআরটি স্পষ্ট করে ধরুন।"
          : "Could not detect a valid Transaction ID format. Please scan a clear receipt QR code."
        );
      }
    }
  };

  const startScanner = async () => {
    setIsScannerActive(true);
    setTimeout(async () => {
      try {
        const scannerId = "qr-reader";
        const element = document.getElementById(scannerId);
        if (!element) return;

        if (qrcodeInstanceRef.current) {
          try {
            await qrcodeInstanceRef.current.stop();
          } catch (_) {}
        }

        const scanner = new Html5Qrcode(scannerId);
        qrcodeInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const minSize = Math.min(width, height);
              const size = Math.floor(minSize * 0.75);
              return { width: size, height: size };
            },
            aspectRatio: 1
          },
          (decodedText) => {
            handleQrCodeSuccess(decodedText);
          },
          () => {} // Silent verbosity of scanner frames
        );
      } catch (err) {
        console.warn("Camera environment mode failed, falling back to any query style source", err);
        try {
          if (qrcodeInstanceRef.current) {
            await qrcodeInstanceRef.current.start(
              { facingMode: "user" },
              {
                fps: 15,
                qrbox: { width: 200, height: 200 }
              },
              (decodedText) => {
                handleQrCodeSuccess(decodedText);
              },
              () => {}
            );
          }
        } catch (subErr) {
          alert(isBN 
            ? "ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে ক্যামেরার পারমিশন দিন।" 
            : "Failed to open camera. Please grant camera access permissions to begin scanning."
          );
          setIsScannerActive(false);
        }
      }
    }, 150);
  };

  const stopScanner = async () => {
    if (qrcodeInstanceRef.current) {
      try {
        if (qrcodeInstanceRef.current.isScanning) {
          await qrcodeInstanceRef.current.stop();
        }
      } catch (err) {
        console.warn("Error stopping scanner instance", err);
      }
      qrcodeInstanceRef.current = null;
    }
    setIsScannerActive(false);
  };

  // Safe cleaner hook destructors
  useEffect(() => {
    return () => {
      if (qrcodeInstanceRef.current) {
        qrcodeInstanceRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Filter transactions
  const filteredTxs = transactions.filter(tx => {
    // Member only views their own, admin views all
    const ownerMatch = isAdmin || tx.memberId === currentProfile.uid;
    const statusMatch = filterStatus === 'all' || tx.status === filterStatus;
    
    // Support translation searching matching translated values
    const searchMatch = 
      tx.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.monthYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.monthsList[tx.monthYear as keyof typeof t.monthsList] || tx.monthYear).toLowerCase().includes(searchTerm.toLowerCase());
    
    return ownerMatch && statusMatch && searchMatch;
  });

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlipSuccess('');

    if (!transactionId.trim()) return alert(isBN ? 'ট্রানজেকশন Txn ID দিতে হবে!' : 'Please enter Transaction ID!');
    if (amount <= 0) return alert(isBN ? 'টাকার অংক অবশ্যই ১ এর বেশি হতে হবে!' : 'Amount must be greater than 0!');

    setIsSubmittingSlip(true);
    try {
      await onAddTransaction({
        memberId: currentProfile.uid,
        memberName: currentProfile.name,
        amount,
        monthYear,
        gateway,
        transactionId: transactionId.trim().toUpperCase(),
        gpsLocation: gpsLocation || undefined
      });
      setSlipSuccess(t.txnSucces);
      setTransactionId('');
      setAmount(2000);
      setGpsLocation('');
      setTimeout(() => setSlipSuccess(''), 5050);
    } catch (err) {
      alert(isBN ? 'স্লিপ জমা দেওয়া যায়নি। পুনরায় ট্রাই করুন।' : 'Failed to submit slip. Please try again.');
    } finally {
      setIsSubmittingSlip(false);
    }
  };

  const handleApproveAction = async (id: string) => {
    try {
      await onApproveTransaction(id, approvalNotes.trim() || (isBN ? 'বিকাশ/নগদ স্টেটমেন্টের সাথে মিল পাওয়া গেছে।' : 'Verified with gateway statements.'));
      setActiveReviewId(null);
      setApprovalNotes('');
    } catch (err) {
      alert(isBN ? 'অনুমোদনে সমস্যা হয়েছে।' : 'Error in approval.');
    }
  };

  const handleRejectAction = async (id: string) => {
    if (!approvalNotes.trim()) {
      return alert(isBN ? 'প্রত্যাখ্যান করতে অবশ্যই কারণ (Notes) লিখতে হবে!' : 'Please write audit notes explaining the rejection context!');
    }
    try {
      await onRejectTransaction(id, approvalNotes.trim());
      setActiveReviewId(null);
      setApprovalNotes('');
    } catch (err) {
      alert(isBN ? 'প্রত্যাখ্যান করা যায়নি।' : 'Failed to reject.');
    }
  };

  // Format currency
  const formatBDT = (num: number) => {
    if (isBN) {
      return new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
  };

  // Maps of available months and localized list
  const availableMonths = [
    { value: 'June 2026', label: t.monthJune },
    { value: 'May 2026', label: t.monthMay },
    { value: 'April 2026', label: t.monthApril },
    { value: 'March 2026', label: t.monthMarch },
    { value: 'February 2026', label: t.monthFeb },
    { value: 'January 2026', label: t.monthJan }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Left Side: Submit Slips form (Members side) */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
            <Coins className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{t.txnFormTitle}</h3>
              <p className="text-[10px] text-gray-400">{t.txnFormSub}</p>
            </div>
          </div>

          {slipSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold animate-fade-in">
              {slipSuccess}
            </div>
          )}

          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.txnAmountLabel}</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-10 text-xs font-black font-mono text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  placeholder="2000"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">BDT</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.txnMonthLabel}</label>
              <select
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.txnGatewayLabel}</label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
              >
                <option value="bKash">{isBN ? 'বিকাশ (bKash Mobile App)' : 'bKash Mobile Money'}</option>
                <option value="Nagad">{isBN ? 'নগদ (Nagad App)' : 'Nagad Mobile Wallet'}</option>
                <option value="Bank Transfer">{isBN ? 'ব্যাংক ট্রান্সফার (EBL/Citybank)' : 'EFT Bank Transfer'}</option>
                <option value="Cash">{isBN ? 'নগদ রসিদ (Cash with Slip)' : 'Cash Hand Receipt'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.txnTxnId}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. BK9Z103XQR"
                  className="flex-1 bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-black font-mono text-gray-800 uppercase focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={isScannerActive ? stopScanner : startScanner}
                  className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer flex-shrink-0 ${
                    isScannerActive 
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 shadow-xs'
                  }`}
                  title={isBN ? "রসিদের কিউআর কোড স্ক্যান করুন" : "Scan receipt QR Code"}
                >
                  <QrCode className="h-4.5 w-4.5 text-current" />
                  <span>{isScannerActive ? (isBN ? 'বন্ধ' : 'Stop') : (isBN ? 'স্ক্যান' : 'Scan')}</span>
                </button>
              </div>

              {/* Dynamic QR Scanner Viewfinder Panel */}
              {isScannerActive && (
                <div className="border border-emerald-200 bg-black rounded-xl p-3 relative overflow-hidden animate-fade-in mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-rose-450 text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>{isBN ? 'ক্যামেরা চালু আছে...' : 'Camera Live...'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="text-[10px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border border-rose-300/10"
                    >
                      {isBN ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                  
                  <div className="relative">
                    {/* Camera view container */}
                    <div id="qr-reader" className="w-full bg-slate-900 rounded-lg overflow-hidden border border-gray-800" style={{ minHeight: '220px' }}></div>
                    
                    {/* Viewfinder focus box and scanner laser animation */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
                      <div className="flex justify-between">
                        <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                        <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                      </div>
                      <div className="h-0.5 w-full bg-emerald-400/60 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce"></div>
                      <div className="flex justify-between">
                        <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                        <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[9.5px] text-gray-400 mt-2 text-center leading-normal">
                    {isBN 
                      ? 'মোবাইল স্ক্রিনে বিকাশ বা নগদ অ্যাপের সফল পরিশোধিত রসিদের কিউআরটি ক্যামেরার সামনে ধরুন।' 
                      : 'Position the successful bKash or Nagad receipt transaction QR code within the frame.'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBN ? 'লোকেশন ট্র্যাকিং (GPS Option)' : 'GPS Submission Location'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={gpsLocation}
                  onChange={(e) => setGpsLocation(e.target.value)}
                  placeholder={isBN ? "যেমন: ঢাকা (অথবা অটো জিপিএস ট্যাপ করুন)" : "e.g. Dhaka (or tap auto GPS)"}
                  className="flex-1 bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={fetchCurrentGpsLocation}
                  disabled={isFetchingLocation}
                  className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer flex-shrink-0 ${
                    isFetchingLocation 
                      ? 'bg-amber-50 text-amber-650 border-amber-200 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 shadow-xs'
                  }`}
                  title={isBN ? "বর্তমান জিপিএস লোকেশন নিন" : "Fetch precise GPS location"}
                >
                  <MapPin className={`h-4.5 w-4.5 ${isFetchingLocation ? 'animate-bounce' : 'text-current'}`} />
                  <span>{isFetchingLocation ? (isBN ? 'খুঁজছে...' : 'Locating...') : (isBN ? 'জিপিএস' : 'GPS')}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingSlip}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/10"
            >
              <Send className="h-4 w-4" />
              <span>{t.btnSubmitSlip}</span>
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-2.5 text-left">
          <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4 text-emerald-600 font-bold" />
            <span>{t.rulesHeader}</span>
          </h4>
          <ul className="text-[10px] text-gray-500 list-disc list-inside space-y-1 font-medium">
            <li>{t.rules1}</li>
            <li>{t.rules2}</li>
            <li>{t.rules3}</li>
          </ul>
        </div>
      </div>

      {/* 2. Right Side: Management Console & Transactions filter */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Ledger actions toolbar */}
        <div id="ledger-box" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="text-left">
              <h3 className="font-bold text-gray-900 text-sm">
                {isAdmin ? t.ledgerTitleAdmin : t.ledgerTitleMember}
              </h3>
              <p className="text-[10px] text-gray-400">{t.ledgerSub}</p>
            </div>

            {/* Filter tags */}
            <div className="flex flex-wrap items-center gap-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {st === 'all' 
                    ? (isBN ? 'সব' : 'All') 
                    : st === 'pending' 
                      ? t.pending 
                      : st === 'approved' 
                        ? (isBN ? 'অনুমোদিত' : 'Approved') 
                        : (isBN ? 'প্রত্যাখ্যাত' : 'Rejected')}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.txnSearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 ring-0 text-xs text-gray-800 w-full focus:ring-0 focus:outline-hidden"
            />
          </div>

          {/* List/Audit Container */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTxs.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-100 text-center rounded-xl">
                <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">{t.noTxnFound}</p>
              </div>
            ) : (
              filteredTxs.map((tx) => {
                const isUnderReview = activeReviewId === tx.id;
                const displayMonth = t.monthsList[tx.monthYear as keyof typeof t.monthsList] || tx.monthYear;
                const displayGateway = t.gatewaysList[tx.gateway as keyof typeof t.gatewaysList] || tx.gateway;
                
                return (
                  <div 
                    key={tx.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      tx.status === 'pending' 
                        ? 'bg-amber-50/40 border-amber-200/50 hover:bg-amber-50/60' 
                        : tx.status === 'approved'
                          ? 'bg-gray-50/30 border-gray-100 hover:bg-gray-50/70'
                          : 'bg-rose-50/20 border-rose-100 hover:bg-rose-50/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      
                      {/* Left: Metadata */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-gray-900 text-xs">{tx.memberName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-xs font-semibold font-mono">
                            {displayMonth}
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.2 rounded-xs font-mono font-medium">
                            {displayGateway}
                          </span>
                        </div>
                        
                        <div className="text-[10.5px] text-gray-500 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono">TxnID: <strong className="text-gray-700 font-bold">{tx.transactionId}</strong></span>
                          <span>{t.txnSubmitted} {new Date(tx.submittedAt).toLocaleDateString(isBN ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          {tx.gpsLocation && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 rounded text-[10px]">
                              <MapPin className="h-3 w-3" />
                              <span>{tx.gpsLocation}</span>
                            </span>
                          )}
                        </div>

                        {tx.approvalNotes && (
                          <div className="text-[10.5px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md mt-1 italic border border-emerald-100/50">
                            {t.txnMemo} {tx.approvalNotes}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions or state tags */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                        <div className="text-base font-black text-gray-950 font-mono">{formatBDT(tx.amount)}</div>
                        
                        <div>
                          {tx.status === 'pending' ? (
                            isAdmin ? (
                              !isUnderReview ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReviewId(tx.id);
                                    setApprovalNotes('');
                                  }}
                                  className="px-3 py-1 rounded-lg bg-orange-650 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-all cursor-pointer"
                                >
                                  {t.btnAudit}
                                </button>
                              ) : null
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-amber-200">
                                <Clock className="h-3 w-3" />
                                <span>{t.pending}</span>
                              </span>
                            )
                          ) : tx.status === 'approved' ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-emerald-200">
                              <Check className="h-3 w-3" />
                              <span>{t.approved}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-rose-200">
                              <X className="h-3 w-3" />
                              <span>{t.rejected}</span>
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Expand Auditing block (For Admin verification) */}
                    {isUnderReview && (
                      <div className="mt-3 pt-3 border-t border-amber-200/50 space-y-3 animate-fade-in text-left">
                        <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">{t.auditConsoleTitle}</h5>
                        
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">{t.auditMemoLabel}</label>
                          <input
                            type="text"
                            placeholder={t.auditMemoPlaceholder}
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs font-medium text-gray-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleApproveAction(tx.id)}
                            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center space-x-0.5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{t.btnApprove}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRejectAction(tx.id)}
                            className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center space-x-0.5 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>{t.btnReject}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveReviewId(null)}
                            className="px-2.5 py-1.5 text-xs text-gray-400 font-bold hover:text-gray-700 cursor-pointer"
                          >
                            {t.btnCancel}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, KeyRound, Mail, Phone, User, Calendar, Users, Eye, EyeOff, CheckCircle, Smartphone, AlertCircle, ArrowLeft, RefreshCw, Fingerprint } from 'lucide-react';
import { MemberProfile } from '../types';
import { Language } from '../lib/translations';

interface AuthProps {
  members: MemberProfile[];
  onLoginSuccess: (member: MemberProfile) => void;
  onRegisterSuccess: (newMember: MemberProfile) => void;
  lang: Language;
}

export default function Auth({ members, onLoginSuccess, onRegisterSuccess, lang }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginRole, setLoginRole] = useState<'member' | 'admin'>('member');

  // Form states - Forgot Password workflow
  const [forgotStep, setForgotStep] = useState<'none' | 'enter_identifier' | 'verify_otp' | 'reset_password'>('none');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotEnteredOtp, setForgotEnteredOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmNewPassword, setForgotConfirmNewPassword] = useState('');
  const [forgotMember, setForgotMember] = useState<MemberProfile | null>(null);

  // Form states - Registration verification loop with simulated OTP
  const [regOtpStep, setRegOtpStep] = useState(false);
  const [regGeneratedOtp, setRegGeneratedOtp] = useState('');
  const [regEnteredOtp, setRegEnteredOtp] = useState('');
  const [temporaryMember, setTemporaryMember] = useState<MemberProfile | null>(null);

  // Form states - Login
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone
  const [loginPassword, setLoginPassword] = useState('');

  // Form states - Registration
  const [regName, setRegName] = useState('');
  const [regContact, setRegContact] = useState(''); // Email or Phone number
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [regNid, setRegNid] = useState(''); // Passport / NID / Birth Cert unified field

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isBN = lang === 'BN';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg(isBN ? 'দয়া করে আপনার ফোন নম্বর অথবা ইমেইল দিন।' : 'Please enter your phone number or email.');
      return;
    }
    if (loginPassword.length < 8) {
      setErrorMsg(isBN ? 'পাসওয়ার্ড কমপক্ষে ৮ সংখ্যার বা অক্ষরের হতে হবে।' : 'Password must be at least 8 characters (alphas/numbers).');
      return;
    }

    // Match by email or phone
    const cleanId = loginIdentifier.toLowerCase().trim();
    const cleanPhoneId = cleanId.replace('+88', '');

    const userMatched = members.find(m => {
      const dbEmail = m.email?.toLowerCase().trim();
      const dbPhone = m.phone?.trim() || '';
      const dbPhoneClean = dbPhone.replace('+88', '');
      return (dbEmail === cleanId || dbPhone === cleanId || dbPhoneClean === cleanPhoneId);
    });

    if (!userMatched) {
      setErrorMsg(isBN ? 'এই ফোন/ইমেইল দিয়ে কোনো অ্যাকাউন্ট নিবন্ধিত নেই।' : 'No registered account found with this phone/email.');
      return;
    }

    // Role validation
    if (loginRole === 'admin' && userMatched.role !== 'admin') {
      setErrorMsg(isBN 
        ? 'এই অ্যাকাউন্টটি অ্যাডমিন নয়। দয়া করে "সদস্য" অপশন সিলেক্ট করে লগইন করুন।' 
        : 'This account does not have Admin privileges. Please select the "Member" option to log in.');
      return;
    }

    if (loginRole === 'member' && userMatched.role === 'admin') {
      setErrorMsg(isBN 
        ? 'আপনার অ্যাকাউন্টটি অ্যাডমিন। দয়া করে "এডমিন" অপশন সিলেক্ট করে লগইন করুন।' 
        : 'This is an Admin account. Please select the "Admin" option to log in.');
      return;
    }

    // For simulation/local persistent storage checks
    const savedPassword = userMatched.password || '12345678';
    if (loginPassword !== savedPassword) {
      setErrorMsg(isBN ? 'ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।' : 'Incorrect password! Please try again.');
      return;
    }

    // Login successful
    onLoginSuccess(userMatched);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg(isBN ? 'নাম আবশ্যক।' : 'Name is required.');
      return;
    }

    const contact = regContact.trim();
    if (!contact) {
      setErrorMsg(isBN ? 'ইমেইল অথবা মোবাইল নম্বর আবশ্যক।' : 'Email or phone number is required.');
      return;
    }

    let email = '';
    let phone = '';

    if (contact.includes('@')) {
      email = contact;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMsg(isBN ? 'সঠিক ইমেইল ঠিকানা দিন।' : 'Please enter a valid email address.');
        return;
      }
    } else {
      phone = contact;
      // standard Bangladeshi phone number usually has 11 digits
      if (phone.length < 11 || !/^\d+$/.test(phone)) {
        setErrorMsg(isBN ? '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন।' : 'Please enter a valid 11-digit phone number.');
        return;
      }
    }

    if (regPassword.length < 8) {
      setErrorMsg(isBN ? 'পাসওয়ার্ড কমপক্ষে ৮ সংখ্যার বা অক্ষরের হতে হবে।' : 'Password must be at least 8 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg(isBN ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।' : 'Password and Confirm Password do not match.');
      return;
    }

    if (!regNid.trim() || regNid.length < 8) {
      setErrorMsg(isBN 
        ? 'সঠিক পাসপোর্ট, এনআইডি অথবা জন্ম নিবন্ধন নম্বর দিন (কমপক্ষে ৮ সংখ্যা)।' 
        : 'Please enter a valid NID, Passport or Birth Registration number (minimum 8 characters).');
      return;
    }

    // Check duplicates
    if (phone) {
      const phoneExists = members.some(m => m.phone === phone);
      if (phoneExists) {
        setErrorMsg(isBN ? 'এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।' : 'This phone number is already registered.');
        return;
      }
    }
    if (email) {
      const emailExists = members.some(m => m.email?.toLowerCase().trim() === email.toLowerCase());
      if (emailExists) {
        setErrorMsg(isBN ? 'এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।' : 'This email is already registered.');
        return;
      }
    }

    // Create a new member profile
    const newUid = `AP-${members.length + 101}`;
    const formattedMemberId = `ASFF-${String(members.length + 1).padStart(4, '0')}`;
    const newMember: MemberProfile = {
      uid: newUid,
      memberId: formattedMemberId,
      name: regName.trim(),
      email: email,
      phone: phone,
      password: regPassword,
      nid: regNid.trim(), // Save Passport/NID/BC in NID
      role: 'member',
      status: 'pending_kyc', // Pending admin approval
      birthDate: regDob,
      gender: regGender || 'Male',
      bloodGroup: '',
      paternalName: '',
      maternalName: '',
      smoker: false,
      chronicIllness: 'None',
      height: 170,
      weight: 65,
      nominees: [],
      birthRegistrationNo: '',
      passportNo: '',
      currentAddress: '',
      permanentAddress: '',
      occupation: '',
      companyName: '',
      monthlyIncome: 0,
      incomeSource: '',
      tin: '',
      bankAccountDetails: '',
      joinedAt: new Date().toISOString(),
      totalDPSPaid: 0
    };

    // For physical demonstration and sandbox testing, we intercept registration with a Mobile OTP!
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    setRegGeneratedOtp(otpCode);
    setTemporaryMember(newMember);
    setRegOtpStep(true);
    setSuccessMsg(isBN 
      ? `নিবন্ধনের ওটিপি প্রেরণ করা হয়েছে! ডেমো কোড: ${otpCode}` 
      : `Registration verification OTP sent to contact! Demo OTP Code: ${otpCode}`);
    setErrorMsg('');
  };

  // Helper verifying user entered OTP during registration
  const handleVerifyRegOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regEnteredOtp !== regGeneratedOtp) {
      setErrorMsg(isBN 
        ? 'ভুল ওটিপি কোড! দয়া করে সঠিক কোড দিন অথবা আবার কোড পাঠান।' 
        : 'Invalid OTP code entered! Please check the code or resend.');
      return;
    }

    if (!temporaryMember) return;

    // Successful OTP verification
    onRegisterSuccess(temporaryMember);
    setSuccessMsg(isBN 
      ? 'মোবাইল ওটিপি সফলভাবে যাচাই করা হয়েছে এবং অ্যাকাউন্ট তৈরি হয়েছে।' 
      : 'Mobile OTP verified successfully! Account container initialized.');
    
    setRegOtpStep(false);
    setRegEnteredOtp('');
    setTemporaryMember(null);

    // Auto transition back to login
    const contactUsed = regContact.trim();
    setTimeout(() => {
      setIsLogin(true);
      setLoginIdentifier(contactUsed);
      setLoginPassword(regPassword);
      setSuccessMsg('');
    }, 1800);
  };

  // Helper handling forgot password search / code dispatch
  const handleForgotSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!forgotIdentifier.trim()) {
      setErrorMsg(isBN ? 'দয়া করে আপনার ফোন অথবা ইমেইল দিন।' : 'Please specify registration contact.');
      return;
    }

    const searchStr = forgotIdentifier.trim().toLowerCase();
    const cleanSearchStr = searchStr.replace('+88', '');

    const found = members.find(m => {
      const dbEmail = m.email?.toLowerCase().trim();
      const dbPhone = m.phone?.trim() || '';
      const dbPhoneClean = dbPhone.replace('+88', '');
      return (dbEmail === searchStr || dbPhone === searchStr || dbPhoneClean === cleanSearchStr);
    });

    if (!found) {
      setErrorMsg(isBN 
        ? 'এই ফোন/ইমেইল দিয়ে কোনো অ্যাকাউন্ট রেকর্ড পাওয়া যায়নি।' 
        : 'No registered user found containing this contact reference.');
      return;
    }

    // Match found, issue simulated SMS OTP
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setForgotMember(found);
    setForgotGeneratedOtp(generatedCode);
    setForgotStep('verify_otp');
    setSuccessMsg(isBN 
      ? `পাসওয়ার্ড পুনরুদ্ধারের ওটিপি পাঠানো হয়েছে। ডেমো কোড: ${generatedCode}` 
      : `Recovery SMS OTP dispatched! Sandbox Demo OTP Code: ${generatedCode}`);
  };

  // Helper verifying forgot password OTP
  const handleVerifyForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (forgotEnteredOtp !== forgotGeneratedOtp) {
      setErrorMsg(isBN ? 'ভুল ওটিপি কোড! সঠিক কোডটি পুনরায় লিখুন।' : 'Invalid OTP code! Please try again.');
      return;
    }

    setForgotStep('reset_password');
    setSuccessMsg(isBN ? 'ওটিপি যাচাই সম্পন্ন হয়েছে। নতুন পাসওয়ার্ড সেট করুন।' : 'OTP verification successful! Enter your new password details.');
  };

  // Confirm password update
  const handleVerifyResetPwdConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (forgotNewPassword.length < 8) {
      setErrorMsg(isBN ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' : 'Password must be at least 8 characters.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmNewPassword) {
      setErrorMsg(isBN ? 'পাসওয়ার্ড দুটি মিলছে না!' : 'Passwords do not match!');
      return;
    }

    if (!forgotMember) return;

    // Build user update object with new password
    const updatedUser: MemberProfile = {
      ...forgotMember,
      password: forgotNewPassword
    };

    // Propagate up to db and memory
    onRegisterSuccess(updatedUser);

    setSuccessMsg(isBN 
      ? 'পাসওয়ার্ড সফলভাবে রিসেট সম্পন্ন হয়েছে! অনুগ্রহ করে নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' 
      : 'Password reset successful! Please log in using your new credentials.');

    setTimeout(() => {
      // Clear forgot workflow states
      setForgotStep('none');
      setForgotIdentifier('');
      setForgotGeneratedOtp('');
      setForgotEnteredOtp('');
      setForgotNewPassword('');
      setForgotConfirmNewPassword('');
      setForgotMember(null);
      
      // Focus login form
      setIsLogin(true);
      setLoginIdentifier(updatedUser.phone || updatedUser.email || '');
      setLoginPassword(forgotNewPassword);
      setSuccessMsg('');
    }, 2000);
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-gray-150 shadow-xl overflow-hidden p-6 space-y-6 text-left" id="auth-panel">
      
      {/* Brand Icon Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex bg-emerald-50 text-emerald-700 p-3 rounded-2xl">
          <Shield className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-lg font-black text-gray-950 uppercase tracking-tight">
          {isBN ? 'আমাদের স্বপ্ন ফ্যামিলি ফান্ড' : 'Amader Shopno Family Fund'}
        </h2>
        <p className="text-xs text-emerald-600 font-semibold tracking-tight">
          {isBN ? 'ফ্যামিলি ফান্ড ও ইন্স্যুরেন্স ম্যানেজমেন্ট প্ল্যাটফর্ম' : 'Family Fund & KYC Record Registry'}
        </p>
        <p className="text-xs text-gray-500 italic font-medium pt-1 border-t border-gray-100 mt-1 max-w-sm mx-auto">
          {isBN 
            ? '“একতাবদ্ধ সঞ্চয়ে সমৃদ্ধি, সুদৃঢ় হোক পারিবারিক বন্ধন”' 
            : '“Unity in savings, prosperity in family bonds”'}
        </p>
      </div>

      {/* Tabs list Toggle - Hide on OTP or Reset steps */}
      {forgotStep === 'none' && !regOtpStep && (
        <div className="flex border-b border-gray-100 pb-1">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 pb-3 text-xs font-bold text-center transition-all cursor-pointer ${
              isLogin ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {isBN ? 'লগইন (Login)' : 'Member Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 pb-3 text-xs font-bold text-center transition-all cursor-pointer ${
              !isLogin ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {isBN ? 'রেজিস্ট্রেশন (Register)' : 'New Registration'}
          </button>
        </div>
      )}

      {/* Error & Success Feeds */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-850 p-3 rounded-xl text-xs font-semibold animate-shake">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-850 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {forgotStep !== 'none' ? (
        /* FORGOT PASSWORD WORKFLOW PANEL */
        <div className="space-y-4 animate-fade-in text-gray-700 text-xs">
          <div className="flex items-center space-x-2 text-emerald-800 pb-2 border-b border-emerald-50">
            <button
              type="button"
              onClick={() => {
                setForgotStep('none');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="p-1 hover:bg-emerald-50 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-xs sm:text-sm">
              {isBN ? 'পাসওয়ার্ড পুনরুদ্ধার করার পদ্ধতি (Password Reset Method)' : 'Password Reset Recovery Portal'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] sm:text-[11px] text-gray-600 leading-normal space-y-1">
            <div className="flex items-center text-emerald-700 gap-1.5 font-bold">
              <Fingerprint className="h-4.5 w-4.5" />
              <span>{isBN ? 'ব্যবহার নির্দেশিকা ও নিরাপত্তা তথ্য' : 'Operating Rules & Security Information'}</span>
            </div>
            <p className="font-medium text-gray-500">
              {isBN 
                ? 'পদ্ধতি: ১. মোবাইল/ইমেইল লিখুন -> ২. ওটিপি দিন -> ৩. নতুন পাসওয়ার্ড সেট করুন। প্রোডাকশনে এটি গেটওয়ের মাধ্যমে আপনার ক্যারিয়ারে সরাসরি ৩ সেকেন্ডে এসএমএস ওটিপি আকারে পাঠাবে।' 
                : 'Method: 1. Input ID -> 2. Enter carrier-delivered OTP -> 3. Set custom new password. Under production, SMS credits deliver this code in 3 seconds.'}
            </p>
          </div>

          {forgotStep === 'enter_identifier' && (
            <form onSubmit={handleForgotSearch} className="space-y-4 font-semibold">
              <div>
                <label className="block mb-1.5 font-bold text-gray-800">
                  {isBN ? 'আপনার নিবন্ধিত মোবাইল নম্বর অথবা ইমেইল' : 'Registered Mobile Number or Email'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder={isBN ? 'উদা: 017XXXXXXXX অথবা user@email.com' : 'e.g., 017XXXXXXXX or user@email.com'}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-hidden text-gray-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                {isBN ? 'ওটিপি কোড পাঠান (Generate OTP)' : 'Send Verification Recovery OTP'}
              </button>
            </form>
          )}

          {forgotStep === 'verify_otp' && (
            <form onSubmit={handleVerifyForgotOtp} className="space-y-4 font-semibold">
              <div className="bg-amber-50 border border-amber-250 p-2 text-center text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1.5 rounded-lg">
                <span>📱 {isBN ? 'নিরাপত্তা কোড (রিসেট ওটিপি):' : 'Reset Verification OTP:'}</span>
                <span className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-250 font-black tracking-wider text-xs">{forgotGeneratedOtp}</span>
              </div>
              <div>
                <label className="block mb-1.5 font-bold text-gray-800">
                  {isBN ? 'মোবাইলে পাঠানো ৬-ডিজিটের কোডটি লিখুন' : 'Enter 6-Digit OTP received'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={forgotEnteredOtp}
                  onChange={(e) => setForgotEnteredOtp(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 text-center font-mono text-base font-black tracking-widest text-emerald-950 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                {isBN ? 'কোড যাচাই করুন' : 'Verify Recovery OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const rng = String(Math.floor(100000 + Math.random() * 900000));
                  setForgotGeneratedOtp(rng);
                  setSuccessMsg(isBN ? `নতুন পুনরুদ্ধার কোড পাঠানো হয়েছে: ${rng}` : `New recovery OTP issued: ${rng}`);
                }}
                className="w-full text-center text-[10px] text-emerald-600 font-extrabold hover:underline py-1 cursor-pointer block"
              >
                {isBN ? 'ওটিপি পাননি? পুনরায় কোড পাঠান' : 'Did not receive OTP? Resend Code'}
              </button>
            </form>
          )}

          {forgotStep === 'reset_password' && (
            <form onSubmit={handleVerifyResetPwdConfirm} className="space-y-4">
              <div>
                <label className="block mb-1 font-bold text-gray-800">
                  {isBN ? 'নতুন পাসওয়ার্ড সেট করুন (কমপক্ষে ৮ সংখ্যা/অক্ষর)' : 'Set New Password (At least 8 chars)'}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-hidden font-mono text-gray-900"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-800">
                  {isBN ? 'নতুন পাসওয়ার্ডটি নিশ্চিত করুন' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={forgotConfirmNewPassword}
                  onChange={(e) => setForgotConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-hidden font-mono text-gray-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all cursor-pointer shadow-md"
              >
                {isBN ? 'নতুন পাসওয়ার্ড সংরক্ষণ করুন' : 'Update & Save New Password'}
              </button>
            </form>
          )}
        </div>
      ) : regOtpStep ? (
        /* REGISTRATION OTP WORKFLOW PANEL */
        <div className="space-y-4 animate-fade-in text-gray-700 text-xs text-left">
          <div className="flex items-center space-x-2 text-emerald-800 pb-2 border-b border-emerald-50">
            <button
              type="button"
              onClick={() => {
                setRegOtpStep(false);
                setTemporaryMember(null);
                setRegEnteredOtp('');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="p-1 hover:bg-emerald-50 rounded-lg cursor-pointer animate-pulse"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-xs sm:text-sm">
              {isBN ? 'মোবাইল সিকিউরিটি ওটিপি (Registration SMS Verification)' : 'Registration SMS OTP Verification'}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-xl text-[10px] sm:text-[11px] text-gray-600 leading-normal space-y-1">
            <div className="flex items-center text-teal-700 gap-1.5 font-bold">
              <Smartphone className="h-4.5 w-4.5" />
              <span>{isBN ? 'ওটিপি যাচাইকরণের উদ্দেশ্য ও পদ্ধতি' : 'Simulated Sandbox OTP System'}</span>
            </div>
            <p className="font-medium text-gray-500 leading-relaxed">
              {isBN 
                ? 'অননুমোদিত বা ভুয়া মোবাইল নম্বর রেজিস্ট্রেশন রোধে স্বয়ংক্রিয় ওটিপি যাচাই প্রয়োজন। ডেমো সিস্টেমে ইনস্ট্যান্ট কোডটি নিচে দেখানো কারেন্ট বক্সে রয়েছে।' 
                : 'Protects the Family Fund from spoofed registration. High-fidelity verification prevents unauthorized records.'}
            </p>
          </div>

          <form onSubmit={handleVerifyRegOtp} className="space-y-4 font-semibold">
            <div className="bg-amber-50 border border-amber-250 p-2.5 text-center font-bold text-amber-950 rounded-lg flex items-center justify-center gap-1.5">
              <span>🔑 {isBN ? 'রেজিস্ট্রেশনের ওটিপি কোড:' : 'Your Signup Verification OTP:'}</span>
              <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 tracking-wider font-extrabold text-xs">{regGeneratedOtp}</span>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-gray-800">
                {isBN ? 'মোবাইলে প্রেরিত ৬-ডিজিটের কোড লিখুন' : 'Enter 6-Digit OTP Registration Code'}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={regEnteredOtp}
                onChange={(e) => setRegEnteredOtp(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 text-center font-mono text-base font-extrabold tracking-widest text-emerald-950 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              {isBN ? 'যাচাই করুন এবং অ্যাকাউন্ট চালু করুন' : 'Verify & Enable Family Fund Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                const rngOtp = String(Math.floor(100000 + Math.random() * 900000));
                setRegGeneratedOtp(rngOtp);
                setSuccessMsg(isBN ? `নতুন সিকিউরিটি কোড ওটিপি প্রেরণ করা হয়েছে: ${rngOtp}` : `New sign-up OTP verified: ${rngOtp}`);
              }}
              className="w-full text-center text-[10px] text-teal-600 font-extrabold hover:underline py-1 cursor-pointer block"
            >
              🔄 {isBN ? 'ওটিপি কোড পাননি? পুনরায় পাঠান' : 'Not received SMS Code? Click to Resend OTP'}
            </button>
          </form>
        </div>
      ) : isLogin ? (
        /* LOGIN FORM */
        <form onSubmit={handleLogin} className="space-y-4 font-semibold text-xs text-gray-700">
          
          {/* Active Role Selector */}
          <div>
            <label className="block mb-1.5 font-bold text-gray-800">
              {isBN ? 'লগইন রোলের অপশন (Select Login Role)' : 'Select Login Role'}
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50">
              <button
                type="button"
                onClick={() => {
                  setLoginRole('member');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  loginRole === 'member' 
                    ? 'bg-white text-emerald-700 shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:text-gray-850 bg-transparent border border-transparent'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>{isBN ? 'সদস্য (Member)' : 'Member'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole('admin');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  loginRole === 'admin' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-850 bg-transparent border border-transparent'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>{isBN ? 'এডমিন (Admin)' : 'Admin'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-gray-800">
              {isBN ? 'মোবাইল নম্বর অথবা ইমেইল' : 'Mobile Number or Email'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Smartphone className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={isBN ? 'উদা: 017XXXXXXXX অথবা user@email.com' : 'e.g., 017XXXXXXXX or user@email.com'}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-gray-800">
                {isBN ? 'পাসওয়ার্ড (কমপক্ষে ৮ সংখ্যা/অক্ষর)' : 'Password (Min 8 Characters)'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotStep('enter_identifier');
                  setForgotIdentifier(loginIdentifier);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[10px] text-emerald-600 hover:text-emerald-705 font-black hover:underline cursor-pointer"
              >
                {isBN ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-gray-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Fillers */}
          <div className="space-y-1 pt-1 border-t border-dashed border-gray-100 mt-2">
            <span className="block text-[10px] text-gray-450 font-bold uppercase tracking-wider">{isBN ? 'ডেমো অ্যাকাউন্ট টেস্ট করুন:' : 'Test with Demo Accounts:'}</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginIdentifier('01815556677');
                  setLoginPassword('12345678');
                  setLoginRole('member');
                  setErrorMsg('');
                }}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-100/70 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>👥</span>
                <span>{isBN ? 'সদস্য টেস্ট' : 'Demo Member'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginIdentifier('01711223344');
                  setLoginPassword('12345678');
                  setLoginRole('admin');
                  setErrorMsg('');
                }}
                className="text-[10px] font-bold text-teal-700 bg-teal-50/70 hover:bg-teal-100 border border-teal-100/70 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🛡️</span>
                <span>{isBN ? 'এডমিন টেস্ট' : 'Demo Admin'}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            {isBN ? 'লগইন করুন' : 'Login Securely'}
          </button>
          
          <p className="text-[10px] text-gray-400 text-center font-medium mt-2">
            {isBN 
              ? 'প্রথমবারের ব্যবহারের পাসওয়ার্ড ও ডেমো ডাটা অ্যাক্সেস করতে উপরের ডেমো বাটনগুলো ট্যাপ করুন।'
              : 'Tap the demo buttons above to instantly load test data and credentials.'}
          </p>
        </form>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleRegister} className="space-y-4 font-semibold text-xs text-gray-700 max-h-[450px] overflow-y-auto pr-1">
          <div>
            <label className="block mb-1 font-bold text-gray-800">{isBN ? 'পূর্ণ নাম (Full Name)' : 'Full Name'}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={isBN ? 'উদা: মো: সাব্বির রহমান' : 'e.g., Mohammad Sabbir'}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-hidden text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-gray-800">
              {isBN ? 'মোবাইল নম্বর অথবা ইমেইল ঠিকানা' : 'Mobile Number or Email Address'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={regContact}
                onChange={(e) => setRegContact(e.target.value)}
                placeholder={isBN ? 'উদা: 017XXXXXXXX অথবা name@mail.com' : 'e.g., 017XXXXXXXX or name@mail.com'}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-hidden text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-gray-800">{isBN ? 'জন্মতারিখ' : 'Date of Birth'}</label>
              <input
                type="date"
                required
                value={regDob}
                onChange={(e) => setRegDob(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2 px-3 focus:outline-hidden text-gray-900"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-gray-800">{isBN ? 'লিঙ্গ' : 'Gender'}</label>
              <select
                value={regGender}
                onChange={(e) => setRegGender(e.target.value as any)}
                required
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-hidden text-gray-900"
              >
                <option value="">{isBN ? 'নির্বাচন করুন' : 'Select'}</option>
                <option value="Male">{isBN ? 'পুরুষ' : 'Male'}</option>
                <option value="Female">{isBN ? 'নারী' : 'Female'}</option>
                <option value="Other">{isBN ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block mb-1 font-bold text-gray-800">
                {isBN ? 'পাসপোর্ট / এনআইডি / জন্ম নিবন্ধন নম্বর' : 'Passport / NID / Birth Cert Number'}
              </label>
              <input
                type="text"
                required
                value={regNid}
                onChange={(e) => setRegNid(e.target.value)}
                placeholder={isBN ? 'কমপক্ষে ৮ অক্ষরের নম্বর দিন' : 'Minimum 8 characters limit'}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-hidden text-gray-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-gray-800">
                {isBN ? 'পাসওয়ার্ড সেট করুন' : 'Set Password'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-hidden font-mono text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold text-gray-800">
                {isBN ? 'কনফার্ম পাসওয়ার্ড' : 'Confirm Password'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-hidden font-mono text-gray-900"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer text-xs uppercase tracking-wide"
          >
            {isBN ? 'ওটিপি পাঠান এবং পরবর্তী যান' : 'Send OTP & Register'}
          </button>
        </form>
      )}

    </div>
  );
}

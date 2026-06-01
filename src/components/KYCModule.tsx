/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Users2, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Trash2, 
  Plus, 
  HeartHandshake,
  ShieldAlert,
  Loader2,
  MapPin,
  KeyRound
} from 'lucide-react';
import { MemberProfile, Nominee, BloodGroup } from '../types';
import { Language, translations } from '../lib/translations';

interface KYCModuleProps {
  profile: MemberProfile | null;
  onSaveKYC: (updated: Partial<MemberProfile>) => Promise<void>;
  lang: Language;
}

export default function KYCModule({ profile, onSaveKYC, lang }: KYCModuleProps) {
  if (!profile) return null;

  const t = translations[lang];

  // Active sub-tab inside KYC
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'nominees' | 'password'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password alteration states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Form states initialized from profile
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [nid, setNid] = useState(profile.nid || '');
  const [birthDate, setBirthDate] = useState(profile.birthDate || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(profile.bloodGroup || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>(profile.gender || '');
  
  // Custom Family KYC fields
  const [paternalName, setPaternalName] = useState(profile.paternalName || '');
  const [maternalName, setMaternalName] = useState(profile.maternalName || '');
  const [birthRegistrationNo, setBirthRegistrationNo] = useState(profile.birthRegistrationNo || '');
  const [passportNo, setPassportNo] = useState(profile.passportNo || '');
  const [currentAddress, setCurrentAddress] = useState(profile.currentAddress || '');
  const [permanentAddress, setPermanentAddress] = useState(profile.permanentAddress || '');
  const [occupation, setOccupation] = useState(profile.occupation || '');
  const [companyName, setCompanyName] = useState(profile.companyName || '');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(profile.monthlyIncome || 0);
  const [incomeSource, setIncomeSource] = useState(profile.incomeSource || '');
  const [tin, setTin] = useState(profile.tin || '');
  const [bankAccountDetails, setBankAccountDetails] = useState(profile.bankAccountDetails || '');
  const [gpsLocation, setGpsLocation] = useState(profile.gpsLocation || '');
  const [isLocating, setIsLocating] = useState(false);

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === 'BN' ? 'আপনার ব্রাউজার লোকেশন সমর্থন করে না।' : 'Your browser does not support geolocation.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setGpsLocation(`Lat: ${lat}, Lon: ${lon}`);
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        setIsLocating(false);
        alert(lang === 'BN' 
          ? 'লোকেশন পাওয়া যায়নি। অনুগ্রহ করে অনুমতি দিন অথবা জিপিএস চালু করুন।' 
          : 'Could not fetch GPS. Please grant system or browser permission.');
      },
      { timeout: 8000 }
    );
  };
  
  // Medical/Lifestyle states
  const [smoker, setSmoker] = useState(profile.smoker || false);
  const [chronicIllness, setChronicIllness] = useState(profile.chronicIllness || 'None');
  const [height, setHeight] = useState<number>(profile.height || 170);
  const [weight, setWeight] = useState<number>(profile.weight || 65);

  // Nominees list space
  const [nominees, setNominees] = useState<Nominee[]>(
    profile.nominees && profile.nominees.length > 0
      ? [...profile.nominees]
      : [{ name: '', relation: 'Spouse', nidOrBirthCert: '', sharePercent: 100, birthDate: '' }]
  );

  // Sync state if profile changes (Simulation swap)
  useEffect(() => {
    setName(profile.name || '');
    setPhone(profile.phone || '');
    setNid(profile.nid || '');
    setBirthDate(profile.birthDate || '');
    setBloodGroup(profile.bloodGroup || '');
    setGender(profile.gender || '');
    
    // Sync custom fields
    setPaternalName(profile.paternalName || '');
    setMaternalName(profile.maternalName || '');
    setBirthRegistrationNo(profile.birthRegistrationNo || '');
    setPassportNo(profile.passportNo || '');
    setCurrentAddress(profile.currentAddress || '');
    setPermanentAddress(profile.permanentAddress || '');
    setOccupation(profile.occupation || '');
    setCompanyName(profile.companyName || '');
    setMonthlyIncome(profile.monthlyIncome || 0);
    setIncomeSource(profile.incomeSource || '');
    setTin(profile.tin || '');
    setBankAccountDetails(profile.bankAccountDetails || '');
    setGpsLocation(profile.gpsLocation || '');
    
    setSmoker(profile.smoker || false);
    setChronicIllness(profile.chronicIllness || 'None');
    setHeight(profile.height || 170);
    setWeight(profile.weight || 65);
    setNominees(
      profile.nominees && profile.nominees.length > 0
        ? [...profile.nominees]
        : [{ name: '', relation: 'Spouse', nidOrBirthCert: '', sharePercent: 100, birthDate: '' }]
    );
    setSuccessMsg('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPwdError('');
    setPwdSuccess('');
  }, [profile]);

  // Nominee actions
  const handleAddNominee = () => {
    setNominees([
      ...nominees,
      { name: '', relation: 'Spouse', nidOrBirthCert: '', sharePercent: 0 }
    ]);
  };

  const handleRemoveNominee = (index: number) => {
    const updated = nominees.filter((_, i) => i !== index);
    setNominees(updated);
  };

  const handleNomineeChange = (index: number, field: keyof Nominee, value: any) => {
    const updated = [...nominees];
    if (field === 'sharePercent') {
      updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setNominees(updated);
  };

  // BMI Calculator
  const heightInMeters = height / 100;
  const bmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)) : 0;
  
  const getBMICategory = (val: number) => {
    if (val < 18.5) return { label: t.bmiUnderweight, color: 'text-amber-600 bg-amber-50' };
    if (val < 25) return { label: t.bmiHealthy, color: 'text-emerald-700 bg-emerald-50' };
    if (val < 30) return { label: t.bmiOverweight, color: 'text-orange-600 bg-orange-50' };
    return { label: t.bmiObese, color: 'text-rose-600 bg-rose-50' };
  };

  const bmiCat = getBMICategory(bmi);

  // Password alteration logic handler
  const handlePasswordChange = async () => {
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword) {
      setPwdError(lang === 'BN' ? 'বর্তমান পাসওয়ার্ডটি প্রদান করুন।' : 'Please enter your current password.');
      return;
    }

    const actualSavedPassword = profile.password || '12345678';
    if (currentPassword !== actualSavedPassword) {
      setPwdError(lang === 'BN' ? 'বর্তমান পাসওয়ার্ডটি সঠিক নয়!' : 'The current password you entered is incorrect!');
      return;
    }

    if (newPassword.length < 8) {
      setPwdError(lang === 'BN' ? 'নতুন পাসওয়ার্ডটি কমপক্ষে ৮ সংখ্যার হতে হবে।' : 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdError(lang === 'BN' ? 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!' : 'New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPwdError(lang === 'BN' ? 'নতুন পাসওয়ার্ডটি আপনার বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে।' : 'New password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveKYC({ password: newPassword });
      setPwdSuccess(lang === 'BN' ? 'আপনার পাসওয়ার্ডটি সফলভবে পরিবর্তন করা হয়েছে!' : 'Your password has been successfully changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error(err);
      setPwdError(lang === 'BN' ? 'পাসওয়ার্ড পরিবর্তনে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nominee shares math calculation
  const totalNomineeShare = nominees.reduce((sum, nom) => sum + nom.sharePercent, 0);
  const isSharesValid = totalNomineeShare === 100;

  // Primary Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    // Validations
    if (!name.trim()) return alert(lang === 'BN' ? 'দয়া করে আপনার নাম প্রদান করুন।' : 'Please enter your full name.');
    if (!phone.trim()) return alert(lang === 'BN' ? 'দয়া করে আপনার মোবাইল নম্বর প্রদান করুন।' : 'Please enter your phone number.');
    if (!nid.trim() || nid.length < 10) return alert(lang === 'BN' ? 'দয়া করে সর্বমোট ১০ বা ১৭ সংখ্যার সঠিক NID দিন।' : 'Please enter a valid 10 or 17 digit NID number.');
    if (!isSharesValid) {
      return alert(lang === 'BN' ? 'মনোনীতদের সর্বমোট শেয়ার বণ্টন ব্যবধান অবশ্যই ১০০% হতে হবে!' : 'Total nominee share allocation must sum to exactly 100%!');
    }

    setIsSubmitting(true);
    try {
      await onSaveKYC({
        name,
        phone,
        nid,
        birthDate,
        bloodGroup,
        gender,
        paternalName,
        maternalName,
        birthRegistrationNo,
        passportNo,
        currentAddress,
        permanentAddress,
        occupation,
        companyName,
        monthlyIncome,
        incomeSource,
        tin,
        bankAccountDetails,
        gpsLocation: gpsLocation || undefined,
        smoker,
        chronicIllness,
        height,
        weight,
        nominees,
        status: 'active' // Auto-activate if KYC successfully updated
      });
      setSuccessMsg(t.kycSaveSuccess);
      setTimeout(() => setSuccessMsg(''), 6050);
    } catch (err) {
      console.error(err);
      alert(lang === 'BN' ? 'সংরক্ষণে ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।' : 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <HeartHandshake className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-bold text-base">{t.kycTitle}</h3>
            <p className="text-xs text-emerald-200">{t.kycSub}</p>
          </div>
        </div>
        
        {/* Verification Status Badge */}
        <div>
          {profile.status === 'active' ? (
            <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{t.kycVerified}</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              <span>{t.kycPending}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs list selector */}
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <User className="h-4 w-4" />
          <span>{t.kycTabPersonal}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('medical')}
          className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'medical'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>{t.kycTabMedical}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nominees')}
          className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'nominees'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Users2 className="h-4 w-4" />
          <span>{t.kycTabNominee}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>{lang === 'BN' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
        </button>
      </div>

      {/* Primary Forms Section */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {successMsg && (
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold animate-bounce">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: Personal Details */}
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* Section A: General Info */}
            <div className="bg-gray-50/30 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                <User className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-xs">
                  {lang === 'BN' ? '১. ক) সাধারণ ব্যক্তিগত বিবরণী' : '1. a) General Personal Information'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycFullName}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-805 text-gray-850 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={t.kycFullNamePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycEmail}</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    title={t.kycEmailSub}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycPhone}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={t.kycPhonePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycDob}</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycGender}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">{t.kycGenderSelect}</option>
                    <option value="Male">{t.kycGenderMale}</option>
                    <option value="Female">{t.kycGenderFemale}</option>
                    <option value="Other">{t.kycGenderOther}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycBlood}</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">{t.kycBloodSelect}</option>
                    <option value="A+">A+ (পজিটিভ / Positive)</option>
                    <option value="A-">A- (নেগেটিভ / Negative)</option>
                    <option value="B+">B+ (পজিটিভ / Positive)</option>
                    <option value="B-">B- (নেগেটিভ / Negative)</option>
                    <option value="AB+">AB+ (পজিটিভ / Positive)</option>
                    <option value="AB-">AB- (নেগেটিভ / Negative)</option>
                    <option value="O+">O+ (পজিটিভ / Positive)</option>
                    <option value="O-">O- (নেগেটিভ / Negative)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">{t.familySlot}</label>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-bold text-gray-500">
                    {t.memberId} <span className="font-mono text-emerald-700 font-black">{profile.memberId || profile.uid}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Family & Document IDs */}
            <div className="bg-gray-50/30 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                <User className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-xs">
                  {lang === 'BN' ? '১. খ) পারিবারিক ও ডকুমেন্ট আইডি রেকর্ড' : '1. b) Family & Document ID Records'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'পিতার নাম' : "Father's Name"}
                  </label>
                  <input
                    type="text"
                    value={paternalName}
                    onChange={(e) => setPaternalName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'পিতার নাম লিখুন' : "Enter father's name"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'মাতার নাম' : "Mother's Name"}
                  </label>
                  <input
                    type="text"
                    value={maternalName}
                    onChange={(e) => setMaternalName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'মাতার নাম লিখুন' : "Enter mother's name"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycNid}</label>
                  <input
                    type="text"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={t.kycNidPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'জন্ম নিবন্ধন নাম্বার (ঐচ্ছিক)' : 'Birth Registration No. (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={birthRegistrationNo}
                    onChange={(e) => setBirthRegistrationNo(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'জন্ম নিবন্ধন নম্বর লিখুন' : 'Enter Birth Certificate Number'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'পাসপোর্ট নম্বর (ঐচ্ছিক)' : 'Passport Number (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={passportNo}
                    onChange={(e) => setPassportNo(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'পাসপোর্ট নম্বর লিখুন' : 'Enter Passport Number'}
                  />
                </div>
              </div>
            </div>

            {/* Section C: Resident Addresses */}
            <div className="bg-gray-50/30 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                <User className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-xs">
                  {lang === 'BN' ? '১. গ) বর্তমান ও স্থায়ী ঠিকানা' : '1. c) Current & Permanent Addresses'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'বর্তমান ঠিকানা' : 'Current Address'}
                  </label>
                  <textarea
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'গ্রাম/পাড়া, ডাকঘর, থানা, জেলা উল্লেখ করুন' : 'Village/Street, Post Office, Police Station, District'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                  </label>
                  <textarea
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'স্থায়ী ঠিকানা লিখুন' : 'Enter Permanent Address details'}
                  />
                </div>

                <div className="md:col-span-2 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50/45 p-3 rounded-lg border border-dashed border-emerald-100/60 font-medium">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{lang === 'BN' ? 'জিপিএস ঠিকানা যাচাইকরণ' : 'GPS Verification Coordinate'}</span>
                    </span>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      {lang === 'BN' 
                        ? 'সদস্যের সঠিক অবস্থান নিশ্চিত করার জন্য জিপিএস স্থানাঙ্ক সংযুক্ত করুন।' 
                        : 'Securely verify and append precise GPS location to your family file.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input 
                      type="text"
                      readOnly
                      value={gpsLocation}
                      placeholder={lang === 'BN' ? 'স্থানাঙ্ক নেই (Location Coords)' : 'No location verified'}
                      className="bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs font-mono font-bold text-gray-700 w-full sm:w-48 text-center placeholder-gray-400 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleGetGPSLocation}
                      disabled={isLocating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer flex-shrink-0 ${
                        isLocating 
                          ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold'
                      }`}
                    >
                      <span>{isLocating ? (lang === 'BN' ? 'খুঁজছে...' : 'Locating...') : (lang === 'BN' ? 'লোকেশন' : 'Get Location')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section D: Profession, Finances & Bank Accounts */}
            <div className="bg-gray-50/30 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                <User className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-xs">
                  {lang === 'BN' ? '১. ঘ) পেশা, আর্থিক তথ্য ও ব্যাংক অ্যাকাউন্ট বিবরণী' : '1. d) Profession, Finances & Bank Accounts'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'পেশা' : 'Occupation'}
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'উদা: ব্যবসা, চাকরিজীবী, গৃহিণী ইত্যাদি' : 'e.g., Business, Salaried, Homemaker'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'প্রতিষ্ঠানের নাম' : 'Organization Name'}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-00 text-gray-808 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'কর্মরত প্রতিষ্ঠানের নাম' : 'Name of current employer or business'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'মাসিক আয় (৳)' : 'Monthly Income (৳)'}
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome || ''}
                    onChange={(e) => setMonthlyIncome(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g., 25000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'আয়ের উৎস' : 'Source of Income'}
                  </label>
                  <input
                    type="text"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-850 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'উদা: বেতন, লভ্যাংশ, ভাড়া ইত্যাদি' : 'e.g., Salary, Business return, Rental'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'TIN নম্বর (ঐচ্ছিক)' : 'TIN Number (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder="12-digit TIN number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'BN' ? 'ব্যাংক অ্যাকাউন্ট বিবরণী (হিসাব নাম ও নম্বর)' : 'Bank Account Details'}
                  </label>
                  <input
                    type="text"
                    value={bankAccountDetails}
                    onChange={(e) => setBankAccountDetails(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder={lang === 'BN' ? 'ব্যাংক নাম, হিসাব নাম ও নম্বর' : 'Bank Name, Account Name & No'}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className="px-4 py-2 bg-emerald-605 text-white hover:bg-emerald-700 bg-emerald-600 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md flex items-center"
              >
                <span>{t.btnNext}</span>
                <span className="ml-1.5">&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Medical / Lifestyle */}
        {activeTab === 'medical' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
              <h4 className="font-bold text-gray-900 text-sm">{t.kycSectionMedicalHeader}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Smokers toggle */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-105 flex flex-col sm:flex-row sm:items-center justify-between col-span-2 gap-3">
                <div>
                  <h5 className="text-xs font-bold text-gray-900">{t.kycSmoker}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.kycSmokerSub}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSmoker(false)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !smoker 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {t.kycSmokerNo}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmoker(true)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      smoker 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {t.kycSmokerYes}
                  </button>
                </div>
              </div>

              {/* Physical details height */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycHeight}</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 120)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                    placeholder="Height in cm"
                  />
                  <span className="text-xs text-gray-500 font-bold px-2 whitespace-nowrap">
                    {t.kycHeightSub.replace('{foot}', Math.floor(height / 30.48).toString()).replace('{inch}', Math.round((height / 2.54) % 12).toString())}
                  </span>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycWeight}</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value) || 40)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  placeholder="Weight in kg"
                />
              </div>

              {/* Automated BMI Card details */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-gray-900">{t.kycBmiHeader}</h6>
                  <p className="text-[10px] text-gray-400">{t.kycBmiSub}</p>
                </div>
                <div className="flex items-center space-x-3 pr-2">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-medium">{t.kycBmiIndex}</span>
                    <span className="text-sm font-black text-gray-905 font-mono">{bmi.toFixed(1)}</span>
                  </div>
                  <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${bmiCat.color}`}>
                    {bmiCat.label}
                  </span>
                </div>
              </div>

              {/* Chronic illnesses input */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.kycIllness}</label>
                <textarea
                  value={chronicIllness}
                  onChange={(e) => setChronicIllness(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  placeholder={t.kycIllnessPlaceholder}
                />
              </div>

            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="px-4 py-2 text-gray-500 hover:bg-gray-105 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                &larr; {t.btnPrev}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('nominees')}
                className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {t.nomineeSetupBtn} &rarr;
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Nominees Section */}
        {activeTab === 'nominees' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Users2 className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-sm">{t.nomineeHeader}</h4>
              </div>
              
              <button
                type="button"
                onClick={handleAddNominee}
                className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-bold text-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{t.nomineeBtnAdd}</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-400">{t.nomineeSub}</p>

            <div className="space-y-4">
              {nominees.map((nom, idx) => (
                <div key={idx} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative space-y-3 animate-slide-in">
                  
                  {/* Delete trigger */}
                  {nominees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveNominee(idx)}
                      className="absolute top-4 right-4 text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <h5 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    {t.numLabel.replace('{num}', (idx + 1).toString())}
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-0.5">{t.nomName}</label>
                      <input
                        type="text"
                        required
                        value={nom.name}
                        onChange={(e) => handleNomineeChange(idx, 'name', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-gray-800 focus:outline-hidden"
                        placeholder={t.nomNamePlaceholder}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-0.5">{t.nomRelation}</label>
                      <select
                        value={nom.relation}
                        onChange={(e) => handleNomineeChange(idx, 'relation', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
                      >
                        <option value="Spouse">{t.nomRelationSpouse}</option>
                        <option value="Mother">{t.nomRelationMother}</option>
                        <option value="Father">{t.nomRelationFather}</option>
                        <option value="Child">{t.nomRelationChild}</option>
                        <option value="Sibling">{t.nomRelationSibling}</option>
                        <option value="Other">{t.nomRelationOther}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                        {lang === 'BN' ? 'জন্মতারিখ' : 'Date of Birth'}
                      </label>
                      <input
                        type="date"
                        required
                        value={nom.birthDate || ''}
                        onChange={(e) => handleNomineeChange(idx, 'birthDate', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-gray-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-0.5">{t.nomNid}</label>
                      <input
                        type="text"
                        required
                        value={nom.nidOrBirthCert}
                        onChange={(e) => handleNomineeChange(idx, 'nidOrBirthCert', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-gray-800 focus:outline-hidden font-mono"
                        placeholder={t.nomNidPlaceholder}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-0.5">{t.nomShare}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={nom.sharePercent}
                        onChange={(e) => handleNomineeChange(idx, 'sharePercent', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs font-bold text-gray-800 focus:outline-hidden font-mono"
                        placeholder={t.nomSharePlaceholder}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation warning feedback */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isSharesValid 
                ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                : 'bg-rose-50 border-rose-250 text-rose-800'
            }`}>
              <div className="flex items-center space-x-2">
                {isSharesValid ? (
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0 animate-pulse" />
                )}
                <span className="font-semibold">
                  {isSharesValid 
                    ? t.nomSharesValid 
                    : t.nomSharesInvalid.replace('{total}', totalNomineeShare.toString())
                  }
                </span>
              </div>
              <span className="font-mono font-black text-sm">{totalNomineeShare}%</span>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                &larr; {t.btnPrev}
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !isSharesValid}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md ${
                  isSharesValid && !isSubmitting
                    ? 'bg-emerald-600 font-bold hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/10'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t.btnSubmitting}</span>
                  </>
                ) : (
                  <span>{t.btnSubmitKyc}</span>
                )}
              </button>
            </div>

          </div>
        )}

        {activeTab === 'password' && (
          <div className="space-y-6 animate-fade-in text-left max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-6 rounded-2xl border border-emerald-100/80 shadow-xs space-y-5">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-gray-100 font-bold text-gray-800">
                <KeyRound className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="font-extrabold text-gray-950 text-xs sm:text-sm">
                    {lang === 'BN' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Your Password'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {lang === 'BN' ? 'আপনার ব্যক্তিগত পোর্টাল অ্যাকাউন্ট সুরক্ষায় নতুন পাসওয়ার্ড তৈরি করুন।' : 'Set a new secure password to protect your personal fund records.'}
                  </p>
                </div>
              </div>

              {pwdError && (
                <div className="flex items-center space-x-2.5 bg-rose-50 border border-rose-200/50 text-rose-800 p-3 rounded-xl text-xs font-semibold animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 animate-pulse" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="flex items-center space-x-2.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 p-3 rounded-xl text-xs font-semibold animate-fade-in">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {lang === 'BN' ? 'বর্তমান পাসওয়ার্ড (Current Password)' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPwdError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-mono font-black focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {lang === 'BN' ? 'নতুন পাসওয়ার্ড (New Password - At least 8 characters)' : 'New Password (Minimum 8 chars)'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwdError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-mono font-black focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {lang === 'BN' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm New Password)' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setPwdError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-mono font-black focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{lang === 'BN' ? 'পরিবর্তন হচ্ছে...' : 'Updating...'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>{lang === 'BN' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password Update'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </form>

    </div>
  );
}

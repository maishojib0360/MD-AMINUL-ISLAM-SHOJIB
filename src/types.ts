/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Nominee {
  name: string;
  relation: string;
  nidOrBirthCert: string;
  sharePercent: number;
  birthDate: string; // Nominee Date of birth
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MemberStatus = 'pending_kyc' | 'active' | 'suspended';
export type UserRole = 'admin' | 'member';

export interface MemberProfile {
  uid: string;
  memberId?: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password?: string; // At least 8 chars
  
  // Custom Family KYC fields
  paternalName?: string;
  maternalName?: string;
  birthRegistrationNo?: string;
  passportNo?: string;
  currentAddress?: string;
  permanentAddress?: string;
  occupation?: string;
  companyName?: string;
  monthlyIncome?: number;
  incomeSource?: string;
  tin?: string;
  bankAccountDetails?: string;
  gpsLocation?: string; // Capturing physical coordinates via browser geolocation

  nid: string;
  birthDate: string;
  bloodGroup: BloodGroup | '';
  gender: 'Male' | 'Female' | 'Other' | '';
  smoker: boolean;
  chronicIllness: string; // Comma-separated or text describing illnesses
  height: number; // in cm
  weight: number; // in kg
  status: MemberStatus;
  nominees: Nominee[];
  joinedAt: string;
  totalDPSPaid: number; // Tracked historical payments in BDT
}

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  monthYear: string; // e.g. "June 2026", "May 2026"
  gateway: string; // bKash, Nagad, Bank Transfer, cash
  transactionId: string; // transaction reference
  submittedAt: string;
  status: TransactionStatus;
  gpsLocation?: string; // Capturing physical coordinates via browser geolocation during DPS submission
  approvedBy?: string;
  approvalNotes?: string;
  approvedAt?: string;
}

export interface Investment {
  id: string;
  title: string;
  amount: number;
  expectedReturnRate: number; // e.g. 8.5 for 8.5%
  startDate: string;
  maturityDate: string; // "YYYY-MM-DD" or "Ongoing"
  status: 'active' | 'liquidated';
  currentValuation: number;
  category: string; // FDR, Bond, SME Loan, Gold, etc.
}

export type NoticeCategory = 'announcement' | 'emergency' | 'meeting' | 'financial';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  createdAt: string;
  authorName: string;
  isPinned: boolean;
}

export interface FundStats {
  totalCapital: number;
  activeInvestmentsTotal: number;
  liquidCash: number;
  activeMembersCount: number;
  pendingTransactionsCount: number;
}

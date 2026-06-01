/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, auth, isFirebaseAvailable } from './firebaseConfig';
import { 
  MemberProfile, 
  Transaction, 
  Investment, 
  Notice, 
  FundStats, 
  Nominee, 
  BloodGroup, 
  MemberStatus, 
  UserRole 
} from '../types';

// --- FIREBASE ERROR HANDLING (Pillar 3 & Section 3 of skill) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- MOCK DATA INITIALIZATION FOR FALLBACK ---
const FAMILY_SURNAMES = ['Rahman', 'Ahmed', 'Hasan', 'Hossain', 'Chowdhury', 'Khan', 'Islam', 'Sarker', 'Ali', 'Uddin'];
const FIRST_NAMES_MALE = ['Farhan', 'Kamal', 'Anis', 'Rafiq', 'Sajid', 'Abir', 'Kabir', 'Zayan', 'Tanvir', 'Arif', 'Nabil', 'Imtiaz', 'Tamim', 'Rashed', 'Jamil'];
const FIRST_NAMES_FEMALE = ['Sumaiya', 'Rokeya', 'Shaila', 'Nabila', 'Tasnim', 'Sajani', 'Fariha', 'Maliha', 'Sadia', 'Nusrat', 'Sabrina', 'Ayesha', 'Tanjila', 'Rifa', 'Laila'];
const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CHRONIC_ILLNESSES = ['None', 'Diabetes', 'Hypertension', 'None', 'Asthma', 'Heart Condition', 'None', 'None', 'Diabetes, Hypertension', 'None'];

function generate50Members(): MemberProfile[] {
  const list: MemberProfile[] = [];
  
  // 1. Farhan Rahman - Admin (Finance Team)
  list.push({
    uid: 'm-admin-farhan',
    memberId: 'ASFF-0001',
    role: 'admin',
    name: 'Farhan Rahman',
    email: 'farhan.finance@familyfund.com',
    phone: '+8801711223344',
    nid: '9182736450',
    birthDate: '1985-04-12',
    bloodGroup: 'B+',
    gender: 'Male',
    smoker: false,
    chronicIllness: 'None',
    height: 172,
    weight: 78,
    status: 'active',
    nominees: [
      { name: 'Rokeya Rahman', relation: 'Spouse', nidOrBirthCert: '7483920164', sharePercent: 60, birthDate: '1990-05-14' },
      { name: 'Zayan Rahman', relation: 'Child', nidOrBirthCert: '201592837482', sharePercent: 40, birthDate: '2015-08-22' }
    ],
    joinedAt: '2025-01-10T10:00:00Z',
    totalDPSPaid: 30000 // 15 months paid
  });

  // 2. Sumaiya Akhter - Regular Member
  list.push({
    uid: 'm-member-sumaiya',
    memberId: 'ASFF-0002',
    role: 'member',
    name: 'Sumaiya Akhter',
    email: 'sumaiya@familyfund.com',
    phone: '+8801815556677',
    nid: '5647382910',
    birthDate: '1992-08-25',
    bloodGroup: 'O+',
    gender: 'Female',
    smoker: false,
    chronicIllness: 'None',
    height: 158,
    weight: 55,
    status: 'active',
    nominees: [
      { name: 'Anisul Islam', relation: 'Spouse', nidOrBirthCert: '1029384756', sharePercent: 100, birthDate: '1985-11-20' }
    ],
    joinedAt: '2025-01-12T11:30:00Z',
    totalDPSPaid: 28000 // 14 months paid
  });

  // 3. Rokeya Rahman - Regular Member
  list.push({
    uid: 'm-member-rokeya',
    memberId: 'ASFF-0003',
    role: 'member',
    name: 'Rokeya Rahman',
    email: 'rokeya@familyfund.com',
    phone: '+8801919992211',
    nid: '4839201837',
    birthDate: '1989-11-03',
    bloodGroup: 'A+',
    gender: 'Female',
    smoker: false,
    chronicIllness: 'Hypertension',
    height: 161,
    weight: 62,
    status: 'active',
    nominees: [
      { name: 'Farhan Rahman', relation: 'Spouse', nidOrBirthCert: '9182736450', sharePercent: 100, birthDate: '1985-04-12' }
    ],
    joinedAt: '2025-01-15T09:00:00Z',
    totalDPSPaid: 30000
  });

  // 4. Anisul Islam - Regular Member
  list.push({
    uid: 'm-member-anis',
    memberId: 'ASFF-0004',
    role: 'member',
    name: 'Anisul Islam',
    email: 'anis@familyfund.com',
    phone: '+8801515432109',
    nid: '1029384756',
    birthDate: '1988-01-18',
    bloodGroup: 'O-',
    gender: 'Male',
    smoker: true,
    chronicIllness: 'Asthma',
    height: 175,
    weight: 81,
    status: 'active',
    nominees: [
      { name: 'Sumaiya Akhter', relation: 'Spouse', nidOrBirthCert: '5647382910', sharePercent: 100, birthDate: '1992-08-25' }
    ],
    joinedAt: '2025-01-15T15:20:00Z',
    totalDPSPaid: 26000
  });

  // Programmatically generate remaining 46 members to make exactly 50 members
  for (let i = 5; i <= 50; i++) {
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const fn = gender === 'Male' 
      ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
      : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
    const sn = FAMILY_SURNAMES[Math.floor(Math.random() * FAMILY_SURNAMES.length)];
    const name = `${fn} ${sn}`;
    const email = `${fn.toLowerCase()}.${sn.toLowerCase()}${i}@familyfund.com`;
    const randPhone = `+8801${Math.floor(Math.random() * 5 + 3)}${Math.floor(Math.random() * 89999999 + 10000000)}`;
    const randNid = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
    const bg = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
    const isSmoker = Math.random() < 0.2; // 20% smokers
    const ill = CHRONIC_ILLNESSES[Math.floor(Math.random() * CHRONIC_ILLNESSES.length)];
    const status: MemberStatus = Math.random() < 0.08 ? 'pending_kyc' : 'active';
    const height = Math.floor(Math.random() * 30) + 150; // 150 to 180
    const weight = Math.floor(Math.random() * 40) + 50; // 50 to 90
    
    // Assign reasonable total paid DPS metrics (some paid fully, some behind)
    const monthsPaid = Math.floor(Math.random() * 5) + 11; // 11 to 15 months
    const totalPaid = monthsPaid * 2000;

    // Nominees setup
    const nomineeGender = Math.random() > 0.5 ? 'Female' : 'Male';
    const nomFn = nomineeGender === 'Male' ? FIRST_NAMES_MALE[0] : FIRST_NAMES_FEMALE[0];
    const nomName = `${nomFn} ${sn}`;
    const rent = Math.random() > 0.5 ? 'Father' : 'Mother';

    list.push({
      uid: `m-member-${i}`,
      memberId: `ASFF-${String(i).padStart(4, '0')}`,
      role: 'member',
      name,
      email,
      phone: randPhone,
      nid: randNid,
      birthDate: `${1975 + Math.floor(Math.random() * 25)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      bloodGroup: bg,
      gender,
      smoker: isSmoker,
      chronicIllness: ill,
      height,
      weight,
      status,
      nominees: [
        { name: nomName, relation: rent, nidOrBirthCert: Math.floor(Math.random() * 9000000000 + 1000000000).toString(), sharePercent: 100, birthDate: '1995-01-01' }
      ],
      joinedAt: `2025-02-${Math.floor(Math.random() * 20) + 1}T12:00:00Z`,
      totalDPSPaid: totalPaid
    });
  }

  return list;
}

const INITIAL_INVESTMENTS: Investment[] = [
  {
    id: 'inv-1',
    title: 'Eastern Bank Ltd (EBL) Fixed Deposit Receipt (FDR)',
    amount: 500000,
    expectedReturnRate: 8.5,
    startDate: '2025-06-15',
    maturityDate: '2026-06-15',
    status: 'active',
    currentValuation: 542500, // Accumulated BDT
    category: 'FDR'
  },
  {
    id: 'inv-2',
    title: 'Bangladesh Government 5-Year Sanchayapatra (Savings Certificate)',
    amount: 400000,
    expectedReturnRate: 11.2,
    startDate: '2025-08-01',
    maturityDate: '2030-08-01',
    status: 'active',
    currentValuation: 437333,
    category: 'Savings Certificate'
  },
  {
    id: 'inv-3',
    title: 'Family Agro SME Business Expansion Capital Loan',
    amount: 150000,
    expectedReturnRate: 9.0,
    startDate: '2025-11-20',
    maturityDate: 'Ongoing',
    status: 'active',
    currentValuation: 157200,
    category: 'SME Loan'
  }
];

const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not-1',
    title: 'জরুরি নোটিশ: আগামী সাধারণ সভা ও ফান্ড অডিট আলোচনা',
    content: 'আসসালামু আলাইকুম। আমাদের ফ্যামিলি ফান্ডের দেড় বছর পূর্তি উপলক্ষে আগামী ১৫ই জুন ২০২৬ তারিখে একটি সাধারণ সভা আয়োজন করা হয়েছে। সভায় ফান্ডের আয়-ব্যয় এবং নতুন বিনিয়োগ নিয়ে আলোচনা হবে। সবাইকে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে।\n\n**তাড়িখ:** ১৫ জুন ২০২৬ (শুক্রবার)\n**সময়:** বিকাল ৪:০০ টা\n**স্থান:** জুম অনলাইন মিটিং লিঙ্কে।',
    category: 'meeting',
    createdAt: '2026-05-28T09:12:00Z',
    authorName: 'Farhan Rahman (Finance Lead)',
    isPinned: true
  },
  {
    id: 'not-2',
    title: 'নতুন বিনিয়োগ: বাংলাদেশ সঞ্চয়পত্র ক্রয়ের লভ্যাংশ ক্রেডিট',
    content: 'আমাদের ফ্যামিলি ফান্ড থেকে ক্রয়কৃত বাংলাদেশ সরকারের ৫-বছর মেয়াদী সঞ্চয়পত্রের মোট লভ্যাংশ ফান্ডের মূল ব্যাংক একাউন্টে জমা হয়েছে। মোট ৩৭,৩৩৩ টাকা মূল ফান্ডের ক্যাপিটালের সাথে পুনরায় বিনিয়োগ হিসেবে যোগ করা হয়েছে। লভ্যাংশের আর্থিক স্বচ্ছতা নিশ্চিত করতে বিস্তারিত ড্যাশবোর্ডে আপডেট করা আছে।',
    category: 'financial',
    createdAt: '2026-05-15T14:30:00Z',
    authorName: 'Farhan Rahman (Finance Lead)',
    isPinned: false
  },
  {
    id: 'not-3',
    title: 'DPS কিস্তি জমাদানের সতর্কতা ও আপডেট',
    content: 'সবাইকে স্মরণ করিয়ে দেওয়া হচ্ছে যে আমাদের মাসিক DPS ২,০০০ টাকা জমাদানের শেষ তাড়িখ প্রতি মাসের ১০ তাড়িখ। টাকা জমাদানের পর অবশ্যই বিকাশ/নগদ/ব্যাংক চালানের ট্রানজেকশন আইডি (Txn ID) সহ ডিপোজিট স্লিপ ড্যাশবোর্ড থেকে সাবমিট করবেন। ট্রানজেকশন অনুমোদনের পর তা আপনার প্রোফাইলে তাৎক্ষণিক যোগ হবে।',
    category: 'announcement',
    createdAt: '2026-05-01T08:00:00Z',
    authorName: 'Farhan Rahman (Finance Team)',
    isPinned: false
  }
];

const INITIAL_TRANSACTIONS = (): Transaction[] => [
  {
    id: 'tx-1',
    memberId: 'm-member-sumaiya',
    memberName: 'Sumaiya Akhter',
    amount: 2000,
    monthYear: 'May 2026',
    gateway: 'bKash',
    transactionId: 'BK6X918AZE',
    submittedAt: '2026-05-08T18:24:00Z',
    status: 'approved',
    approvedBy: 'm-admin-farhan',
    approvedAt: '2026-05-09T10:15:00Z',
    approvalNotes: 'Bkash received and matching balance verify.'
  },
  {
    id: 'tx-2',
    memberId: 'm-member-rokeya',
    memberName: 'Rokeya Rahman',
    amount: 2000,
    monthYear: 'May 2026',
    gateway: 'Nagad',
    transactionId: 'NG77Y092P',
    submittedAt: '2026-05-09T11:00:00Z',
    status: 'approved',
    approvedBy: 'm-admin-farhan',
    approvedAt: '2026-05-09T11:45:00Z',
    approvalNotes: 'Matched with Nagad statement.'
  },
  // Active pending transactions for finance team approval testing
  {
    id: 'tx-pending-1',
    memberId: 'm-member-sumaiya',
    memberName: 'Sumaiya Akhter',
    amount: 2000,
    monthYear: 'June 2026',
    gateway: 'bKash',
    transactionId: 'BK9Z008XQR',
    submittedAt: '2026-06-01T08:15:00Z',
    status: 'pending'
  },
  {
    id: 'tx-pending-2',
    memberId: 'm-member-5',
    memberName: 'Zayan Chowdhury',
    amount: 2000,
    monthYear: 'June 2026',
    gateway: 'Bank Transfer',
    transactionId: 'EBLTXN29103',
    submittedAt: '2026-06-01T09:40:00Z',
    status: 'pending'
  }
];

// In-memory fallback if localStorage is blocked by Chrome in iframe settings
const memoryStorage: Record<string, string> = {};
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem blocked/failed: falling back to memory.", e);
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem blocked/failed: falling back to memory.", e);
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage.removeItem blocked/failed: falling back to memory.", e);
      delete memoryStorage[key];
    }
  }
};

// Seed local storage with mock database
function getLocalDB() {
  if (typeof window === 'undefined') return { members: [], transactions: [], investments: [], notices: [] };
  
  let members = safeLocalStorage.getItem('ff_members');
  let transactions = safeLocalStorage.getItem('ff_transactions');
  let investments = safeLocalStorage.getItem('ff_investments');
  let notices = safeLocalStorage.getItem('ff_notices');

  if (!members) {
    const defaultM = generate50Members();
    const defaultT = INITIAL_TRANSACTIONS();
    const defaultI = INITIAL_INVESTMENTS;
    const defaultN = INITIAL_NOTICES;
    
    safeLocalStorage.setItem('ff_members', JSON.stringify(defaultM));
    safeLocalStorage.setItem('ff_transactions', JSON.stringify(defaultT));
    safeLocalStorage.setItem('ff_investments', JSON.stringify(defaultI));
    safeLocalStorage.setItem('ff_notices', JSON.stringify(defaultN));

    return { members: defaultM, transactions: defaultT, investments: defaultI, notices: defaultN };
  }

  return {
    members: JSON.parse(members),
    transactions: JSON.parse(transactions || '[]'),
    investments: JSON.parse(investments || '[]'),
    notices: JSON.parse(notices || '[]')
  };
}

function saveLocalDB(data: { members: MemberProfile[]; transactions: Transaction[]; investments: Investment[]; notices: Notice[] }) {
  if (typeof window === 'undefined') return;
  safeLocalStorage.setItem('ff_members', JSON.stringify(data.members));
  safeLocalStorage.setItem('ff_transactions', JSON.stringify(data.transactions));
  safeLocalStorage.setItem('ff_investments', JSON.stringify(data.investments));
  safeLocalStorage.setItem('ff_notices', JSON.stringify(data.notices));
}

// --- HYBRID DATABASE SERVICE INTERFACES ---

export const dbService = {
  // 1. Members / KYC
  async getMembers(): Promise<MemberProfile[]> {
    if (isFirebaseAvailable) {
      const path = 'members';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => doc.data() as MemberProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
    // Fallback
    return getLocalDB().members;
  },

  async getMember(uid: string): Promise<MemberProfile | null> {
    if (isFirebaseAvailable) {
      const path = `members/${uid}`;
      try {
        const docRef = doc(db, 'members', uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as MemberProfile) : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
    // Fallback
    const members = getLocalDB().members;
    return members.find(m => m.uid === uid) || null;
  },

  async updateMember(uid: string, data: Partial<MemberProfile>): Promise<void> {
    if (isFirebaseAvailable) {
      const path = `members/${uid}`;
      try {
        const docRef = doc(db, 'members', uid);
        await setDoc(docRef, data as any, { merge: true });
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
    // Fallback
    const local = getLocalDB();
    const idx = local.members.findIndex(m => m.uid === uid);
    if (idx !== -1) {
      local.members[idx] = { ...local.members[idx], ...data };
    } else {
      local.members.push({ uid, ...data } as MemberProfile);
    }
    saveLocalDB(local);
  },

  // 2. Transactions (Approved/Pending DPS slides)
  async getTransactions(): Promise<Transaction[]> {
    if (isFirebaseAvailable) {
      const path = 'transactions';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => doc.data() as Transaction);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
    // Fallback
    return getLocalDB().transactions;
  },

  async addTransaction(tx: Omit<Transaction, 'id' | 'submittedAt' | 'status'> & { id?: string }): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    if (isFirebaseAvailable) {
      const path = `transactions/${newTx.id}`;
      try {
        await setDoc(doc(db, 'transactions', newTx.id), newTx);
        return newTx;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
    // Fallback
    const local = getLocalDB();
    local.transactions.unshift(newTx);
    saveLocalDB(local);
    return newTx;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    if (isFirebaseAvailable) {
      const path = `transactions/${id}`;
      try {
        await updateDoc(doc(db, 'transactions', id), updates as any);
        // If approved, update member's total DPS
        if (updates.status === 'approved') {
          const snap = await getDoc(doc(db, 'transactions', id));
          if (snap.exists()) {
            const t = snap.data() as Transaction;
            const mRef = doc(db, 'members', t.memberId);
            const mSnap = await getDoc(mRef);
            if (mSnap.exists()) {
              const m = mSnap.data() as MemberProfile;
              await updateDoc(mRef, {
                totalDPSPaid: (m.totalDPSPaid || 0) + t.amount
              });
            }
          }
        }
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
    // Fallback
    const local = getLocalDB();
    const idx = local.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const prevStatus = local.transactions[idx].status;
      local.transactions[idx] = { ...local.transactions[idx], ...updates };
      
      // Handle capital adjustment if first-time approved
      if (updates.status === 'approved' && prevStatus !== 'approved') {
        const trans = local.transactions[idx];
        const mIdx = local.members.findIndex(m => m.uid === trans.memberId);
        if (mIdx !== -1) {
          local.members[mIdx].totalDPSPaid = (local.members[mIdx].totalDPSPaid || 0) + trans.amount;
        }
      }
      
      saveLocalDB(local);
    }
  },

  // 3. Investments
  async getInvestments(): Promise<Investment[]> {
    if (isFirebaseAvailable) {
      const path = 'investments';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => doc.data() as Investment);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
    // Fallback
    return getLocalDB().investments;
  },

  async addInvestment(inv: Omit<Investment, 'id'>): Promise<Investment> {
    const id = `inv-${Date.now()}`;
    const newInv: Investment = { ...inv, id };
    if (isFirebaseAvailable) {
      const path = `investments/${id}`;
      try {
        await setDoc(doc(db, 'investments', id), newInv);
        return newInv;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
    const local = getLocalDB();
    local.investments.push(newInv);
    saveLocalDB(local);
    return newInv;
  },

  // 4. Notices
  async getNotices(): Promise<Notice[]> {
    if (isFirebaseAvailable) {
      const path = 'notices';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => doc.data() as Notice);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
    // Fallback
    return getLocalDB().notices;
  },

  async addNotice(notice: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> {
    const id = `not-${Date.now()}`;
    const newNotice: Notice = {
      ...notice,
      id,
      createdAt: new Date().toISOString()
    };
    if (isFirebaseAvailable) {
      const path = `notices/${id}`;
      try {
        await setDoc(doc(db, 'notices', id), newNotice);
        return newNotice;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
    const local = getLocalDB();
    local.notices.unshift(newNotice);
    saveLocalDB(local);
    return newNotice;
  },

  // 5. Consolidated system stats
  async getFundStats(): Promise<FundStats> {
    const members = await this.getMembers();
    const transactions = await this.getTransactions();
    const investments = await this.getInvestments();

    const activeMembersCount = members.filter(m => m.status === 'active').length;
    const pendingTransactionsCount = transactions.filter(t => t.status === 'pending').length;

    // Capital calculation
    // Primary capital is calculated as sum of APPROVED DPS payments + initial capital.
    // In our seed, members has totalDPSPaid accrued. Let's sum those!
    const totalCapital = members.reduce((sum, m) => sum + (m.totalDPSPaid || 0), 0);
    const activeInvestmentsTotal = investments
      .filter(i => i.status === 'active')
      .reduce((sum, i) => sum + i.amount, 0);

    const liquidCash = totalCapital - activeInvestmentsTotal;

    return {
      totalCapital,
      activeInvestmentsTotal,
      liquidCash: liquidCash > 0 ? liquidCash : 0,
      activeMembersCount,
      pendingTransactionsCount
    };
  }
};

import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAaDeNCfcF9tU0HsopArzZPksNs9C5OX0Y",
  authDomain: "complete-monitor-n9nlt.firebaseapp.com",
  projectId: "complete-monitor-n9nlt",
  storageBucket: "complete-monitor-n9nlt.firebasestorage.app",
  messagingSenderId: "782446855533",
  appId: "1:782446855533:web:1c5d5557f7382a0e748664"
};

export const app = initializeApp(firebaseConfig);

// ارسال درخواست‌ها به دامنه‌ی اختصاصی خودمان تا ورکر آن‌ها را مدیریت کند
export const db = initializeFirestore(app, {
  host: 'service.mums-fani.ir/firestore', 
  ssl: true,
  experimentalForceLongPolling: true
}, "ai-studio-b9f80ad4-4fd6-4e96-acba-f63aed7713aa");

export const auth = getAuth(app);
/**
 * Auth Service – Expo compatible (Phone OTP)
 */

import { getApps, initializeApp } from "firebase/app";
import {
  signOut as firebaseSignOut,
  User as FirebaseUser,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
} from "firebase/auth";
import { ENDPOINTS } from "../config/api.config";
import api, { clearAuthToken, setAuthToken } from "./api.service";

// 🔐 Firebase config (WEB config – required for OTP)
const firebaseConfig = {
  apiKey: "AIzaSyA8aVMD3C9AqF8a9lcK8_LeNCPk3fBXb6o",
  authDomain: "jobassigning.firebaseapp.com",
  projectId: "jobassigning",
  storageBucket: "jobassigning.firebasestorage.app",
  messagingSenderId: "732994003548",
  appId: "1:732994003548:web:anything",
};

// Init Firebase ONCE
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// ---------- TYPES ----------
export interface User {
  id: string;
  phone: string;
  isProfileComplete: boolean;
  currentMode: "employer" | "worker";
  name?: string;
  skills?: string[];
}

// ---------- SEND OTP ----------
export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier: any
) => {
  const formattedPhone = phoneNumber.startsWith("+")
    ? phoneNumber
    : `+91${phoneNumber}`;

  return await signInWithPhoneNumber(
    auth,
    formattedPhone,
    recaptchaVerifier
  );
};

// ---------- VERIFY OTP (IMPORTANT FIX) ----------
export const verifyOTP = async (
  confirmationResult: any,
  otp: string
): Promise<{ user: User; isNewUser: boolean }> => {
  const credential = await confirmationResult.confirm(otp);
  const firebaseUser = credential.user;

  const idToken = await firebaseUser.getIdToken();
  console.log("Firebase ID Token:", idToken);
  await setAuthToken(idToken);

  const response = await api.post(ENDPOINTS.AUTH.VERIFY_TOKEN, { idToken });

  //  SAFETY CHECK
  if (!response?.data?.user) {
    console.error(" Backend response:", response);
    throw new Error("User not returned from backend");
  }

  // RETURN CLEAN DATA
  return {
    user: response.data.user,
    isNewUser: response.data.isNewUser,
  };
};


// ---------- COMPLETE PROFILE ----------
export const completeProfile = async (data: {
  name: string;
  age?: number;
  gender: "male" | "female" | "other";
  skills: string[];
}) => {
  return api.post(ENDPOINTS.USERS.COMPLETE_PROFILE, data);
};


// ---------- AUTH STATE ----------
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
) => onAuthStateChanged(auth, callback);

// ---------- LOGOUT ----------
export const signOut = async () => {
  await clearAuthToken();
  await firebaseSignOut(auth);
};

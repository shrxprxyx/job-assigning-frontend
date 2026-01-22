import React, { createContext, useContext, useState } from "react";
import { User } from "../services/auth.service";

/**
 * Auth context type
 */
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  confirmationResult: any;
  setConfirmationResult: (v: any) => void;
}

/**
 * Context
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Set full user (after login / OTP verify)
  const login = (userData: User) => {
    setUser(userData);
  };

  // Clear user (logout)
  const logout = () => {
    setUser(null);
    setConfirmationResult(null);
  };

  // Update partial user data (profile completion, edits, etc.)
  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        confirmationResult,
        setConfirmationResult,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook
 */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

export default AuthContext;

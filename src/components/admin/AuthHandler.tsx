// components/admin/AuthHandler.ts
import { getAuth, signOut } from 'firebase/auth';
import { NextRouter } from 'next/router';

export const handleAdminLogout = async (router: NextRouter) => {
  const auth = getAuth();
  try {
    await signOut(auth);
    localStorage.removeItem('adminLoginTime'); // Clear login timestamp
    router.replace('/admin/password');
  } catch (logoutError) {
    console.error('Logout error:', logoutError);
    throw logoutError;
  }
};

export const checkAdminAuth = (): boolean => {
  const adminLoginTime = localStorage.getItem('adminLoginTime');
  return !!(adminLoginTime && Date.now() - Number(adminLoginTime) < 20 * 60 * 1000);
};
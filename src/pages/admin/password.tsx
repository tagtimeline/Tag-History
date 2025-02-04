// pages/admin/password.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import AdminAuth from '@/components/auth/AdminAuth';
import baseStyles from '@/styles/admin/base.module.css';
import headerStyles from '@/styles/header.module.css';

export default function AdminPassword() {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   const checkAuth = () => {
     const auth = localStorage.getItem('adminLoginTime');
     if (auth) {
       router.replace('/admin');
     }
     setIsLoading(false);
   };
   
   checkAuth();
 }, [router]);

 if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;

 return (
   <div className={baseStyles.pageWrapper}>
     <Head>
       <title>Admin Login - TNT Tag History</title>
     </Head>
     <Header />
     <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
     <main className="centered">
       <AdminAuth />
     </main>
     <Footer />
   </div>
 );
}
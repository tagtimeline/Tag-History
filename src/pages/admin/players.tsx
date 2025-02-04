// pages/admin/players.tsx
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import PlayerSearch from '@/components/search/PlayerSearch';
import playerStyles from '@/styles/admin/players.module.css';

import baseStyles from '@/styles/admin/base.module.css';
import controlStyles from '@/styles/controls.module.css';
import headerStyles from '@/styles/header.module.css';

export default function AdminPlayers() {
 const router = useRouter();
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.replace('/admin/password');
      }
      setIsLoading(false);
    });
  
    return () => unsubscribe();
  }, [router]);

 const handleLogout = async () => {
   const auth = getAuth();
   try {
     await signOut(auth);
     router.push('/');
   } catch (logoutError) {
     console.error('Logout error:', logoutError);
   }
 };

 if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;
 if (!isAuthenticated) return null;

 return (
   <div className={baseStyles.pageWrapper}>
     <Head>
       <title>Player Management - TNT Tag History</title>
     </Head>
     <Header>
       <div className={controlStyles.headerControls}>
         <Link href="/admin">
           <button className={controlStyles.headerButton} style={{ width: 'auto' }}>
             Dashboard
           </button>
         </Link>
         <button onClick={handleLogout} className={controlStyles.headerButton}>
           Logout
         </button>
       </div>
     </Header>
     <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
     
     <main className={baseStyles.mainContent}>
        <div className={baseStyles.header}>
          <div className={baseStyles.title}>Player Management</div>
        </div>

        <div className={playerStyles.searchContainer}>
          <PlayerSearch />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
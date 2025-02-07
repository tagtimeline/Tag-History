import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { handleAdminLogout } from '@/components/admin/AuthHandler';

import baseStyles from '@/styles/admin/base.module.css';
import controlStyles from '@/styles/controls.module.css';

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

 const handleLogout = () => handleAdminLogout(router);

 if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;
 if (!isAuthenticated) return null;

 return (
   <div className={baseStyles.pageWrapper}>
     <Head>
       <title>Category Management - TNT Tag History</title>
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
     
     <main className={baseStyles.mainContent}>
        <div className={baseStyles.header}>
          <div className={baseStyles.title}>Category Management</div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
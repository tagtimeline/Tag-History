import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getAdminInfo } from '@/../lib/adminUtils';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { handleAdminLogout } from '@/components/admin/AuthHandler';

import baseStyles from '@/styles/admin/base.module.css';
import welcomeStyles from '@/styles/admin/welcome.module.css';
import controlStyles from '@/styles/controls.module.css';

interface AdminInfo {
  email: string;
  minecraft_uuid: string;
  discord_id: string;
  minecraft_ign?: string;
  discord_username?: string;
  skin_url?: string;
}

export default function AdminWelcome() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setIsAuthenticated(true);
            fetchAdminInfo(user);
          } else {
            router.replace('/admin/password');
          }
          setIsLoading(false);
        });
    
        return () => unsubscribe();
      }, [router]);
  
      const fetchAdminInfo = async (user: { email: string | null }) => {
        try {
          if (!user.email) {
            setError('No email found');
            return;
          }
          const info = await getAdminInfo(user.email);
          setAdminInfo(info);
        } catch (err) {
          console.error('Error fetching admin info:', err);
          setError('Failed to load admin information');
        }
      };
  
    const handleLogout = () => handleAdminLogout(router);
  
    if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;
    if (!isAuthenticated) return null;

    return (
      <div className={baseStyles.pageWrapper}>
        <Head>
          <title>Admin Dashboard - TNT Tag History</title>
          <meta name="description" content="Admin dashboard for TNT Tag History" />
        </Head>

        <Header>
          <button onClick={handleLogout} className={controlStyles.headerButton}>
            Logout
          </button>
        </Header>

        {error && <div className={baseStyles.errorMessage}><span className={baseStyles.errorText}>{error}</span></div>}

        <main className={welcomeStyles.adminWelcome}>
          <div className={welcomeStyles.welcomeContainer}>
            <div>Welcome to the Tag Timeline</div>
            <h1 className={welcomeStyles.title}>Admin Dashboard</h1>

            {adminInfo && (
              <div className={welcomeStyles.adminInfo}>
                <div className={welcomeStyles.adminInfoContent}>
                  <div>
                    <p>Email: {adminInfo.email}</p>
                    <p>Minecraft: {adminInfo.minecraft_ign || 'Loading...'}</p>
                    <p>Discord: {adminInfo.discord_username || 'Loading...'}</p>
                  </div>
                  {adminInfo.minecraft_uuid && (
                    <div className={welcomeStyles.playerHead}>
                      <Image 
                        src={`https://crafthead.net/avatar/${adminInfo.minecraft_uuid}?size=64`}
                        alt="Player head"
                        width={64}
                        height={64}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={welcomeStyles.adminButtons}>
              <Link href="/admin/events">
                <button className={controlStyles.headerButton} style={{ width: '264px' }}>
                  Event Management
                </button>
              </Link>
              <Link href="/admin/players">
                <button className={controlStyles.headerButton} style={{ width: '264px' }}>
                  Player Management
                </button>
              </Link>
            </div>
          </div>  
        </main>

        <Footer />
      </div>
    );
}
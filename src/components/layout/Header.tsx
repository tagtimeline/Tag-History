// src/components/layout/Header.tsx
import React, { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../../styles/header.module.css';
import { useRouter } from 'next/router';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith('/admin');

  return (
    <header className={styles.header}>
      <div className={styles['header-content']}>
        <div className={styles['header-left']}>
          <Link href="/">
            Tag Timeline
            {isAdminPage && <div  style={{ fontSize: '12px' }}>Admin Dashboard</div>}
          </Link>
        </div>
        {children && (
          <div className={styles['header-right']}>
            {children}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

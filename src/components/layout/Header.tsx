// src/components/layout/Header.tsx
import React, { ReactNode } from 'react';
import Link from 'next/link';
import styles from '../../styles/header.module.css';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <header className={styles.header}>
      <div className={styles['header-content']}>
        <div className={styles['header-left']}>
          <Link href="/">
            Tag Timeline
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
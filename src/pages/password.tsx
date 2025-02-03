// pages/password.tsx
import React from 'react';
import Head from 'next/head';
import PasswordForm from '../components/auth/PasswordForm';
import styles from '../styles/password.module.css';

const PasswordPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Enter Password - TNT Tag History</title>
        <meta name="description" content="Enter the password to access the TNT Tag History site" />
      </Head>
      <main className={styles.mainContent}>
        <PasswordForm />
      </main>
    </>
  );
};

export default PasswordPage;
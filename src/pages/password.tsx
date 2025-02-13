// pages/password.tsx
import React from "react";
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import PasswordForm from "../components/auth/PasswordForm";
import styles from "../styles/password.module.css";

const PasswordPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Enter Password - TNT Tag History</title>
        <meta
          name="description"
          content="Enter the password to access the TNT Tag History site"
        />
      </Head>
      <Header />
      <main className={styles.mainContent}>
        <PasswordForm />
      </main>
      <Footer />
    </>
  );
};

export default PasswordPage;

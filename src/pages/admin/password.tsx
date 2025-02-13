import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Head from "next/head";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdminAuth from "@/components/auth/AdminAuth";
import { checkAdminAuth } from "@/components/admin/AuthHandler";

import baseStyles from "@/styles/admin/base.module.css";

export default function AdminPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && checkAdminAuth()) {
        router.replace("/admin");
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;

  return (
    <div className={baseStyles.pageWrapper}>
      <Head>
        <title>Admin Login - TNT Tag History</title>
      </Head>
      <Header />
      <main className="centered">
        <AdminAuth />
      </main>
      <Footer />
    </div>
  );
}

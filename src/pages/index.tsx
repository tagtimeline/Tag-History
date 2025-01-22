// src/pages/index.tsx
import type { NextPage } from 'next'
import Head from 'next/head'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import PasswordForm from '../components/auth/PasswordForm'
import styles from '../styles/header.module.css'


const Home: NextPage = () => {
  return (
    <>
      <Head>
      <title>Password - TNT Tag History</title>
        <meta name="description" content="An interactive journey through the TNT Tag History" />
      </Head>

      <Header />
      <div className={styles['info-box']}>Version: Beta 1.0</div>
      
      <main className="centered">
        <PasswordForm />
      </main>
      <Footer />
    </>
  )
}

export default Home
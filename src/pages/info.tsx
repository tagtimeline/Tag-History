// src/pages/info.tsx
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image';
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import styles from '../styles/info.module.css'
import headerStyles from '../styles/header.module.css'
import withAuth from '../components/auth/withAuth'

const InfoPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Info - TNT Tag History</title>
        <meta name="description" content="Learn more about the TNT Tag History project" />
      </Head>
      
      <Header>
        <Link href="/timeline">
          <button className={styles.timelineButton}>Timeline</button>
        </Link>
      </Header>
      
      <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
      
      <main className="centered">
        <div className={styles.mainContent}>
          <h2>The TNT Tag History Project</h2>
          <p>
            The project is still under development,<br />
            and updates are being added frequently.<br />
            This website is an interactive timeline that aims to<br />
            document the history of TNT Tag on Hypixel.
          </p>
          <section>
            <div className={styles.profileBox}>
            <Image
              src="https://crafthead.net/avatar/flodlol/128"
              alt="Minecraft Head of flodlol"
              width={128}
              height={128}
              className={styles.profilePicture}
            />
              <div className={styles.profileInfo}>
                <p>
                  <b>flodlol</b><br />
                  Developer<br />
                  @.flod
                </p>
              </div>
            </div>
          </section>
          <section>
            <p>
              Do you want to help us improve the timeline? <br />
              Do you want to suggest new events or corrections? <br />
              <br />
              Or do you just want to stay <b>updated</b>?
            </p>
            <button 
              className={styles.discordButton}
              onClick={() => window.open('https://discord.gg/tEtay34xPv', '_blank')}
            >
              Join Our Discord
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default withAuth(InfoPage);
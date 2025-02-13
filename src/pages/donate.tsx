import type { NextPage } from "next";
import Link from "next/link";
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import styles from "../styles/donate.module.css";
import controlStyles from "../styles/controls.module.css";
import withAuth from "../components/auth/withAuth";

const DonatePage: NextPage = () => {
  const features = [
    "Support ongoing server hosting and maintenance costs",
    "Help fund future development and improvements",
    "Get a special 'Supporter' role in our Discord server",
    "Access to exclusive Discord channels",
    "Early access to new features and updates",
    "Your name in the supporters list on the website",
  ];

  return (
    <>
      <Head>
        <title>Donate - TNT Tag History</title>
        <meta
          name="description"
          content="Support the TNT Tag History project"
        />
      </Head>

      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/timeline">
            <button className={controlStyles.headerButton}>Timeline</button>
          </Link>
          <Link href="/events">
            <button className={controlStyles.headerButton}>Events</button>
          </Link>
          <Link href="/info">
            <button className={controlStyles.headerButton}>Info</button>
          </Link>
        </div>
      </Header>

      <main className="centered">
        <div className={styles.mainContent}>
          <h1 className={styles.title}>Support the Project</h1>
          <div className={styles.description}>
            <p>
              Your contribution helps cover hosting costs and supports the
              continued development of TNT Tag History. Every donation makes a
              difference in keeping this project running and improving.
            </p>
          </div>

          <div className={styles.featuresContainer}>
            <h2 className={styles.subtitle}>Supporter Benefits</h2>
            <ul className={styles.featuresList}>
              {features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="https://ko-fi.com/tagtimeline"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              <img src="/ko-fi.png" alt="Ko-fi" className={styles.kofiLogo} />
              Support me
            </a>
          </div>

          <div className={styles.note}>
            <p>Thank you for considering supporting TNT Tag History!</p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default withAuth(DonatePage);

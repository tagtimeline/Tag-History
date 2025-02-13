// src/components/errors/NotFound.tsx
import Link from "next/link";
import Head from "next/head";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import styles from "../../styles/error.module.css";
import controlStyles from "../../styles/controls.module.css";
import headerStyles from "../../styles/header.module.css";

interface NotFoundProps {
  title?: string;
  message?: string;
}

const NotFound: React.FC<NotFoundProps> = ({
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist.",
}) => {
  return (
    <>
      <Head>
        <title>{title} - TNT Tag History</title>
      </Head>

      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/timeline">
            <button className={controlStyles.timelineButton}>Timeline</button>
          </Link>
          <Link href="/events">
            <button className={controlStyles.eventsButton}>Events</button>
          </Link>
          <Link href="/info">
            <button className={controlStyles.infoButton}>Info</button>
          </Link>
        </div>
      </Header>

      <div className={headerStyles["info-box"]}>Version: Beta 1.0</div>

      <main className="centered">
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorTitle}>{title}</div>
            <p className={styles.errorMessage}>{message}</p>
          </div>
          <div className={styles.buttonWrapper}>
            <Link href="/timeline">
              <button className={styles.returnButton}>
                Return to Timeline
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default NotFound;

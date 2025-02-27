// src/pages/info.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import styles from "../styles/info.module.css";
import controlStyles from "../styles/controls.module.css";
import withAuth from "../components/auth/withAuth";
import { getDevelopers, getRoleColor } from "../data/affiliates";

const InfoPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Info - TNT Tag History</title>
        <meta
          name="description"
          content="Learn more about the TNT Tag History project"
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
          <Link href="/donate">
            <button className={controlStyles.headerButton}>Donate</button>
          </Link>
        </div>
      </Header>

      <main className="centered">
        <div className={styles.mainContent}>
          <title>The TNT Tag History Project</title>
          <p>
            The project is still under development,
            <br />
            and updates are being added frequently.
            <br />
            This website is an interactive timeline that aims to
            <br />
            document the history of TNT Tag on Hypixel.
          </p>
          <div className={styles.spacing}></div>
          <section className={styles.profileSection}>
            {getDevelopers().map(([ign, data]) => (
              <div key={ign} className={styles.profileBox}>
                <Image
                  src={`https://visage.surgeplay.com/bust/${data.uuid}`}
                  alt={`${ign}'s Minecraft Character`}
                  width={200}
                  height={200}
                  className={styles.profilePicture}
                  priority
                  quality={100}
                  onError={(e) => {
                    // Fallback to crafthead.net if visage.surgeplay.com fails
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.src = `https://crafthead.net/avatar/${data.uuid}`;
                  }}
                />
                <div className={styles.profileInfo}>
                  <p>
                    <b>{ign}</b>
                    <br />
                    {data.discord}
                    <br />
                    <br />
                    <span
                      className={styles.developerTag}
                      style={{
                        color: getRoleColor(
                          data.roles.includes("HeadDeveloper")
                            ? "HeadDeveloper"
                            : "Developer"
                        ),
                      }}
                    >
                      {data.roles.includes("HeadDeveloper")
                        ? "Head Developer"
                        : "Developer"}
                    </span>
                    <br />
                  </p>
                </div>
              </div>
            ))}
          </section>
          <div className={styles.spacing}></div>
          <section>
            <p>
              Do you want to help us improve the timeline? <br />
              Do you want to suggest new events or corrections? <br />
              <br />
              Or do you just want to stay <b>updated</b>?
            </p>
            <button
              className={styles.discordButton}
              onClick={() =>
                window.open("https://discord.gg/tEtay34xPv", "_blank")
              }
            >
              Join Our Discord
            </button>
            <Link href="/donate">
              <button className={styles.donateButton}>Donate</button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default withAuth(InfoPage);

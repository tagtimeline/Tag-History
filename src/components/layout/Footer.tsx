// Footer.tsx
import React from "react";
import Link from "next/link";
import styles from "../../styles/footer.module.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`${styles["footer-box"]} ${styles["left-box"]}`}>
        <div className={styles["footer-left-content"]}>
          &copy; {currentYear} Tag Timeline
        </div>
      </div>
      <div className={`${styles["footer-box"]} ${styles["right-box"]}`}>
        <div className={styles["footer-right-content"]}>Created by flodlol</div>
      </div>
    </footer>
  );
};

export default Footer;

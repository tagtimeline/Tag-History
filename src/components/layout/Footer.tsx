// src/components/layout/Footer.tsx
import React from 'react';
import styles from '../../styles/footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`${styles['footer-box']} ${styles['left-box']}`}>
        WORK IN PROGRESS (!)<br />
        &copy; 2025 TNT Tag History
      </div>
      <div className={`${styles['footer-box']} ${styles['right-box']}`}>
        <div className={styles['footer-right-content']}>
          <div>
            Created by flodlol
            <br />
            @<b>.flod</b>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
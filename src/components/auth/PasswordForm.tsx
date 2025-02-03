// src/components/auth/PasswordForm.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/password.module.css';
import { AUTH_CONFIG } from '../../config/auth';

const PasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  // If password protection is disabled, redirect immediately
  React.useEffect(() => {
    if (!AUTH_CONFIG.enablePasswordProtection) {
      localStorage.setItem('isAuthenticated', 'true');
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
      setShowError(false);
      localStorage.setItem('isAuthenticated', 'true');
      router.push('/');
    } else {
      setShowError(true);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <p>This site is currently under development. Please enter the password to preview.</p>
      <form className={styles.passwordForm} onSubmit={handleSubmit}>
        <input
          type="password"
          className={styles.input}
          placeholder="Enter password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className={styles.enterButton}>
          Enter
        </button>
      </form>
      <div className={`${styles.errorMessage} ${showError ? styles.errorVisible : ''}`}>
        Incorrect password
      </div>
    </div>
  );
};

export default PasswordForm;
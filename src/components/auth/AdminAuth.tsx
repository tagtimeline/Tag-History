// components/auth/AdminAuth.tsx
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';
import styles from '../../styles/adminAuth.module.css';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowError(false);

    try {
      console.log('Attempting login...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user);
      localStorage.setItem('adminLoginTime', Date.now().toString());
      router.push('/admin'); // Redirect to the admin page after successful login
    } catch (error) {
      console.error('Login failed:', error);
      setShowError(true);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.title}>Admin Access</div>
        <p className={styles.description}>
          Please enter your admin credentials to continue.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            className={styles.input}
            placeholder="Email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className={styles.input}
            placeholder="Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.button}>
            Login
          </button>
        </form>
        <div className={`${styles.error} ${showError ? styles.errorVisible : ''}`}>
          Invalid credentials
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
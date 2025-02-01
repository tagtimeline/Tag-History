// src/components/auth/withAuth.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';

const withAuth = <P extends Record<string, unknown>>(
  WrappedComponent: NextPage<P>
): NextPage<P> => {
  const AuthComponent: NextPage<P> = (props) => {
    const router = useRouter();

    useEffect(() => {
      // Check if we're in the browser
      if (typeof window !== 'undefined') {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (!isAuthenticated) {
          router.replace('/');
        }
      }
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  // Copy getInitialProps from WrappedComponent
  if ('getInitialProps' in WrappedComponent) {
    AuthComponent.getInitialProps = WrappedComponent.getInitialProps;
  }

  return AuthComponent;
};

export default withAuth;
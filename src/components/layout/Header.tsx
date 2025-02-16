// src/components/layout/Header.tsx
import React, { ReactNode, useEffect } from "react";
import Link from "next/link";
import styles from "../../styles/header.module.css";
import { useRouter } from "next/router";

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith("/admin");

  useEffect(() => {
    // Function to recursively find all href attributes in children
    const findHrefs = (node: ReactNode): string[] => {
      if (!node) return [];

      // If it's a React element
      if (React.isValidElement(node)) {
        const hrefs: string[] = [];
        const props = node.props as { href?: string; children?: ReactNode };

        // Check if the element has an href prop
        if (props.href) {
          hrefs.push(props.href);
        }

        // Recursively check children
        if (props.children) {
          hrefs.push(...findHrefs(props.children));
        }

        return hrefs;
      }

      // If it's an array of elements
      if (Array.isArray(node)) {
        return node.flatMap(findHrefs);
      }

      return [];
    };

    // Find all unique paths in the header
    const paths = [...new Set(findHrefs(children))];

    // Prefetch all found paths
    paths.forEach((path) => {
      if (typeof path === "string" && path !== router.pathname) {
        router.prefetch(path);
      }
    });

    // Always prefetch home page if we're not on it
    if (router.pathname !== "/") {
      router.prefetch("/");
    }
  }, [router, children]);

  return (
    <header className={styles.header}>
      <div className={styles["header-content"]}>
        <div className={styles["header-left"]}>
          <Link href="/" prefetch={true}>
            Tag Timeline
            {isAdminPage && (
              <div style={{ fontSize: "12px" }}>Admin Dashboard</div>
            )}
          </Link>
        </div>
        {children && <div className={styles["header-right"]}>{children}</div>}
      </div>
    </header>
  );
};

export default Header;

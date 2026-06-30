'use client';

import React from 'react';
import Link from 'next/link';

interface PageShellProps {
  children: React.ReactNode;
  // narrow = legal/centered content; default = wider for checkout/booking
  width?: 'narrow' | 'wide';
}

const PageShell: React.FC<PageShellProps> = ({ children, width = 'wide' }) => {
  return (
    <div className="subpage">
      <div className="hero-bg" />

      <header className="subpage-top">
        <Link href="/" className="subpage-logo" aria-label="The Athletic Indian — Home">
          <img src="/athletic-indian-logo.png" alt="The Athletic Indian" />
        </Link>
      </header>

      <main className={`subpage-main ${width === 'narrow' ? 'subpage-main--narrow' : ''}`}>
        {children}
      </main>

      <footer className="subpage-footer">
        <nav className="subpage-footer-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <span>·</span>
          <Link href="/refund-policy">Refund Policy</Link>
          <span>·</span>
          <Link href="/">Home</Link>
        </nav>
        <p className="subpage-copyright">© The Athletic Indian · All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PageShell;

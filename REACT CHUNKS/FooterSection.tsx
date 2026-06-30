import React from 'react';
import { SUPPORT_EMAIL } from '../lib/siteConfig';

const FooterSection: React.FC = () => {
  const footerLinks = [
    { text: "Privacy Policy", href: "/privacy-policy" },
    { text: "Terms & Conditions", href: "/terms" },
    { text: "Refund Policy", href: "/refund-policy" },
    { text: "Contact Us", href: `mailto:${SUPPORT_EMAIL}` }
  ];

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-logo">
          <img
            src="/athletic-indian-logo.png"
            alt="The Athletic Indian"
            style={{
              height: '88px',
              width: 'auto',
              display: 'block',
              opacity: '0.85'
            }}
          />
        </div>

        <nav className="footer-links">
          {footerLinks.map((link, index) => (
            <React.Fragment key={index}>
              <a href={link.href}>{link.text}</a>
              {index < footerLinks.length - 1 && <span>·</span>}
            </React.Fragment>
          ))}
        </nav>

        <div className="footer-disclaimer">
          <p>
            <strong>Results Disclaimer:</strong> The testimonials, case studies, and results shown on this page are real but not typical. Individual results will vary based on starting point, effort, consistency, and a number of other factors. The Health Audit is a diagnostic consultation — it does not guarantee specific fitness outcomes. Nothing on this page constitutes medical advice.
          </p>
          <p>
            <strong>Facebook / Meta Disclaimer:</strong> This site is not part of, or endorsed by, Facebook, Meta Platforms Inc., or any of its subsidiaries. FACEBOOK is a trademark of META PLATFORMS, INC.
          </p>
          <p className="footer-copyright">
            © 2026 The Athletic Indian · Asveth Sreiram · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
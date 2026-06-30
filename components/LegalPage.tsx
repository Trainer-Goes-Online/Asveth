'use client';

import React from 'react';
import PageShell from './PageShell';

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

const LegalPage: React.FC<LegalPageProps> = ({ title, intro, sections }) => {
  return (
    <PageShell width="narrow">
      <article className="legal">
        <h1 className="legal-title">{title}</h1>
        <p className="legal-intro">{intro}</p>

        {sections.map((s, i) => (
          <section key={i} className="legal-section">
            <h2 className="legal-heading">{s.heading}</h2>
            <div className="legal-body">{s.body}</div>
          </section>
        ))}
      </article>
    </PageShell>
  );
};

export default LegalPage;

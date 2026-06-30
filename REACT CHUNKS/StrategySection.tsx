'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PRICE_DISPLAY } from '../lib/siteConfig';

const StrategySection: React.FC = () => {
  const steps = [
    {
      number: "01",
      icon: "🔬",
      tag: "Assessment · Value ₹2,500",
      title: "The Health Audit Call",
      description: "A live Zoom session — not a sales call. We assess your symptoms, injury history, and eating patterns to identify what blood markers you should test and what internal blocks to investigate. Most people have never been told what to look for. They've only been told to try harder. This call shows you exactly what to examine."
    },
    {
      number: "02", 
      icon: "📋",
      tag: "Guidance · Value ₹1,500",
      title: "Personalised Testing Roadmap",
      description: "Your personalized testing roadmap — which specific blood markers to test (D3, testosterone, thyroid, HbA1c, B12), how to interpret results, and what dietary patterns to track. Every recommendation tailored to your symptoms and goals — not generic advice. This level of personalized health guidance normally requires multiple specialist consultations."
    },
    {
      number: "03",
      icon: "🎯", 
      tag: "Roadmap · Value ₹2,000",
      title: "Custom Transformation Roadmap",
      description: "A personalised action framework based on your symptoms, injury profile, and lifestyle reality. Not a generic plan — a roadmap that says 'here's what to test first, then what to optimize, then how to build.' You don't leave with vague advice. You leave with clear, specific, immediately actionable next steps to uncover your blocks."
    }
  ];

  // Scroll-driven progressive timeline: each number lights up as it crosses
  // the activation line. Scrolling down lights 1 → 2 → 3, scrolling up
  // dims 3 → 2 → 1 (cumulative, based on each node's position).
  const numRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      // Activation line sits a little below the vertical centre of the viewport.
      const line = window.innerHeight * 0.62;
      let count = 0;
      for (const el of numRefs.current) {
        if (el && el.getBoundingClientRect().top < line) count += 1;
      }
      setActiveCount((prev) => (prev === count ? prev : count));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <div className="section-divider"></div>

      <section className="strategy-section">
        <p className="section-eyebrow">The Health Audit</p>

        <h2 className="section-headline">
          Not a Consultation.
          <span>An Assessment.</span>
        </h2>

        <p className="section-sub">
          Here's exactly what you get in your Health Audit — ₹6,000 worth of health expertise and guidance for {PRICE_DISPLAY}.
        </p>

        <div className="steps-wrap">
          {steps.map((step, index) => {
            const numberOn = index < activeCount;        // this node is lit
            const lineOn = index + 1 < activeCount;       // next node is lit → fill this rail
            return (
            <div
              key={index}
              className={`step-row ${lineOn ? 'line-on' : ''}`}
            >
              <div className="step-left">
                <div
                  className={`step-num ${numberOn ? 'is-active' : ''}`}
                  ref={(el) => {
                    numRefs.current[index] = el;
                  }}
                >
                  {step.number}
                </div>
                <div className="step-line"></div>
              </div>
              <div className="step-card">
                <div className="card-top">
                  <div className="card-icon">{step.icon}</div>
                  <div className="card-tag">{step.tag}</div>
                </div>
                <div className="card-title">{step.title}</div>
                <div className="card-body">
                  {step.description.split(/(\*\*.*?\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.includes('why')) {
                      return <em key={i}>{part}</em>;
                    }
                    return part;
                  })}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default StrategySection;
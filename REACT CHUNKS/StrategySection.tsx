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

  // Smooth scroll-driven timeline: one continuous rail whose fill height tracks
  // the scroll position (not stepped). Each number lights up the moment the
  // fill reaches its centre; the most-recent one pulses as the "current" node.
  const numRefs = useRef<Array<HTMLDivElement | null>>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [rail, setRail] = useState({ left: 0, top: 0, height: 0, fill: 0 });

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const wrap = wrapRef.current;
      const nodes = numRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!wrap || nodes.length === 0) return;

      const wrapRect = wrap.getBoundingClientRect();
      const first = nodes[0].getBoundingClientRect();
      const last = nodes[nodes.length - 1].getBoundingClientRect();

      // Rail geometry (relative to the wrap): runs node-1 centre → node-N centre.
      const centerX = first.left + first.width / 2 - wrapRect.left;
      const firstCenterY = first.top + first.height / 2 - wrapRect.top;
      const lastCenterY = last.top + last.height / 2 - wrapRect.top;
      const trackHeight = Math.max(0, lastCenterY - firstCenterY);

      // Activation line in the viewport; fill = how far it has passed node 1.
      const activationY = window.innerHeight * 0.55;
      const firstCenterViewport = first.top + first.height / 2;
      const fill = Math.max(0, Math.min(trackHeight, activationY - firstCenterViewport));

      let count = 0;
      for (const n of nodes) {
        const r = n.getBoundingClientRect();
        if (r.top + r.height / 2 <= activationY) count += 1;
      }

      setRail((prev) =>
        prev.left === centerX &&
        prev.top === firstCenterY &&
        prev.height === trackHeight &&
        Math.abs(prev.fill - fill) < 0.5
          ? prev
          : { left: centerX, top: firstCenterY, height: trackHeight, fill }
      );
      setActiveCount((prev) => (prev === count ? prev : count));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    // Recompute once layout/fonts settle so the rail lands on the node centres.
    const settle = setTimeout(compute, 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
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

        <div className="steps-wrap" ref={wrapRef}>
          {/* one continuous rail; its fill height tracks scroll smoothly */}
          <div
            className="steps-rail"
            style={{ left: rail.left, top: rail.top, height: rail.height }}
            aria-hidden="true"
          >
            <div className="steps-rail-fill" style={{ height: rail.fill }} />
          </div>

          {steps.map((step, index) => {
            const numberOn = index < activeCount;          // this node is lit
            const isCurrent = index === activeCount - 1;    // most-recent → pulse
            return (
            <div key={index} className="step-row">
              <div className="step-left">
                <div
                  className={`step-num ${numberOn ? 'is-active' : ''} ${isCurrent ? 'is-current' : ''}`}
                  ref={(el) => {
                    numRefs.current[index] = el;
                  }}
                >
                  {step.number}
                </div>
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
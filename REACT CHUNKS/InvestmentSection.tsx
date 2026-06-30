import React from 'react';

interface InvestmentSectionProps {
  onOpenQuiz?: () => void;
}

const InvestmentSection: React.FC<InvestmentSectionProps> = ({ onOpenQuiz }) => {
  const investmentPoints = [
    "People who pay show up. Free sessions get ignored.",
    "This is a filter, not a barrier. We only work with serious men.",
    "One gym PT session costs ₹1,500 and skips your blood markers entirely.",
    "₹6,000 worth of health expertise and guidance. You pay ₹97.",
    "No clarity? Full refund. No forms. Just WhatsApp us.",
    "Every coach you've tried started with a plan. None of them started with an assessment.",
    "Every month in that AC office, your D3 drops and the body you want gets harder to build.",
    "₹97 to understand exactly what you need to investigate. Or keep wondering."
  ];

  const priceAnchors = [
    { label: "One health consultation", price: "₹2,000" },
    { label: "One PT session at gym", price: "₹1,500" },
    { label: "Starbucks for two people", price: "₹1,000" },
    { label: "Your Health Audit + roadmap", price: "₹97", highlight: true }
  ];

  return (
    <>
      <div className="section-divider" style={{ marginTop: '64px' }}></div>

      <section className="invest-section">
        <p className="invest-eyebrow">Investment</p>
        <h2 className="invest-headline">Why Only ₹97?</h2>
        <div className="invest-rule"></div>

        <div className="invest-card">
          {/* LEFT: reasoning */}
          <div className="invest-left">
            <div className="invest-card-title">
              A Small Investment.<br />A Serious Commitment.
            </div>
            <ul className="invest-points">
              {investmentPoints.map((point, index) => (
                <li key={index}>
                  <span className="invest-arrow">→</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: price + CTA + anchors */}
          <div className="invest-right">
            <div className="invest-price">
              <span className="invest-rupee">₹</span>
              <span className="invest-amount">97</span>
            </div>
            <div className="invest-price-label">One-Time · Risk-Free</div>

            <a 
              href="#" 
              className="invest-cta-btn"
              onClick={(e) => {
                e.preventDefault();
                onOpenQuiz && onOpenQuiz();
              }}
            >
              Book My Health Audit Now
              <span className="invest-cta-sub">₹97 · Full refund if no clarity</span>
            </a>

            <div className="invest-anchors">
              {priceAnchors.map((anchor, index) => (
                <div 
                  key={index} 
                  className={`anchor-row ${anchor.highlight ? 'highlight-row' : ''}`}
                >
                  <span className="anchor-label">{anchor.label}</span>
                  <span className="anchor-price">{anchor.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default InvestmentSection;
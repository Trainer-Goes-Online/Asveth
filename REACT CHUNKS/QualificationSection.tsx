import React from 'react';

const QualificationSection: React.FC = () => {
  const qualifications = {
    yes: [
      "You're an IT professional or desk-job worker who's been going to the gym but not seeing results",
      "You're an NRI who wants expert-level coaching without paying local trainer prices abroad", 
      "You've tried diets and workout plans before — and they worked for a while, then stopped",
      "You suspect something internal (hormones, deficiencies, metabolism) is working against you",
      "You're done guessing — you want real answers about what's actually holding your body back, not just another routine to follow",
      "You're willing to commit to 3 days a week and make small, sustainable changes to your diet",
      "You want results you can keep — not a transformation that reverses the moment you stop"
    ],
    no: [
      "You're looking for a generic 12-week PDF with a meal plan that ignores your blood markers",
      "You want quick fixes, fat-burner pills, or extreme crash diets",
      "You're not willing to get a basic blood panel done before starting", 
      "You make excuses about time, genetics, or your desk job being the reason you can't change",
      "You want someone to just tell you to \"eat less and move more\"",
      "You're not ready to follow a structured programme for at least 90 days",
      "You're comfortable staying exactly where you are"
    ]
  };

  return (
    <>
      <div className="section-divider" style={{ marginTop: '64px' }}></div>

      <section className="qualify-section">
        <h2 className="qualify-headline">
          This Is <span className="not">NOT</span> For Everyone
        </h2>
        <p className="qualify-sub">
          Asveth works with men who are serious about understanding their body — not looking for shortcuts or someone to hand them a PDF.
        </p>

        <div className="qualify-grid">
          {/* YES CARD */}
          <div className="qualify-card yes-card">
            <div className="qualify-card-header">
              <span className="qi">✔</span> This is for you if:
            </div>
            <ul className="qualify-list">
              {qualifications.yes.map((item, index) => (
                <li key={index}>
                  <span className="qi">✔</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* NO CARD */}
          <div className="qualify-card no-card">
            <div className="qualify-card-header">
              <span className="qi">✗</span> This is NOT for you if:
            </div>
            <ul className="qualify-list">
              {qualifications.no.map((item, index) => (
                <li key={index}>
                  <span className="qi">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="qualify-footer">
          <span>⚠</span> If you're looking for a generic coach who skips the assessment — respectfully, this Health Audit is not designed for you.
        </div>
      </section>
    </>
  );
};

export default QualificationSection;
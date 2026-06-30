import React from 'react';

interface MentorSectionProps {
  onOpenQuiz?: () => void;
}

const MentorSection: React.FC<MentorSectionProps> = ({ onOpenQuiz }) => {
  const credentials = [
    {
      icon: "🎓",
      label: "Stanford Certified",
      sub: "Nutrition, Genetics & Exercise Methodology"
    },
    {
      icon: "🏆", 
      label: "National Gold Medallist",
      sub: "Competitive Powerlifting · 5 State Titles"
    },
    {
      icon: "👥",
      label: "100+ Active Clients", 
      sub: "India, Singapore, Dubai, France, UK"
    },
    {
      icon: "📱",
      label: "650K+ Instagram",
      sub: "The Athletic Indian · Featured on Behindwoods"
    }
  ];

  return (
    <>
      <div className="section-divider" style={{ marginTop: '64px' }}></div>

      <section className="mentor-section">
        <p className="mentor-eyebrow">Your Coach</p>
        <h2 className="mentor-headline">
          Meet The Man<br />Behind <span>The Method.</span>
        </h2>

        <div className="mentor-grid">
          {/* LEFT: photo card */}
          <div className="mentor-photo-card">
            <img 
              src="/mentor-photo.webp" 
              style={{
                width: '100%',
                height: '100%', 
                objectFit: 'cover',
                objectPosition: 'center top',
                position: 'absolute',
                inset: '0'
              }}
              alt="Asveth - Science-Backed Health Strategist"
            />

            <div className="mentor-photo-name">
              <span className="mentor-photo-name-main">Asveth</span>
              <span className="mentor-photo-name-role">Science-Backed Health Strategist</span>
            </div>
          </div>

          {/* RIGHT: content */}
          <div className="mentor-content">
            <div className="mentor-name-block">
              <div className="mentor-name">Asveth Sreiram</div>
              <div className="mentor-title">Science-Backed Health Strategist · Chennai</div>
            </div>

            <div className="mentor-bio">
              <p>
                Asveth started where most of his clients are now — <strong>skinny, insecure, putting in effort with nothing to show for it.</strong> At 18, after four years of trial and error with no coach, no direction, and only YouTube for guidance, he figured out that results don't come from more effort. They come from the right assessment.
              </p>
              <p>
                He's since completed <strong>two Stanford online courses in nutrition &amp; genetics and exercise methodology</strong>, competed at national level powerlifting — and won gold — and built a coaching practice of 65+ active clients across India and the Indian diaspora in Singapore, France, Dubai, and the UK.
              </p>
              <p>
                What makes him different isn't the credentials. It's the framework: <strong>no plan gets built until the body is understood.</strong> Blood markers first. Injury history first. Eating patterns first. Then — and only then — the programme.
              </p>
              <p>
                That's the Diagnostic-First Method. And it's why his clients get results that generic coaching couldn't deliver in years.
              </p>
            </div>

            <div className="mentor-creds">
              {credentials.map((cred, index) => (
                <div key={index} className="cred-item">
                  <div className="cred-icon">{cred.icon}</div>
                  <div className="cred-text">
                    <div className="cred-label">{cred.label}</div>
                    <div className="cred-sub">{cred.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MentorSection;
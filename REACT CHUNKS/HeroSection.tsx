import React, { useRef } from 'react';

interface HeroSectionProps {
  onOpenQuiz?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onOpenQuiz }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  const scrollToVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth' });
      // Add attention-grabbing pulse after scroll
      setTimeout(() => {
        videoRef.current?.classList.add('video-highlight');
        setTimeout(() => {
          videoRef.current?.classList.remove('video-highlight');
        }, 3000);
      }, 800);
    }
  };

  const avatars = ['R', 'M', 'A', 'K', '+'];
  
  const proofStats = [
    { label: '100+ men diagnosed', bold: '100+' },
    { label: '₹6,000 value for ₹97', bold: '₹6,000' }
  ];

  const bottomBarItems = [
    "Live Zoom Health Audit",
    "Health Gap Assessment", 
    "Personalised Roadmap",
    "100% Money-Back Guarantee"
  ];

  // SVG Arrow Component
  const ArrowSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 56 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M50 6 C42 6, 16 10, 10 38" 
        stroke="#f97316" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M5 33 L10 40 L16 34" 
        stroke="#f97316" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
    </svg>
  );

  return (
    <>
      <div className="hero-bg"></div>

      <div className="outer-wrap">
        <div className="frame">
          {/* TOP BAR */}
          <div className="top-bar">
            <div className="logo-wrap">
              <img 
                src="/athletic-indian-logo.png" 
                alt="The Athletic Indian" 
                style={{
                  height: '56px',
                  width: 'auto',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {/* HERO BODY */}
          <div className="hero-body">
            <div className="pre-headline">
              <div className="pre-dot"></div>
              The Health Audit — Only ₹97
            </div>

            <h1 className="headline">
              For The Man Who Has Everything<br />
              <em>Except The Body</em>{' '}
              <span style={{ 
                WebkitTextFillColor: '#fff', 
                background: 'none' 
              }}>
                To Match.
              </span>
            </h1>

            <p className="subheadline">
              Watch this if you've been trying — and your body still isn't changing. Most coaches hand you a plan. Asveth <strong>shows you which blood markers to test first</strong> — your <strong>D3, testosterone, thyroid, HbA1c</strong> — identifies exactly what to investigate, then guides you through the process. Men who follow this approach <strong>lose 7–10kg and add 2 inches to their chest and shoulders in 90 days.</strong>
            </p>

            <div className="cta-wrap">
              <a 
                href="#" 
                className="cta-btn cta-watch"
                onClick={scrollToVideo}
              >
                Watch How Asveth Fixes What Other Coaches Miss
              </a>
            </div>

            {/* ARROWS + SOCIAL PROOF */}
            <div className="proof-row">
              {/* Left arrow */}
              <ArrowSvg className="arrow-svg" />

              <div className="social-proof">
                <div className="avatars">
                  {avatars.map((avatar, index) => (
                    <div key={index} className={`av a${index + 1} proof-avatar`}>
                      {avatar}
                    </div>
                  ))}
                </div>
                
                <div className="stars-wrap">
                  <div className="stars">★★★★★</div>
                  <div className="stars-label">4.9/5 Rating</div>
                </div>

                <div className="proof-divider"></div>
                
                {proofStats.map((stat, index) => (
                  <React.Fragment key={index}>
                    <div className="proof-text">
                      <strong>{stat.bold}</strong> {stat.label.replace(stat.bold, '').trim()}
                    </div>
                    {index < proofStats.length - 1 && (
                      <div className="proof-divider"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Right arrow */}
              <ArrowSvg className="arrow-svg arrow-right-flip" />
            </div>
          </div>

          {/* VIDEO */}
          <div className="video-wrap" ref={videoRef}>
            <div className="video-outer-ring">
              <div className="video-container clickable-video" onClick={() => alert('Video player would open here - Please add your video URL')}>
                <div className="video-thumb-bg" style={{ background: 'none' }}>
                  <img 
                    src="/video-thumnail-1.png" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      position: 'absolute',
                      inset: '0'
                    }}
                    alt="Video thumbnail"
                  />
                  <div style={{
                    position: 'absolute',
                    inset: '0',
                    background: 'linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%)'
                  }}></div>
                </div>
                
                {/* Large Premium Play Button */}
                <div className="video-play-button">
                  <div className="play-button-outer">
                    <div className="play-button-inner">
                      <svg 
                        width="32" 
                        height="32" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        className="play-icon"
                      >
                        <path 
                          d="M8 5v14l11-7z" 
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="play-button-pulse"></div>
                </div>
                
                
                <div className="video-overlay"></div>
              </div>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="bottom-bar">
            {bottomBarItems.map((item, index) => (
              <div key={index} className="check-item">
                <div className="check-icon">✓</div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
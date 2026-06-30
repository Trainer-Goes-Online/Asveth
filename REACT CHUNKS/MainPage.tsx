import React, { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import StrategySection from './StrategySection';
import CarouselSection from './CarouselSection';
import MentorSection from './MentorSection';
import QualificationSection from './QualificationSection';
import InvestmentSection from './InvestmentSection';
import FinalCtaSection from './FinalCtaSection';
import FooterSection from './FooterSection';
import QuizPopup from './QuizPopup';

const MainPage: React.FC = () => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const openQuiz = () => setIsQuizOpen(true);
  const closeQuiz = () => setIsQuizOpen(false);

  // Scroll-triggered animation setup
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // For number counters
          if (entry.target.classList.contains('counter-trigger')) {
            entry.target.classList.add('count-active');
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all sections for scroll animations
    const animatedElements = document.querySelectorAll('.scroll-reveal, .counter-trigger');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="min-h-screen">
      <HeroSection onOpenQuiz={openQuiz} />
      <div className="scroll-reveal">
        <StrategySection />
      </div>
      <div className="scroll-reveal">
        <CarouselSection />
      </div>
      <div className="scroll-reveal">
        <MentorSection onOpenQuiz={openQuiz} />
      </div>
      <div className="scroll-reveal">
        <QualificationSection />
      </div>
      <div className="scroll-reveal">
        <InvestmentSection onOpenQuiz={openQuiz} />
      </div>
      <div className="scroll-reveal">
        <FinalCtaSection onOpenQuiz={openQuiz} />
      </div>
      <FooterSection />
      <QuizPopup isOpen={isQuizOpen} onClose={closeQuiz} />
      
      {/* Mobile Fixed Bottom CTA */}
      <div className="mobile-bottom-cta">
        <div className="mobile-cta-content">
          <div className="mobile-cta-info">
            <div className="mobile-cta-title">Health Audit</div>
            <div className="mobile-cta-price">Only ₹97</div>
          </div>
          <button 
            className="mobile-cta-btn"
            onClick={openQuiz}
          >
            <span className="mobile-cta-icon">⚡</span>
            Book Now
          </button>
        </div>
      </div>
    </main>
  );
};

export default MainPage;
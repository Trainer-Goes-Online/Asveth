import React from 'react';

interface BeforeAfterCard {
  type: 'before-after';
  id: string;
  name: string;
  stat: string;
  description: string;
}

type CarouselCard = BeforeAfterCard;

const CarouselSection: React.FC = () => {

  const carouselCards: CarouselCard[] = [
    {
      type: 'before-after',
      id: 'rahul-ba',
      name: 'Rahul',
      stat: '↓ 40kg',
      description: 'Gym-goer for years. No results. Blood markers revealed the real block.'
    },
    {
      type: 'before-after',
      id: 'kesavan-ba',
      name: 'Kesavan',
      stat: 'Body Recomp',
      description: 'IT Professional. Working 12+ hours. Blood markers revealed D3 deficiency blocking results.'
    },
    {
      type: 'before-after',
      id: 'sanjeev-ba',
      name: 'Sanjeev',
      stat: '↓ 15kg',
      description: 'Software Engineer. Tried everything. Blood work showed thyroid issues blocking fat loss.'
    }
  ];



  const renderBeforeAfterCard = (card: BeforeAfterCard) => {
    // Map client names to their image files
    const getClientImage = (name: string) => {
      const nameMap: { [key: string]: string } = {
        'Rahul': 'rahul.png',
        'Kesavan': 'kesavan.png',
        'Sanjeev': 'sanjeev.png'
      };
      return `/client results/${nameMap[name] || 'rahul.png'}`;
    };

    return (
      <div key={card.id} className="c-card c-ba-card">
        <div className="c-ba-split">
          <div className="c-ba-slot">
            <img 
              src={getClientImage(card.name)} 
              alt={`${card.name} transformation`}
              className="c-ba-image"
            />
          </div>
        </div>
        <div className="c-ba-info">
          <div className="c-ba-result">
            {card.stat}
          </div>
          <div className="c-ba-desc">{card.description}</div>
        </div>
      </div>
    );
  };


  const renderCard = (card: CarouselCard) => {
    if (card.type === 'before-after') {
      return renderBeforeAfterCard(card);
    }
    return null;
  };

  return (
    <>
      <div className="section-divider" style={{ marginTop: '64px' }}></div>
      
      <section className="carousel-section">
        <div className="carousel-header">
          <p className="carousel-eyebrow counter-trigger">
            <strong><span className="counter-number">100+</span> men</strong> have gone through the Diagnostic-First Method
          </p>
          <h2 className="carousel-headline">See What Asveth's Clients Achieve</h2>
        </div>

        <div className="carousel-track-wrap">
          <div className="carousel-track">
            {carouselCards.map(renderCard)}
          </div>
        </div>

      </section>
    </>
  );
};

export default CarouselSection;
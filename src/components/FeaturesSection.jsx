import React from 'react';

const FeatureCard = ({ iconClass, title, text }) => (
  <div className="feature-card">
    <div className="feature-icon">
      <i className={iconClass}></i>
    </div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const FeaturesSection = () => {
  return (
    <section id="features" className="features">
      <h2>Features</h2>
      <div className="feature-grid">
        <FeatureCard
          iconClass="fas fa-language"
          title="Multiple Voices"
          text="Choose from a variety of voices and languages"
        />
        <FeatureCard
          iconClass="fas fa-sliders-h"
          title="Adjustable Settings"
          text="Customize speed and pitch to your preference"
        />
        <FeatureCard
          iconClass="fas fa-play-circle"
          title="Playback Controls"
          text="Play, pause, resume, and stop speech anytime"
        />
        <FeatureCard
          iconClass="fas fa-mobile-alt"
          title="Responsive Design"
          text="Works on desktop, tablet, and mobile devices"
        />
      </div>
    </section>
  );
};

export default FeaturesSection;
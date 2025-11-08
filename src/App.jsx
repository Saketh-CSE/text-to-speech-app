import React from 'react';
import './index.css'; // <-- MAKE SURE THIS LINE IS HERE

import AppHeader from './components/AppHeader';
import HeroSection from './components/HeroSection';
import Converter from './components/Converter';
import FeaturesSection from './components/FeaturesSection';
import AboutSection from './components/AboutSection';
import AppFooter from './components/AppFooter';

function App() {
  return (
    <div className="app-container">
      <AppHeader />
      <main className="main-content">
        <HeroSection />
        <Converter />
        <FeaturesSection />
        <AboutSection />
      </main>
      <AppFooter />
    </div>
  );
}

export default App;
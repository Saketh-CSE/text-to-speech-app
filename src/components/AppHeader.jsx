import React from 'react';

const AppHeader = () => {
  return (
    <header className="header">
      <div className="logo">
        <h1>VoiceAloud</h1>
      </div>
      <nav className="nav-menu">
        <ul>
          <li><a href="#" className="active">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default AppHeader;
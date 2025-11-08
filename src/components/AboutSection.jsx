import React from 'react';

const AboutSection = () => {
  return (
    <section id="about" className="about-section">
      <div className="about-content">
        <h2>About Text to Speech Technology</h2>
        <p>
          Text-to-speech (TTS) is a form of speech synthesis that converts text into spoken
          voice output. This technology is widely used to assist people with visual
          impairments or reading disabilities, for learning languages, and for various
          applications where audio output enhances user experience.
        </p>
        <p>
          Our text-to-speech converter uses the Web Speech API, a technology built into
          modern web browsers that allows websites to speak. This means no extra software
          installation is needed - it works right in your browser!
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
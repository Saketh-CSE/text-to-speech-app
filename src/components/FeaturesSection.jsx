import React from 'react';
import {
  Languages,
  SlidersHorizontal,
  Play,
  MonitorSmartphone,
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      name: 'Multiple Voices',
      description: 'Choose from a variety of voices and languages provided by your browser.',
      icon: Languages,
    },
    {
      name: 'Adjustable Settings',
      description: 'Customize the speech speed and pitch to your exact preference.',
      icon: SlidersHorizontal,
    },
    {
      name: 'Playback Controls',
      description: 'Play, pause, resume, and stop the speech playback at any time.',
      icon: Play,
    },
    {
      name: 'Responsive Design',
      description: 'Works beautifully on your desktop, tablet, and mobile devices.',
      icon: MonitorSmartphone,
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Everything you need for a great experience
          </p>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.name} className="pt-6">
              <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 shadow-sm">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-md shadow-lg">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.name}</h3>
                  <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
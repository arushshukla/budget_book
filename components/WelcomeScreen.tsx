import React from 'react';
import LogoIcon from './LogoIcon';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col h-screen p-6 bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-slate-900 dark:to-gray-900 text-center">
      <main className="flex-grow flex flex-col items-center justify-center">
        
        <div className="animate-bounce-in">
            <LogoIcon className="h-28 w-28 text-primary shadow-lg rounded-[28px]" />
        </div>

        <h1 className="text-5xl font-black tracking-wider text-text-light dark:text-text-dark mt-6">
          BUDGET BOOK
        </h1>
        
        <p className="mt-2 text-lg text-text-muted-light dark:text-text-muted-dark">
          Smart money habits start young.
        </p>

        <button
          onClick={onStart}
          className="mt-12 py-4 px-10 bg-primary text-white font-bold text-xl rounded-full shadow-lg hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          Get Started
        </button>
      </main>
    </div>
  );
};

export default WelcomeScreen;
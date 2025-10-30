import React from 'react';
import type { ArchivedMonth } from '../types';

interface PreviousMonthsScreenProps {
  onBack: () => void;
  archivedMonths: ArchivedMonth[];
  onViewReport: (monthData: ArchivedMonth) => void;
}

const EmptyState = () => (
    <div className="text-center py-20 px-4 animate-fade-in-up">
        <div className="text-5xl mb-4 animate-pulse-gentle">🗄️</div>
        <h3 className="font-semibold text-lg text-text-light dark:text-text-dark">No Archives Yet</h3>
        <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Your past monthly reports will appear here automatically.</p>
    </div>
);

const PreviousMonthsScreen: React.FC<PreviousMonthsScreenProps> = ({ onBack, archivedMonths, onViewReport }) => {
  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95" aria-label="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark mx-auto">Archived Months</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        {archivedMonths.length > 0 ? (
          <ul className="space-y-4">
            {archivedMonths.map((archive, index) => {
              const [year, monthIndex] = archive.month.split('-').map(Number);
              const monthDate = new Date(year, monthIndex - 1);
              const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
              
              const totalSpent = archive.expenses.reduce((sum, exp) => sum + exp.amount, 0);
              const savings = archive.pocketMoney - totalSpent;

              return (
                <li key={archive.month} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 60}ms`}}>
                  <button 
                    onClick={() => onViewReport(archive)} 
                    className="w-full text-left p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md hover:shadow-lg transition-all flex justify-between items-center active:scale-[0.98]"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">{monthName}</h2>
                      <div className="flex space-x-4 mt-1 text-sm">
                        <p className="text-red-600 dark:text-red-400">Spent: ₹{totalSpent.toLocaleString()}</p>
                        <p className="text-green-600 dark:text-green-400">Saved: ₹{savings.toLocaleString()}</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
};

export default PreviousMonthsScreen;
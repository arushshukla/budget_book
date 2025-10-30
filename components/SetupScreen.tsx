import React, { useState } from 'react';
import LogoIcon from './LogoIcon';
import type { PocketMoneyInfo, IncomeSource } from '../types';

interface SetupScreenProps {
  onSave: (info: PocketMoneyInfo) => void;
}

const incomeSourceOptions: IncomeSource[] = ["Monthly Income", "Pocket Money", "Allowance", "Part-Time Job", "Gift", "Other"];

const SetupScreen: React.FC<SetupScreenProps> = ({ onSave }) => {
  const [amount, setAmount] = useState('');
  const [payday, setPayday] = useState('1');
  const [source, setSource] = useState<IncomeSource>('Monthly Income');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    const numericAmount = parseInt(amount, 10);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      setIsSaving(true);
      setTimeout(() => {
        onSave({ amount: numericAmount, payday: parseInt(payday, 10), source });
      }, 1000); // Delay to show animation
    } else {
      setError('Please enter a valid positive amount.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-sm text-center">
            <div className="opacity-0 animate-fade-in-up">
                <LogoIcon className="h-24 w-24 text-primary mx-auto" />
                <h1 className="text-3xl font-bold text-text-light dark:text-text-dark mt-4">Welcome to BUDGET BOOK</h1>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-2 mb-8 text-lg">Track. Save. Learn.</p>
            </div>
            
            <div className="w-full space-y-4">
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <label htmlFor="pocketMoney" className="block text-left text-lg font-medium text-text-light dark:text-text-dark mb-2">
                        Monthly income (₹)
                    </label>
                    <input
                        id="pocketMoney"
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="e.g., 1500"
                        className="w-full p-4 text-center text-2xl border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-input-dark text-black dark:text-white placeholder-placeholder transition-shadow"
                        aria-describedby="error-message"
                    />
                    {error && <p id="error-message" className="text-red-500 mt-2 text-left">{error}</p>}
                </div>
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                     <label htmlFor="incomeSource" className="block text-left text-lg font-medium text-text-light dark:text-text-dark mb-2">
                        Income Source
                    </label>
                    <select 
                        id="incomeSource" 
                        value={source} 
                        onChange={e => setSource(e.target.value as IncomeSource)}
                        className="w-full p-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-input-dark text-black dark:text-white transition-shadow"
                    >
                        {incomeSourceOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                </div>
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                     <label htmlFor="payday" className="block text-left text-lg font-medium text-text-light dark:text-text-dark mb-2">
                        When do you get it? (Day of month)
                    </label>
                    <select 
                        id="payday" 
                        value={payday} 
                        onChange={e => setPayday(e.target.value)}
                        className="w-full p-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-input-dark text-black dark:text-white transition-shadow"
                    >
                        {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="mt-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <button
                    onClick={handleSave}
                    className={`w-full py-4 px-6 text-white font-bold text-xl rounded-lg shadow-lg transition-all duration-300 ${isSaving ? 'bg-green-500' : 'bg-primary hover:bg-primary-dark active:scale-[0.98]'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    disabled={!amount || isSaving}
                >
                    {isSaving ? (
                        <span className="animate-bounce-in inline-block">All Set!</span>
                    ) : (
                        'Start Tracking'
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SetupScreen;
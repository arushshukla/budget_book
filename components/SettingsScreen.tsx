import React, { useState, useRef, useMemo } from 'react';
import type { Theme, Screen, PocketMoneyInfo, IncomeSource } from '../types';
import * as storage from '../services/storage';

interface SettingsScreenProps {
  onBack: () => void;
  currentPocketMoneyInfo: PocketMoneyInfo;
  onUpdatePocketMoney: (newInfo: PocketMoneyInfo) => void;
  onResetData: () => void;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  onNavigate: (screen: Screen) => void;
  isPasscodeSet: boolean;
  quickExpenseButtonCount: number;
  onSetQuickExpenseButtonCount: (count: number) => void;
}

const incomeSourceOptions: IncomeSource[] = ["Monthly Income", "Pocket Money", "Allowance", "Part-Time Job", "Gift", "Other"];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    onBack, 
    currentPocketMoneyInfo, 
    onUpdatePocketMoney, 
    onResetData, 
    currentTheme, 
    onSetTheme,
    onNavigate,
    isPasscodeSet,
    quickExpenseButtonCount,
    onSetQuickExpenseButtonCount,
}) => {
  const [pocketMoneyInput, setPocketMoneyInput] = useState(String(currentPocketMoneyInfo.amount || ''));
  const [paydayInput, setPaydayInput] = useState(String(currentPocketMoneyInfo.payday));
  const [sourceInput, setSourceInput] = useState<IncomeSource>(currentPocketMoneyInfo.source || 'Monthly Income');
  const [buttonCount, setButtonCount] = useState(quickExpenseButtonCount);
  const [showSuccess, setShowSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePocketMoneySave = () => {
    const amount = parseInt(pocketMoneyInput, 10);
    if (!isNaN(amount) && amount > 0) {
      onUpdatePocketMoney({ amount, payday: parseInt(paydayInput, 10), source: sourceInput });
      setShowSuccess('income');
      setTimeout(() => setShowSuccess(''), 2000);
    } else {
      alert('Please enter a valid positive amount.');
    }
  };

  const handleBackup = () => {
    try {
        const data = storage.getAppData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `budgetbuddy_backup_${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Backup failed:", error);
        alert("Could not create backup file.");
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("Restoring from a backup will overwrite all current data. Are you sure you want to continue?")) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const data = JSON.parse(text);
            if (data.pocketMoneyInfo !== undefined && data.allExpenses !== undefined) {
                storage.saveAppData(data);
                alert("Data restored successfully! The app will now reload.");
                window.location.reload();
            } else {
                throw new Error("Invalid backup file format.");
            }
        } catch (error) {
            console.error("Restore failed:", error);
            alert("Failed to restore data. The backup file might be corrupted or invalid.");
        }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]" aria-label="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark mx-auto">Settings</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Monthly Income</h2>
          <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md space-y-3">
             <div>
                <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Amount (₹)</label>
                <input
                  type="number"
                  value={pocketMoneyInput}
                  onChange={(e) => setPocketMoneyInput(e.target.value)}
                  className="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-surface-light dark:bg-input-dark text-black dark:text-white placeholder-placeholder"
                  placeholder="Enter amount"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Income Source</label>
              <select 
                  value={sourceInput} 
                  onChange={e => setSourceInput(e.target.value as IncomeSource)}
                  className="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-surface-light dark:bg-input-dark text-black dark:text-white"
              >
                  {incomeSourceOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Payday (Day of Month)</label>
                <select 
                    value={paydayInput} 
                    onChange={e => setPaydayInput(e.target.value)}
                    className="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-surface-light dark:bg-input-dark text-black dark:text-white"
                >
                    {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
            </div>
             <button onClick={handlePocketMoneySave} className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-transform active:scale-[0.98]">
              Save Income Info
            </button>
            {showSuccess === 'income' && <p className="text-green-600 dark:text-green-400 mt-2 animate-fade-in-up text-center font-semibold">Income updated!</p>}
          </div>
        </section>

         <section>
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Features</h2>
            <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md space-y-3">
                <button onClick={() => onNavigate('quickExpenseSettings')} className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]">
                    <span className="font-medium text-text-light dark:text-text-dark">Customize All Quick Add Buttons</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
                 <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label htmlFor="quick-add-count" className="font-medium text-text-light dark:text-text-dark flex justify-between">
                        <span>Show Quick Add Buttons</span>
                        <span className="font-bold text-primary">{buttonCount}</span>
                    </label>
                    <input
                        id="quick-add-count"
                        type="range"
                        min="3"
                        max="6"
                        step="1"
                        value={buttonCount}
                        onChange={(e) => {
                            const count = parseInt(e.target.value, 10);
                            setButtonCount(count);
                            onSetQuickExpenseButtonCount(count);
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
                    />
                </div>
            </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Appearance</h2>
           <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
            {(['light', 'dark', 'system'] as const).map(themeOption => (
              <button
                key={themeOption}
                onClick={() => onSetTheme(themeOption)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${currentTheme === themeOption ? 'bg-surface-light dark:bg-surface-dark text-primary shadow-md' : 'text-text-muted-light dark:text-text-muted-dark'}`}
              >
                {themeOption}
              </button>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Security</h2>
          <button onClick={() => onNavigate('passcode')} className="w-full text-left p-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]">
            <span className="font-medium text-text-light dark:text-text-dark">App Lock</span>
             <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted-light dark:text-text-muted-dark">{isPasscodeSet ? 'On' : 'Off'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
             </div>
          </button>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Data Management</h2>
          <div className="space-y-3">
             <button onClick={handleBackup} className="w-full text-left p-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]">
                <span className="font-medium text-blue-600 dark:text-blue-400">Backup Data</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 8.414V13a1 1 0 11-2 0V8.414L6.293 9.707z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left p-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]">
                <span className="font-medium text-blue-600 dark:text-blue-400">Restore from Backup</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V5a1 1 0 112 0v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".json" />
            <button onClick={onResetData} className="w-full text-left p-3 bg-red-100 dark:bg-red-900/50 rounded-xl shadow-md flex items-center justify-between hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors active:scale-[0.98]">
              <span className="font-medium text-red-700 dark:text-red-300">Reset Current Month's Data</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.001-1.742 3.001H4.42c-1.522 0-2.492-1.667-1.742-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </section>
        
        <section>
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">About & Help</h2>
           <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md text-text-muted-light dark:text-text-muted-dark text-sm space-y-3">
            <p><strong>BUDGET BOOK</strong> helps you take control of your finances and build smart money habits for life.</p>
            <a href="mailto:feedback@budgetbuddy.app?subject=BUDGET BOOK Feedback" className="block font-medium text-primary hover:underline">Send Feedback</a>
            <p className="mt-4 text-xs">Version 1.1.0</p>
          </div>
        </section>

        <div className="pt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Crafted with passion by Arush Shukla</p>
        </div>

      </main>
    </div>
  );
};

export default SettingsScreen;
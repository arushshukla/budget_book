import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AppData, Screen, Expense, ArchivedMonth, Theme, CategoryBudgets, PocketMoneyInfo, QuickExpenseItem, BudgetStreak, SavingsGoal } from './types';
import * as storage from './services/storage';
import { Category } from './types';

import WelcomeScreen from './components/WelcomeScreen';
import SetupScreen from './components/SetupScreen';
import Dashboard from './components/Dashboard';
import ExpenseFormScreen from './components/AddExpenseScreen';
import ReportScreen from './components/ReportScreen';
import SettingsScreen from './components/SettingsScreen';
import PreviousMonthsScreen from './components/PreviousMonthsScreen';
import SearchScreen from './components/SearchScreen';
import InsightsScreen from './components/InsightsScreen';
import LogoIcon from './components/LogoIcon';

// --- Voice Input Parsing Logic ---
// ... (omitted for brevity, no changes)
const numberWords: { [key: string]: number } = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100, }; const currencyWords: string[] = ['rupee', 'rupees', 'rs', 'r', 's', 'inr', 'dollar', 'dollars', 'paisa', 'paise', 'bucks']; const fillerWords: string[] = [ 'i', 'spent', 'spend', 'on', 'at', 'the', 'a', 'for', 'my', 'bought', 'buy', 'an', 'and', 'is', 'was', 'cost', 'costs', 'amounting', 'to', 'of', ...currencyWords ]; const convertWordToNumber = (words: string[]): number | null => { if (words.length === 2 && words.includes('one') && words.includes('fifty')) { return 150; } let total = 0; let currentNumber = 0; for (const word of words) { if (numberWords[word] !== undefined) { const val = numberWords[word]; if (val === 100) { currentNumber = (currentNumber === 0 ? 1 : currentNumber) * val; } else { currentNumber += val; } } else { break; } } total += currentNumber; return total > 0 ? total : null; }; const parseVoiceInput = (text: string): { item: string; amount: number } | null => { if (!text || text.trim() === '') return null; let cleanedText = text.toLowerCase().trim().replace(/₹/g, ' '); const words = cleanedText.split(/\s+/).filter(Boolean); let potentialAmounts: { value: number, index: number, length: number }[] = []; for (let i = 0; i < words.length; i++) { const word = words[i]; const numericValue = parseInt(word, 10); if (!isNaN(numericValue)) { potentialAmounts.push({ value: numericValue, index: i, length: 1 }); continue; } if (numberWords[word]) { let amountWordBlock = [word]; let j = i + 1; while (j < words.length && numberWords[words[j]]) { amountWordBlock.push(words[j]); j++; } const value = convertWordToNumber(amountWordBlock); if (value) { potentialAmounts.push({ value, index: i, length: amountWordBlock.length }); i = j - 1; } } } if (potentialAmounts.length === 0) return null; const chosenAmount = potentialAmounts[potentialAmounts.length - 1]; const amount = chosenAmount.value; const itemWords = [ ...words.slice(0, chosenAmount.index), ...words.slice(chosenAmount.index + chosenAmount.length) ]; const cleanedItemWords = itemWords.filter(word => !fillerWords.includes(word.toLowerCase())); if (cleanedItemWords.length === 0) return null; let item = cleanedItemWords.join(' ').trim(); if (!item) return null; item = item.charAt(0).toUpperCase() + item.slice(1); return { item, amount }; };


// Custom hook for managing modal open/close animations
const useAnimatedModal = (duration = 300) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
        setIsClosing(false);
    }, []);

    const close = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, duration);
    }, [duration]);

    const animationClass = isClosing ? 'animate-modal-exit' : 'animate-modal-enter';

    return { isOpen, open, close, animationClass };
};


// --- Onboarding Screen Component ---
const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState(0);
    const [animationState, setAnimationState] = useState<'entering' | 'exiting' | 'idle'>('entering');
    const onboardingSteps = [
        { icon: '📈', title: "Track Your Spending", description: "Effortlessly log every expense to see exactly where your money goes." },
        { icon: '🏆', title: "Set Fun Budgets", description: "Set monthly spending limits for categories to stay on track and save more." },
        { icon: '🔒', title: "Your Data is Yours", description: "BUDGET BOOK works 100% offline. No sign-up, no accounts. Your financial data never leaves your device." }
    ];

    const handleComplete = useCallback(() => {
        if (animationState === 'exiting') return; // Prevent double-taps
        setAnimationState('exiting');
        setTimeout(onComplete, 400);
    }, [animationState, onComplete]);

    const handleNext = useCallback(() => {
        if (animationState === 'exiting') return; // Prevent double-taps

        if (step < onboardingSteps.length - 1) {
            setAnimationState('exiting');
            setTimeout(() => {
                setStep(s => s + 1);
                setAnimationState('entering');
            }, 400);
        } else {
            handleComplete();
        }
    }, [animationState, step, onboardingSteps.length, handleComplete]);

    const currentStep = onboardingSteps[step];
    const animationClass = animationState === 'exiting' ? 'animate-onboarding-exit' : 'animate-onboarding-enter';

    // Defensive check to prevent crash if step is out of bounds
    if (!currentStep) {
        return null; 
    }

    return (
        <div className="flex flex-col h-screen p-6 bg-background-light dark:bg-background-dark text-center overflow-hidden">
            <header className="flex justify-end opacity-0 animate-fade-in" style={{ animationDelay: '200ms'}}>
                <button onClick={handleComplete} className="text-primary font-semibold transition-transform active:scale-[0.98]">Skip</button>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center relative">
                <div key={step} className={`absolute w-full px-4 ${animationClass}`}>
                    <div className="text-6xl mb-8 animate-bounce-in">{currentStep.icon}</div>
                    <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{currentStep.title}</h1>
                    <p className="mt-2 text-lg text-text-muted-light dark:text-text-muted-dark max-w-xs mx-auto">{currentStep.description}</p>
                    {step === 2 && (
                        <div className="mt-8 p-3 bg-teal-100 dark:bg-teal-900/50 rounded-lg text-teal-800 dark:text-teal-200 font-semibold opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            🔒 100% Offline • No Data Leaves Your Phone
                        </div>
                    )}
                </div>
            </main>
            <footer className="pb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms'}}>
                <div className="flex justify-center space-x-2 mb-8">
                    {onboardingSteps.map((_, index) => (
                        <div key={index} className={`w-2 h-2 rounded-full transition-all duration-300 ${step === index ? 'bg-primary scale-125' : 'bg-gray-300'}`}></div>
                    ))}
                </div>
                <button onClick={handleNext} className="w-full py-4 px-10 bg-primary text-white font-bold text-xl rounded-xl shadow-lg hover:bg-primary-dark transition-transform active:scale-[0.98]">
                    {step < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
                </button>
            </footer>
        </div>
    );
};

// --- Passcode Screen Component ---
// ... (omitted for brevity, no changes)
const PasscodeScreen = ({ onCorrect, onCompleteSetup, storedPasscode }: { onCorrect: () => void, onCompleteSetup: (newPasscode: string) => void, storedPasscode: string | null }) => { const [passcode, setPasscode] = useState(''); const [confirmPasscode, setConfirmPasscode] = useState<string | null>(null); const [error, setError] = useState(''); const isSettingUp = storedPasscode === null; const handleKeyPress = (key: string) => { setError(''); if (key === 'del') { if (confirmPasscode !== null) { setConfirmPasscode(p => p!.slice(0, -1)); } else { setPasscode(p => p.slice(0, -1)); } } else { const targetPasscode = confirmPasscode !== null ? confirmPasscode : passcode; if (targetPasscode.length < 4) { if (confirmPasscode !== null) { setConfirmPasscode(p => p! + key); } else { setPasscode(p => p + key); } } } }; useEffect(() => { if (!isSettingUp && passcode.length === 4) { if (passcode === storedPasscode) { onCorrect(); } else { setError('Incorrect Passcode'); setTimeout(() => { setPasscode(''); setError(''); }, 1000); } } }, [passcode, isSettingUp, storedPasscode, onCorrect]); const handleSetPasscode = () => { if (passcode.length === 4) { setConfirmPasscode(''); } else { setError('Passcode must be 4 digits'); } }; const handleConfirmPasscode = () => { if (passcode === confirmPasscode) { onCompleteSetup(passcode); } else { setError('Passcodes do not match. Try again.'); setTimeout(() => { setPasscode(''); setConfirmPasscode(null); setError(''); }, 2000); } }; const title = isSettingUp ? (confirmPasscode === null ? 'Create a Passcode' : 'Confirm Passcode') : 'Enter Passcode'; const currentDisplayCode = confirmPasscode !== null ? confirmPasscode : passcode; return ( <div className="flex flex-col h-screen p-6 bg-background-light dark:bg-background-dark text-center"> <main className="flex-grow flex flex-col items-center justify-center"> <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{title}</h1> <div className="flex space-x-4 my-8"> {[...Array(4)].map((_, i) => ( <div key={i} className={`w-4 h-4 rounded-full border-2 ${currentDisplayCode.length > i ? 'bg-primary border-primary' : 'border-gray-400'}`}></div> ))} </div> {error && <p className="text-red-500 h-6">{error}</p>} <div className="grid grid-cols-3 gap-6 mt-4 w-full max-w-xs"> {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ( <button key={n} onClick={() => handleKeyPress(String(n))} className="text-3xl font-semibold h-20 bg-surface-light dark:bg-surface-dark rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]"> {n} </button> ))} <div/> <button onClick={() => handleKeyPress('0')} className="text-3xl font-semibold h-20 bg-surface-light dark:bg-surface-dark rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]"> 0 </button> <button onClick={() => handleKeyPress('del')} className="h-20 flex items-center justify-center bg-surface-light dark:bg-surface-dark rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]"> <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M22 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 14H9V7h10v10zm-4-7h-2v2h2v-2zm-4 0H9v2h2v-2zM2 7v14h14v2H2c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h2V3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2H2V7z"/></svg> </button> </div> {isSettingUp && confirmPasscode === null && ( <button onClick={handleSetPasscode} disabled={passcode.length !== 4} className="mt-8 w-full max-w-xs py-3 bg-primary text-white font-bold rounded-xl disabled:bg-gray-400 active:scale-[0.98]"> Set Passcode </button> )} {isSettingUp && confirmPasscode !== null && ( <button onClick={handleConfirmPasscode} disabled={confirmPasscode.length !== 4} className="mt-8 w-full max-w-xs py-3 bg-primary text-white font-bold rounded-xl disabled:bg-gray-400 active:scale-[0.98]"> Confirm Passcode </button> )} </main> </div> ); };

// --- Budget Screen Component ---
// ... (omitted for brevity, no changes)
const BudgetScreen = ({ budgets, onSave, onBack }: { budgets: CategoryBudgets, onSave: (b: CategoryBudgets) => void, onBack: () => void }) => { const [localBudgets, setLocalBudgets] = useState(budgets); const handleBudgetChange = (category: Category, amount: string) => { const numericAmount = parseInt(amount, 10); setLocalBudgets(prev => ({ ...prev, [category]: isNaN(numericAmount) || numericAmount <= 0 ? undefined : numericAmount })); }; const handleSave = () => { onSave(localBudgets); onBack(); }; return ( <div className="flex flex-col h-full bg-background-light dark:bg-background-dark"> <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10"> <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]" aria-label="Go Back"> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> </button> <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mx-auto">Set Budgets</h1> <div className="w-10"></div> </header> <main className="flex-grow p-4 overflow-y-auto space-y-4"> {Object.values(Category).map(category => ( <div key={category}> <label htmlFor={`budget-${category}`} className="block text-lg font-medium text-text-light dark:text-text-dark">{category}</label> <input id={`budget-${category}`} type="number" value={localBudgets[category] || ''} onChange={(e) => handleBudgetChange(category, e.target.value)} placeholder="No limit" className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-lg bg-white dark:bg-input-dark text-black dark:text-white placeholder-placeholder" /> </div> ))} </main> <footer className="p-4 border-t border-gray-200 dark:border-gray-700"> <button onClick={handleSave} className="w-full py-4 bg-primary text-white font-bold text-xl rounded-xl shadow-lg hover:bg-primary-dark transition-transform active:scale-[0.98]">Save Budgets</button> </footer> </div> ); };

// --- Quick Expense Settings Screen Component ---
// ... (omitted for brevity, no changes)
const QuickExpenseSettingsScreen = ({ items, onSave, onBack }: { items: QuickExpenseItem[], onSave: (items: QuickExpenseItem[]) => void, onBack: () => void }) => { const [localItems, setLocalItems] = useState(items); const handleItemChange = (id: number, field: keyof QuickExpenseItem, value: string | number | Category) => { setLocalItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item)); }; const handleSave = () => { onSave(localItems); onBack(); }; return ( <div className="flex flex-col h-full bg-background-light dark:bg-background-dark"> <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10"> <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]" aria-label="Go Back"> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> </button> <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mx-auto">Customize Quick Add</h1> <div className="w-10"></div> </header> <main className="flex-grow p-4 overflow-y-auto space-y-6"> {localItems.map((item, index) => ( <div key={item.id} className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm"> <h3 className="font-bold text-lg mb-3">Button {index + 1}</h3> <div className="space-y-3"> <div> <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Name</label> <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-input-dark text-black dark:text-white placeholder-placeholder" /> </div> <div> <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Amount (₹)</label> <input type="number" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', parseInt(e.target.value) || 0)} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-input-dark text-black dark:text-white placeholder-placeholder" /> </div> <div> <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Category</label> <select value={item.category} onChange={(e) => handleItemChange(item.id, 'category', e.target.value as Category)} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-input-dark text-black dark:text-white" > {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> </div> </div> </div> ))} </main> <footer className="p-4 border-t border-gray-200 dark:border-gray-700"> <button onClick={handleSave} className="w-full py-4 bg-primary text-white font-bold text-xl rounded-xl shadow-lg hover:bg-primary-dark transition-transform active:scale-[0.98]">Save Changes</button> </footer> </div> ); };

// --- Weekly Summary Modal ---
const WeeklySummaryModal = ({ expenses, pocketMoney, onClose, animationClass }: { expenses: Expense[], pocketMoney: number, onClose: () => void, animationClass: string }) => {
    const summary = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const weeklyExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
        const spent = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const saved = (pocketMoney / 4) - spent; // Simplified weekly income
        const spendByCategory = weeklyExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<Category, number>);
        const topCategory = Object.keys(spendByCategory).length > 0 ? Object.entries(spendByCategory).sort((a, b) => b[1] - a[1])[0] : null;
        return { spent, saved: Math.max(0, saved), topCategory };
    }, [expenses, pocketMoney]);

    const handleShare = () => {
        const message = `My Weekly Budget Report:\n- Spent: ₹${summary.spent}\n- Saved: ₹${summary.saved}\n- Top Category: ${summary.topCategory ? summary.topCategory[0] : 'N/A'}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark text-center">✨ Weekly Summary!</h2>
                <div className="mt-4 space-y-2 text-lg">
                    <p><strong>Spent this week:</strong> <span className="text-red-500">₹{summary.spent}</span></p>
                    <p><strong>Saved this week:</strong> <span className="text-green-500">₹{summary.saved}</span></p>
                    {summary.topCategory && <p><strong>Top Category:</strong> {summary.topCategory[0]} ({((summary.topCategory[1] / summary.spent) * 100).toFixed(0)}%)</p>}
                </div>
                 <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={handleShare} className="py-3 bg-green-500 text-white font-bold rounded-xl transition-transform active:scale-[0.98]">Share</button>
                    <button onClick={onClose} className="py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-xl transition-transform active:scale-[0.98]">Close</button>
                </div>
            </div>
        </div>
    );
};

// --- Over Budget Modal ---
const OverBudgetModal = ({ category, onClose, onAdjust, animationClass }: { category: Category, onClose: () => void, onAdjust: () => void, animationClass: string }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
        <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Heads up!</h2>
            <p className="text-text-muted-light dark:text-text-muted-dark mt-2">You've gone over your budget for <span className="font-semibold">{category}</span>. Would you like to adjust your limit?</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={onClose} className="py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-xl transition-transform active:scale-[0.98]">No, it's fine</button>
                <button onClick={() => { onAdjust(); onClose(); }} className="py-3 bg-primary text-white font-bold rounded-xl transition-transform active:scale-[0.98]">Yes, adjust</button>
            </div>
        </div>
    </div>
);

// --- Voice Input Modal ---
const VoiceInputModal = ({ onClose, onResult, animationClass }: { onClose: () => void; onResult: (result: { item: string; amount: number }) => void; animationClass: string }) => {
    // ... (omitted for brevity, no logic changes)
    const [status, setStatus] = useState<'idle' | 'listening' | 'confirming' | 'error'>('idle'); const [errorMessage, setErrorMessage] = useState(''); const [parsedResult, setParsedResult] = useState<{ item: string; amount: number } | null>(null); const recognitionRef = useRef<any>(null); const resetState = () => { setStatus('idle'); setParsedResult(null); setErrorMessage(''); }
    const handleListen = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Sorry, your browser doesn't support voice recognition."); onClose(); return; }
        if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN'; recognition.interimResults = false; recognition.maxAlternatives = 1; recognitionRef.current = recognition;
        recognition.onstart = () => { setStatus('listening'); setParsedResult(null); };
        recognition.onresult = (event: any) => { const speechResult = event.results[0][0].transcript; const result = parseVoiceInput(speechResult); if (result) { setParsedResult(result); setStatus('confirming'); } else { setErrorMessage("Didn’t catch that. Try: ‘Chai ₹20’ or ‘Recharge 50’"); setStatus('error'); } };
        recognition.onerror = (event: any) => { if (event.error !== 'aborted') { setErrorMessage("Didn’t catch that. Try speaking clearly."); setStatus('error'); } };
        recognition.onend = () => { recognitionRef.current = null; if (status === 'listening') { setStatus('idle'); } };
        recognition.start();
    };
    const handleConfirm = () => { if (parsedResult) { onResult(parsedResult); } };
    const handleRetry = () => { resetState(); };
    const renderContent = () => {
        switch (status) {
            case 'confirming': return ( <> <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Confirm Expense</h2> <p className="text-lg my-4"> Add expense: <span className="font-bold">{parsedResult?.item}</span> for <span className="font-bold text-primary">₹{parsedResult?.amount}</span>? </p> <div className="grid grid-cols-2 gap-3 mt-6"> <button onClick={handleRetry} className="py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-xl transition-transform active:scale-[0.98]">Retry</button> <button onClick={handleConfirm} className="py-3 bg-primary text-white font-bold rounded-xl transition-transform active:scale-[0.98]">Confirm</button> </div> </> );
            case 'listening': return ( <> <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Listening...</h2> <div className="my-4 flex justify-center items-center h-20"> <div className="w-16 h-16 bg-primary rounded-full animate-pulse"></div> </div> <p className="text-text-muted-light dark:text-text-muted-dark">Speak now, e.g., "Samosa 20 rupees"</p> </> );
            case 'error': return ( <> <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Oops!</h2> <p className="text-lg my-4 text-red-500">{errorMessage}</p> <button onClick={handleRetry} className="w-full py-3 bg-primary text-white font-bold rounded-xl transition-transform active:scale-[0.98]">Try Again</button> </> );
            case 'idle': default: return ( <> <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Add by Voice</h2> <p className="text-text-muted-light dark:text-text-muted-dark my-4">Tap the mic and say what you spent.</p> <button onClick={handleListen} className="h-20 w-20 bg-primary text-white rounded-full shadow-lg flex items-center justify-center mx-auto hover:bg-primary-dark active:scale-90 transition-all" aria-label="Start Listening"> <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" /> </svg> </button> </> );
        }
    };
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl text-center relative ${animationClass}`} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                {renderContent()}
            </div>
        </div>
    );
};


// --- Savings Goal Modals ---
const SetGoalModal = ({ onClose, onSave, animationClass }: { onClose: () => void; onSave: (name: string, amount: number) => void; animationClass: string }) => {
    // ... (omitted for brevity, no logic changes)
    const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const handleSave = () => { const numAmount = parseInt(amount, 10); if (name.trim() && !isNaN(numAmount) && numAmount > 0) { onSave(name, numAmount); } };
    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark text-center">Set a Savings Goal</h2>
                <div className="mt-4 space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Goal Name (e.g., Gaming Mouse)" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-input-dark" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₹)" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-input-dark" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-xl transition-transform active:scale-[0.98]">Cancel</button>
                    <button onClick={handleSave} disabled={!name.trim() || !amount} className="py-3 bg-primary text-white font-bold rounded-xl disabled:bg-gray-400 transition-transform active:scale-[0.98]">Set Goal</button>
                </div>
            </div>
        </div>
    );
};

const AddToSavingsModal = ({ onClose, onSave, animationClass }: { onClose: () => void; onSave: (amount: number) => void; animationClass: string }) => {
    // ... (omitted for brevity, no logic changes)
    const [amount, setAmount] = useState(''); const handleSave = () => { const numAmount = parseInt(amount, 10); if (!isNaN(numAmount) && numAmount > 0) { onSave(numAmount); } };
    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark text-center">Add to Savings</h2>
                 <p className="text-center text-text-muted-light dark:text-text-muted-dark mt-2">How much to save? (₹)</p>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full text-center text-3xl p-3 my-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-input-dark" />
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <button onClick={onClose} className="py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-xl transition-transform active:scale-[0.98]">Cancel</button>
                    <button onClick={handleSave} disabled={!amount} className="py-3 bg-primary text-white font-bold rounded-xl disabled:bg-gray-400 transition-transform active:scale-[0.98]">Save</button>
                </div>
            </div>
        </div>
    );
};

// --- Confetti Component for Goal Completion ---
const Confetti = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const pieces: any[] = [];
        const numberOfPieces = 200;
        const colors = ['#00BFA5', '#FFC107', '#E91E63', '#2196F3', '#4CAF50'];

        function createPiece() {
            return {
                x: Math.random() * width,
                y: -40,
                w: 8 + Math.random() * 8,
                h: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 5 - 2.5,
                ySpeed: 2 + Math.random() * 4,
                xSpeed: Math.random() * 4 - 2,
            };
        }

        for (let i = 0; i < numberOfPieces; i++) {
            pieces.push(createPiece());
        }

        let animationFrameId: number;
        
        function update() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            pieces.forEach(p => {
                p.y += p.ySpeed;
                p.x += p.xSpeed;
                p.rotation += p.rotationSpeed;

                if (p.y > height) {
                    Object.assign(p, createPiece(), { y: -40 });
                }

                ctx.save();
                ctx.fillStyle = p.color;
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(update);
        }

        update();

        const timeoutId = setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
        }, 5000); // Stop confetti after 5 seconds to save resources

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timeoutId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-[100] pointer-events-none" />;
};

const GoalCompleteModal = ({ goal, onClose, animationClass }: { goal: SavingsGoal, onClose: () => void; animationClass: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm" onClick={onClose}>
        <Confetti />
        <div className={`text-center p-6 animate-celebrate-zoom`} onClick={e => e.stopPropagation()}>
            <h2 className="text-4xl font-extrabold text-text-light dark:text-text-dark mt-4 drop-shadow-lg">GOAL ACHIEVED!</h2>
            <p className="text-xl text-text-muted-light dark:text-text-muted-dark mt-2 drop-shadow-sm">You saved <span className="font-bold text-primary">₹{goal.amount.toLocaleString()}</span> for your <span className="font-bold">{goal.name}</span>!</p>
            <button onClick={onClose} className="w-full mt-8 py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-xl transition-transform active:scale-[0.98]">Awesome!</button>
        </div>
    </div>
);

const SavingsEducationModal = ({ onComplete, animationClass }: { onComplete: (showGuide: boolean) => void; animationClass: string }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark text-center">🧠 Real Savings = Real Action</h2>
            <div className="mt-4 text-text-muted-light dark:text-text-muted-dark space-y-3">
                <p>BUDGET BOOK is your savings tracker — not your bank.</p>
                <p>✅ <b>First</b>, take the cash out of your wallet and put it in a safe place (piggy bank, locker, etc.).</p>
                <p>✅ <b>Then</b>, enter the amount here to track it.</p>
                <p className="font-semibold text-text-light dark:text-text-dark">If you skip step 1, you haven’t really saved — even if the app says you did!</p>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-6">
                <button onClick={() => onComplete(false)} className="py-3 bg-primary text-white font-bold rounded-xl transition-transform active:scale-[0.98]">Got it! I’ve set aside the cash</button>
                <button onClick={() => onComplete(true)} className="py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-xl transition-transform active:scale-[0.98]">Show me how</button>
            </div>
        </div>
    </div>
);


// --- Savings Guide Screen ---
const SavingsGuideScreen = ({ onBack }: { onBack: () => void }) => (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
        <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]" aria-label="Go Back">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mx-auto">The Savings Guide</h1>
             <div className="w-10"></div>
        </header>
        <main className="flex-grow p-4 overflow-y-auto space-y-6">
            <p className="text-lg">This app helps you TRACK your savings, but the real saving happens in the real world. Here’s how to do it right:</p>
            <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                <h3 className="font-bold text-xl">Method 1: The Piggy Bank 💎</h3>
                <p><b>Step 1:</b> Get a piggy bank or a simple box.</p>
                <p><b>Step 2:</b> When you decide to save ₹50, physically put a ₹50 note in the box.</p>
                <p><b>Step 3:</b> Now, open BUDGET BOOK and tap "+ Add to Savings", and enter 50.</p>
                <p><b>Result:</b> The cash is out of your wallet so you can't spend it, and the app reflects this. That's real saving!</p>
            </div>
             <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                <h3 className="font-bold text-xl">Method 2: Give it to Parents 👨‍👩‍👧</h3>
                <p><b>Step 1:</b> Tell your parents, "I want to save ₹100 from my monthly income."</p>
                <p><b>Step 2:</b> Give them the ₹100 note for safekeeping.</p>
                <p><b>Step 3:</b> Open the app, go to your savings goal, and add ₹100.</p>
                <p><b>Result:</b> You've 'paid yourself first'. The money is safe and you can track your progress.</p>
            </div>
            <div className="mt-8 text-center p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-yellow-800 dark:text-yellow-200">
                <b>Remember:</b> Don't just tap a button. Take the real-world action first!
            </div>
        </main>
         <footer className="p-4">
            <button onClick={onBack} className="w-full py-3 bg-primary text-white font-bold rounded-xl transition-transform active:scale-[0.98]">I Understand</button>
        </footer>
    </div>
);


// --- Budget Streak Modal ---
const BudgetStreakModal = ({ streak, onClose, animationClass }: { streak: number, onClose: () => void, animationClass: string }) => {
    // ... (omitted for brevity, no logic changes)
    const message = useMemo(() => { if (streak >= 7) return "Incredible! You're a saving champion!"; if (streak >= 3) return "Awesome! You're building a great habit!"; if (streak > 0) return "You're on the right track, keep it up!"; return "Start a new streak by staying under budget today!"; }, [streak]);
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl text-center ${animationClass}`} onClick={e => e.stopPropagation()}>
                <p className="text-7xl animate-bounce-in">🏆</p>
                <h2 className="text-4xl font-extrabold text-orange-500 mt-2">{streak}-Day Streak!</h2>
                <p className="text-lg text-text-muted-light dark:text-text-muted-dark mt-2">{message}</p>
                <button onClick={onClose} className="w-full mt-6 py-3 bg-primary text-white font-bold rounded-xl transition-transform active:scale-[0.98]">Keep Going!</button>
            </div>
        </div>
    );
};

// --- Skeleton Loader for Dashboard ---
const DashboardSkeleton = () => (
    <div className="flex flex-col h-full">
        <div className="p-4 relative overflow-hidden bg-gray-200 dark:bg-gray-800 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <header className="flex items-center justify-between p-4 bg-gray-300/50 dark:bg-gray-700/50 rounded-xl">
                <div className="h-8 w-40 bg-gray-400 dark:bg-gray-600 rounded-md"></div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                </div>
            </header>
            <main className="flex-grow p-4 overflow-y-auto">
                <div className="bg-gray-300/50 dark:bg-gray-700/50 p-4 rounded-xl h-24 mb-2"></div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-300/50 dark:bg-gray-700/50 p-4 rounded-xl h-20"></div>
                    <div className="bg-gray-300/50 dark:bg-gray-700/50 p-4 rounded-xl h-20"></div>
                    <div className="bg-gray-300/50 dark:bg-gray-700/50 p-4 rounded-xl h-20"></div>
                </div>
                <div className="h-16 bg-gray-300/50 dark:bg-gray-700/50 rounded-xl mb-6"></div>
                <div className="h-10 w-48 bg-gray-300/50 dark:bg-gray-700/50 rounded-md mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-300/50 dark:bg-gray-700/50 rounded-xl"></div>
                    <div className="h-16 bg-gray-300/50 dark:bg-gray-700/50 rounded-xl"></div>
                    <div className="h-16 bg-gray-300/50 dark:bg-gray-700/50 rounded-xl"></div>
                </div>
            </main>
        </div>
    </div>
);


// --- Main App Component ---
const App: React.FC = () => {
    const [data, setData] = useState<AppData | null>(null);
    const [screenStack, setScreenStack] = useState<Screen[]>(['splash']);
    const [auth, setAuth] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [prefilledExpense, setPrefilledExpense] = useState<Partial<Omit<Expense, 'id'>> | null>(null);
    const [reportMonthData, setReportMonthData] = useState<ArchivedMonth | null>(null);
    const [overBudgetCategory, setOverBudgetCategory] = useState<Category | null>(null);

    // Screen transition state
    const [transition, setTransition] = useState<{ direction: 'forward' | 'backward' | 'none', prevScreen: Screen | null }>({ direction: 'none', prevScreen: null });
    const currentScreen = screenStack[screenStack.length - 1];
    const navigationInProgress = useRef(false);
    
    // Modal states
    const weeklySummaryModal = useAnimatedModal();
    const overBudgetModal = useAnimatedModal();
    const voiceInputModal = useAnimatedModal();
    const streakModal = useAnimatedModal();
    const setGoalModal = useAnimatedModal();
    const addToSavingsModal = useAnimatedModal();
    const goalCompleteModal = useAnimatedModal();
    const savingsEducationModal = useAnimatedModal();

    const debounceNavigation = useCallback((action: () => void) => {
        if (navigationInProgress.current) return;
        navigationInProgress.current = true;
        action();
        setTimeout(() => {
            navigationInProgress.current = false;
        }, 400); // Animation duration
    }, []);

    const navigateTo = useCallback((screen: Screen) => debounceNavigation(() => {
        setTransition({ direction: 'forward', prevScreen: currentScreen });
        setScreenStack(prev => [...prev, screen]);
    }), [currentScreen, debounceNavigation]);

    const navigateBack = useCallback(() => {
        if (screenStack.length === 1) return;
        debounceNavigation(() => {
            setTransition({ direction: 'backward', prevScreen: currentScreen });
            setScreenStack(prev => prev.slice(0, -1));
        });
    }, [screenStack.length, currentScreen, debounceNavigation]);

    const resetTo = useCallback((screen: Screen) => {
        setTransition({ direction: 'none', prevScreen: null }); // No animation for reset
        setScreenStack([screen]);
    }, []);

    useEffect(() => {
        // Clear previous screen from DOM after animation
        if (transition.prevScreen) {
            const timer = setTimeout(() => {
                setTransition({ direction: 'none', prevScreen: null });
            }, 400); // Must match animation duration
            return () => clearTimeout(timer);
        }
    }, [transition.prevScreen]);

    const loadData = useCallback(() => {
        const appData = storage.getAppData();
        setData(appData);
    }, []);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!data) return;
        // ... all business logic (theme, month change, summary, streak) remains the same
        const applyTheme = (theme: Theme) => { if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } }; applyTheme(data.theme); const currentMonth = new Date().toISOString().slice(0, 7); if (data.lastSeenMonth && data.lastSeenMonth !== currentMonth) { const lastMonthExpenses = storage.getExpensesForMonth(data.lastSeenMonth); const lastMonthPocketMoney = storage.getPocketMoneyInfo().amount; const lastMonthBudgets = storage.getCategoryBudgets(); if (lastMonthExpenses.length > 0 && lastMonthPocketMoney !== null) { storage.archiveMonth(data.lastSeenMonth, lastMonthPocketMoney, lastMonthExpenses, lastMonthBudgets); } } storage.saveLastSeenMonth(currentMonth); const lastSummaryDate = localStorage.getItem('lastSummaryDate'); const today = new Date(); const todayStr = today.toISOString().slice(0, 10); if (today.getDay() === 1 && lastSummaryDate !== todayStr) { weeklySummaryModal.open(); localStorage.setItem('lastSummaryDate', todayStr); }
        const todayFormatted = new Date().toISOString().slice(0, 10); if (data.budgetStreak.lastCheckedDate !== todayFormatted) { const expenses = storage.getExpensesForMonth(currentMonth); const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0); const income = data.pocketMoneyInfo.amount || 0; if (totalSpent <= income) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const yesterdayFormatted = yesterday.toISOString().slice(0, 10); if (data.budgetStreak.lastCheckedDate === yesterdayFormatted) { storage.saveBudgetStreak({ count: data.budgetStreak.count + 1, lastCheckedDate: todayFormatted }); } else { storage.saveBudgetStreak({ count: 1, lastCheckedDate: todayFormatted }); } } else { storage.saveBudgetStreak({ count: 0, lastCheckedDate: todayFormatted }); } loadData(); }
    }, [data, loadData, weeklySummaryModal]);


    useEffect(() => {
        if (data) {
            if (!data.passcode || auth) {
                if (!data.onboardingComplete) resetTo('onboarding');
                else if (data.pocketMoneyInfo.amount === null) resetTo('setup');
                else resetTo('dashboard');
            } else {
                resetTo('passcode');
            }
        }
    }, [data, auth, resetTo]);
    
    // --- Handlers (wrapped in useCallback) ---
    const handleSetTheme = useCallback((theme: Theme) => { storage.saveTheme(theme); loadData(); }, [loadData]);
    const handleSaveSetup = useCallback((info: PocketMoneyInfo) => { storage.savePocketMoneyInfo(info); loadData(); resetTo('dashboard'); }, [loadData, resetTo]);
    const handleOnboardingComplete = useCallback(() => { storage.setOnboardingComplete(); loadData(); }, [loadData]);
    const handlePasscodeSet = useCallback((passcode: string) => { storage.savePasscode(passcode); setAuth(true); loadData(); }, [loadData]);
    const handleCorrectPasscode = useCallback(() => { setAuth(true); }, []);
    const handleSaveExpense = useCallback((expense: Omit<Expense, 'id'>) => { if (expenseToEdit) { storage.updateExpense({ ...expense, id: expenseToEdit.id }); } else { storage.addExpense(expense); } setExpenseToEdit(null); setPrefilledExpense(null); resetTo('dashboard'); loadData(); }, [expenseToEdit, loadData, resetTo]);
    const handleAddQuickExpense = useCallback((item: QuickExpenseItem) => { storage.addExpense({ item: item.name, amount: item.amount, category: item.category, date: new Date().toISOString().slice(0, 10) }); loadData(); }, [loadData]);
    const handleEditExpense = useCallback((expense: Expense) => { setExpenseToEdit(expense); navigateTo('addExpense'); }, [navigateTo]);
    const handleDeleteExpense = useCallback((id: string) => { if (window.confirm('Are you sure you want to delete this expense?')) { storage.deleteExpense(id); loadData(); } }, [loadData]);
    const handleResetData = useCallback(() => { if (window.confirm('Are you sure? This will delete all expenses and budgets for the current month.')) { storage.resetCurrentMonthData(); loadData(); } }, [loadData]);
    const handleViewArchivedReport = useCallback((archive: ArchivedMonth) => { setReportMonthData(archive); navigateTo('report'); }, [navigateTo]);
    const handleSaveBudgets = useCallback((budgets: CategoryBudgets) => { storage.saveCategoryBudgets(budgets); loadData(); }, [loadData]);
    const handleSaveQuickExpenses = useCallback((items: QuickExpenseItem[]) => { storage.saveQuickExpenses(items); loadData(); }, [loadData]);
    const handleSetQuickExpenseButtonCount = useCallback((count: number) => { storage.saveQuickExpenseButtonCount(count); loadData(); }, [loadData]);
    const handleVoiceResult = useCallback((result: { item: string; amount: number }) => {
        voiceInputModal.close();
        const category = storage.getAutoCategory(result.item);
        storage.addExpense({
            item: result.item,
            amount: result.amount,
            category: category,
            date: new Date().toISOString().slice(0, 10),
        });
        loadData(); // Refresh data to show new expense on dashboard
    }, [voiceInputModal, loadData]);
    const handleSaveSavingsGoal = useCallback((name: string, amount: number) => { storage.saveSavingsGoal(name, amount); setGoalModal.close(); loadData(); }, [setGoalModal, loadData]);
    const handleAddToSavings = useCallback((amount: number) => {
        if (!data || !data.pocketMoneyInfo.amount) return;
        const currentMonthKey = new Date().toISOString().slice(0, 7);
        const totalSpentSoFar = (data.allExpenses[currentMonthKey] || []).reduce((sum, e) => sum + e.amount, 0);
        const availableBalance = data.pocketMoneyInfo.amount - totalSpentSoFar;

        if (amount <= availableBalance) {
            // 1. Update the persistent goal tracker
            storage.addToSavings(amount);

            // 2. Create a corresponding expense for reporting consistency
            const goalName = data.savingsGoal?.name || 'Savings';
            storage.addExpense({
                item: `Saved for ${goalName}`,
                amount: amount,
                category: Category.Savings,
                date: new Date().toISOString().slice(0, 10),
            });
            
            addToSavingsModal.close();
            loadData(); // Refresh data to show new expense and updated balances

            // Check if the goal is now complete
            const updatedGoal = storage.getAppData().savingsGoal; // Get the very latest data
            if (updatedGoal && updatedGoal.savedAmount >= updatedGoal.amount && !updatedGoal.completed) {
                storage.markGoalAsComplete();
                goalCompleteModal.open();
            }
        } else {
            alert(`⚠️ Not enough money! You only have ₹${availableBalance.toLocaleString()} left to spend or save.`);
        }
    }, [data, addToSavingsModal, loadData, goalCompleteModal]);
    const handleInitiateAddToSavings = useCallback(() => { if (data?.hasShownSavingsEducation) { addToSavingsModal.open(); } else { savingsEducationModal.open(); } }, [data, addToSavingsModal, savingsEducationModal]);
    const handleCompleteSavingsEducation = useCallback((showGuide: boolean) => { savingsEducationModal.close(); storage.setSavingsEducationShown(); loadData(); if (showGuide) { navigateTo('savingsGuide'); } else { addToSavingsModal.open(); } }, [savingsEducationModal, loadData, navigateTo, addToSavingsModal]);
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthExpenses = data ? data.allExpenses[currentMonth] || [] : [];
    
    const renderScreen = (screenName: Screen, isExiting: boolean, direction: 'forward' | 'backward' | 'none') => {
        if (!data && screenName !== 'splash') return null;
        
        let animationClass = '';
        if (direction !== 'none') {
            animationClass = isExiting ? 'animate-screen-exit' : 'animate-screen-enter';
        }
        
        const ScreenComponent = () => {
             switch (screenName) {
                case 'splash': return <div className="flex items-center justify-center h-screen"><LogoIcon className="h-24 w-24 text-primary animate-celebrate-zoom" /></div>;
                case 'onboarding': return <OnboardingScreen onComplete={handleOnboardingComplete} />;
                case 'welcome': return <WelcomeScreen onStart={() => resetTo('setup')} />;
                case 'passcode': return <PasscodeScreen onCorrect={handleCorrectPasscode} onCompleteSetup={handlePasscodeSet} storedPasscode={data.passcode} />;
                case 'setup': return <SetupScreen onSave={handleSaveSetup} />;
                case 'dashboard': return <Dashboard pocketMoneyInfo={data.pocketMoneyInfo} expenses={currentMonthExpenses} budgets={data.categoryBudgets} quickExpenses={data.quickExpenses} quickExpenseButtonCount={data.quickExpenseButtonCount} budgetStreak={data.budgetStreak} savingsGoal={data.savingsGoal} setScreen={navigateTo} onEdit={handleEditExpense} onDelete={handleDeleteExpense} onAddQuickExpense={handleAddQuickExpense} onOverBudget={(cat) => {setOverBudgetCategory(cat); overBudgetModal.open()}} onVoiceInput={voiceInputModal.open} onShowStreak={streakModal.open} onSetGoalClick={setGoalModal.open} onInitiateAddToSavings={handleInitiateAddToSavings} />;
                case 'addExpense': return <ExpenseFormScreen onSave={handleSaveExpense} onCancel={() => { setExpenseToEdit(null); setPrefilledExpense(null); navigateBack(); }} expenseToEdit={expenseToEdit} prefilledData={prefilledExpense} />;
                case 'report': const reportData = reportMonthData ? { pocketMoney: reportMonthData.pocketMoney, expenses: reportMonthData.expenses, month: reportMonthData.month } : { pocketMoney: data.pocketMoneyInfo.amount || 0, expenses: currentMonthExpenses, month: currentMonth }; return <ReportScreen {...reportData} onBack={() => { setReportMonthData(null); navigateBack(); }} />;
                case 'previousMonths': return <PreviousMonthsScreen onBack={navigateBack} archivedMonths={data.archivedMonths} onViewReport={handleViewArchivedReport} />;
                case 'settings': return <SettingsScreen onBack={navigateBack} currentPocketMoneyInfo={data.pocketMoneyInfo} onUpdatePocketMoney={(info) => { storage.savePocketMoneyInfo(info); loadData(); }} onResetData={handleResetData} currentTheme={data.theme} onSetTheme={handleSetTheme} onNavigate={navigateTo} isPasscodeSet={!!data.passcode} quickExpenseButtonCount={data.quickExpenseButtonCount} onSetQuickExpenseButtonCount={handleSetQuickExpenseButtonCount} />;
                case 'budgets': return <BudgetScreen budgets={data.categoryBudgets} onSave={handleSaveBudgets} onBack={navigateBack} />;
                case 'quickExpenseSettings': return <QuickExpenseSettingsScreen items={data.quickExpenses} onSave={handleSaveQuickExpenses} onBack={navigateBack} />;
                case 'insights': return <InsightsScreen pocketMoneyInfo={data.pocketMoneyInfo} expenses={currentMonthExpenses} budgetStreak={data.budgetStreak} onBack={navigateBack} />;
                case 'search': return <SearchScreen allExpenses={storage.getAllExpenses()} onBack={navigateBack} />;
                case 'savingsGuide': return <SavingsGuideScreen onBack={navigateBack} />;
                default: return <div>Unknown Screen</div>;
            }
        };

        return (
            <div key={screenName} className={`screen ${animationClass}`} style={{ zIndex: isExiting ? 0 : 1 }}>
                <ScreenComponent />
            </div>
        );
    };

    return (
      <div className="h-screen w-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans">
        {!data ? <DashboardSkeleton /> : (
            <div className="transition-wrapper">
                {transition.prevScreen && renderScreen(transition.prevScreen, true, transition.direction)}
                {renderScreen(currentScreen, false, transition.direction)}
            </div>
        )}
        
        {/* Modals */}
        {weeklySummaryModal.isOpen && data?.pocketMoneyInfo.amount && <WeeklySummaryModal expenses={currentMonthExpenses} pocketMoney={data.pocketMoneyInfo.amount} onClose={weeklySummaryModal.close} animationClass={weeklySummaryModal.animationClass} />}
        {overBudgetModal.isOpen && overBudgetCategory && <OverBudgetModal category={overBudgetCategory} onClose={overBudgetModal.close} onAdjust={() => navigateTo('budgets')} animationClass={overBudgetModal.animationClass}/>}
        {voiceInputModal.isOpen && <VoiceInputModal onClose={voiceInputModal.close} onResult={handleVoiceResult} animationClass={voiceInputModal.animationClass}/>}
        {streakModal.isOpen && data && <BudgetStreakModal streak={data.budgetStreak.count} onClose={streakModal.close} animationClass={streakModal.animationClass}/>}
        {setGoalModal.isOpen && <SetGoalModal onSave={handleSaveSavingsGoal} onClose={setGoalModal.close} animationClass={setGoalModal.animationClass}/>}
        {addToSavingsModal.isOpen && <AddToSavingsModal onSave={handleAddToSavings} onClose={addToSavingsModal.close} animationClass={addToSavingsModal.animationClass} />}
        {goalCompleteModal.isOpen && data && data.savingsGoal && <GoalCompleteModal goal={data.savingsGoal} onClose={goalCompleteModal.close} animationClass={goalCompleteModal.animationClass}/>}
        {savingsEducationModal.isOpen && <SavingsEducationModal onComplete={handleCompleteSavingsEducation} animationClass={savingsEducationModal.animationClass}/>}
      </div>
    );
};

export default App;
import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Expense, Screen, CategoryBudgets, PocketMoneyInfo, QuickExpenseItem, BudgetStreak, SavingsGoal, IncomeSource } from '../types';
import { Category } from '../types';
import LogoIcon from './LogoIcon';
import { getDailyTip } from '../services/tips';

// Custom hook to animate numbers counting up
const useCountUp = (endValue: number, duration: number = 1000) => {
    const [count, setCount] = useState(0);
    const prevEndValueRef = useRef(0);

    useEffect(() => {
        let start = prevEndValueRef.current;
        if (start === endValue) {
            setCount(endValue);
            return;
        }
        
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            const currentCount = Math.floor(start + (endValue - start) * percentage);
            setCount(currentCount);

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(endValue); // Ensure it ends on the exact value
                prevEndValueRef.current = endValue;
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            prevEndValueRef.current = endValue;
        };
    }, [endValue, duration]);
    
    return count;
};

const AnimatedNumber = ({ value, duration = 1200, animate }: { value: number, duration?: number, animate: boolean }) => {
    const count = useCountUp(value, duration);
    return <span>{(animate ? count : value).toLocaleString()}</span>;
};


interface DashboardProps {
  pocketMoneyInfo: PocketMoneyInfo;
  expenses: Expense[];
  budgets: CategoryBudgets;
  quickExpenses: QuickExpenseItem[];
  quickExpenseButtonCount: number;
  budgetStreak: BudgetStreak;
  savingsGoal: SavingsGoal | null;
  setScreen: (screen: Screen) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAddQuickExpense: (item: QuickExpenseItem) => void;
  onOverBudget: (category: Category) => void;
  onVoiceInput: () => void;
  onShowStreak: () => void;
  onSetGoalClick: () => void;
  onInitiateAddToSavings: () => void;
}

const categoryIcons: { [key in Category]: string } = {
    [Category.Food]: '🍴',
    [Category.Recharge]: '⚡️',
    [Category.Stationery]: '✒️',
    [Category.Entertainment]: '🎥',
    [Category.Fun]: '🎲',
    [Category.Transport]: '🚗',
    [Category.Savings]: '💎',
    [Category.Other]: '🛍️',
};


const FinancialTipCard = ({ tip, onDismiss, animate }: { tip: string; onDismiss: () => void; animate: boolean }) => (
    <div className={`mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl relative border-l-4 border-yellow-500 ${animate ? 'animate-fade-in-up' : ''}`}>
        <h3 className="font-semibold text-lg text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <span className="text-xl">🧠</span>
            Financial Tip
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mt-1">{tip}</p>
        <button 
            onClick={onDismiss} 
            className="mt-3 text-sm font-semibold text-yellow-800 dark:text-yellow-200 hover:underline"
        >
            Got it!
        </button>
    </div>
);


const EmptyState = ({ animate }: { animate: boolean }) => (
    <div className={`text-center py-10 px-4 bg-surface-light dark:bg-surface-dark rounded-xl ${animate ? 'animate-fade-in-up' : ''}`}>
        <div className={`text-5xl mb-4 ${animate ? 'animate-pulse-gentle' : ''}`}>🧘‍♂️</div>
        <h3 className="font-semibold text-lg text-text-light dark:text-text-dark">All Clear!</h3>
        <p className="text-text-muted-light dark:text-text-muted-dark mt-1">No expenses logged yet. Tap '+' to add one!</p>
    </div>
);

const FutureBalanceProjection = ({ remaining, expenses }: { remaining: number; expenses: Expense[] }) => {
    const projection = useMemo(() => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        if (dayOfMonth === 1 && expenses.length === 0) return "for the whole month!";
        
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const avgDailySpend = totalSpent / dayOfMonth;

        if (avgDailySpend <= 0) return "for the whole month!";

        const daysLeft = Math.floor(remaining / avgDailySpend);
        if (daysLeft > 60) return "for the whole month!";

        const endDate = new Date(today);
        endDate.setDate(today.getDate() + daysLeft);
        
        return `until ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

    }, [remaining, expenses]);

    return (
        <div className="mt-2 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
            <p>At this rate, your money will last {projection}</p>
        </div>
    );
};


const OfflineInsightCard = ({ expenses, animate }: { expenses: Expense[]; animate: boolean }) => {
    const insight = useMemo(() => {
        if (expenses.length < 10) return null;

        const spendByCategory = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<Category, number>);

        const topCategory = Object.entries(spendByCategory)
                                 .sort((a, b) => b[1] - a[1])[0];

        if (!topCategory) return null;

        const [category, amount] = topCategory;
        const daysInMonth = new Date().getDate();
        const weeklyAvg = (amount / daysInMonth) * 7;
        const monthlyProjection = weeklyAvg * 4;

        let suggestion = '';
        if (category === Category.Food) {
            suggestion = "Could you save by carrying tiffin from home?";
        } else if (category === Category.Transport) {
            suggestion = "Is there a cheaper way to travel, like a bus pass?";
        } else if (category === Category.Fun || category === Category.Entertainment) {
            suggestion = "Think about free activities you can enjoy with friends!";
        } else {
            return null; // No smart tip for this category
        }

        return `You spend ~₹${weeklyAvg.toFixed(0)}/week on ${category} — that's ~₹${monthlyProjection.toFixed(0)}/month! ${suggestion}`;

    }, [expenses]);
    
    if (!insight) return null;

    return (
        <div className={`mt-6 p-4 bg-blue-100 dark:bg-blue-900/50 rounded-xl ${animate ? 'animate-fade-in-up' : ''}`}>
            <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-200">🧠 Smart Insight</h3>
            <p className="text-blue-700 dark:text-blue-300 mt-1">{insight}</p>
        </div>
    );
};

const PocketMoneyCountdown = ({ payday, source }: { payday: number; source: IncomeSource }) => {
    const { daysLeft, nextPaydayString } = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let nextPayday = new Date(currentYear, currentMonth, payday);
        if(currentDay >= payday) {
            nextPayday.setMonth(currentMonth + 1);
        }

        const diffTime = nextPayday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dateStr = nextPayday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return { daysLeft: diffDays, nextPaydayString: dateStr };
    }, [payday]);

    if (daysLeft <= 0) return null;
    
    const sourceName = source || 'Income';

    return (
         <div className="mt-6 text-center p-3 bg-teal-100 dark:bg-teal-900/50 rounded-xl">
            <p className="font-semibold text-teal-800 dark:text-teal-200">📥 Next {sourceName} payment on {nextPaydayString}!</p>
        </div>
    );
};

const QuickExpenseButtons = ({ items, onAdd, onSettings, buttonCount, animate }: { items: QuickExpenseItem[], onAdd: (item: QuickExpenseItem) => void, onSettings: () => void, buttonCount: number, animate: boolean }) => {
    const itemsToShow = useMemo(() => items.slice(0, buttonCount), [items, buttonCount]);

    return (
        <div className={animate ? 'animate-fade-in-up' : ''} style={{animationDelay: '100ms'}}>
            <div className="flex justify-between items-center mb-2 mt-6">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">Quick Add</h2>
                <button onClick={onSettings} className="text-sm text-primary font-semibold">Customize</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {itemsToShow.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => onAdd(item)}
                        className="p-2 text-center bg-surface-light dark:bg-surface-dark rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] active:shadow-sm"
                    >
                        <p className="font-semibold text-text-light dark:text-text-dark truncate">{item.name}</p>
                        <p className="text-sm text-primary">₹{item.amount}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const BudgetProgress = ({ expenses, budgets, onNavigate, onOverBudget, animate }: { expenses: Expense[], budgets: CategoryBudgets, onNavigate: () => void, onOverBudget: (c: Category) => void, animate: boolean }) => {
    const previouslyOverBudgetRef = useRef<Set<Category>>(new Set());

    const budgetData = useMemo(() => {
        return Object.entries(budgets).map(([category, budget]) => {
            if (!budget) return null;
            const spent = expenses
                .filter(e => e.category === category)
                .reduce((sum, e) => sum + e.amount, 0);
            const percentage = Math.round((spent / budget) * 100);
            const isOver = spent > budget;
            return { category: category as Category, spent, budget, percentage, isOver };
        }).filter(item => item !== null && item.budget > 0);
    }, [expenses, budgets]);

    useEffect(() => {
        const currentlyOverBudget = new Set(
            budgetData.filter(item => item?.isOver).map(item => item!.category)
        );

        for (const category of currentlyOverBudget) {
            if (!previouslyOverBudgetRef.current.has(category)) {
                onOverBudget(category);
            }
        }

        previouslyOverBudgetRef.current = currentlyOverBudget;
    }, [budgetData, onOverBudget]);


    if (budgetData.length === 0) {
        return (
            <div className={`mt-6 text-center p-4 bg-surface-light dark:bg-surface-dark rounded-xl ${animate ? 'animate-fade-in-up' : ''}`}>
                <p className="text-text-muted-light dark:text-text-muted-dark">Set category budgets to track your spending goals.</p>
                <button onClick={onNavigate} className="mt-2 text-primary font-semibold">Set Budgets</button>
            </div>
        );
    }

    return (
        <div className={animate ? 'animate-fade-in-up' : ''} style={{animationDelay: '200ms'}}>
             <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mt-6 mb-2">Budget Progress</h2>
            <div className="space-y-3">
                {budgetData.map(item => {
                    if (!item) return null;
                    const remaining = item.budget - item.spent;
                    const isNearLimit = !item.isOver && item.percentage > 80;
                    const displayPercentage = Math.min(item.percentage, 100);

                    return (
                    <button onClick={onNavigate} key={item.category} className="w-full text-left p-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] active:shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-text-light dark:text-text-dark">{item.category} {categoryIcons[item.category]}</span>
                             <span className={`text-sm font-semibold ${item.isOver ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                ₹{item.spent.toLocaleString()} / ₹{item.budget.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${item.isOver ? 'bg-red-500' : isNearLimit ? 'bg-orange-500 animate-pulse' : 'bg-primary'}`} 
                                style={{ width: `${displayPercentage}%` }}
                            ></div>
                        </div>
                         {isNearLimit && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1.5">⚠️ Careful! Only ₹{remaining} left for {item.category} this month.</p>
                        )}
                        {item.isOver && (
                             <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1.5">🚨 You've spent ₹{-remaining} over your budget for {item.category}.</p>
                        )}
                    </button>
                )})}
            </div>
             <div className="mt-4 text-center">
                <button
                onClick={onNavigate}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-semibold text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                Customize Budget
                </button>
            </div>
        </div>
    );
};

const SavingsGoalProgress = ({ savingsGoal, onSetGoalClick, onInitiateAddToSavings, animate }: { savingsGoal: SavingsGoal | null; onSetGoalClick: () => void; onInitiateAddToSavings: () => void; animate: boolean }) => {
    if (!savingsGoal) {
        return (
            <div className={`mt-6 text-center p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md ${animate ? 'animate-fade-in-up' : ''}`}>
                <p className="text-xl">💎</p>
                <p className="font-semibold text-text-light dark:text-text-dark mt-1">No goal yet. Tap ‘Set Goal’ to start saving!</p>
                <button onClick={onSetGoalClick} className="mt-3 text-primary font-semibold">Set Goal</button>
            </div>
        );
    }
    
    const { name, amount, savedAmount, completed } = savingsGoal;
    const percentage = amount > 0 ? Math.round((savedAmount / amount) * 100) : 0;
    const displayPercentage = Math.min(percentage, 100);

    return (
        <div className={`mt-6 p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-md ${animate ? 'animate-fade-in-up' : ''}`}>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">{name}</h2>
                {completed && <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded-full">COMPLETED</span>}
            </div>
            
            <p className="font-semibold text-lg text-text-light dark:text-text-dark my-2">
                Saved: ₹<AnimatedNumber value={savedAmount} animate={animate} /> / <span className="text-text-muted-light dark:text-text-muted-dark">₹{amount.toLocaleString()}</span>
            </p>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                    className={`h-4 rounded-full transition-all duration-700 ease-out ${completed ? 'bg-green-500' : 'bg-primary'}`} 
                    style={{ width: `${displayPercentage}%` }}
                ></div>
            </div>

            {!completed && (
                 <button onClick={onInitiateAddToSavings} className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-transform active:scale-[0.98]">
                    + Add to Savings
                </button>
            )}
            
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-3 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                💡 Savings are now part of your expense history.
            </p>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ pocketMoneyInfo, expenses, budgets, quickExpenses, quickExpenseButtonCount, budgetStreak, savingsGoal, setScreen, onEdit, onDelete, onAddQuickExpense, onOverBudget, onVoiceInput, onShowStreak, onSetGoalClick, onInitiateAddToSavings }) => {
  const { amount: pocketMoney, payday } = pocketMoneyInfo;
  const [showTip, setShowTip] = useState(false);
  const dailyTip = useMemo(() => getDailyTip(), []);

  // Performance: Check session storage only once on mount to decide if animations should run
  const dashboardAnimatedInSession = useRef(sessionStorage.getItem('dashboardAnimated') === 'true');
  const shouldAnimate = !dashboardAnimatedInSession.current;

  useEffect(() => {
    // This effect runs only on the first mount in a session
    if (!dashboardAnimatedInSession.current) {
        sessionStorage.setItem('dashboardAnimated', 'true');
    }

    const lastDismissedDate = localStorage.getItem('tipDismissedDate');
    const todayStr = new Date().toISOString().slice(0, 10);
    if (lastDismissedDate !== todayStr) {
        setShowTip(true);
    }
  }, []);

  const handleDismissTip = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem('tipDismissedDate', todayStr);
    setShowTip(false);
  };
  
  if(pocketMoney === null) return null;
  
  // New unified balance calculations
  const totalOutgoing = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSavedThisMonth = expenses
      .filter(e => e.category === Category.Savings)
      .reduce((sum, e) => sum + e.amount, 0);
  const totalSpentOnGoods = totalOutgoing - totalSavedThisMonth;
  const remaining = pocketMoney - totalOutgoing;
  
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-8" />
          <h1 className="text-2xl font-black tracking-wider text-text-light dark:text-text-dark">BUDGET BOOK</h1>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => setScreen('search')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform active:scale-[0.98]" aria-label="Search">
                <span className="text-2xl leading-none">🔍</span>
            </button>
            <button onClick={() => setScreen('settings')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform active:scale-[0.98]" aria-label="Settings">
                <span className="text-2xl leading-none">🛠️</span>
            </button>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className={shouldAnimate ? "animate-fade-in-up" : ""}>
            <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md col-span-3">
                    <p className="text-lg text-text-muted-light dark:text-text-muted-dark">Available to Spend</p>
                    <p className="text-4xl font-extrabold text-primary dark:text-teal-400">₹<AnimatedNumber value={remaining} animate={shouldAnimate} /></p>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Income</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹<AnimatedNumber value={pocketMoney} animate={shouldAnimate} /></p>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Spent</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹<AnimatedNumber value={totalSpentOnGoods} animate={shouldAnimate} /></p>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md">
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">Saved</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹<AnimatedNumber value={totalSavedThisMonth} animate={shouldAnimate} /></p>
                </div>
            </div>

            <FutureBalanceProjection remaining={remaining} expenses={expenses} />
        </div>
        
        {showTip && (
            <FinancialTipCard 
                tip={dailyTip}
                onDismiss={handleDismissTip}
                animate={shouldAnimate}
            />
        )}

        <SavingsGoalProgress savingsGoal={savingsGoal} onSetGoalClick={onSetGoalClick} onInitiateAddToSavings={onInitiateAddToSavings} animate={shouldAnimate} />
        
        <PocketMoneyCountdown payday={payday} source={pocketMoneyInfo.source} />
        <QuickExpenseButtons items={quickExpenses} buttonCount={quickExpenseButtonCount} onAdd={onAddQuickExpense} onSettings={() => setScreen('quickExpenseSettings')} animate={shouldAnimate} />
        <OfflineInsightCard expenses={expenses} animate={shouldAnimate} />
        <BudgetProgress expenses={expenses} budgets={budgets} onNavigate={() => setScreen('budgets')} onOverBudget={onOverBudget} animate={shouldAnimate} />
        
        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mt-6 mb-2">Recent Transactions</h2>

        {sortedExpenses.length > 0 ? (
            <ul className="space-y-3">
                {sortedExpenses.map((expense, index) => (
                    <li key={expense.id} className={`flex items-center bg-surface-light dark:bg-surface-dark p-3 rounded-xl shadow-md ${shouldAnimate ? 'opacity-0 animate-fade-in-up' : ''}`} style={{ animationDelay: shouldAnimate ? `${index * 60}ms` : '0ms' }}>
                        <div className="text-2xl mr-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">{categoryIcons[expense.category]}</div>
                        <div className="flex-grow">
                            <p className="font-semibold text-text-light dark:text-text-dark">{expense.item}</p>
                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="text-right">
                           <p className={`font-bold text-lg ${expense.category === Category.Savings ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>₹{expense.amount.toLocaleString()}</p>
                           <div className="flex items-center space-x-1 mt-1">
                                <button onClick={() => onEdit(expense)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform active:scale-[0.98]" aria-label={`Edit ${expense.item}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => onDelete(expense.id)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform active:scale-[0.98]" aria-label={`Delete ${expense.item}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                           </div>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <EmptyState animate={shouldAnimate} />
        )}
      </main>
      
      <button 
        onClick={onShowStreak}
        className={`absolute bottom-24 right-4 z-20 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-[0.98] ${shouldAnimate ? 'animate-bounce-in' : ''}`}
        aria-label="Show budget streak"
      >
        🏆 Streak
      </button>

      <div className="p-2 bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 grid grid-cols-5 gap-1 items-center sticky bottom-0">
          <button onClick={onVoiceInput} className="flex flex-col justify-center items-center h-14 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Voice Input">
              <span className="text-3xl leading-none">🎙️</span>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">Voice</span>
          </button>
          <button onClick={() => setScreen('insights')} className="flex flex-col justify-center items-center h-14 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Insights">
               <span className="text-3xl leading-none">🧠</span>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">Insights</span>
          </button>
          <button onClick={() => setScreen('addExpense')} className="h-16 w-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center transform -translate-y-4 hover:bg-primary-dark active:scale-90 transition-all" aria-label="Add Expense">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
          </button>
          <button onClick={() => setScreen('report')} className="flex flex-col justify-center items-center h-14 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Report">
              <span className="text-3xl leading-none">📋</span>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">Report</span>
          </button>
          <button onClick={() => setScreen('previousMonths')} className="flex flex-col justify-center items-center h-14 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Archive">
              <span className="text-3xl leading-none">📦</span>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">Archive</span>
          </button>
      </div>
    </div>
  );
};

export default Dashboard;

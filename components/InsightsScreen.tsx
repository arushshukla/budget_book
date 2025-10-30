import React, { useMemo } from 'react';
import type { Expense, PocketMoneyInfo, BudgetStreak, Category } from '../types';

// Props definition
interface InsightsScreenProps {
  pocketMoneyInfo: PocketMoneyInfo;
  expenses: Expense[];
  budgetStreak: BudgetStreak;
  onBack: () => void;
}

// Reusable card component
const InsightCard = ({ icon, title, value, description, valueColor, delay = 0 }: { icon: string; title: string; value: string; description?: string; valueColor?: string; delay?: number }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-md opacity-0 animate-fade-in-up flex flex-col" style={{animationDelay: `${delay}ms`}}>
        <div className="flex items-start">
            <div className="text-2xl mr-3">{icon}</div>
            <div>
                <h3 className="font-semibold text-text-light dark:text-text-dark">{title}</h3>
                <p className={`text-2xl font-bold ${valueColor || 'text-primary'}`}>{value}</p>
            </div>
        </div>
        {description && <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">{description}</p>}
    </div>
);


const InsightsScreen: React.FC<InsightsScreenProps> = ({ pocketMoneyInfo, expenses, budgetStreak, onBack }) => {
    
    // All calculations are memoized for performance
    const insights = useMemo(() => {
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const income = pocketMoneyInfo.amount || 0;
        const remaining = income - totalSpent;
        const today = new Date();
        const dayOfMonth = today.getDate();

        // 1. Daily Average Spend
        const dailyAverage = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;

        // 2. Top Spending Category
        const spendByCategory = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<Category, number>);
        
        const topCategoryEntry = Object.entries(spendByCategory).sort((a, b) => b[1] - a[1])[0];
        const topCategory = topCategoryEntry ? { name: topCategoryEntry[0] as Category, amount: topCategoryEntry[1] } : null;

        // 3. Money Lasts Until
        let moneyLastsUntil = 'the end of the month!';
        if (remaining > 0 && dailyAverage > 0) {
            const daysLeft = Math.floor(remaining / dailyAverage);
            if (daysLeft < 90) { // Avoid ridiculously long projections
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + daysLeft);
                moneyLastsUntil = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            }
        }

        // 4. Smart Suggestion
        let smartSuggestion = {
            message: "Great job! You’re spending wisely. 💪",
            isWarning: false
        };
        if (topCategory && totalSpent > 0 && (topCategory.amount / totalSpent) > 0.5) {
            const percentage = ((topCategory.amount / totalSpent) * 100).toFixed(0);
            const suggestedReduction = (topCategory.amount * 0.1).toFixed(0);
            smartSuggestion = {
                message: `You spent ${percentage}% on ${topCategory.name}! Try reducing by ₹${suggestedReduction} to save more.`,
                isWarning: true
            };
        }

        return {
            topCategory,
            dailyAverage,
            moneyLastsUntil,
            smartSuggestion,
        };

    }, [expenses, pocketMoneyInfo]);


    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95" aria-label="Go Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark mx-auto">Smart Insights</h1>
                <div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 overflow-y-auto space-y-4">
                {/* Main Insight Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <InsightCard 
                        icon="🎯" 
                        title="Top Spending" 
                        value={insights.topCategory?.name || 'N/A'} 
                        description={`₹${insights.topCategory?.amount.toLocaleString() || 0}`}
                        delay={0}
                    />
                    <InsightCard 
                        icon="💸" 
                        title="Daily Average" 
                        value={`₹${insights.dailyAverage.toFixed(0)}`}
                        description="Avg. spent per day this month"
                        delay={50}
                    />
                    <InsightCard 
                        icon="📈" 
                        title="Money Will Last" 
                        value={insights.moneyLastsUntil}
                        description="At your current spending rate"
                        delay={100}
                    />
                     <InsightCard 
                        icon="🏆" 
                        title="Budget Streak" 
                        value={`${budgetStreak.count}-Day`}
                        description="Days you've stayed under budget"
                        valueColor="text-orange-500"
                        delay={150}
                    />
                </div>

                {/* Smart Suggestion Card */}
                <div className={`p-4 rounded-xl shadow-md opacity-0 animate-fade-in-up ${insights.smartSuggestion.isWarning ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-green-100 dark:bg-green-900/50'}`} style={{animationDelay: '200ms'}}>
                    <h3 className={`font-semibold ${insights.smartSuggestion.isWarning ? 'text-orange-800 dark:text-orange-200' : 'text-green-800 dark:text-green-200'}`}>
                        {insights.smartSuggestion.isWarning ? '💡 Smart Tip' : '👍 Keep it Up!'}
                    </h3>
                    <p className={`text-sm mt-1 ${insights.smartSuggestion.isWarning ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
                        {insights.smartSuggestion.message}
                    </p>
                </div>

            </main>
        </div>
    );
};

export default InsightsScreen;
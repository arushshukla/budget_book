import React, { useState, useMemo } from 'react';
import type { Expense } from '../types';
import { Category } from '../types';

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

interface SearchScreenProps {
  allExpenses: Expense[];
  onBack: () => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ allExpenses, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

    const filteredAndSortedExpenses = useMemo(() => {
        let results = allExpenses;

        if (searchTerm.trim() !== '') {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(expense =>
                expense.item.toLowerCase().includes(lowercasedTerm) ||
                expense.category.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        results.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'date-desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return results;
    }, [allExpenses, searchTerm, sortBy]);

    const EmptyState = () => (
        <div className="text-center py-20 px-4 animate-fade-in-up">
            <div className="text-5xl mb-4 animate-pulse-gentle">🧩</div>
            <h3 className="font-semibold text-lg text-text-light dark:text-text-dark">No Results Found</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Try adjusting your search term.</p>
        </div>
    );
    
     const InitialState = () => (
        <div className="text-center py-20 px-4 animate-fade-in-up">
            <div className="text-5xl mb-4 animate-pulse-gentle">🔍</div>
            <h3 className="font-semibold text-lg text-text-light dark:text-text-dark">Search Your Expenses</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Find any transaction by its name or category.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95" aria-label="Go Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark mx-auto">Search Expenses</h1>
                <div className="w-10"></div>
            </header>
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by item or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-surface-light dark:bg-input-dark text-black dark:text-white placeholder-placeholder"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <label htmlFor="sort-by" className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Sort by:</label>
                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-surface-light dark:bg-input-dark text-black dark:text-white"
                    >
                        <option value="date-desc">Date (Newest)</option>
                        <option value="date-asc">Date (Oldest)</option>
                        <option value="amount-desc">Amount (High to Low)</option>
                        <option value="amount-asc">Amount (Low to High)</option>
                    </select>
                </div>
            </div>

            <main className="flex-grow overflow-y-auto">
                {searchTerm.trim() === '' ? (
                    <InitialState />
                ) : filteredAndSortedExpenses.length > 0 ? (
                    <ul className="space-y-3 p-4">
                        {filteredAndSortedExpenses.map((expense, index) => (
                            <li key={expense.id} className="flex items-center bg-surface-light dark:bg-surface-dark p-3 rounded-xl shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 40}ms` }}>
                                <div className="text-2xl mr-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">{categoryIcons[expense.category]}</div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-text-light dark:text-text-dark">{expense.item}</p>
                                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <p className="font-bold text-red-600 dark:text-red-400 text-lg">₹{expense.amount.toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState />
                )}
            </main>
        </div>
    );
};

export default SearchScreen;
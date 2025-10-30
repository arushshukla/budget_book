import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import type { Expense } from '../types';
import * as storage from '../services/storage';

interface ExpenseFormScreenProps {
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
  expenseToEdit: Expense | null;
  prefilledData: Partial<Omit<Expense, 'id'>> | null;
}

const ExpenseFormScreen: React.FC<ExpenseFormScreenProps> = ({ onSave, onCancel, expenseToEdit, prefilledData }) => {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(Category.Other);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setItem(expenseToEdit.item);
      setAmount(String(expenseToEdit.amount));
      setCategory(expenseToEdit.category);
      setDate(expenseToEdit.date);
    } else if (prefilledData) {
      setItem(prefilledData.item || '');
      setAmount(String(prefilledData.amount || ''));
      const autoCategory = storage.getAutoCategory(prefilledData.item || '');
      setCategory(autoCategory);
      setDate(prefilledData.date || new Date().toISOString().slice(0, 10));
    }
  }, [expenseToEdit, prefilledData]);
  
  const handleItemChange = (newItem: string) => {
    setItem(newItem);
    const autoCategory = storage.getAutoCategory(newItem);
    setCategory(autoCategory); // Automatically set the category
  };

  const handleSave = () => {
    const numericAmount = parseFloat(amount);
    if (!item.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please fill in all fields with valid values.');
      return;
    }
    
    setError('');
    setIsSaving(true);
    // Simulate save and show success animation
    setTimeout(() => {
        onSave({ item, amount: numericAmount, category, date });
    }, 1000);
  };
  
  const screenTitle = expenseToEdit ? 'Edit Expense' : 'Add New Expense';
  const buttonText = expenseToEdit ? 'Update Expense' : 'Save Expense';

  return (
    <div className="flex flex-col h-full p-4 bg-background-light dark:bg-background-dark">
      <header className="flex items-center pb-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]" aria-label="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark mx-auto">{screenTitle}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow mt-6 space-y-6 overflow-y-auto">
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-300 p-3 rounded-xl animate-fade-in-up">{error}</p>}
        
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <label htmlFor="item" className="block text-lg font-medium text-text-light dark:text-text-dark">Item</label>
          <input
            id="item"
            type="text"
            value={item}
            onChange={(e) => handleItemChange(e.target.value)}
            placeholder="e.g., Canteen Samosa"
            className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-lg bg-surface-light dark:bg-input-dark text-black dark:text-white placeholder-placeholder transition-shadow"
          />
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <label htmlFor="amount" className="block text-lg font-medium text-text-light dark:text-text-dark">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 20"
            className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-lg bg-surface-light dark:bg-input-dark text-black dark:text-white placeholder-placeholder transition-shadow"
          />
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <label htmlFor="category" className="block text-lg font-medium text-text-light dark:text-text-dark">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-lg bg-surface-light dark:bg-input-dark text-black dark:text-white transition-shadow"
          >
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <label htmlFor="date" className="block text-lg font-medium text-text-light dark:text-text-dark">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-lg bg-surface-light dark:bg-input-dark text-black dark:text-white transition-shadow"
          />
        </div>
      </main>

      <footer className="mt-auto pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full py-4 px-6 text-white font-bold text-xl rounded-xl shadow-lg transition-all duration-300 ${
            isSaving
              ? 'bg-green-500'
              : 'bg-primary hover:bg-primary-dark active:scale-[0.98]'
          }`}
        >
          {isSaving ? (
            <svg className="animate-bounce-in mx-auto h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            buttonText
          )}
        </button>
      </footer>
    </div>
  );
};

export default ExpenseFormScreen;
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Expense } from '../types';
import { Category } from '../types';

interface ReportScreenProps {
  pocketMoney: number;
  expenses: Expense[];
  onBack: () => void;
  month: string; // YYYY-MM
}

const categoryColors: { [key in Category]: string } = {
    [Category.Food]: '#FF5722',
    [Category.Recharge]: '#2196F3',
    [Category.Stationery]: '#FFC107',
    [Category.Entertainment]: '#9C27B0',
    [Category.Fun]: '#E91E63',
    [Category.Transport]: '#3F51B5',
    [Category.Savings]: '#03A9F4', // Light Blue
    [Category.Other]: '#9E9E9E'
};

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


const financeTips = [
    "Saving ₹50 daily equals ₹1500 a month! Small amounts add up.",
    "Before buying something, wait 24 hours. You might realize you don't need it.",
    "Track every expense, no matter how small. It helps you see where your money goes.",
    "Set a savings goal, like for a new book or a video game. It makes saving more fun!",
    "Pack snacks from home instead of buying them outside. It's cheaper and healthier."
];

const ReportScreen: React.FC<ReportScreenProps> = ({ pocketMoney, expenses, onBack, month }) => {
  const [year, monthIndex] = month.split('-').map(Number);
  const monthDate = new Date(year, monthIndex - 1);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const savings = pocketMoney - totalSpent;
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const dataByCategory = Object.values(Category).map(category => {
      const total = expenses
          .filter(e => e.category === category)
          .reduce((sum, e) => sum + e.amount, 0);
      return { name: category, value: total };
  }).filter(item => item.value > 0);
  
  const expensesByDate = useMemo(() => {
    const grouped: { [date: string]: { total: number; items: Expense[] } } = {};
    expenses.forEach(expense => {
        if (!grouped[expense.date]) {
            grouped[expense.date] = { total: 0, items: [] };
        }
        grouped[expense.date].total += expense.amount;
        grouped[expense.date].items.push(expense);
    });
    return Object.entries(grouped).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [expenses]);

  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
        const newSet = new Set(prev);
        if (newSet.has(date)) {
            newSet.delete(date);
        } else {
            newSet.add(date);
        }
        return newSet;
    });
  };

  // Make the tip deterministic based on the month
  const tipIndex = (monthIndex - 1) % financeTips.length;
  const selectedTip = financeTips[tipIndex];

  const handleExportPDF = () => {
    const input = document.getElementById('report-content');
    if (input) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      if (isDarkMode) {
        document.documentElement.classList.remove('dark');
      }

      html2canvas(input, { scale: 2, backgroundColor: '#ffffff' })
        .then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`BudgetBuddy_Report_${month.replace('-', '_')}.pdf`);
        })
        .catch(error => {
            console.error("PDF export failed:", error);
            alert("Sorry, we couldn't create the PDF report.");
        })
        .finally(() => {
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            }
        });
    }
  };


  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]" aria-label="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mx-auto">Monthly Report</h1>
        <div className="w-10"></div>
      </header>
      
      <main className="flex-grow overflow-y-auto">
        <div id="report-content" className="p-4 bg-surface-light dark:bg-surface-dark">
          <p className="text-center text-lg text-text-muted-light dark:text-text-muted-dark font-semibold mb-4">{monthName}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg shadow-sm opacity-0 animate-fade-in-up">
                  <p className="text-sm text-red-700 dark:text-red-300">Total Outgoing</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">₹{totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-lg shadow-sm opacity-0 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                  <p className="text-sm text-green-700 dark:text-green-300">Net Savings</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">₹{savings.toLocaleString()}</p>
              </div>
          </div>

          <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">Category Breakdown</h2>

          {dataByCategory.length > 0 ? (
            <>
              <div className="w-full h-64 sm:h-80 opacity-0 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={dataByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                      {dataByCategory.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={categoryColors[entry.name as Category]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} wrapperClassName="!bg-[#F5F5F5] dark:!bg-[#333333] !text-black dark:!text-white !border-gray-300 dark:!border-gray-600 !rounded-md !shadow-lg" />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 mt-4">
                {dataByCategory.map((cat, index) => (
                  <li key={cat.name} className="flex justify-between items-center p-2 bg-background-light dark:bg-background-dark rounded-md opacity-0 animate-fade-in-up" style={{animationDelay: `${300 + index * 50}ms`}}>
                    <span className="font-medium text-text-light dark:text-text-dark">{cat.name}</span>
                    <span className="text-text-muted-light dark:text-text-muted-dark">
                      ₹{cat.value.toLocaleString()} 
                      <span className="text-sm"> ({totalSpent > 0 ? ((cat.value / totalSpent) * 100).toFixed(0) : 0}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
              <div className="text-center py-10 bg-background-light dark:bg-background-dark rounded-lg">
                  <p className="text-text-muted-light dark:text-text-muted-dark">No expenses logged this month!</p>
              </div>
          )}

          <h2 className="text-xl font-bold text-text-light dark:text-text-dark mt-6 mb-2">Daily Transactions</h2>
          {expensesByDate.length > 0 ? (
              <ul className="space-y-2">
                  {expensesByDate.map(([date, data], index) => {
                      const isExpanded = expandedDates.has(date);
                      return (
                          <li key={date} className="bg-background-light dark:bg-background-dark rounded-lg shadow-sm opacity-0 animate-fade-in-up" style={{animationDelay: `${index * 60}ms`}}>
                              <button
                                  onClick={() => toggleDateExpansion(date)}
                                  className="w-full flex items-center justify-between p-3 text-left"
                                  aria-expanded={isExpanded}
                              >
                                  <span className="font-medium text-text-light dark:text-text-dark">
                                      {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                                  </span>
                                  <div className="flex items-center">
                                      <span className="font-bold text-text-light dark:text-text-dark mr-2">
                                          ₹{data.total.toLocaleString()}
                                      </span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-text-muted-light dark:text-text-muted-dark transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                      </svg>
                                  </div>
                              </button>
                              {isExpanded && (
                                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                      <ul className="space-y-3">
                                          {data.items.map(expense => (
                                              <li key={expense.id} className="flex items-center bg-surface-light dark:bg-surface-dark p-2 rounded animate-fade-in">
                                                  <div className="text-xl mr-3">{categoryIcons[expense.category]}</div>
                                                  <div className="flex-grow">
                                                      <p className="font-medium text-text-light dark:text-text-dark">{expense.item}</p>
                                                      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{expense.category}</p>
                                                  </div>
                                                  <p className={`font-semibold ${expense.category === Category.Savings ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>₹{expense.amount.toLocaleString()}</p>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </li>
                      )
                  })}
              </ul>
          ) : (
            <div className="text-center py-5 bg-background-light dark:bg-background-dark rounded-lg">
                  <p className="text-text-muted-light dark:text-text-muted-dark">No daily spending to show.</p>
              </div>
          )}


          <div className="mt-8 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg" role="alert">
              <p className="font-bold">Finance Tip of the Month</p>
              <p>{selectedTip}</p>
          </div>
        </div>
      </main>

       <footer className="p-4 bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700">
        <button onClick={handleExportPDF} className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-all active:scale-[0.98]">Export as PDF</button>
      </footer>
    </div>
  );
};

export default ReportScreen;
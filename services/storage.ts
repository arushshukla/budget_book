import type { Expense, Theme, ArchivedMonth, AppData, CategoryBudgets, PocketMoneyInfo, QuickExpenseItem, BudgetStreak, SavingsGoal } from '../types';
import { Category } from '../types';

const APP_DATA_KEY = 'budgetbuddy_app_data';

const getDefaultData = (): AppData => ({
    pocketMoneyInfo: { amount: null, payday: 1, source: 'Monthly Income' },
    allExpenses: {},
    archivedMonths: [],
    theme: 'system',
    lastSeenMonth: null,
    categoryBudgets: {
        [Category.Food]: 400,
        [Category.Recharge]: 100,
        [Category.Entertainment]: 200,
    },
    passcode: null,
    onboardingComplete: false,
    quickExpenses: [
        { id: 1, name: "Chai", amount: 20, category: Category.Food },
        { id: 2, name: "Recharge", amount: 50, category: Category.Recharge },
        { id: 3, name: "Pen", amount: 30, category: Category.Stationery },
        { id: 4, name: "Movie", amount: 150, category: Category.Entertainment },
        { id: 5, name: "Bus Fare", amount: 15, category: Category.Transport },
        { id: 6, name: "Snacks", amount: 40, category: Category.Food }
    ],
    quickExpenseButtonCount: 3,
    budgetStreak: { count: 0, lastCheckedDate: null },
    savingsGoal: null,
    hasShownSavingsEducation: false,
    autoCategoryMap: {
        // == Multi-word phrases (prioritized) ==
        'movie ticket': Category.Entertainment,
        'bus fare': Category.Transport,
        'metro card': Category.Transport,
        'phone bill': Category.Recharge,
        'ice cream': Category.Food,
        'cold drink': Category.Food,
        'pencil box': Category.Stationery,
        'video game': Category.Fun,
        'amazon prime': Category.Entertainment,
        'geometry box': Category.Stationery,

        // == Single words & Brands ==

        // Savings
        'savings': Category.Savings,
        'saved': Category.Savings,
        'save': Category.Savings,
        
        // Recharge
        'recharge': Category.Recharge,
        'jio': Category.Recharge,
        'airtel': Category.Recharge,
        'vi': Category.Recharge,
        'vodafone': Category.Recharge,

        // Food & Drinks
        'samosa': Category.Food,
        'chai': Category.Food,
        'canteen': Category.Food,
        'pizza': Category.Food,
        'burger': Category.Food,
        'lunch': Category.Food,
        'dinner': Category.Food,
        'breakfast': Category.Food,
        'snack': Category.Food,
        'snacks': Category.Food,
        'noodles': Category.Food,
        'maggi': Category.Food,
        'dosa': Category.Food,
        'biryani': Category.Food,
        'kfc': Category.Food,
        'mcdonalds': Category.Food,
        'dominos': Category.Food,
        'subway': Category.Food,
        'pastry': Category.Food,
        'cake': Category.Food,
        'juice': Category.Food,
        'coffee': Category.Food,
        'tea': Category.Food,

        // Entertainment & Fun
        'movie': Category.Entertainment,
        'game': Category.Fun,
        'gaming': Category.Fun,
        'playstation': Category.Fun,
        'xbox': Category.Fun,
        'netflix': Category.Entertainment,
        'spotify': Category.Entertainment,
        'hotstar': Category.Entertainment,
        'concert': Category.Entertainment,
        'fair': Category.Fun,
        'mela': Category.Fun,
        'arcade': Category.Fun,
        'bgmi': Category.Fun,

        // Stationery
        'pen': Category.Stationery,
        'book': Category.Stationery,
        'notebook': Category.Stationery,
        'register': Category.Stationery,
        'xerox': Category.Stationery,
        'photocopy': Category.Stationery,
        'print': Category.Stationery,
        'notes': Category.Stationery,

        // Transport
        'auto': Category.Transport,
        'bus': Category.Transport,
        'metro': Category.Transport,
        'ola': Category.Transport,
        'uber': Category.Transport,
        'rapido': Category.Transport,
        'rickshaw': Category.Transport,
        'cab': Category.Transport,
        'taxi': Category.Transport,
        'train': Category.Transport,

        // Other (Shopping, Health, etc.)
        'gift': Category.Other,
        'present': Category.Other,
        'medicine': Category.Other,
        'pharmacy': Category.Other,
        'clothes': Category.Other,
        'shoes': Category.Other,
        't-shirt': Category.Other,
        'jeans': Category.Other,
    },
});

// --- Core Data Functions ---
export const getAppData = (): AppData => {
    const saved = localStorage.getItem(APP_DATA_KEY);
    if (saved) {
        try {
            const defaultData = getDefaultData();
            const parsedData = JSON.parse(saved);
            // Merge saved data with defaults to handle schema updates gracefully
            return {
                ...defaultData,
                ...parsedData,
                pocketMoneyInfo: { ...defaultData.pocketMoneyInfo, ...parsedData.pocketMoneyInfo },
                budgetStreak: { ...defaultData.budgetStreak, ...parsedData.budgetStreak },
                autoCategoryMap: { ...defaultData.autoCategoryMap, ...parsedData.autoCategoryMap },
             };
        } catch (error) {
            console.error("Failed to parse app data from localStorage. Resetting to default.", error);
            // If parsing fails, return default data to prevent a crash.
            return getDefaultData();
        }
    }
    return getDefaultData();
};

export const saveAppData = (data: AppData): void => {
    localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
};

// --- Individual Getters/Setters (for convenience) ---

export const getPocketMoneyInfo = (): PocketMoneyInfo => getAppData().pocketMoneyInfo;
export const savePocketMoneyInfo = (info: PocketMoneyInfo): void => {
    const data = getAppData();
    data.pocketMoneyInfo = info;
    saveAppData(data);
};

const getAllExpensesByMonth = (): { [month: string]: Expense[] } => getAppData().allExpenses;
const saveAllExpensesByMonth = (allExpenses: { [month: string]: Expense[] }): void => {
    const data = getAppData();
    data.allExpenses = allExpenses;
    saveAppData(data);
};

export const getExpensesForMonth = (month: string): Expense[] => {
    const allExpenses = getAllExpensesByMonth();
    return allExpenses[month] || [];
};

export const getAllExpenses = (): Expense[] => {
    const data = getAppData();
    const currentExpenses = Object.values(data.allExpenses).flat();
    const archivedExpenses = data.archivedMonths.flatMap(archive => archive.expenses);
    return [...currentExpenses, ...archivedExpenses];
};

export const addExpense = (expense: Omit<Expense, 'id'>): void => {
  const month = expense.date.slice(0, 7);
  const allExpenses = getAllExpensesByMonth();
  const monthExpenses = allExpenses[month] || [];
  
  const newExpense: Expense = {
    id: new Date().toISOString() + Math.random(),
    ...expense,
  };
  
  monthExpenses.push(newExpense);
  allExpenses[month] = monthExpenses;
  saveAllExpensesByMonth(allExpenses);
};

export const updateExpense = (updatedExpense: Expense): void => {
    const month = updatedExpense.date.slice(0, 7);
    const allExpenses = getAllExpensesByMonth();
    const monthExpenses = allExpenses[month] || [];
    const index = monthExpenses.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) {
        monthExpenses[index] = updatedExpense;
        allExpenses[month] = monthExpenses;
        saveAllExpensesByMonth(allExpenses);
    }
};

export const deleteExpense = (id: string): void => {
    const allExpenses = getAllExpensesByMonth();
    for (const month in allExpenses) {
        const index = allExpenses[month].findIndex(e => e.id === id);
        if (index !== -1) {
            allExpenses[month].splice(index, 1);
            saveAllExpensesByMonth(allExpenses);
            return;
        }
    }
};

export const resetCurrentMonthData = (): void => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const data = getAppData();
    delete data.allExpenses[currentMonth];
    data.categoryBudgets = {
        [Category.Food]: 400,
        [Category.Recharge]: 100,
        [Category.Entertainment]: 200,
    };
    data.budgetStreak = { count: 0, lastCheckedDate: null };
    saveAppData(data);
};

export const getArchivedMonths = (): ArchivedMonth[] => getAppData().archivedMonths;
export const archiveMonth = (month: string, pocketMoney: number, expenses: Expense[], categoryBudgets?: CategoryBudgets): void => {
    const data = getAppData();
    const newArchive: ArchivedMonth = { month, pocketMoney, expenses, categoryBudgets };

    const existingIndex = data.archivedMonths.findIndex(a => a.month === month);
    if (existingIndex > -1) {
        data.archivedMonths[existingIndex] = newArchive;
    } else {
        data.archivedMonths.push(newArchive);
    }

    data.archivedMonths.sort((a, b) => b.month.localeCompare(a.month));
    saveAppData(data);
};

export const getTheme = (): Theme => getAppData().theme;
export const saveTheme = (theme: Theme): void => {
    const data = getAppData();
    data.theme = theme;
    saveAppData(data);
};

export const getLastSeenMonth = (): string | null => getAppData().lastSeenMonth;
export const saveLastSeenMonth = (month: string): void => {
    const data = getAppData();
    data.lastSeenMonth = month;
    saveAppData(data);
};

// --- New Feature Storage ---
export const getCategoryBudgets = (): CategoryBudgets => getAppData().categoryBudgets;
export const saveCategoryBudgets = (budgets: CategoryBudgets): void => {
    const data = getAppData();
    data.categoryBudgets = budgets;
    saveAppData(data);
};

export const getPasscode = (): string | null => getAppData().passcode;
export const savePasscode = (passcode: string | null): void => {
    const data = getAppData();
    data.passcode = passcode;
    saveAppData(data);
};

export const isOnboardingComplete = (): boolean => getAppData().onboardingComplete;
export const setOnboardingComplete = (): void => {
    const data = getAppData();
    data.onboardingComplete = true;
    saveAppData(data);
};

export const getQuickExpenses = (): QuickExpenseItem[] => getAppData().quickExpenses;
export const saveQuickExpenses = (items: QuickExpenseItem[]): void => {
    const data = getAppData();
    data.quickExpenses = items;
    saveAppData(data);
};

export const saveQuickExpenseButtonCount = (count: number): void => {
    const data = getAppData();
    data.quickExpenseButtonCount = count;
    saveAppData(data);
};

export const getBudgetStreak = (): BudgetStreak => getAppData().budgetStreak;
export const saveBudgetStreak = (streak: BudgetStreak): void => {
    const data = getAppData();
    data.budgetStreak = streak;
    saveAppData(data);
};

export const getAutoCategoryMap = (): { [keyword: string]: Category } => getAppData().autoCategoryMap;

export const getAutoCategory = (item: string): Category => {
    const autoCategoryMap = getAutoCategoryMap();
    const itemLower = item.toLowerCase();
    
    // Prioritize longer, more specific keywords first
    const sortedKeywords = Object.keys(autoCategoryMap).sort((a, b) => b.length - a.length);

    // Helper to escape special regex characters to prevent errors.
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    for (const keyword of sortedKeywords) {
        // Use regex to match whole words or phrases to avoid partial matches (e.g., 'pen' in 'spend')
        const escapedKeyword = escapeRegExp(keyword);
        const regex = new RegExp(`\\b${escapedKeyword}\\b`);
        if (regex.test(itemLower)) {
            return autoCategoryMap[keyword];
        }
    }

    return Category.Other;
};

// --- Savings Goal Functions ---
export const saveSavingsGoal = (name: string, amount: number): void => {
    const data = getAppData();
    data.savingsGoal = { name, amount, savedAmount: 0, completed: false };
    saveAppData(data);
};

export const addToSavings = (amount: number): void => {
    const data = getAppData();
    if (data.savingsGoal) {
        data.savingsGoal.savedAmount += amount;
    }
    saveAppData(data);
};

export const markGoalAsComplete = (): void => {
    const data = getAppData();
    if (data.savingsGoal) {
        data.savingsGoal.completed = true;
    }
    saveAppData(data);
};

export const setSavingsEducationShown = (): void => {
    const data = getAppData();
    data.hasShownSavingsEducation = true;
    saveAppData(data);
};
export function getItem(key: string) {
  return localStorage.getItem(key);
}

export function setItem(key: string, value: string) {
  localStorage.setItem(key, value);
}

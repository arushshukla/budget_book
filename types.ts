
export enum Category {
  Food = 'Food',
  Recharge = 'Recharge',
  Stationery = 'Stationery',
  Entertainment = 'Entertainment',
  Fun = 'Fun',
  Transport = 'Transport',
  Savings = 'Savings',
  Other = 'Other',
}

export type IncomeSource = "Monthly Income" | "Pocket Money" | "Allowance" | "Part-Time Job" | "Gift" | "Other";

export interface Expense {
  id: string;
  item: string;
  amount: number;
  category: Category;
  date: string; // YYYY-MM-DD
}

export interface PocketMoneyInfo {
  amount: number | null;
  payday: number; // Day of the month
  source: IncomeSource;
}

export type CategoryBudgets = {
  [key in Category]?: number;
};

export interface ArchivedMonth {
  month: string; // YYYY-MM
  pocketMoney: number;
  expenses: Expense[];
  categoryBudgets?: CategoryBudgets;
}

export type Theme = 'light' | 'dark' | 'system';

export type Screen =
  | 'splash'
  | 'onboarding'
  | 'welcome'
  | 'setup'
  | 'dashboard'
  | 'addExpense'
  | 'report'
  | 'previousMonths'
  | 'settings'
  | 'passcode'
  | 'budgets'
  | 'quickExpenseSettings'
  | 'insights'
  | 'search'
  | 'savingsGuide';


export interface QuickExpenseItem {
    id: number;
    name: string;
    amount: number;
    category: Category;
}

export interface BudgetStreak {
    count: number;
    lastCheckedDate: string | null; // YYYY-MM-DD
}

export interface SavingsGoal {
    name: string;
    amount: number;
    savedAmount: number;
    completed: boolean;
}

export interface AppData {
  pocketMoneyInfo: PocketMoneyInfo;
  allExpenses: { [month: string]: Expense[] }; // YYYY-MM -> expenses
  archivedMonths: ArchivedMonth[];
  theme: Theme;
  lastSeenMonth: string | null;
  categoryBudgets: CategoryBudgets;
  passcode: string | null;
  onboardingComplete: boolean;
  quickExpenses: QuickExpenseItem[];
  quickExpenseButtonCount: number;
  budgetStreak: BudgetStreak;
  savingsGoal: SavingsGoal | null;
  hasShownSavingsEducation: boolean;
  autoCategoryMap: { [keyword: string]: Category };
}

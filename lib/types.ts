export const CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other"
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string; // ISO string (yyyy-mm-dd)
  createdAt: number;
}

export interface Filters {
  search: string;
  category: Category | "All";
  from: string;
  to: string;
}

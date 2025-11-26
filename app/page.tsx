"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Calendar, Download, Edit3, Filter, PlusCircle, Trash2, Wallet2 } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/format";
import { CATEGORIES, Category, Expense, Filters } from "@/lib/types";

const STORAGE_KEY = "clarity-expenses-v1";

interface FormState {
  description: string;
  amount: string;
  category: Category;
  date: string;
}

const initialForm = (): FormState => ({
  description: "",
  amount: "",
  category: "Food",
  date: new Date().toISOString().slice(0, 10)
});

export default function HomePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [filters, setFilters] = useState<Filters>({ search: "", category: "All", from: "", to: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message?: string }>({ type: null });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load expenses", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, isReady]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm());
    setEditingId(null);
  };

  const validateForm = () => {
    const amount = Number(form.amount);
    if (!form.description.trim()) return "Add a description";
    if (!form.date) return "Pick a date";
    if (Number.isNaN(amount) || amount <= 0) return "Enter a valid amount";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    const amount = Number(form.amount);
    if (editingId) {
      setExpenses((prev) =>
        prev.map((item) => (item.id === editingId ? { ...item, ...form, amount } : item))
      );
      setStatus({ type: "success", message: "Expense updated" });
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description: form.description.trim(),
        amount,
        category: form.category,
        date: form.date,
        createdAt: Date.now()
      };
      setExpenses((prev) => [newExpense, ...prev]);
      setStatus({ type: "success", message: "Expense added" });
    }

    resetForm();
    setTimeout(() => setStatus({ type: null }), 2200);
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date
    });
  };

  const handleDelete = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    if (editingId === id) resetForm();
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const matchesCategory =
          filters.category === "All" ? true : expense.category === filters.category;
        const matchesSearch = expense.description
          .toLowerCase()
          .includes(filters.search.trim().toLowerCase());
        const afterFrom = filters.from ? expense.date >= filters.from : true;
        const beforeTo = filters.to ? expense.date <= filters.to : true;
        return matchesCategory && matchesSearch && afterFrom && beforeTo;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, filters]);

  const totalsByCategory = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0)
    }));
  }, [expenses]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlySpent = expenses
    .filter((expense) => expense.date.startsWith(monthKey))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const topCategory = totalsByCategory.reduce(
    (top, current) => (current.total > (top?.total ?? 0) ? current : top),
    { category: "Food", total: 0 }
  );

  const totalFiltered = filteredExpenses.length;

  const exportCsv = () => {
    if (!expenses.length) return;
    const header = ["Description", "Amount", "Category", "Date"];
    const rows = filteredExpenses.map((expense) => [
      expense.description,
      expense.amount.toFixed(2),
      expense.category,
      expense.date
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/\"/g, '"')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isReady) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-gray-200">
        <div className="glass-card animate-pulse p-8">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="glass-card h-20" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-gray-100">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm text-emerald-300">
            <Wallet2 className="h-4 w-4" /> Clarity · Personal finance
          </p>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Expense dashboard</h1>
            <p className="text-gray-300">
              Track spending, spot trends, and keep your budget on course with quick filters and
              summaries.
            </p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-card transition hover:translate-y-[-2px] hover:bg-emerald-300"
          disabled={!expenses.length}
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total spend" value={formatCurrency(totalSpent)} hint="Lifetime" />
        <SummaryCard
          label="This month"
          value={formatCurrency(monthlySpent)}
          hint={monthKey}
          accent
        />
        <SummaryCard
          label="Top category"
          value={topCategory.total ? `${topCategory.category}` : "-"}
          hint={topCategory.total ? formatCurrency(topCategory.total) : "No data"}
        />
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-card col-span-2 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Add expense</h2>
              <p className="text-sm text-gray-400">Capture spending with validation and quick edit mode.</p>
            </div>
            {status.type && (
              <span
                className={`badge ${status.type === "success" ? "badge-soft" : "bg-rose-500/10 text-rose-200"}`}
              >
                {status.message}
              </span>
            )}
          </div>
          <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300">Description</label>
              <input
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white shadow-soft focus:border-emerald-400/60"
                placeholder="Coffee with friends"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white shadow-soft"
                placeholder="18.50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Date</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 pl-9 text-sm text-white shadow-soft"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white shadow-soft"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-gray-900">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-card transition hover:translate-y-[-2px] hover:shadow-xl"
              >
                <PlusCircle className="h-4 w-4" /> {editingId ? "Save changes" : "Add expense"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200 hover:border-white/30"
                >
                  Cancel edit
                </button>
              )}
              <p className="text-sm text-gray-400">Amounts are formatted as US currency.</p>
            </div>
          </form>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Filters</h2>
              <p className="text-sm text-gray-400">Search, constrain by date, or focus on one category.</p>
            </div>
            <Filter className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-300">Search</label>
              <input
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Groceries, Uber, rent..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300">From</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => handleFilterChange("from", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300">To</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => handleFilterChange("to", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value as Filters["category"])}
                className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="All" className="text-gray-900">
                  All
                </option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-gray-900">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{totalFiltered} result{totalFiltered === 1 ? "" : "s"}</span>
              <button
                onClick={() => setFilters({ search: "", category: "All", from: "", to: "" })}
                className="text-emerald-300 hover:text-emerald-200"
              >
                Clear all
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Expense history</h2>
              <p className="text-sm text-gray-400">Edit inline, delete, or export filtered rows.</p>
            </div>
            <span className="badge badge-soft">{filteredExpenses.length} shown</span>
          </div>
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-gray-300">
                <tr>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-gray-400">
                      No expenses match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-6 py-3">
                        <p className="font-medium text-white">{expense.description}</p>
                        <p className="text-xs text-gray-400">Added {formatDate(expense.date)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-soft">{expense.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{expense.date}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-300">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="rounded-lg bg-white/5 px-2 py-1 text-xs text-emerald-200 hover:bg-white/10"
                            aria-label="Edit expense"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Category mix</h2>
              <p className="text-sm text-gray-400">Basic breakdown of where your money goes.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="mt-6 space-y-3">
            {totalsByCategory.map(({ category, total }) => {
              const max = Math.max(...totalsByCategory.map((item) => item.total), 1);
              const width = `${Math.max((total / max) * 100, 6)}%`;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{category}</span>
                    <span className="font-semibold text-white">{formatCurrency(total)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  accent
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`glass-card border ${accent ? "border-emerald-400/40" : "border-white/5"} p-5 shadow-card transition hover:translate-y-[-2px]`}
    >
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{label}</span>
        {accent ? (
          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-200">
            Live
          </span>
        ) : (
          <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-gray-300">Summary</span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
    </div>
  );
}

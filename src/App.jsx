import { useEffect, useMemo, useState } from "react";

import {

  Wallet, TrendingUp, TrendingDown, Plus, LayoutDashboard,

  Receipt, PiggyBank, Sparkles, Trash2, Lightbulb,

  BarChart3, ShieldAlert, Target, FileText, X,

  CalendarDays, ArrowUpRight, ArrowDownRight, CircleDollarSign,

  Pencil,

} from "lucide-react";

import {

  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,

  BarChart, Bar, XAxis, YAxis, CartesianGrid,

} from "recharts";

import "./App.css";

const BUDGET_STORAGE_KEY = "smartExpenseMonthlyBudget";

const SAVINGS_GOAL_KEY = "smartExpenseSavingsGoal";

const CATEGORIES = [

  "Food", "Transport", "Bills", "Shopping", "Health",

  "Education", "Entertainment", "Rent", "Salary", "Business",

  "Investment", "Other",

];

const CHART_COLORS = [

  "#6475db", "#35a783", "#f3ad53", "#e57575",

  "#9270ca", "#55a9c5", "#8a9baf", "#cf79a8",

];

const money = (value) =>

  `₹${Number(value || 0).toLocaleString("en-IN", {

    maximumFractionDigits: 2,

  })}`;

const today = () => new Date().toISOString().slice(0, 10);

function readNumber(key, fallback) {

  try {

    const saved = localStorage.getItem(key);

    if (saved === null) return fallback;

    const value = Number(saved);

    return Number.isFinite(value) && value > 0 ? value : fallback;

  } catch {

    return fallback;

  }

}

function App() {

  const API_URL = "http://localhost:8080/api/transactions";

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [apiError, setApiError] = useState("");

  const [monthlyBudget, setMonthlyBudget] = useState(() =>

    readNumber(BUDGET_STORAGE_KEY, 20000)

  );

  const [savingsGoal, setSavingsGoal] = useState(() =>

    readNumber(SAVINGS_GOAL_KEY, 10000)

  );

  const [budgetInput, setBudgetInput] = useState("");

  const [goalInput, setGoalInput] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [reportMonth, setReportMonth] = useState(today().slice(0, 7));

  const [title, setTitle] = useState("");

  const [amount, setAmount] = useState("");

  const [type, setType] = useState("expense");

  const [category, setCategory] = useState("Food");

  const [date, setDate] = useState(today());

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      try {
        setLoadingTransactions(true);
        setApiError("");
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Failed to load transactions (HTTP ${response.status}).`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The backend returned an unexpected response.");
        }
        if (!cancelled) setTransactions(data);
      } catch (error) {
        console.error("Error loading transactions:", error);
        if (!cancelled) {
          setApiError("Could not load transactions. Make sure the Spring Boot backend is running on port 8080.");
        }
      } finally {
        if (!cancelled) setLoadingTransactions(false);
      }
    }

    loadTransactions();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {

    try {

      localStorage.setItem(BUDGET_STORAGE_KEY, String(monthlyBudget));

    } catch (error) {

      console.error("Could not save budget:", error);

    }

  }, [monthlyBudget]);

  useEffect(() => {

    try {

      localStorage.setItem(SAVINGS_GOAL_KEY, String(savingsGoal));

    } catch (error) {

      console.error("Could not save savings goal:", error);

    }

  }, [savingsGoal]);

  const currentMonth = today().slice(0, 7);

  const monthlyTransactions = useMemo(

    () => transactions.filter(

      (item) => (item.date || currentMonth).slice(0, 7) === currentMonth

    ),

    [transactions, currentMonth]

  );

  const income = monthlyTransactions

    .filter((item) => item.type === "income")

    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenses = monthlyTransactions

    .filter((item) => item.type === "expense")

    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = income - expenses;

  const remainingBudget = monthlyBudget - expenses;

  const budgetUsed = monthlyBudget > 0 ? (expenses / monthlyBudget) * 100 : 0;

  const budgetProgress = Math.min(budgetUsed, 100);

  const savings = Math.max(balance, 0);

  const savingsProgress = savingsGoal > 0

    ? Math.min((savings / savingsGoal) * 100, 100)

    : 0;

  const categoryTotals = monthlyTransactions

    .filter((item) => item.type === "expense")

    .reduce((totals, item) => {

      const name = item.category || "Other";

      totals[name] = (totals[name] || 0) + Number(item.amount || 0);

      return totals;

    }, {});

  const categoryEntries = Object.entries(categoryTotals)

    .sort((a, b) => b[1] - a[1]);

  const expenseTransactions = monthlyTransactions.filter(

    (item) => item.type === "expense"

  );

  const averageExpense = expenseTransactions.length

    ? expenses / expenseTransactions.length

    : 0;

  const unusualExpenses = expenseTransactions.filter(

    (item) => averageExpense > 0 && Number(item.amount) >= averageExpense * 2

  );

  const daysElapsed = Math.max(new Date().getDate(), 1);

  const daysInMonth = new Date(

    new Date().getFullYear(),

    new Date().getMonth() + 1,

    0

  ).getDate();

  const predictedExpenses = (expenses / daysElapsed) * daysInMonth;

  const insights = [];

  if (expenses === 0) {

    insights.push({

      title: "Start tracking expenses",

      message: "Add expenses to see spending patterns and recommendations.",

      kind: "normal",

      icon: <Lightbulb size={21} />,

    });

  } else if (budgetUsed >= 100) {

    insights.push({

      title: "Budget limit reached",

      message: `You have exceeded your monthly budget by ${money(Math.abs(remainingBudget))}. Review optional spending.`,

      kind: "warning",

      icon: <ShieldAlert size={21} />,

    });

  } else if (budgetUsed >= 80) {

    insights.push({

      title: "Approaching your budget",

      message: `${budgetUsed.toFixed(0)}% of your monthly budget has been used.`,

      kind: "warning",

      icon: <ShieldAlert size={21} />,

    });

  } else {

    insights.push({

      title: "You are within your budget",

      message: `${money(remainingBudget)} remains in your monthly spending limit.`,

      kind: "normal",

      icon: <Lightbulb size={21} />,

    });

  }

  if (categoryEntries.length) {

    insights.push({

      title: `Highest spending: ${categoryEntries[0][0]}`,

      message: `${money(categoryEntries[0][1])} spent in this category this month.`,

      kind: "normal",

      icon: <BarChart3 size={21} />,

    });

  }

  if (unusualExpenses.length) {

    insights.push({

      title: "Review larger expenses",

      message: `${unusualExpenses.length} expense(s) are at least twice your average recorded expense. Check whether they were necessary.`,

      kind: "warning",

      icon: <ShieldAlert size={21} />,

    });

  }

  if (income > 0 && balance >= 0) {

    insights.push({

      title: "Savings opportunity",

      message: `Your recorded income minus expenses is ${money(balance)} this month.`,

      kind: "normal",

      icon: <PiggyBank size={21} />,

    });

  } else if (balance < 0) {

    insights.push({

      title: "Spending exceeds income",

      message: `Recorded expenses exceed income by ${money(Math.abs(balance))}.`,

      kind: "warning",

      icon: <TrendingDown size={21} />,

    });

  }

  function resetTransactionForm() {

    setTitle("");

    setAmount("");

    setType("expense");

    setCategory("Food");

    setDate(today());

    setEditingId(null);

    setShowForm(false);

  }

  async function handleAddTransaction(event) {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      window.alert("Enter a transaction title and an amount greater than zero.");
      return;
    }
    if (!date) {
      window.alert("Please select a transaction date.");
      return;
    }

    const transactionData = {
      title: title.trim(),
      amount: numericAmount,
      type,
      category,
      date,
    };

    try {
      setApiError("");
      const isEditing = editingId !== null;
      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionData),
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Save failed (HTTP ${response.status}).`);
      }

      const savedTransaction = await response.json();
      if (isEditing) {
        setTransactions((previous) =>
          previous.map((item) => item.id === editingId ? savedTransaction : item)
        );
      } else {
        setTransactions((previous) => [savedTransaction, ...previous]);
      }
      resetTransactionForm();
    } catch (error) {
      console.error("Error saving transaction:", error);
      setApiError("Could not save the transaction. Check the backend and try again.");
    }
  }

  function handleEditTransaction(item) {

    setEditingId(item.id);

    setTitle(item.title);

    setAmount(String(item.amount));

    setType(item.type);

    setCategory(item.category || (item.type === "income" ? "Salary" : "Other"));

    setDate(item.date || today());

    setShowForm(true);

  }

  async function handleDeleteTransaction(id) {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      setApiError("");
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Delete failed (HTTP ${response.status}).`);
      }

      setTransactions((previous) => previous.filter((item) => item.id !== id));
      if (editingId === id) resetTransactionForm();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setApiError("Could not delete the transaction. Check the backend and try again.");
    }
  }

  function handleSaveBudget(event) {

    event.preventDefault();

    const value = Number(budgetInput);

    if (!Number.isFinite(value) || value <= 0) {

      window.alert("Enter a valid monthly budget greater than zero.");

      return;

    }

    setMonthlyBudget(value);

    setBudgetInput("");

  }

  function handleSaveGoal(event) {

    event.preventDefault();

    const value = Number(goalInput);

    if (!Number.isFinite(value) || value <= 0) {

      window.alert("Enter a savings goal greater than zero.");

      return;

    }

    setSavingsGoal(value);

    setGoalInput("");

  }

  const reportTransactions = transactions.filter(

    (item) => (item.date || currentMonth).slice(0, 7) === reportMonth

  );

  const reportIncome = reportTransactions

    .filter((item) => item.type === "income")

    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const reportExpenses = reportTransactions

    .filter((item) => item.type === "expense")

    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pageDescriptions = {

    Dashboard: "Your complete financial overview.",

    Transactions: "Create, view, edit, and delete your financial records.",

    "Budgets & Savings": "Plan spending and work towards your savings goals.",

    "AI Insights": "Review spending patterns and suggested actions.",

    Reports: "Explore monthly summaries and transaction reports.",

  };

  const navItems = [

    { name: "Dashboard", icon: <LayoutDashboard size={19} /> },

    { name: "Transactions", icon: <Receipt size={19} /> },

    { name: "Budgets & Savings", icon: <PiggyBank size={19} /> },

    { name: "AI Insights", icon: <Sparkles size={19} /> },

    { name: "Reports", icon: <FileText size={19} /> },

  ];

  function transactionList(items) {

    if (!items.length) {

      return (

        <div className="empty-state">

          <Receipt size={34} />

          <h3>No transactions found</h3>

          <p>Add a transaction to begin tracking your finances.</p>

          <button className="primary-button" type="button" onClick={() => {

            resetTransactionForm();

            setShowForm(true);

          }}>

            <Plus size={17} /> Add Transaction

          </button>

        </div>

      );

    }

    return (

      <div className="transaction-list">

        {items.map((item) => (

          <article className="transaction-item" key={item.id}>

            <div className="transaction-left">

              <div className={`transaction-icon ${item.type}`}>

                {item.type === "income"

                  ? <ArrowDownRight size={20} />

                  : <ArrowUpRight size={20} />}

              </div>

              <div>

                <h3>{item.title}</h3>

                <p>{item.category || "Other"} · {item.date || "Date not recorded"}</p>

              </div>

            </div>

            <div className="transaction-right">

              <strong className={item.type === "income" ? "income-text" : "expense-text"}>

                {item.type === "income" ? "+" : "−"}{money(item.amount)}

              </strong>

              <button className="edit-button" type="button"

                aria-label={`Edit ${item.title}`}

                onClick={() => handleEditTransaction(item)}>

                <Pencil size={15} /> Edit

              </button>

              <button className="delete-button" type="button"

                aria-label={`Delete ${item.title}`}

                onClick={() => handleDeleteTransaction(item.id)}>

                <Trash2 size={17} />

              </button>

            </div>

          </article>

        ))}

      </div>

    );

  }

  return (

    <div className="app">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon"><Wallet size={25} /></div>

          <div><h2>SmartExpense</h2><p>AI Finance Manager</p></div>

        </div>

        <p className="menu-heading">WORKSPACE</p>

        <nav className="navigation" aria-label="Main navigation">

          {navItems.map((item) => (

            <button key={item.name} type="button"

              className={`nav-item ${activePage === item.name ? "active" : ""}`}

              onClick={() => setActivePage(item.name)}>

              {item.icon}{item.name}

            </button>

          ))}

        </nav>

        <div className="sidebar-bottom">

          <div className="ai-card">

            <Sparkles size={22} />

            <h3>Smarter spending starts here</h3>

            <p>Track your money, understand spending, and work towards savings goals.</p>

          </div>

          <p className="sidebar-footer">SmartExpense AI © 2026</p>

        </div>

      </aside>

      <main className="main-content">
        {loadingTransactions && (
          <p className="info-message" role="status">Loading transactions from the database...</p>
        )}
        {apiError && (
          <p className="info-message" role="alert" style={{ color: "crimson" }}>{apiError}</p>
        )}

        <header className="topbar">

          <div>

            <p className="breadcrumb">SmartExpense / {activePage}</p>

            <h1>{activePage}</h1>

            <p className="page-description">{pageDescriptions[activePage]}</p>

          </div>

          <button className="primary-button" type="button" onClick={() => {

            resetTransactionForm();

            setShowForm(true);

          }}>

            <Plus size={19} /> Add Transaction

          </button>

        </header>

        {activePage === "Dashboard" && (

          <>

            <section className="welcome-banner">

              <div>

                <p className="welcome-label">YOUR FINANCIAL OVERVIEW</p>

                <h2>Take control of your money.</h2>

                <p>Track income, manage expenses, set savings goals, and make informed financial decisions.</p>

              </div>

              <div className="banner-icon"><Wallet size={54} /></div>

            </section>

            <section className="stats-grid">

              <StatCard title="Monthly Balance" amount={balance} icon={<Wallet size={22} />} className="balance-card" />

              <StatCard title="Monthly Income" amount={income} icon={<TrendingUp size={22} />} className="income-card" />

              <StatCard title="Monthly Expenses" amount={expenses} icon={<TrendingDown size={22} />} className="expense-card" />

            </section>

            <BudgetPanel monthlyBudget={monthlyBudget} expenses={expenses}

              budgetUsed={budgetUsed} budgetProgress={budgetProgress}

              remainingBudget={remainingBudget} budgetInput={budgetInput}

              setBudgetInput={setBudgetInput} handleSaveBudget={handleSaveBudget} />

            <SavingsPanel savingsGoal={savingsGoal} savings={savings}

              savingsProgress={savingsProgress} goalInput={goalInput}

              setGoalInput={setGoalInput} handleSaveGoal={handleSaveGoal} />

            <InsightsPanel insights={insights.slice(0, 3)} />

            <FinancialCharts categoryEntries={categoryEntries} income={income} expenses={expenses} />

            <section className="transactions-section">

              <div className="section-header">

                <div><h2>Recent Transactions</h2><p>Your latest recorded financial activities.</p></div>

                <button className="text-button" type="button" onClick={() => setActivePage("Transactions")}>View all</button>

              </div>

              {transactionList(transactions.slice(0, 5))}

            </section>

          </>

        )}

        {activePage === "Transactions" && (

          <section className="transactions-section">

            <div className="section-header">

              <div><h2>All Transactions</h2><p>{transactions.length} transaction(s) recorded.</p></div>

            </div>

            {transactionList(transactions)}

          </section>

        )}

        {activePage === "Budgets & Savings" && (

          <>

            <BudgetPanel monthlyBudget={monthlyBudget} expenses={expenses}

              budgetUsed={budgetUsed} budgetProgress={budgetProgress}

              remainingBudget={remainingBudget} budgetInput={budgetInput}

              setBudgetInput={setBudgetInput} handleSaveBudget={handleSaveBudget} />

            <SavingsPanel savingsGoal={savingsGoal} savings={savings}

              savingsProgress={savingsProgress} goalInput={goalInput}

              setGoalInput={setGoalInput} handleSaveGoal={handleSaveGoal} />

            <InsightsPanel insights={insights} />

          </>

        )}

        {activePage === "AI Insights" && (

          <>

            <section className="prediction-card">

              <div className="prediction-icon"><BarChart3 size={25} /></div>

              <div>

                <p className="welcome-label">SPENDING FORECAST</p>

                <h2>{money(predictedExpenses)}</h2>

                <p>Estimated spending for this month, based on your current daily average.</p>

                <small>This is a simple estimate, not a trained machine-learning prediction.</small>

              </div>

            </section>

            <InsightsPanel insights={insights} />

            <FinancialCharts categoryEntries={categoryEntries} income={income} expenses={expenses} />

            <section className="transactions-section">

              <div className="section-header">

                <div><h2>Expenses to Review</h2><p>Transactions at least twice the average recorded expense.</p></div>

              </div>

              {unusualExpenses.length

                ? transactionList(unusualExpenses)

                : <p className="info-message">No unusually large expenses detected by this simple rule.</p>}

            </section>

          </>

        )}

        {activePage === "Reports" && (

          <>

            <section className="budget-card">

              <div className="section-header">

                <div><h2><FileText size={21} /> Monthly Report</h2><p>Select a month to view its recorded income and expenses.</p></div>

              </div>

              <label htmlFor="report-month">Report month</label>

              <input id="report-month" className="report-month-input" type="month"

                value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} />

              <div className="report-summary-grid">

                <StatCard title="Report Income" amount={reportIncome} icon={<TrendingUp size={22} />} className="income-card" />

                <StatCard title="Report Expenses" amount={reportExpenses} icon={<TrendingDown size={22} />} className="expense-card" />

                <StatCard title="Net Amount" amount={reportIncome - reportExpenses} icon={<CircleDollarSign size={22} />} className="balance-card" />

              </div>

              <FinancialCharts

                categoryEntries={Object.entries(

                  reportTransactions.filter((item) => item.type === "expense")

                    .reduce((totals, item) => {

                      const name = item.category || "Other";

                      totals[name] = (totals[name] || 0) + Number(item.amount || 0);

                      return totals;

                    }, {})

                ).sort((a, b) => b[1] - a[1])}

                income={reportIncome} expenses={reportExpenses} />

            </section>

            <section className="transactions-section">

              <div className="section-header">

                <div><h2>Report Transactions</h2><p>Transactions recorded for {reportMonth}.</p></div>

              </div>

              {transactionList(reportTransactions)}

            </section>

          </>

        )}

        <footer className="app-disclaimer">

          Financial summaries and suggestions are calculated from transactions stored in your database. Insights are rule-based prototypes, not a trained AI model.

        </footer>

        {showForm && (

          <div className="modal-overlay" onClick={(event) => {

            if (event.target === event.currentTarget) resetTransactionForm();

          }}>

            <section className="transaction-modal" role="dialog" aria-modal="true"

              aria-labelledby="transaction-form-title">

              <div className="modal-header">

                <div>

                  <h2 id="transaction-form-title">{editingId !== null ? "Edit Transaction" : "Add Transaction"}</h2>

                  <p>{editingId !== null ? "Update the selected financial record." : "Enter your financial details below."}</p>

                </div>

                <button className="icon-button" type="button" onClick={resetTransactionForm} aria-label="Close">

                  <X size={21} />

                </button>

              </div>

              <form onSubmit={handleAddTransaction}>

                <label htmlFor="transaction-title">Transaction name</label>

                <input id="transaction-title" value={title}

                  onChange={(event) => setTitle(event.target.value)}

                  placeholder="e.g. Grocery shopping" required />

                <label htmlFor="transaction-amount">Amount (₹)</label>

                <input id="transaction-amount" type="number" min="0.01" step="0.01"

                  value={amount} onChange={(event) => setAmount(event.target.value)}

                  placeholder="Enter amount" required />

                <label htmlFor="transaction-type">Transaction type</label>

                <select id="transaction-type" value={type} onChange={(event) => {

                  const nextType = event.target.value;

                  setType(nextType);

                  setCategory(nextType === "income" ? "Salary" : "Food");

                }}>

                  <option value="expense">Expense</option>

                  <option value="income">Income</option>

                </select>

                <label htmlFor="transaction-category">Category</label>

                <select id="transaction-category" value={category}

                  onChange={(event) => setCategory(event.target.value)}>

                  {CATEGORIES.filter((item) => type === "income"

                    ? ["Salary", "Business", "Investment", "Other"].includes(item)

                    : item !== "Salary" && item !== "Business" && item !== "Investment"

                  ).map((item) => <option key={item} value={item}>{item}</option>)}

                </select>

                <label htmlFor="transaction-date">Date</label>

                <input id="transaction-date" type="date" value={date}

                  onChange={(event) => setDate(event.target.value)} required />

                <div className="modal-actions">

                  <button type="button" className="secondary-button" onClick={resetTransactionForm}>Cancel</button>

                  <button type="submit" className="primary-button">

                    {editingId !== null ? <Pencil size={17} /> : <Plus size={17} />}

                    {editingId !== null ? "Update Transaction" : "Save Transaction"}

                  </button>

                </div>

              </form>

            </section>

          </div>

        )}

      </main>

    </div>

  );

}

function StatCard({ title, amount, icon, className }) {

  return (

    <article className={`stat-card ${className}`}>

      <div className="stat-card-top"><span>{title}</span><span className="stat-icon">{icon}</span></div>

      <h2>{money(amount)}</h2>

    </article>

  );

}

function BudgetPanel({ monthlyBudget, expenses, budgetUsed, budgetProgress, remainingBudget, budgetInput, setBudgetInput, handleSaveBudget }) {

  return (

    <section className="budget-card">

      <div className="budget-header">

        <div><h2><PiggyBank size={22} /> Monthly Budget</h2><p>Set a spending limit and monitor your progress.</p></div>

        <span className="budget-icon"><CalendarDays size={23} /></span>

      </div>

      <form className="budget-form" onSubmit={handleSaveBudget}>

        <label htmlFor="monthly-budget">Monthly spending limit (₹)</label>

        <div className="budget-input-row">

          <input id="monthly-budget" type="number" min="1" value={budgetInput}

            onChange={(event) => setBudgetInput(event.target.value)}

            placeholder="Enter new monthly budget" required />

          <button type="submit" className="primary-button">Save Budget</button>

        </div>

      </form>

      <div className="budget-summary"><span>{money(expenses)} spent</span><span>{money(monthlyBudget)} limit</span></div>

      <div className="budget-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(Math.round(budgetUsed), 100)}>

        <div className={`budget-progress-fill ${budgetUsed >= 100 ? "over-budget" : ""}`} style={{ width: `${budgetProgress}%` }} />

      </div>

      <p className={`budget-message ${remainingBudget < 0 ? "over-budget-text" : ""}`}>

        {remainingBudget < 0 ? `${money(Math.abs(remainingBudget))} over budget.` : `${money(remainingBudget)} remaining this month.`}

      </p>

    </section>

  );

}

function SavingsPanel({ savingsGoal, savings, savingsProgress, goalInput, setGoalInput, handleSaveGoal }) {

  return (

    <section className="budget-card savings-panel">

      <div className="budget-header">

        <div><h2><Target size={22} /> Savings Goal</h2><p>Set a target and track your progress towards it.</p></div>

        <span className="budget-icon"><PiggyBank size={23} /></span>

      </div>

      <form className="budget-form" onSubmit={handleSaveGoal}>

        <label htmlFor="savings-goal">Savings target (₹)</label>

        <div className="budget-input-row">

          <input id="savings-goal" type="number" min="1" value={goalInput}

            onChange={(event) => setGoalInput(event.target.value)}

            placeholder="Enter savings target" required />

          <button type="submit" className="primary-button">Save Goal</button>

        </div>

      </form>

      <div className="budget-summary"><span>Current net balance: {money(savings)}</span><span>Target: {money(savingsGoal)}</span></div>

      <div className="budget-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(savingsProgress)}>

        <div className="savings-progress-fill" style={{ width: `${savingsProgress}%` }} />

      </div>

      <p className="budget-message">{savingsProgress >= 100 ? "Your target has been reached based on the current net balance!" : `${savingsProgress.toFixed(0)}% of your savings target reached.`}</p>

      <small className="helper-text">Calculated from this month's income minus expenses, not a separate bank balance.</small>

    </section>

  );

}

function InsightsPanel({ insights }) {

  return (

    <section className="insights-section">

      <div className="section-header">

        <div><h2><Sparkles size={21} /> Spending Insights</h2><p>Spending-pattern analysis and suggested actions.</p></div>

        <span className="insight-tag">Smart Analysis</span>

      </div>

      <div className="insights-grid">

        {insights.map((insight, index) => (

          <article className={`insight-card ${insight.kind === "warning" ? "insight-warning" : ""}`} key={`${insight.title}-${index}`}>

            <span className="insight-icon">{insight.icon}</span>

            <div><h3>{insight.title}</h3><p>{insight.message}</p></div>

          </article>

        ))}

      </div>

      <p className="helper-text">These recommendations use simple rules; a trained AI model would be needed for genuine machine-learning predictions.</p>

    </section>

  );

}

function FinancialCharts({ categoryEntries, income, expenses }) {

  const pieData = categoryEntries.map(([name, value]) => ({ name, value }));

  const comparisonData = [

    { name: "Income", amount: income },

    { name: "Expenses", amount: expenses },

  ];

  return (

    <section className="financial-charts">

      <div className="chart-card">

        <div className="chart-heading"><h2>Expenses by Category</h2><p>See where your money is going.</p></div>

        {pieData.length === 0 ? (

          <p className="info-message">Add an expense to display the category chart.</p>

        ) : (

          <div className="chart-container">

            <ResponsiveContainer width="100%" height={290}>

              <PieChart>

                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"

                  innerRadius={62} outerRadius={95} paddingAngle={3}

                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>

                  {pieData.map((entry, index) => (

                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />

                  ))}

                </Pie>

                <Tooltip formatter={(value) => money(value)} />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        )}

      </div>

      <div className="chart-card">

        <div className="chart-heading"><h2>Income vs Expenses</h2><p>Compare this month's totals.</p></div>

        <div className="chart-container">

          <ResponsiveContainer width="100%" height={290}>

            <BarChart data={comparisonData} margin={{ top: 15, right: 12, left: 12, bottom: 5 }}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />

              <Tooltip formatter={(value) => money(value)} />

              <Bar dataKey="amount" name="Amount" fill="#6475db" radius={[7, 7, 0, 0]} />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </section>

  );

}

export default App;

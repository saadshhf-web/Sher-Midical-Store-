import React, { useState } from 'react';
import {
  Pill,
  Package,
  CircleDollarSign,
  Truck,
  TrendingUp,
  Users,
  AlertTriangle,
  CalendarClock,
  Skull,
  Receipt,
  ShoppingCart,
  PlusCircle,
  Eye,
  Printer,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Sale } from '../types';

export const DashboardView: React.FC = () => {
  const {
    medicines,
    sales,
    purchases,
    customers,
    expenses,
    settings,
    setCurrentTab,
    setPrintableDoc,
    printCurrentDoc,
  } = useStore();

  const [chartMode, setChartMode] = useState<'sales' | 'profit'>('sales');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Total Medicines
  const totalMedicines = medicines.length;

  // 2. Total Stock Quantity
  const totalStockQty = medicines.reduce((sum, m) => sum + (m.quantity || 0), 0);

  // 3. Today's Sales
  const todaySalesList = sales.filter((s) => s.date === todayStr);
  const todaySalesTotal = todaySalesList.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

  // 4. Today's Purchases
  const todayPurchasesList = purchases.filter((p) => p.date === todayStr);
  const todayPurchasesTotal = todayPurchasesList.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  // 5. Today's Profit
  const todayProfitTotal = todaySalesList.reduce((sum, s) => sum + (s.totalProfit || 0), 0);

  // 6. Total Customers
  const totalCustomers = customers.length;

  // 7. Low Stock Medicines
  const lowStockMeds = medicines.filter(
    (m) => m.quantity > 0 && m.quantity <= (m.minStock || settings.minStockDefault)
  );

  // 8. Expiring Soon Medicines (within settings.expiryAlertDays, e.g. 60 days)
  const alertDays = settings.expiryAlertDays || 60;
  const alertThresholdDate = new Date();
  alertThresholdDate.setDate(alertThresholdDate.getDate() + alertDays);

  const expiringSoonMeds = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    const exp = new Date(m.expiryDate);
    return exp >= now && exp <= alertThresholdDate;
  });

  // 9. Expired Medicines
  const expiredMeds = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    return new Date(m.expiryDate) < now;
  });

  // 10. Today's Expenses
  const todayExpensesList = expenses.filter((e) => e.date === todayStr);
  const todayExpensesTotal = todayExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Recent 6 Sales
  const recentSales = sales.slice(0, 6);

  // Generate 7-day trend data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const daySales = sales.filter((s) => s.date === dStr);
    const daySalesTotal = daySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const dayProfitTotal = daySales.reduce((sum, s) => sum + s.totalProfit, 0);
    return {
      date: dStr,
      label: dayLabel,
      sales: daySalesTotal,
      profit: dayProfitTotal,
    };
  });

  const maxChartValue = Math.max(
    ...last7Days.map((d) => (chartMode === 'sales' ? d.sales : d.profit)),
    500
  );

  const handlePrintSale = (sale: Sale) => {
    setPrintableDoc({
      type: 'sale',
      data: sale,
      format: settings.defaultInvoiceFormat || 'thermal',
    });
    printCurrentDoc();
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Sher Pharmacy Desk
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Date: {todayStr}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            Store Performance & Real-Time Overview
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-0.5">
            Monitor inventory health, sales velocity, profit margins, and expiry warnings across the dispensary.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentTab('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow transition-all cursor-pointer text-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale (POS)</span>
          </button>
          <button
            onClick={() => setCurrentTab('purchases')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 shadow-xs transition-all cursor-pointer text-xs"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Record Purchase</span>
          </button>
          <button
            onClick={() => setCurrentTab('medicines')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 shadow-xs transition-all cursor-pointer text-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* 10 Dashboard KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Medicines */}
        <div
          onClick={() => setCurrentTab('medicines')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Medicines</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totalMedicines}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active formulations</p>
        </div>

        {/* 2. Total Stock Quantity */}
        <div
          onClick={() => setCurrentTab('stock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Units</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totalStockQty}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Units in dispensary</p>
        </div>

        {/* 3. Today's Sales */}
        <div
          onClick={() => setCurrentTab('sales')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">
            {settings.currencySymbol} {todaySalesTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{todaySalesList.length} invoices generated</p>
        </div>

        {/* 4. Today's Purchases */}
        <div
          onClick={() => setCurrentTab('purchases')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Purchases</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {settings.currencySymbol} {todayPurchasesTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{todayPurchasesList.length} orders restocked</p>
        </div>

        {/* 5. Today's Profit */}
        <div
          onClick={() => setCurrentTab('profit')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Profit</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-teal-700">
            {settings.currencySymbol} {todayProfitTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Gross sales margin</p>
        </div>

        {/* 6. Total Customers */}
        <div
          onClick={() => setCurrentTab('customers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Customers</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totalCustomers}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Registered accounts</p>
        </div>

        {/* 7. Low Stock Medicines */}
        <div
          onClick={() => setCurrentTab('stock')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            lowStockMeds.length > 0
              ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Low Stock</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-900">{lowStockMeds.length}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Below reorder level</p>
        </div>

        {/* 8. Expiring Soon Medicines */}
        <div
          onClick={() => setCurrentTab('expiry')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            expiringSoonMeds.length > 0
              ? 'bg-orange-50/70 border-orange-200 hover:border-orange-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-900">Expiring Soon</span>
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-orange-900">{expiringSoonMeds.length}</div>
          <p className="text-[11px] text-orange-700 mt-0.5">Within {alertDays} days</p>
        </div>

        {/* 9. Expired Medicines */}
        <div
          onClick={() => setCurrentTab('expiry')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            expiredMeds.length > 0
              ? 'bg-rose-50/80 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">Expired</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Skull className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-900">{expiredMeds.length}</div>
          <p className="text-[11px] text-rose-700 mt-0.5">Disposal required</p>
        </div>

        {/* 10. Today's Expenses */}
        <div
          onClick={() => setCurrentTab('expenses')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Expense</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {settings.currencySymbol} {todayExpensesTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{todayExpensesList.length} payouts today</p>
        </div>
      </div>

      {/* Main Grid: Charts & Urgent Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sales & Profit Interactive SVG Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Last 7 Days Financial Trend</h3>
              <p className="text-xs text-slate-500">Visual comparison of daily billing and margins</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setChartMode('sales')}
                className={`px-3 py-1 rounded-md transition-all ${
                  chartMode === 'sales'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sales Trend
              </button>
              <button
                onClick={() => setChartMode('profit')}
                className={`px-3 py-1 rounded-md transition-all ${
                  chartMode === 'profit'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Profit Trend
              </button>
            </div>
          </div>

          {/* SVG Bar / Line Chart */}
          <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2">
            {last7Days.map((day, idx) => {
              const val = chartMode === 'sales' ? day.sales : day.profit;
              const heightPercent = maxChartValue > 0 ? Math.round((val / maxChartValue) * 82) + 6 : 6;
              const isToday = day.date === todayStr;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-sm">
                    {settings.currencySymbol} {val.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative ${
                      chartMode === 'sales'
                        ? isToday
                          ? 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                          : 'bg-emerald-400 group-hover:bg-emerald-500'
                        : isToday
                        ? 'bg-teal-700 shadow-md shadow-teal-700/30'
                        : 'bg-teal-500 group-hover:bg-teal-600'
                    }`}
                  />
                  <div className="text-center">
                    <span
                      className={`text-xs font-semibold block ${
                        isToday ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                      {day.date.slice(5)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Urgent Low Stock & Expiry Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Critical Stock Alerts
            </h3>
            <button
              onClick={() => setCurrentTab('stock')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
            >
              All Stock <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-72 flex-1 pr-1">
            {lowStockMeds.length === 0 && expiredMeds.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All medicines are in healthy stock and valid dates!
              </div>
            ) : (
              <>
                {expiredMeds.map((med) => (
                  <div
                    key={`exp-${med.id}`}
                    className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-rose-900">{med.name}</div>
                      <div className="text-[11px] text-rose-600">
                        Expired on: {med.expiryDate} (Batch: {med.batchNumber || 'N/A'})
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold rounded text-[10px]">
                      EXPIRED
                    </span>
                  </div>
                ))}

                {lowStockMeds.map((med) => (
                  <div
                    key={`low-${med.id}`}
                    className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-amber-900">{med.name}</div>
                      <div className="text-[11px] text-amber-700">
                        Rack: {med.rackShelf || 'Unassigned'} • Min: {med.minStock}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-900 text-sm">{med.quantity}</span>
                      <span className="text-[10px] text-amber-700 ml-1">left</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={() => setCurrentTab('purchases')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg text-center transition-colors"
            >
              Order Low Stock From Suppliers
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Sales Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Counter Sales Invoices</h3>
            <p className="text-xs text-slate-500">Latest completed dispensary transactions</p>
          </div>
          <button
            onClick={() => setCurrentTab('sales')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View All Sales <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Medicines</th>
                <th className="py-2.5 px-4 text-right">Grand Total</th>
                <th className="py-2.5 px-4 text-right">Profit</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No sales recorded yet. Click POS to make your first sale!
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {sale.date} {sale.time}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {sale.customerName || 'Walk-in Customer'}
                      {sale.customerPhone && (
                        <div className="text-[11px] text-slate-400">{sale.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {sale.items.map((i) => `${i.medicineName} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-right whitespace-nowrap">
                      {settings.currencySymbol} {sale.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700 text-right whitespace-nowrap">
                      +{settings.currencySymbol} {sale.totalProfit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.remainingAmount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sale.remainingAmount > 0 ? 'Partial Credit' : 'Paid Full'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handlePrintSale(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-md font-semibold text-xs transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

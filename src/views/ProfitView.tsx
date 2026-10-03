import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  CircleDollarSign,
  Download,
  Printer,
  Search,
  ArrowUpRight,
  Receipt,
  PieChart,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { downloadCSV } from '../utils/csv';

export const ProfitView: React.FC = () => {
  const { sales, settings, setPrintableDoc, printCurrentDoc } = useStore();

  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Weekly threshold (7 days ago)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Monthly threshold (current month)
  const currentMonthStr = todayStr.substring(0, 7);

  // 1. Today's Profit
  const todaySales = sales.filter((s) => s.date === todayStr);
  const todayProfit = todaySales.reduce((sum, s) => sum + s.totalProfit, 0);

  // 2. Weekly Profit
  const weeklySales = sales.filter((s) => s.date >= sevenDaysAgoStr && s.date <= todayStr);
  const weeklyProfit = weeklySales.reduce((sum, s) => sum + s.totalProfit, 0);

  // 3. Monthly Profit
  const monthlySales = sales.filter((s) => s.date.startsWith(currentMonthStr));
  const monthlyProfit = monthlySales.reduce((sum, s) => sum + s.totalProfit, 0);

  // 4. Total Profit
  const totalProfit = sales.reduce((sum, s) => sum + s.totalProfit, 0);

  // Filtered sales for detail table
  const filteredSales = sales.filter((s) => {
    if (dateFilter && s.date !== dateFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchInv = s.invoiceNumber.toLowerCase().includes(q);
      const matchCust = s.customerName.toLowerCase().includes(q);
      const matchItem = s.items.some((i) => i.medicineName.toLowerCase().includes(q));
      return matchInv || matchCust || matchItem;
    }
    return true;
  });

  // Calculate gross margin %
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const overallMarginPercent =
    totalSalesRevenue > 0 ? Math.round((totalProfit / totalSalesRevenue) * 100) : 0;

  const handleExportCSV = () => {
    const headers = [
      'Invoice #',
      'Date',
      'Customer',
      'Sale Amount',
      'Cost of Goods',
      'Discount Deducted',
      'Net Profit',
      'Margin %',
    ];

    const rows = filteredSales.map((s) => {
      const costOfGoods = s.grandTotal - s.totalProfit;
      const margin = s.grandTotal > 0 ? Math.round((s.totalProfit / s.grandTotal) * 100) : 0;
      return [
        s.invoiceNumber,
        s.date,
        s.customerName,
        s.grandTotal,
        costOfGoods,
        s.discountAmount,
        s.totalProfit,
        `${margin}%`,
      ];
    });

    downloadCSV('Sher_Medical_Store_Profit_Ledger', headers, rows);
  };

  const handlePrint = () => {
    setPrintableDoc({
      type: 'profit',
      data: {
        todayProfit,
        weeklyProfit,
        monthlyProfit,
        totalProfit,
        sales: filteredSales,
      },
      format: 'a4',
    });
    printCurrentDoc();
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Profit & Margins Intelligence
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Formula: Sale Price - Cost Price
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time profit tracking per prescription, batch margin realization, and historical net yield.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Profit Ledger</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Required KPI Cards: Today's, Weekly, Monthly, Total Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Today's Net Profit
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {settings.currencySymbol} {todayProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{todaySales.length} invoices cleared today</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Weekly Profit (Last 7 Days)
          </div>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {settings.currencySymbol} {weeklyProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{weeklySales.length} invoices in 7 days</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Monthly Profit ({currentMonthStr})
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {settings.currencySymbol} {monthlyProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{monthlySales.length} monthly transactions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Lifetime Profit
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {settings.currencySymbol} {totalProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
            Avg Margin: {overallMarginPercent}%
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, customer, sold medicine..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Profit Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Medicines Sold & Unit Costs</th>
                <th className="py-3 px-3 text-right">Gross Sale</th>
                <th className="py-3 px-3 text-right">Cost of Goods</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales records found for profit computation.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const costOfGoods = Math.max(0, sale.grandTotal - sale.totalProfit);
                  const marginPct =
                    sale.grandTotal > 0
                      ? Math.round((sale.totalProfit / sale.grandTotal) * 100)
                      : 0;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {sale.date}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {sale.customerName}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="space-y-0.5">
                          {sale.items.map((i, idx) => (
                            <div key={idx} className="text-[11px]">
                              <b>{i.medicineName}</b> ({i.quantity}x) • Cost: {settings.currencySymbol}
                              {i.purchasePrice} → Sale: {settings.currencySymbol}
                              {i.unitPrice} (+{settings.currencySymbol}
                              {i.profit})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-semibold whitespace-nowrap">
                        {settings.currencySymbol} {sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 whitespace-nowrap">
                        {settings.currencySymbol} {costOfGoods.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700 text-sm whitespace-nowrap">
                        +{settings.currencySymbol} {sale.totalProfit.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {marginPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

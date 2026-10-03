import React, { useState } from 'react';
import {
  FileBarChart2,
  Calendar,
  Printer,
  Download,
  Filter,
  DollarSign,
  Truck,
  Package,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { downloadCSV } from '../utils/csv';

export const ReportsView: React.FC = () => {
  const {
    sales,
    purchases,
    medicines,
    expenses,
    settings,
    setPrintableDoc,
    printCurrentDoc,
  } = useStore();

  const [activeReportTab, setActiveReportTab] = useState<
    'sales' | 'purchases' | 'stock' | 'financial'
  >('sales');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');

  // Filter Sales
  const filteredSales = sales.filter((s) => {
    if (startDate && s.date < startDate) return false;
    if (endDate && s.date > endDate) return false;
    return true;
  });

  // Filter Purchases
  const filteredPurchases = purchases.filter((p) => {
    if (startDate && p.date < startDate) return false;
    if (endDate && p.date > endDate) return false;
    if (supplierFilter !== 'all' && p.supplierName !== supplierFilter) return false;
    return true;
  });

  // Financial P&L Calculations
  const periodSales = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const periodPurchases = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const periodExpenses = expenses
    .filter((e) => (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate))
    .reduce((sum, e) => sum + e.amount, 0);

  const periodGrossProfit = filteredSales.reduce((sum, s) => sum + s.totalProfit, 0);
  const periodNetProfit = periodGrossProfit - periodExpenses;

  // Print Handlers
  const handlePrint = () => {
    setPrintableDoc({
      type: 'report',
      data: {
        reportType: activeReportTab,
        startDate: startDate || 'All Time',
        endDate: endDate || 'Present',
        sales: filteredSales,
        purchases: filteredPurchases,
        medicines,
        financial: {
          periodSales,
          periodPurchases,
          periodExpenses,
          periodGrossProfit,
          periodNetProfit,
        },
      },
      format: 'a4',
    });
    printCurrentDoc();
  };

  const handleExportCSV = () => {
    if (activeReportTab === 'sales') {
      const headers = ['Invoice #', 'Date', 'Customer', 'Items Count', 'Grand Total', 'Profit'];
      const rows = filteredSales.map((s) => [
        s.invoiceNumber,
        s.date,
        s.customerName,
        s.items.reduce((sum, i) => sum + i.quantity, 0),
        s.grandTotal,
        s.totalProfit,
      ]);
      downloadCSV('Sher_Medical_Store_Sales_Report', headers, rows);
    } else if (activeReportTab === 'purchases') {
      const headers = ['Invoice #', 'Date', 'Supplier', 'Medicine', 'Qty', 'Total Amount'];
      const rows = filteredPurchases.map((p) => [
        p.invoiceNumber,
        p.date,
        p.supplierName,
        p.medicineName,
        p.quantity,
        p.totalAmount,
      ]);
      downloadCSV('Sher_Medical_Store_Purchases_Report', headers, rows);
    } else if (activeReportTab === 'financial') {
      const headers = ['Metric', 'Amount'];
      const rows = [
        ['Total Sales Billing', `${settings.currencySymbol} ${periodSales}`],
        ['Total Purchases Inward', `${settings.currencySymbol} ${periodPurchases}`],
        ['Gross Trading Profit', `${settings.currencySymbol} ${periodGrossProfit}`],
        ['Store Operating Expenses', `${settings.currencySymbol} ${periodExpenses}`],
        ['Net Bottom-Line Profit', `${settings.currencySymbol} ${periodNetProfit}`],
      ];
      downloadCSV('Sher_Medical_Store_Financial_Statement', headers, rows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Executive Business Reports & Audits
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Comprehensive Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Generate printable audit trails, P&L statements, and supplier purchase distributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Report</span>
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

      {/* Tabs and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Tab selection */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: 'sales', label: 'Sales Reports' },
            { id: 'purchases', label: 'Purchase Reports' },
            { id: 'financial', label: 'Financial Profit & Loss (P&L)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReportTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Range Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-slate-400 hover:text-slate-700 underline"
          >
            Clear Date Filter
          </button>
        </div>
      </div>

      {/* Report Content Panels */}
      {activeReportTab === 'financial' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 text-center">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              Statement of Profit or Loss (Income Statement)
            </h3>
            <p className="text-xs text-slate-500">
              For period: {startDate || 'Commencement'} to {endDate || 'Present'}
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Gross Sales Revenue:</span>
              <span className="font-bold text-slate-900">
                {settings.currencySymbol} {periodSales.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">
                Cost of Goods Sold (Purchases Incurred):
              </span>
              <span className="font-bold text-slate-900">
                ({settings.currencySymbol} {periodPurchases.toLocaleString()})
              </span>
            </div>

            <div className="flex justify-between py-2.5 bg-emerald-50 px-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-900">Gross Margin from Sales:</span>
              <span className="font-black text-emerald-800 text-base">
                +{settings.currencySymbol} {periodGrossProfit.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">
                Operating Expenses (Salaries, Rent, Bills):
              </span>
              <span className="font-bold text-rose-700">
                -{settings.currencySymbol} {periodExpenses.toLocaleString()}
              </span>
            </div>

            <div
              className={`flex justify-between py-3 px-4 rounded-xl border ${
                periodNetProfit >= 0
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-rose-600 text-white border-rose-700'
              }`}
            >
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80 font-bold">
                  Net Bottom-Line Profit
                </div>
                <div className="text-2xl font-black">
                  {settings.currencySymbol} {periodNetProfit.toLocaleString()}
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-md self-center">
                {periodNetProfit >= 0 ? 'Profitable' : 'Deficit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-xs font-bold text-slate-800">
              Period Sales Ledger ({filteredSales.length} Transactions)
            </span>
            <span className="text-xs font-bold text-emerald-700">
              Total: {settings.currencySymbol} {periodSales.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5 text-right">Items Sold</th>
                  <th className="p-2.5 text-right">Total Bill</th>
                  <th className="p-2.5 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold">{s.invoiceNumber}</td>
                    <td className="p-2.5 text-slate-600">{s.date}</td>
                    <td className="p-2.5 font-medium">{s.customerName}</td>
                    <td className="p-2.5 text-right">{s.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {settings.currencySymbol} {s.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-700">
                      +{settings.currencySymbol} {s.totalProfit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'purchases' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-xs font-bold text-slate-800">
              Supplier Purchases Ledger ({filteredPurchases.length} Orders)
            </span>
            <span className="text-xs font-bold text-slate-900">
              Total Inward: {settings.currencySymbol} {periodPurchases.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Purchase Invoice</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Supplier Agency</th>
                  <th className="p-2.5">Medicine</th>
                  <th className="p-2.5 text-center">Qty Received</th>
                  <th className="p-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold">{p.invoiceNumber}</td>
                    <td className="p-2.5 text-slate-600">{p.date}</td>
                    <td className="p-2.5 font-medium">{p.supplierName}</td>
                    <td className="p-2.5">{p.medicineName}</td>
                    <td className="p-2.5 text-center font-bold">+{p.quantity}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {settings.currencySymbol} {p.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

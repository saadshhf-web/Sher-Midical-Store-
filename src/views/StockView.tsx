import React, { useState } from 'react';
import {
  PackageSearch,
  Search,
  Filter,
  Download,
  Printer,
  AlertTriangle,
  Package,
  CircleDollarSign,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Medicine } from '../types';
import { downloadCSV } from '../utils/csv';

export const StockView: React.FC = () => {
  const { medicines, settings, setPrintableDoc, printCurrentDoc } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const now = new Date();
  const alertDays = settings.expiryAlertDays || 60;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + alertDays);

  const getStatus = (med: Medicine) => {
    if (med.expiryDate && new Date(med.expiryDate) < now) return 'Expired';
    if (med.quantity <= 0) return 'Out of Stock';
    if (med.quantity <= (med.minStock || settings.minStockDefault)) return 'Low Stock';
    if (med.expiryDate && new Date(med.expiryDate) <= thresholdDate) return 'Expiring Soon';
    return 'In Stock';
  };

  const filteredMedicines = medicines.filter((med) => {
    const status = getStatus(med);
    if (selectedStatus !== 'all' && status !== selectedStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        med.name.toLowerCase().includes(q) ||
        med.genericName.toLowerCase().includes(q) ||
        med.company.toLowerCase().includes(q) ||
        med.batchNumber.toLowerCase().includes(q) ||
        med.barcode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stock summary valuations
  const totalCostValuation = medicines.reduce(
    (sum, m) => sum + (m.quantity || 0) * (m.purchasePrice || 0),
    0
  );
  const totalRetailValuation = medicines.reduce(
    (sum, m) => sum + (m.quantity || 0) * (m.salePrice || 0),
    0
  );
  const potentialProfit = Math.max(0, totalRetailValuation - totalCostValuation);

  const outOfStockCount = medicines.filter((m) => m.quantity <= 0).length;
  const lowStockCount = medicines.filter(
    (m) => m.quantity > 0 && m.quantity <= (m.minStock || settings.minStockDefault)
  ).length;

  const handleExportCSV = () => {
    const headers = [
      'Medicine',
      'Batch',
      'Shelf / Rack',
      'Quantity',
      'Min Stock',
      'Cost Price',
      'Retail Price',
      'Total Stock Value',
      'Expiry Date',
      'Status',
    ];

    const rows = filteredMedicines.map((m) => {
      const status = getStatus(m);
      return [
        m.name,
        m.batchNumber,
        m.rackShelf || '—',
        m.quantity,
        m.minStock,
        m.purchasePrice,
        m.salePrice,
        m.quantity * m.purchasePrice,
        m.expiryDate,
        status,
      ];
    });

    downloadCSV('Sher_Medical_Store_Stock_Inventory', headers, rows);
  };

  const handlePrintStock = () => {
    setPrintableDoc({
      type: 'stock',
      data: filteredMedicines,
      format: 'a4',
    });
    printCurrentDoc();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Valuation Cards */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Stock Valuation & Inventory Audit
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {medicines.length} Medicines Cataloged
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time stock valuation based on cost price vs potential retail selling price.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintStock}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Stock Report</span>
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

      {/* Stock KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Inventory Cost Value
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {settings.currencySymbol} {totalCostValuation.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Purchased capital invested</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Potential Retail Value
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">
            {settings.currencySymbol} {totalRetailValuation.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Full realization sales</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Projected Profit
          </div>
          <div className="text-xl font-black text-teal-700 mt-1">
            +{settings.currencySymbol} {potentialProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Potential gross margin</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Low / Out of Stock Items
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">
            {lowStockCount} Low / {outOfStockCount} Out
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Requires reorder action</p>
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
            placeholder="Search medicine name, barcode, shelf location..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="In Stock">In Stock (Healthy)</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Medicine & Generic</th>
                <th className="py-3 px-3">Batch</th>
                <th className="py-3 px-3">Shelf</th>
                <th className="py-3 px-3 text-center">Qty Available</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Sale Price</th>
                <th className="py-3 px-3 text-right">Stock Cost Value</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No medicines match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const status = getStatus(med);
                  const itemStockValue = (med.quantity || 0) * (med.purchasePrice || 0);

                  return (
                    <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {med.genericName}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {med.batchNumber || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        {med.rackShelf || '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-sm">
                        <span
                          className={
                            med.quantity <= 0
                              ? 'text-rose-600'
                              : med.quantity <= (med.minStock || settings.minStockDefault)
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }
                        >
                          {med.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Min: {med.minStock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {settings.currencySymbol} {med.purchasePrice}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-800">
                        {settings.currencySymbol} {med.salePrice}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        {settings.currencySymbol} {itemStockValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={
                            status === 'Expired'
                              ? 'font-bold text-rose-600'
                              : status === 'Expiring Soon'
                              ? 'font-bold text-orange-600'
                              : 'text-slate-600'
                          }
                        >
                          {med.expiryDate || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'Out of Stock'
                              ? 'bg-slate-200 text-slate-700'
                              : status === 'Expiring Soon'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {status}
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

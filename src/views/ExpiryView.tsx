import React, { useState } from 'react';
import {
  CalendarX,
  AlertTriangle,
  Skull,
  Calendar,
  Printer,
  Download,
  Trash2,
  Undo2,
  CheckCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Medicine } from '../types';
import { downloadCSV } from '../utils/csv';

export const ExpiryView: React.FC = () => {
  const {
    medicines,
    settings,
    adjustStock,
    setPrintableDoc,
    printCurrentDoc,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'expired' | 'soon'>('expired');
  const [soonDays, setSoonDays] = useState<30 | 60 | 90>(
    (settings.expiryAlertDays as 30 | 60 | 90) || 60
  );

  const now = new Date();

  // Expired medicines
  const expiredMedicines = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    return new Date(m.expiryDate) < now;
  });

  // Expiring soon threshold
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + soonDays);

  const expiringSoonMedicines = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    const exp = new Date(m.expiryDate);
    return exp >= now && exp <= thresholdDate;
  });

  const displayedList = activeTab === 'expired' ? expiredMedicines : expiringSoonMedicines;

  const totalExpiredValue = expiredMedicines.reduce(
    (sum, m) => sum + (m.quantity || 0) * (m.purchasePrice || 0),
    0
  );

  const totalExpiringSoonValue = expiringSoonMedicines.reduce(
    (sum, m) => sum + (m.quantity || 0) * (m.purchasePrice || 0),
    0
  );

  const handleDisposeStock = async (med: Medicine) => {
    if (med.quantity <= 0) return;
    if (
      window.confirm(
        `Are you sure you want to dispose all ${med.quantity} expired units of "${med.name}"?`
      )
    ) {
      await adjustStock(med.id, -med.quantity, 'Expired batch discarded');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Medicine',
      'Generic',
      'Batch Number',
      'Company',
      'Shelf Location',
      'Quantity',
      'Unit Cost',
      'Loss / Stock Value',
      'Expiry Date',
      'Days Status',
    ];

    const rows = displayedList.map((m) => {
      const exp = new Date(m.expiryDate);
      const diffTime = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return [
        m.name,
        m.genericName,
        m.batchNumber,
        m.company,
        m.rackShelf || '—',
        m.quantity,
        m.purchasePrice,
        m.quantity * m.purchasePrice,
        m.expiryDate,
        diffDays < 0 ? `Expired ${Math.abs(diffDays)} days ago` : `Expires in ${diffDays} days`,
      ];
    });

    downloadCSV(`Sher_Medical_Store_Expiry_${activeTab}`, headers, rows);
  };

  const handlePrint = () => {
    setPrintableDoc({
      type: 'expiry',
      data: {
        type: activeTab,
        items: displayedList,
        soonDays,
      },
      format: 'a4',
    });
    printCurrentDoc();
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Expiry Alerts & Disposal Registry
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                expiredMedicines.length > 0
                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {expiredMedicines.length} Expired Batches
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Prevent dispensing expired drugs, plan returns to distributors, and quarantine damaged stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Expiry Report</span>
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

      {/* Summary Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Expired Medicines Cost Loss
            </div>
            <div className="text-2xl font-black text-rose-900 mt-0.5">
              {settings.currencySymbol} {totalExpiredValue.toLocaleString()}
            </div>
            <p className="text-xs text-rose-700 mt-0.5">
              {expiredMedicines.length} formulations require immediate quarantine
            </p>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <Skull className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/70 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
              Expiring Soon Value (Next {soonDays} Days)
            </div>
            <div className="text-2xl font-black text-orange-900 mt-0.5">
              {settings.currencySymbol} {totalExpiringSoonValue.toLocaleString()}
            </div>
            <p className="text-xs text-orange-700 mt-0.5">
              {expiringSoonMedicines.length} formulations approaching expiry
            </p>
          </div>
          <div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
            <CalendarX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Segmented Control Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-4 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expired ({expiredMedicines.length})
          </button>
          <button
            onClick={() => setActiveTab('soon')}
            className={`px-4 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'soon'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expiring Soon ({expiringSoonMedicines.length})
          </button>
        </div>

        {activeTab === 'soon' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Alert Horizon:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              {([30, 60, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setSoonDays(days)}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    soonDays === days
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Medicine & Generic</th>
                <th className="py-3 px-3">Batch #</th>
                <th className="py-3 px-3">Shelf Location</th>
                <th className="py-3 px-3 text-center">Units in Stock</th>
                <th className="py-3 px-3 text-right">Unit Cost</th>
                <th className="py-3 px-3 text-right">Stock At Risk</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    {activeTab === 'expired'
                      ? 'Great news! No expired medicines in your inventory.'
                      : `No medicines expiring in the next ${soonDays} days.`}
                  </td>
                </tr>
              ) : (
                displayedList.map((med) => {
                  const exp = new Date(med.expiryDate);
                  const diffTime = exp.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const lossValue = (med.quantity || 0) * (med.purchasePrice || 0);

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
                      <td className="py-3 px-3 text-center font-black text-sm text-slate-900">
                        {med.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {settings.currencySymbol} {med.purchasePrice}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-700 text-sm">
                        {settings.currencySymbol} {lossValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {med.expiryDate}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'expired'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {diffDays < 0
                            ? `Expired (${Math.abs(diffDays)}d ago)`
                            : `In ${diffDays} days`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {activeTab === 'expired' ? (
                          <button
                            onClick={() => handleDisposeStock(med)}
                            disabled={med.quantity <= 0}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                              med.quantity <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                            }`}
                          >
                            Dispose Stock
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Promote First</span>
                        )}
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

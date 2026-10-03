import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  FileJson,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreDB } from '../services/db';
import { downloadCSV } from '../utils/csv';

export const BackupRestoreView: React.FC = () => {
  const {
    medicines,
    sales,
    purchases,
    customers,
    suppliers,
    expenses,
    settings,
    refreshAllData,
    showToast,
  } = useStore();

  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup Data to JSON
  const handleBackupData = async () => {
    try {
      const jsonStr = await StoreDB.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Sher_Medical_Store_Complete_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Database backup exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create backup file.', 'error');
    }
  };

  // Restore Data from JSON
  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      'WARNING: Restoring from this backup will overwrite your current medicines, sales, purchases, and settings with the file data. Are you sure you want to proceed?'
    );
    if (!confirmRestore) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const text = await file.text();
      await StoreDB.importBackupJSON(text);
      await refreshAllData();
      showToast('Database restored successfully! Application reloaded.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Restore failed: ${err.message || 'Invalid backup file'}`, 'error');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Offline Database Backup & Full Recovery
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              IndexedDB Storage Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Export complete dispensary inventory, historical invoices, and store branding to an encrypted JSON offline file.
          </p>
        </div>

        <button
          onClick={refreshAllData}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync State</span>
        </button>
      </div>

      {/* Main Backup and Restore Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Backup Complete Database
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Downloads a single consolidated JSON archive containing all medicines, batches,
              sales invoices, customer records, supplier accounts, operating expenses, settings, and
              the uploaded store logo.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Medicines cataloged:</span>
              <span className="font-bold text-slate-900">{medicines.length}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales invoices stored:</span>
              <span className="font-bold text-slate-900">{sales.length}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Purchase orders stored:</span>
              <span className="font-bold text-slate-900">{purchases.length}</span>
            </div>
          </div>

          <button
            onClick={handleBackupData}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>BACKUP DATA</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Restore Database from File
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select a previously exported JSON backup file to instantly restore your dispensary
              records. Works seamlessly when migrating to a new laptop or after reinstalling the
              browser.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Restoring replaces all current data with the backup snapshot. Back up your existing data
              first if needed!
            </span>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isRestoring ? 'Restoring Database...' : 'SELECT BACKUP FILE & RESTORE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Individual Tables Export Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Individual Entity Spreadsheets (CSV)
        </h4>
        <p className="text-xs text-slate-500">
          Export raw comma-separated values compatible with Microsoft Excel, Google Sheets, and LibreOffice.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
          {[
            {
              label: 'Medicines',
              action: () => {
                const headers = ['ID', 'Barcode', 'Name', 'Generic', 'Company', 'Qty', 'Buy', 'Sale', 'Expiry'];
                const rows = medicines.map((m) => [m.id, m.barcode, m.name, m.genericName, m.company, m.quantity, m.purchasePrice, m.salePrice, m.expiryDate]);
                downloadCSV('Medicines_Export', headers, rows);
              },
            },
            {
              label: 'Sales Records',
              action: () => {
                const headers = ['Invoice', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Profit'];
                const rows = sales.map((s) => [s.invoiceNumber, s.date, s.customerName, s.items.length, s.grandTotal, s.paidAmount, s.totalProfit]);
                downloadCSV('Sales_Export', headers, rows);
              },
            },
            {
              label: 'Purchases',
              action: () => {
                const headers = ['Invoice', 'Date', 'Supplier', 'Medicine', 'Qty', 'Total'];
                const rows = purchases.map((p) => [p.invoiceNumber, p.date, p.supplierName, p.medicineName, p.quantity, p.totalAmount]);
                downloadCSV('Purchases_Export', headers, rows);
              },
            },
            {
              label: 'Customers',
              action: () => {
                const headers = ['ID', 'Name', 'Phone', 'Address', 'Balance'];
                const rows = customers.map((c) => [c.id, c.name, c.phone, c.address, c.previousBalance]);
                downloadCSV('Customers_Export', headers, rows);
              },
            },
            {
              label: 'Suppliers',
              action: () => {
                const headers = ['ID', 'Name', 'Company', 'Phone', 'Address', 'Balance'];
                const rows = suppliers.map((s) => [s.id, s.name, s.company, s.phone, s.address, s.previousBalance]);
                downloadCSV('Suppliers_Export', headers, rows);
              },
            },
            {
              label: 'Expenses',
              action: () => {
                const headers = ['ID', 'Date', 'Category', 'Description', 'Amount'];
                const rows = expenses.map((e) => [e.id, e.date, e.category, e.description, e.amount]);
                downloadCSV('Expenses_Export', headers, rows);
              },
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

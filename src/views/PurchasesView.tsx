import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Printer,
  Download,
  Trash2,
  Calendar,
  Building2,
  CheckCircle,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Purchase } from '../types';
import { downloadCSV } from '../utils/csv';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    medicines,
    suppliers,
    settings,
    addPurchase,
    deletePurchase,
    setPrintableDoc,
    printCurrentDoc,
    showToast,
    setCurrentTab,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    supplierId: '',
    medicineId: '',
    medicineName: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 10,
    purchasePrice: 0,
    notes: '',
  });

  const handleOpenNew = () => {
    if (medicines.length === 0) {
      showToast('Please add at least one medicine in Medicine Management first to record purchases.', 'warning');
      setCurrentTab('medicines');
      return;
    }
    const defaultMed = medicines[0];
    const defaultSupp = suppliers[0];
    setFormData({
      invoiceNumber: `PINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      supplierName: defaultSupp ? defaultSupp.name : '',
      supplierId: defaultSupp ? defaultSupp.id : '',
      medicineId: defaultMed ? defaultMed.id : '',
      medicineName: defaultMed ? defaultMed.name : '',
      batchNumber: defaultMed?.batchNumber || `BT-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: defaultMed?.expiryDate || '',
      quantity: 10,
      purchasePrice: defaultMed?.purchasePrice || 0,
      notes: '',
    });
    setIsNewPurchaseOpen(true);
  };

  const handleMedicineSelect = (medId: string) => {
    const med = medicines.find((m) => m.id === medId);
    if (med) {
      setFormData((prev) => ({
        ...prev,
        medicineId: med.id,
        medicineName: med.name,
        batchNumber: med.batchNumber || prev.batchNumber,
        expiryDate: med.expiryDate || prev.expiryDate,
        purchasePrice: med.purchasePrice || prev.purchasePrice,
      }));
    }
  };

  const handleSupplierSelect = (suppId: string) => {
    const supp = suppliers.find((s) => s.id === suppId);
    if (supp) {
      setFormData((prev) => ({
        ...prev,
        supplierId: supp.id,
        supplierName: supp.name,
      }));
    }
  };

  const calculatedTotal = (formData.quantity || 0) * (formData.purchasePrice || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineId || formData.quantity <= 0) return;

    await addPurchase({
      invoiceNumber: formData.invoiceNumber,
      date: formData.date,
      supplierId: formData.supplierId,
      supplierName: formData.supplierName,
      medicineId: formData.medicineId,
      medicineName: formData.medicineName,
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      quantity: formData.quantity,
      purchasePrice: formData.purchasePrice,
      totalAmount: calculatedTotal,
      notes: formData.notes,
    });

    setIsNewPurchaseOpen(false);
  };

  const filteredPurchases = purchases.filter((p) => {
    if (selectedSupplierFilter !== 'all' && p.supplierName !== selectedSupplierFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.medicineName.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.batchNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Purchase ID',
      'Invoice Number',
      'Date',
      'Supplier',
      'Medicine',
      'Batch Number',
      'Expiry Date',
      'Quantity',
      'Purchase Price',
      'Total Amount',
      'Notes',
    ];

    const rows = filteredPurchases.map((p) => [
      p.id,
      p.invoiceNumber,
      p.date,
      p.supplierName,
      p.medicineName,
      p.batchNumber,
      p.expiryDate,
      p.quantity,
      p.purchasePrice,
      p.totalAmount,
      p.notes || '',
    ]);

    downloadCSV('Sher_Medical_Store_Purchases', headers, rows);
  };

  const handlePrintPurchase = (purchase: Purchase) => {
    setPrintableDoc({
      type: 'purchase',
      data: purchase,
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
              Supplier Purchase & Inward Restock
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {purchases.length} Purchase Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Purchases automatically credit inventory quantity and adjust cost prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Purchase</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, supplier, medicine or batch..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Medicine Restocked</th>
                <th className="py-3 px-3">Batch & Expiry</th>
                <th className="py-3 px-3 text-center">Qty Received</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No purchase records found. Record a purchase to restock medicines!
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {pur.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {pur.date}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {pur.supplierName || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{pur.medicineName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pur.medicineId}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      <div>{pur.batchNumber || '—'}</div>
                      <div className="text-slate-400 text-[10px]">Exp: {pur.expiryDate || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 text-sm">
                      +{pur.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                      {settings.currencySymbol} {pur.purchasePrice}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                      {settings.currencySymbol} {pur.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrintPurchase(pur)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                          title="Print Purchase Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(pur.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* New Purchase Modal */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Record Inward Stock Purchase
                </h3>
                <p className="text-xs text-slate-500">
                  Stock quantity will be added automatically to the selected medicine
                </p>
              </div>
              <button
                onClick={() => setIsNewPurchaseOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Purchase Invoice # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNumber: e.target.value })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company || 'Pharma'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Medicine To Restock *
                  </label>
                  <select
                    required
                    value={formData.medicineId}
                    onChange={(e) => handleMedicineSelect(e.target.value)}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="">-- Choose Medicine --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stock: {m.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, batchNumber: e.target.value })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Purchase Price per Unit ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Automatic Total Calculation Display */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">
                    Automatic Total Amount
                  </div>
                  <div className="text-xl font-black text-emerald-900">
                    {formData.quantity} units × {settings.currencySymbol}{' '}
                    {formData.purchasePrice} = {settings.currencySymbol}{' '}
                    {calculatedTotal.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                  Stock Auto-Increases
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. 15 days credit terms, delivered by van"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Purchase & Increase Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-900">Delete Purchase Record?</h3>
            <p className="text-xs text-slate-500">
              Do you want to delete this purchase invoice and also revert the added medicine stock?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deletePurchase(deleteConfirmId, true);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Delete & Revert Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

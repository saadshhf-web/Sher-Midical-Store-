import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Download,
  Truck,
  Eye,
  CheckCircle,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Supplier } from '../types';
import { downloadCSV } from '../utils/csv';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    purchases,
    settings,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedHistorySupplier, setSelectedHistorySupplier] = useState<Supplier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    email: '',
    previousBalance: 0,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      address: '',
      email: '',
      previousBalance: 0,
      notes: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      company: s.company || '',
      phone: s.phone || '',
      address: s.address || '',
      email: s.email || '',
      previousBalance: s.previousBalance || 0,
      notes: s.notes || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, formData);
    } else {
      await addSupplier(formData);
    }
    setIsAddEditOpen(false);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    }
    return true;
  });

  const totalSupplierPayable = suppliers.reduce(
    (sum, s) => sum + (s.previousBalance || 0),
    0
  );

  const handleExportCSV = () => {
    const headers = [
      'Supplier ID',
      'Name',
      'Company',
      'Phone',
      'Address',
      'Email',
      'Payable Balance',
      'Notes',
    ];
    const rows = filteredSuppliers.map((s) => [
      s.id,
      s.name,
      s.company,
      s.phone,
      s.address,
      s.email,
      s.previousBalance,
      s.notes || '',
    ]);
    downloadCSV('Sher_Medical_Store_Suppliers', headers, rows);
  };

  const supplierPurchases = selectedHistorySupplier
    ? purchases.filter(
        (p) =>
          p.supplierId === selectedHistorySupplier.id ||
          p.supplierName.toLowerCase() === selectedHistorySupplier.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Pharma Distributors & Suppliers
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {suppliers.length} Distributors
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage distributor agencies, supply credit balances, and delivery terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500">Total Supplier Payable: </span>
            <span className="font-extrabold text-slate-900">
              {settings.currencySymbol} {totalSupplierPayable.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by supplier name, company (e.g. GSK, Abbott), phone..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Supplier ID</th>
                <th className="py-3 px-3">Supplier Name & Company</th>
                <th className="py-3 px-3">Contact Phone</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-3 text-right">Payable Balance</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No suppliers found. Click Add Supplier to create one!
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supp) => (
                  <tr key={supp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {supp.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-sm">{supp.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {supp.company || 'Pharmaceutical Agency'}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {supp.phone || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {supp.email || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {supp.address || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                      {supp.previousBalance > 0 ? (
                        <span className="text-rose-700">
                          {settings.currencySymbol} {supp.previousBalance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Paid Up</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedHistorySupplier(supp)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 rounded hover:bg-slate-100 transition-colors"
                          title="View Inward Purchases"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(supp)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(supp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Supplier"
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

      {/* Add / Edit Supplier Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Distributor / Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. GSK Distribution Network"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Parent Pharmaceutical Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. GlaxoSmithKline Pakistan"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="042-35800000"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@distributor.com"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Warehouse Depot</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Industrial Area, Multan Road, Lahore"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payable Outstanding Balance ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.previousBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, previousBalance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Terms / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Orders delivered every Tuesday, 15 days credit"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Purchases History Modal */}
      {selectedHistorySupplier && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Purchase History: {selectedHistorySupplier.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Orders: {supplierPurchases.length} • Current Balance Payable:{' '}
                  <span className="font-bold text-rose-700">
                    {settings.currencySymbol} {selectedHistorySupplier.previousBalance}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedHistorySupplier(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-72 border border-slate-200 rounded-lg">
              {supplierPurchases.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No purchase records for this supplier yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Medicine</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPurchases.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 font-mono font-bold text-slate-800">
                          {p.invoiceNumber}
                        </td>
                        <td className="p-2 text-slate-600">{p.date}</td>
                        <td className="p-2 font-medium text-slate-900">{p.medicineName}</td>
                        <td className="p-2 text-center">+{p.quantity}</td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {settings.currencySymbol} {p.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button
              onClick={() => setSelectedHistorySupplier(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-900">Delete Supplier Record?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this distributor account?
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
                  await deleteSupplier(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

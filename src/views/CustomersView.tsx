import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Download,
  Receipt,
  Eye,
  CheckCircle,
  X,
  CreditCard,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Customer } from '../types';
import { downloadCSV } from '../utils/csv';

export const CustomersView: React.FC = () => {
  const {
    customers,
    sales,
    settings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setCurrentTab,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    previousBalance: 0,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      previousBalance: 0,
      notes: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      previousBalance: c.previousBalance || 0,
      notes: c.notes || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }
    setIsAddEditOpen(false);
  };

  const filteredCustomers = customers.filter((c) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalOutstandingBalance = customers.reduce(
    (sum, c) => sum + (c.previousBalance || 0),
    0
  );

  const handleExportCSV = () => {
    const headers = ['Customer ID', 'Name', 'Phone', 'Address', 'Balance Due', 'Notes'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.address,
      c.previousBalance,
      c.notes || '',
    ]);
    downloadCSV('Sher_Medical_Store_Customers', headers, rows);
  };

  // Get sales for selected history customer
  const customerSales = selectedHistoryCustomer
    ? sales.filter(
        (s) =>
          s.customerId === selectedHistoryCustomer.id ||
          s.customerName.toLowerCase() === selectedHistoryCustomer.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Customer Accounts & Ledger
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              {customers.length} Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage patient records, credit balances, and lifetime purchase receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500">Total Credit Due: </span>
            <span className="font-extrabold text-amber-700">
              {settings.currencySymbol} {totalOutstandingBalance.toLocaleString()}
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
            <span>Add Customer</span>
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
            placeholder="Search by customer name, phone number, address..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Customer ID</th>
                <th className="py-3 px-3">Patient / Customer Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-3 text-right">Credit Balance</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found. Add your first regular patient or doctor account!
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {cust.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {cust.phone || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {cust.address || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-sm whitespace-nowrap">
                      {cust.previousBalance > 0 ? (
                        <span className="text-amber-700">
                          {settings.currencySymbol} {cust.previousBalance.toLocaleString()} Due
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Clear (Rs. 0)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[11px]">
                      {cust.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedHistoryCustomer(cust)}
                          className="p-1.5 text-slate-400 hover:text-purple-700 rounded hover:bg-slate-100 transition-colors"
                          title="View Invoices History"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(cust.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Customer"
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

      {/* Add / Edit Customer Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Tariq Mahmood"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone (WhatsApp Compatible)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="03001234567"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House 14, Main Road, Lahore"
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Previous Balance / Credit ({settings.currencySymbol})
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
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Monthly insulin prescription patient, 5% doctor discount"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {selectedHistoryCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Purchase History: {selectedHistoryCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Phone: {selectedHistoryCustomer.phone || 'N/A'} • Outstanding Balance:{' '}
                  <span className="font-bold text-amber-700">
                    {settings.currencySymbol} {selectedHistoryCustomer.previousBalance}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-72 border border-slate-200 rounded-lg">
              {customerSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No invoices recorded for this customer yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Paid</th>
                      <th className="p-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerSales.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2 font-mono font-bold text-slate-800">
                          {s.invoiceNumber}
                        </td>
                        <td className="p-2 text-slate-600">{s.date}</td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {settings.currencySymbol} {s.grandTotal}
                        </td>
                        <td className="p-2 text-right text-slate-600">
                          {settings.currencySymbol} {s.paidAmount}
                        </td>
                        <td className="p-2 text-right text-amber-700 font-bold">
                          {s.remainingAmount > 0
                            ? `${settings.currencySymbol} ${s.remainingAmount}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button
              onClick={() => setSelectedHistoryCustomer(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-900">Delete Customer?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove this customer record? Historical sales invoices will remain intact.
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
                  await deleteCustomer(deleteConfirmId);
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

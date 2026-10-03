import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Download,
  Trash2,
  Share2,
  Calendar,
  Eye,
  CheckCircle,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Sale } from '../types';
import { downloadCSV } from '../utils/csv';

export const SalesHistoryView: React.FC = () => {
  const {
    sales,
    settings,
    deleteSale,
    setPrintableDoc,
    printCurrentDoc,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredSales = sales.filter((s) => {
    if (selectedDateFilter && s.date !== selectedDateFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchInvoice = s.invoiceNumber.toLowerCase().includes(q);
      const matchCustomer = s.customerName.toLowerCase().includes(q);
      const matchItem = s.items.some((i) => i.medicineName.toLowerCase().includes(q));
      return matchInvoice || matchCustomer || matchItem;
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.totalProfit, 0);

  const handlePrint = (sale: Sale, format: 'a4' | 'thermal') => {
    setPrintableDoc({
      type: 'sale',
      data: sale,
      format,
    });
    printCurrentDoc();
  };

  const handleWhatsApp = (sale: Sale) => {
    const phone = (sale.customerPhone || '').replace(/\D/g, '');
    const itemsList = sale.items
      .map((item) => `• ${item.medicineName} x ${item.quantity} = ${settings.currencySymbol} ${item.total}`)
      .join('%0A');

    const message = `*${settings.storeName || 'SHER MEDICAL STORE'}*%0A*Invoice No:* ${sale.invoiceNumber}%0A*Date:* ${sale.date} ${sale.time}%0A%0A*Customer:* ${sale.customerName}%0A*Phone:* ${sale.customerPhone || 'N/A'}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total:* ${settings.currencySymbol} ${sale.grandTotal}%0A*Paid:* ${settings.currencySymbol} ${sale.paidAmount}%0A*Remaining:* ${settings.currencySymbol} ${sale.remainingAmount}%0A%0AThank you for shopping with us!%0A_Wish you good health._`;

    const cleanPhone = phone.startsWith('0')
      ? '92' + phone.substring(1)
      : phone.startsWith('92')
      ? phone
      : '92' + phone;

    const url = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice #',
      'Date',
      'Time',
      'Customer',
      'Phone',
      'Items Count',
      'Subtotal',
      'Discount',
      'Grand Total',
      'Paid',
      'Remaining / Due',
      'Profit',
      'Payment Method',
    ];

    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      s.date,
      s.time,
      s.customerName,
      s.customerPhone,
      s.items.reduce((acc, i) => acc + i.quantity, 0),
      s.subtotal,
      s.discountAmount,
      s.grandTotal,
      s.paidAmount,
      s.remainingAmount,
      s.totalProfit,
      s.paymentMethod,
    ]);

    downloadCSV('Sher_Medical_Store_Sales_Record', headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header & Metric Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Sales Ledger & Invoices
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {filteredSales.length} Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500">
            View customer bills, reprints, WhatsApp links, and profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500">Filtered Revenue: </span>
            <span className="font-extrabold text-slate-900">
              {settings.currencySymbol} {totalRevenue.toLocaleString()}
            </span>
            <span className="text-emerald-700 font-bold ml-2">
              (Profit: {settings.currencySymbol} {totalProfit.toLocaleString()})
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, customer name, medicine item..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <input
            type="date"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items Purchased</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Profit</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No sales matching your query.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {sale.date} {sale.time}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div>{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sale.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {sale.items.map((i) => `${i.medicineName} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {settings.currencySymbol} {sale.subtotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {sale.discountAmount > 0
                        ? `-${settings.currencySymbol}${sale.discountAmount}`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                      {settings.currencySymbol} {sale.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                      +{settings.currencySymbol} {sale.totalProfit.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.remainingAmount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sale.remainingAmount > 0
                          ? `Due: ${settings.currencySymbol}${sale.remainingAmount}`
                          : 'Paid Full'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedSaleDetail(sale)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                          title="View Invoice Items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrint(sale, 'thermal')}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                          title="Print Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(sale)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 transition-colors"
                          title="Send on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Invoice"
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

      {/* Invoice Detail Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                  {selectedSaleDetail.invoiceNumber}
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">
                  Sales Invoice Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSaleDetail.date} at {selectedSaleDetail.time}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer</span>
                  <span className="font-bold text-slate-800">
                    {selectedSaleDetail.customerName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Phone</span>
                  <span className="font-mono text-slate-700">
                    {selectedSaleDetail.customerPhone || 'Walk-in'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSaleDetail.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-800">{i.medicineName}</td>
                        <td className="p-2 text-center">{i.quantity}</td>
                        <td className="p-2 text-right">
                          {settings.currencySymbol} {i.unitPrice}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {settings.currencySymbol} {i.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>
                    {settings.currencySymbol} {selectedSaleDetail.subtotal.toLocaleString()}
                  </span>
                </div>
                {selectedSaleDetail.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="text-rose-600 font-semibold">
                      -{settings.currencySymbol} {selectedSaleDetail.discountAmount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                  <span>Grand Total:</span>
                  <span>
                    {settings.currencySymbol} {selectedSaleDetail.grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount Paid:</span>
                  <span>
                    {settings.currencySymbol} {selectedSaleDetail.paidAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  handlePrint(selectedSaleDetail, 'thermal');
                }}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Thermal (80mm)
              </button>
              <button
                onClick={() => {
                  handlePrint(selectedSaleDetail, 'a4');
                }}
                className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                A4 Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-900">Delete Sales Invoice?</h3>
            <p className="text-xs text-slate-500">
              Do you want to delete this invoice and restore the sold medicine units back into inventory stock?
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
                  await deleteSale(deleteConfirmId, true);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Delete & Restore Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

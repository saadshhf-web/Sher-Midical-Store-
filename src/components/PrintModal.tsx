import React, { useState } from 'react';
import { Printer, X, Download, Share2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreLogoImage } from './DefaultLogo';
import { Sale, Purchase, Medicine } from '../types';

export const PrintModal: React.FC = () => {
  const { printableDoc, setPrintableDoc, settings } = useStore();
  const [format, setFormat] = useState<'a4' | 'thermal'>(
    printableDoc?.format || settings.defaultInvoiceFormat || 'thermal'
  );

  if (!printableDoc) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setPrintableDoc(null);
  };

  const isSale = printableDoc.type === 'sale';
  const isPurchase = printableDoc.type === 'purchase';
  const isMedicines = printableDoc.type === 'medicines';
  const isStock = printableDoc.type === 'stock';
  const isExpiry = printableDoc.type === 'expiry';
  const isProfit = printableDoc.type === 'profit';
  const isReport = printableDoc.type === 'report';

  const sale: Sale = isSale ? printableDoc.data : null;
  const purchase: Purchase = isPurchase ? printableDoc.data : null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      {/* Top Floating Control Bar (Hidden during print via .no-print) */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="no-print p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Print Preview: {printableDoc.type.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle only relevant for sales */}
            {isSale && (
              <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setFormat('thermal')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    format === 'thermal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Thermal (80mm)
                </button>
                <button
                  onClick={() => setFormat('a4')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    format === 'a4'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  A4 Medical Invoice
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black shadow transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT NOW</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            id="printable-content"
            className={`bg-white shadow-lg mx-auto ${
              format === 'thermal' && isSale
                ? 'thermal-receipt w-[320px] max-w-[320px] p-4 text-[11px] font-mono leading-tight border border-slate-300 text-slate-900'
                : 'w-full max-w-[800px] p-8 text-xs text-slate-800 border border-slate-300 rounded-lg min-h-[700px]'
            }`}
          >
            {/* 1. SALE RECEIPT / INVOICE */}
            {isSale && sale && (
              format === 'thermal' ? (
                /* THERMAL 80mm RECEIPT LAYOUT */
                <div className="space-y-2 text-center text-slate-900">
                  {/* Thermal Header with Logo */}
                  {settings.showLogoOnInvoice && (
                    <div className="flex justify-center mb-1">
                      <StoreLogoImage logoUrl={settings.storeLogo} size="md" />
                    </div>
                  )}

                  <div className="font-black text-sm uppercase tracking-wide">
                    {settings.storeName || 'SHER MEDICAL STORE'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-700">
                    {settings.urduName || 'شیر میڈیکل اسٹور'}
                  </div>
                  {settings.showAddressOnInvoice && (
                    <div className="text-[10px] text-slate-600 px-2">
                      {settings.address}
                    </div>
                  )}
                  {settings.showPhoneOnInvoice && (
                    <div className="text-[10px] font-mono text-slate-700">
                      Tel: {settings.phone}
                    </div>
                  )}

                  <div className="border-t border-b border-dashed border-slate-400 py-1 my-1 text-left text-[10px]">
                    <div className="flex justify-between">
                      <span>Inv: <b>{sale.invoiceNumber}</b></span>
                      <span>{sale.date} {sale.time}</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>Customer: <b>{sale.customerName}</b></span>
                      <span>{sale.customerPhone || ''}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <table className="w-full text-left text-[10px] my-1">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="pb-1">Item</th>
                        <th className="pb-1 text-center">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                        <th className="pb-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dotted divide-slate-300">
                      {sale.items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="py-1 pr-1 font-semibold">{i.medicineName}</td>
                          <td className="py-1 text-center">{i.quantity}</td>
                          <td className="py-1 text-right">{i.unitPrice}</td>
                          <td className="py-1 text-right font-bold">{i.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary */}
                  <div className="border-t border-dashed border-slate-400 pt-1 text-right text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{settings.currencySymbol} {sale.subtotal}</span>
                    </div>
                    {sale.discountAmount > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Discount:</span>
                        <span>-{settings.currencySymbol} {sale.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xs border-t border-slate-400 pt-0.5 mt-0.5">
                      <span>GRAND TOTAL:</span>
                      <span>{settings.currencySymbol} {sale.grandTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span>{settings.currencySymbol} {sale.paidAmount}</span>
                    </div>
                    {sale.remainingAmount > 0 ? (
                      <div className="flex justify-between font-bold text-rose-700">
                        <span>Balance Due:</span>
                        <span>{settings.currencySymbol} {sale.remainingAmount}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between font-bold">
                        <span>Change Returned:</span>
                        <span>{settings.currencySymbol} {Math.abs(sale.remainingAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Thermal Footer */}
                  <div className="border-t border-dashed border-slate-400 pt-2 text-[9px] text-slate-600 text-center leading-normal">
                    <p className="font-bold">Wish you good health!</p>
                    <p className="mt-0.5">{settings.invoiceFooter}</p>
                    <div className="mt-2 font-mono text-[8px] text-slate-400">
                      *** Thank You for Choosing SMS ***
                    </div>
                  </div>
                </div>
              ) : (
                /* A4 STANDARD MEDICAL INVOICE LAYOUT */
                <div className="space-y-6">
                  {/* Top Bar with Logo & Branding */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-emerald-600">
                    <div className="flex items-center gap-3">
                      {settings.showLogoOnInvoice && (
                        <StoreLogoImage logoUrl={settings.storeLogo} size="lg" />
                      )}
                      <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                          {settings.storeName || 'SHER MEDICAL STORE'}
                        </h1>
                        <p className="text-xs font-bold text-emerald-800">
                          {settings.urduName || 'شیر میڈیکل اسٹور'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {settings.subtitle || 'Complete Medical Store Management System'}
                        </p>
                        {settings.showAddressOnInvoice && (
                          <p className="text-[11px] text-slate-600 mt-1 max-w-sm">
                            {settings.address}
                          </p>
                        )}
                        {settings.showPhoneOnInvoice && (
                          <p className="text-[11px] font-mono text-slate-700">
                            Phone: {settings.phone} {settings.email ? `• ${settings.email}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded">
                        Medical Cash Memo
                      </span>
                      <div className="mt-2 font-mono text-xs">
                        <div className="font-bold text-slate-900">
                          Invoice #{sale.invoiceNumber}
                        </div>
                        <div className="text-slate-500">
                          Date: {sale.date} ({sale.time})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 grid grid-cols-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Billed To Patient / Customer:
                      </span>
                      <div className="font-bold text-slate-900 text-sm">
                        {sale.customerName}
                      </div>
                      {sale.customerPhone && (
                        <div className="text-slate-600 font-mono">
                          Phone: {sale.customerPhone}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Payment Mode:
                      </span>
                      <div className="font-semibold text-slate-800">
                        {sale.paymentMethod || 'Cash on Counter'}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Medicine & Generic Formulation</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sale.items.map((i, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}>
                          <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{i.medicineName}</div>
                            {i.genericName && (
                              <div className="text-[10px] text-slate-500">{i.genericName}</div>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">
                            {i.batchNumber}
                          </td>
                          <td className="p-2.5 text-center font-bold">{i.quantity}</td>
                          <td className="p-2.5 text-right text-slate-700">
                            {settings.currencySymbol} {i.unitPrice}
                          </td>
                          <td className="p-2.5 text-right font-black text-slate-900">
                            {settings.currencySymbol} {i.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Section */}
                  <div className="flex justify-end">
                    <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{settings.currencySymbol} {sale.subtotal.toLocaleString()}</span>
                      </div>
                      {sale.discountAmount > 0 && (
                        <div className="flex justify-between text-rose-700">
                          <span>Discount Applied:</span>
                          <span>-{settings.currencySymbol} {sale.discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-300 pt-1.5">
                        <span>Grand Total:</span>
                        <span className="text-emerald-800">
                          {settings.currencySymbol} {sale.grandTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Amount Paid:</span>
                        <span>{settings.currencySymbol} {sale.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                        <span>Remaining Balance:</span>
                        <span className={sale.remainingAmount > 0 ? 'text-amber-700' : 'text-slate-700'}>
                          {settings.currencySymbol} {sale.remainingAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Terms & Pharmacist Signature */}
                  <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                    <div className="max-w-md">
                      <p className="font-bold text-slate-800 mb-0.5">Return & Exchange Policy:</p>
                      <p className="text-[11px] leading-relaxed">{settings.invoiceFooter}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-36 border-b border-slate-400 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Dispenser / Pharmacist
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* 2. PURCHASE INVOICE */}
            {isPurchase && purchase && (
              <div className="space-y-6">
                <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
                  <div className="flex items-center gap-3">
                    <StoreLogoImage logoUrl={settings.storeLogo} size="lg" />
                    <div>
                      <h1 className="text-xl font-black text-slate-900">{settings.storeName}</h1>
                      <p className="text-xs text-slate-500">Inward Stock Inward Voucher</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold">Purchase #{purchase.invoiceNumber}</div>
                    <div className="text-slate-500 text-xs">Date: {purchase.date}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border text-xs">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Distributor Supplier:
                  </span>
                  <div className="font-bold text-slate-900">{purchase.supplierName}</div>
                </div>

                <table className="w-full text-left text-xs border">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2.5">Medicine</th>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Expiry</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Cost Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 font-bold">{purchase.medicineName}</td>
                      <td className="p-2.5 font-mono">{purchase.batchNumber}</td>
                      <td className="p-2.5">{purchase.expiryDate}</td>
                      <td className="p-2.5 text-center font-bold">+{purchase.quantity}</td>
                      <td className="p-2.5 text-right">
                        {settings.currencySymbol} {purchase.purchasePrice}
                      </td>
                      <td className="p-2.5 text-right font-black">
                        {settings.currencySymbol} {purchase.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. MEDICINES CATALOG PRINT */}
            {isMedicines && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b-2 border-emerald-600">
                  <div className="flex items-center gap-3">
                    <StoreLogoImage logoUrl={settings.storeLogo} size="md" />
                    <div>
                      <h1 className="text-lg font-black text-slate-900">{settings.storeName}</h1>
                      <p className="text-xs text-slate-500">Official Medicine Formulary & Price List</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    Printed on: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <table className="w-full text-left text-[11px] border">
                  <thead className="bg-slate-100 font-bold border-b">
                    <tr>
                      <th className="p-2">Name & Generic</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Company</th>
                      <th className="p-2">Shelf</th>
                      <th className="p-2 text-right">Sale Price</th>
                      <th className="p-2 text-center">In Stock</th>
                      <th className="p-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(printableDoc.data as Medicine[]).map((m) => (
                      <tr key={m.id}>
                        <td className="p-2 font-semibold">
                          {m.name} <span className="text-slate-400 font-normal">({m.genericName})</span>
                        </td>
                        <td className="p-2">{m.medicineType}</td>
                        <td className="p-2">{m.company}</td>
                        <td className="p-2">{m.rackShelf || '—'}</td>
                        <td className="p-2 text-right font-bold">
                          {settings.currencySymbol} {m.salePrice}
                        </td>
                        <td className="p-2 text-center font-bold">{m.quantity}</td>
                        <td className="p-2">{m.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. STOCK AUDIT REPORT */}
            {isStock && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b-2 border-teal-600">
                  <div className="flex items-center gap-3">
                    <StoreLogoImage logoUrl={settings.storeLogo} size="md" />
                    <div>
                      <h1 className="text-lg font-black text-slate-900">{settings.storeName}</h1>
                      <p className="text-xs text-slate-500">Physical Stock Valuation & Verification Report</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    Printed: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <table className="w-full text-left text-[11px] border">
                  <thead className="bg-slate-100 font-bold border-b">
                    <tr>
                      <th className="p-2">Medicine</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2 text-center">Stock</th>
                      <th className="p-2 text-right">Cost Price</th>
                      <th className="p-2 text-right">Total Valuation</th>
                      <th className="p-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(printableDoc.data as Medicine[]).map((m) => (
                      <tr key={m.id}>
                        <td className="p-2 font-bold">{m.name}</td>
                        <td className="p-2 font-mono">{m.batchNumber}</td>
                        <td className="p-2 text-center font-bold">{m.quantity}</td>
                        <td className="p-2 text-right">
                          {settings.currencySymbol} {m.purchasePrice}
                        </td>
                        <td className="p-2 text-right font-black">
                          {settings.currencySymbol} {(m.quantity * m.purchasePrice).toLocaleString()}
                        </td>
                        <td className="p-2">{m.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. EXPIRY AUDIT REPORT */}
            {isExpiry && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b-2 border-rose-600">
                  <div className="flex items-center gap-3">
                    <StoreLogoImage logoUrl={settings.storeLogo} size="md" />
                    <div>
                      <h1 className="text-lg font-black text-slate-900">{settings.storeName}</h1>
                      <p className="text-xs text-rose-700 font-bold">
                        Quarantine & Expiry Audit Report ({printableDoc.data.type?.toUpperCase()})
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    Date: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <table className="w-full text-left text-[11px] border">
                  <thead className="bg-slate-100 font-bold border-b">
                    <tr>
                      <th className="p-2">Medicine</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2 text-center">Units</th>
                      <th className="p-2 text-right">Loss / Cost Value</th>
                      <th className="p-2">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(printableDoc.data.items as Medicine[]).map((m) => (
                      <tr key={m.id}>
                        <td className="p-2 font-bold">{m.name}</td>
                        <td className="p-2 font-mono">{m.batchNumber}</td>
                        <td className="p-2 text-center font-bold">{m.quantity}</td>
                        <td className="p-2 text-right font-black text-rose-700">
                          {settings.currencySymbol} {(m.quantity * m.purchasePrice).toLocaleString()}
                        </td>
                        <td className="p-2 font-bold">{m.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. GENERAL EXECUTIVE REPORT */}
            {isReport && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b-2 border-slate-900">
                  <div className="flex items-center gap-3">
                    <StoreLogoImage logoUrl={settings.storeLogo} size="md" />
                    <div>
                      <h1 className="text-lg font-black text-slate-900">{settings.storeName}</h1>
                      <p className="text-xs text-slate-500">
                        Executive Management Audit Report ({printableDoc.data.reportType?.toUpperCase()})
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    Period: {printableDoc.data.startDate} to {printableDoc.data.endDate}
                  </div>
                </div>

                {printableDoc.data.financial && (
                  <div className="p-4 bg-slate-50 border rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Total Sales Revenue:</span>
                      <span className="font-bold text-slate-900">
                        {settings.currencySymbol}{' '}
                        {printableDoc.data.financial.periodSales.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Purchases Restocked:</span>
                      <span className="font-bold text-slate-900">
                        {settings.currencySymbol}{' '}
                        {printableDoc.data.financial.periodPurchases.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating Overhead Expenses:</span>
                      <span className="font-bold text-rose-700">
                        {settings.currencySymbol}{' '}
                        {printableDoc.data.financial.periodExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-sm border-t pt-2">
                      <span>Net Bottom-Line Profit:</span>
                      <span className="text-emerald-700">
                        {settings.currencySymbol}{' '}
                        {printableDoc.data.financial.periodNetProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

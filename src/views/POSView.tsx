import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Printer,
  Share2,
  User,
  Phone,
  RotateCcw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Medicine, Sale, SaleItem } from '../types';

export const POSView: React.FC = () => {
  const {
    medicines,
    customers,
    settings,
    addSale,
    setPrintableDoc,
    printCurrentDoc,
    showToast,
  } = useStore();

  // Search & scanner state
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);

  // Cart state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online / UPI'>('Cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');

  // Completed sale modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input by default
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Filter medicines as user types in search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchTerm.toLowerCase();
    const matches = medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.barcode.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 8));
  }, [searchTerm, medicines]);

  // Handle Barcode Scanner Input (USB scanner types barcode and hits Enter)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = medicines.find(
      (m) => m.barcode.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      showToast(`No medicine found with barcode "${code}"`, 'warning');
    }
  };

  // Add medicine to cart
  const addToCart = (med: Medicine) => {
    // Check if expired
    if (med.expiryDate && new Date(med.expiryDate) < new Date()) {
      showToast(`Cannot sell "${med.name}"! The medicine has EXPIRED (${med.expiryDate}).`, 'error');
      return;
    }

    // Check available stock
    const existingIndex = cart.findIndex((item) => item.medicineId === med.id);
    const currentInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;

    if (currentInCart + 1 > med.quantity) {
      showToast(`INSUFFICIENT STOCK: Only ${med.quantity} units available for "${med.name}".`, 'error');
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...cart];
      const item = updated[existingIndex];
      const newQty = item.quantity + 1;
      const total = newQty * item.unitPrice;
      const profit = (item.unitPrice - item.purchasePrice) * newQty;
      updated[existingIndex] = {
        ...item,
        quantity: newQty,
        total,
        profit,
      };
      setCart(updated);
    } else {
      const unitPrice = med.salePrice || 0;
      const purchasePrice = med.purchasePrice || 0;
      const newItem: SaleItem = {
        medicineId: med.id,
        medicineName: med.name,
        genericName: med.genericName,
        batchNumber: med.batchNumber || 'N/A',
        unitPrice,
        purchasePrice,
        quantity: 1,
        total: unitPrice,
        profit: unitPrice - purchasePrice,
      };
      setCart((prev) => [...prev, newItem]);
    }

    setSearchTerm('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();
  };

  // Update item quantity
  const updateQuantity = (index: number, newQty: number) => {
    const item = cart[index];
    const med = medicines.find((m) => m.id === item.medicineId);
    const availableStock = med ? med.quantity : 9999;

    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (newQty > availableStock) {
      showToast(`INSUFFICIENT STOCK: Only ${availableStock} units in inventory!`, 'error');
      return;
    }

    const updated = [...cart];
    const total = newQty * item.unitPrice;
    const profit = (item.unitPrice - item.purchasePrice) * newQty;
    updated[index] = {
      ...item,
      quantity: newQty,
      total,
      profit,
    };
    setCart(updated);
  };

  // Update item unit price
  const updateUnitPrice = (index: number, newPrice: number) => {
    const updated = [...cart];
    const item = updated[index];
    const price = Math.max(0, newPrice);
    const total = item.quantity * price;
    const profit = (price - item.purchasePrice) * item.quantity;
    updated[index] = {
      ...item,
      unitPrice: price,
      total,
      profit,
    };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setPaidAmount(0);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setSelectedCustomerId(undefined);
    setSaleNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Recalculate discount
  const finalDiscountAmount =
    discountPercent > 0 ? (subtotal * discountPercent) / 100 : discountAmount;
  const grandTotal = Math.max(0, subtotal - finalDiscountAmount);
  const remainingAmount = grandTotal - paidAmount;

  // Auto-set paid amount to grand total if previously untouched or matched
  useEffect(() => {
    if (paidAmount === 0 || paidAmount < grandTotal) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal]);

  // Customer selection helper
  const handleSelectCustomer = (custId: string) => {
    const c = customers.find((cust) => cust.id === custId);
    if (c) {
      setSelectedCustomerId(c.id);
      setCustomerName(c.name);
      setCustomerPhone(c.phone || '');
    } else {
      setSelectedCustomerId(undefined);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
    }
  };

  // Checkout submission
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Please add medicines first.', 'warning');
      return;
    }

    // Double-check stock validity
    for (const item of cart) {
      const med = medicines.find((m) => m.id === item.medicineId);
      if (!med) continue;
      if (item.quantity > med.quantity) {
        showToast(
          `INSUFFICIENT STOCK: ${med.name} only has ${med.quantity} available!`,
          'error'
        );
        return;
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const invoiceNumber = `SMS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalProfit =
      cart.reduce((sum, item) => sum + item.profit, 0) - finalDiscountAmount;

    try {
      const savedSale = await addSale({
        invoiceNumber,
        date: dateStr,
        time: timeStr,
        customerId: selectedCustomerId,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: cart,
        subtotal,
        discountPercent,
        discountAmount: finalDiscountAmount,
        grandTotal,
        paidAmount,
        remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
        totalProfit: Math.max(0, totalProfit),
        paymentMethod,
        notes: saleNotes,
      });

      setCompletedSale(savedSale);
      clearCart();
    } catch (err) {
      console.error(err);
      showToast('Failed to record sale. Please try again.', 'error');
    }
  };

  // WhatsApp share message builder
  const handleSendWhatsApp = (sale: Sale) => {
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

  const handlePrint = (sale: Sale, format: 'a4' | 'thermal') => {
    setPrintableDoc({
      type: 'sale',
      data: sale,
      format,
    });
    printCurrentDoc();
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Barcode Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="lg:col-span-5 relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-emerald-600" />
            <span>Barcode Scanner Input (Press Enter)</span>
          </label>
          <div className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or type barcode, e.g. 8964000101"
              className="w-full pl-3 pr-20 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </form>

        {/* Medicine name / generic live search */}
        <div className="lg:col-span-7 relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Search Medicine / Generic / Brand</span>
          </label>
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type Panadol, Augmentin, Paracetamol..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((med) => {
                const isOutOfStock = med.quantity <= 0;
                const isExp =
                  med.expiryDate && new Date(med.expiryDate) < new Date();

                return (
                  <div
                    key={med.id}
                    onClick={() => {
                      if (!isOutOfStock && !isExp) {
                        addToCart(med);
                      }
                    }}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isOutOfStock || isExp
                        ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'hover:bg-emerald-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {med.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                          {med.medicineType}
                        </span>
                        {med.strength && (
                          <span className="text-xs text-slate-500">
                            {med.strength}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Generic: <span className="font-medium">{med.genericName}</span> • Company: {med.company}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Batch: {med.batchNumber} • Expiry: {med.expiryDate} • Rack: {med.rackShelf || 'N/A'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-sm text-emerald-700">
                        {settings.currencySymbol} {med.salePrice}
                      </div>
                      {isExp ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          EXPIRED
                        </span>
                      ) : isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          OUT OF STOCK
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">
                          Stock: {med.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main POS Interface: Left Cart Table (8 cols), Right Payment Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Cart Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[480px]">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm">Active Billing Cart</h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Cart
              </button>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3 text-right">Price ({settings.currencySymbol})</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total ({settings.currencySymbol})</th>
                  <th className="py-2.5 px-2 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBag className="w-10 h-10 text-slate-300 stroke-1" />
                        <span className="text-sm font-medium">Cart is currently empty</span>
                        <span className="text-xs text-slate-400">
                          Scan a barcode or search above to add medicines to this sale
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const med = medicines.find((m) => m.id === item.medicineId);
                    const stock = med ? med.quantity : 0;
                    const isInsufficient = item.quantity > stock;

                    return (
                      <tr
                        key={item.medicineId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isInsufficient ? 'bg-rose-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.medicineName}
                          </div>
                          {item.genericName && (
                            <div className="text-[11px] text-slate-500">
                              {item.genericName}
                            </div>
                          )}
                          {isInsufficient && (
                            <div className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3" />
                              INSUFFICIENT STOCK (Only {stock} available!)
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {item.batchNumber}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateUnitPrice(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 text-right py-1 px-1.5 border border-slate-200 rounded font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={stock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(idx, parseInt(e.target.value) || 1)
                              }
                              className={`w-14 text-center py-1 font-bold text-xs border rounded focus:ring-1 focus:ring-emerald-500 ${
                                isInsufficient
                                  ? 'border-rose-400 bg-rose-50 text-rose-700'
                                  : 'border-slate-200'
                              }`}
                            />
                            <button
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 text-right text-xs sm:text-sm">
                          {item.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Customer & Checkout Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Selection Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Customer Details
              </span>
              <select
                onChange={(e) => handleSelectCustomer(e.target.value)}
                value={selectedCustomerId || ''}
                className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-slate-50 focus:outline-none"
              >
                <option value="">-- Quick Walk-in --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Phone (for WhatsApp Receipt)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Totals Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Payment Breakdown
            </h4>

            {/* Subtotal */}
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">
                {settings.currencySymbol} {subtotal.toLocaleString()}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">Discount:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={discountPercent || ''}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value) || 0;
                    setDiscountPercent(pct);
                    setDiscountAmount(0);
                  }}
                  className="w-14 text-center py-1 px-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400">% or</span>
                <input
                  type="number"
                  min="0"
                  placeholder={settings.currencySymbol}
                  value={discountAmount || ''}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0;
                    setDiscountAmount(amt);
                    setDiscountPercent(0);
                  }}
                  className="w-20 text-right py-1 px-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Grand Total */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Grand Payable
                </div>
                <div className="text-2xl font-black text-emerald-900">
                  {settings.currencySymbol} {grandTotal.toLocaleString()}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Net Bill
              </span>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              {(['Cash', 'Card', 'Online / UPI'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 text-center rounded-lg border transition-all ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Paid Amount */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                <span>Received / Tendered:</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Remaining / Change:{' '}
                  <b
                    className={
                      remainingAmount < 0
                        ? 'text-teal-700'
                        : remainingAmount > 0
                        ? 'text-amber-700'
                        : 'text-slate-700'
                    }
                  >
                    {remainingAmount < 0
                      ? `Change: ${settings.currencySymbol} ${Math.abs(remainingAmount)}`
                      : remainingAmount > 0
                      ? `Due: ${settings.currencySymbol} ${remainingAmount}`
                      : 'Exact'}
                  </b>
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-base font-bold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {[grandTotal, 500, 1000, 5000].map((amt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPaidAmount(amt)}
                    className="py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    {idx === 0 ? 'Exact' : `${settings.currencySymbol}${amt}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-98'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Complete Sale & Print Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completed Sale Success Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Transaction Completed!
              </h3>
              <p className="text-xs text-slate-500">
                Invoice <span className="font-mono font-bold text-slate-800">{completedSale.invoiceNumber}</span> saved.
                Inventory updated.
              </p>
            </div>

            {/* Sale Summary Box */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items Count:</span>
                <span className="font-semibold text-slate-800">
                  {completedSale.items.reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-bold text-slate-700">Grand Total:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {settings.currencySymbol} {completedSale.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-semibold text-slate-800">
                  {settings.currencySymbol} {completedSale.paidAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons: Print A4, Thermal, WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => handlePrint(completedSale, 'thermal')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal (80mm)</span>
              </button>

              <button
                onClick={() => handlePrint(completedSale, 'a4')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print A4 Invoice</span>
              </button>
            </div>

            {/* WhatsApp receipt button */}
            <button
              onClick={() => handleSendWhatsApp(completedSale)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Send WhatsApp Bill to {completedSale.customerPhone || 'Customer'}</span>
            </button>

            <button
              onClick={() => setCompletedSale(null)}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center"
            >
              Close & Start Next Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

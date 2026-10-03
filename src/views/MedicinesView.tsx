import React, { useState, useMemo } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  Sliders,
  Download,
  Printer,
  Barcode,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Medicine, MedicineType } from '../types';
import { downloadCSV } from '../utils/csv';

export const MEDICINE_TYPES: MedicineType[] = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Sachet',
  'Suspension',
  'Other',
];

export const MedicinesView: React.FC = () => {
  const {
    medicines,
    suppliers,
    settings,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    adjustStock,
    setPrintableDoc,
    printCurrentDoc,
    globalSearch,
    setGlobalSearch,
  } = useStore();

  const [search, setSearch] = useState(globalSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'salePrice' | 'expiryDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);
  const [adjustingStockMed, setAdjustingStockMed] = useState<Medicine | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>('Inventory count correction');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    genericName: '',
    company: '',
    category: '',
    medicineType: 'Tablet' as MedicineType,
    strength: '',
    packSize: '',
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    minStock: 10,
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
    supplierName: '',
    rackShelf: '',
    description: '',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [medicines]);

  // Sync global search with local
  React.useEffect(() => {
    if (globalSearch) {
      setSearch(globalSearch);
    }
  }, [globalSearch]);

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormData({
      barcode: '',
      name: '',
      genericName: '',
      company: '',
      category: '',
      medicineType: 'Tablet',
      strength: '',
      packSize: '',
      purchasePrice: 0,
      salePrice: 0,
      quantity: 0,
      minStock: settings.minStockDefault || 10,
      batchNumber: '',
      mfgDate: '',
      expiryDate: '',
      supplierName: suppliers[0]?.name || '',
      rackShelf: '',
      description: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      barcode: med.barcode || '',
      name: med.name,
      genericName: med.genericName || '',
      company: med.company || '',
      category: med.category || '',
      medicineType: med.medicineType || 'Tablet',
      strength: med.strength || '',
      packSize: med.packSize || '',
      purchasePrice: med.purchasePrice || 0,
      salePrice: med.salePrice || 0,
      quantity: med.quantity || 0,
      minStock: med.minStock || 10,
      batchNumber: med.batchNumber || '',
      mfgDate: med.mfgDate || '',
      expiryDate: med.expiryDate || '',
      supplierName: med.supplierName || '',
      rackShelf: med.rackShelf || '',
      description: med.description || '',
    });
    setIsAddEditOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingMedicine) {
      await updateMedicine(editingMedicine.id, formData);
    } else {
      await addMedicine(formData);
    }
    setIsAddEditOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteMedicine(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockMed) return;
    await adjustStock(adjustingStockMed.id, stockDelta, stockReason);
    setAdjustingStockMed(null);
    setStockDelta(0);
  };

  // Filter & Sort Logic
  const filteredMedicines = useMemo(() => {
    const now = new Date();
    return medicines
      .filter((med) => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            med.name.toLowerCase().includes(q) ||
            med.genericName.toLowerCase().includes(q) ||
            med.company.toLowerCase().includes(q) ||
            med.barcode.toLowerCase().includes(q) ||
            med.batchNumber.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && med.category !== selectedCategory) {
          return false;
        }

        // Type filter
        if (selectedType !== 'all' && med.medicineType !== selectedType) {
          return false;
        }

        // Stock status filter
        if (selectedStockFilter === 'low') {
          return med.quantity > 0 && med.quantity <= (med.minStock || settings.minStockDefault);
        }
        if (selectedStockFilter === 'out') {
          return med.quantity <= 0;
        }
        if (selectedStockFilter === 'expired') {
          return med.expiryDate && new Date(med.expiryDate) < now;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortBy === 'quantity') cmp = a.quantity - b.quantity;
        else if (sortBy === 'salePrice') cmp = a.salePrice - b.salePrice;
        else if (sortBy === 'expiryDate') cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();

        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [
    medicines,
    search,
    selectedCategory,
    selectedType,
    selectedStockFilter,
    sortBy,
    sortOrder,
    settings.minStockDefault,
  ]);

  const handleExportCSV = () => {
    const headers = [
      'Medicine ID',
      'Barcode',
      'Name',
      'Generic Name',
      'Company',
      'Category',
      'Type',
      'Strength',
      'Pack Size',
      'Purchase Price',
      'Sale Price',
      'Quantity',
      'Min Stock',
      'Batch Number',
      'Mfg Date',
      'Expiry Date',
      'Supplier',
      'Rack / Shelf',
    ];

    const rows = filteredMedicines.map((m) => [
      m.id,
      m.barcode,
      m.name,
      m.genericName,
      m.company,
      m.category,
      m.medicineType,
      m.strength,
      m.packSize,
      m.purchasePrice,
      m.salePrice,
      m.quantity,
      m.minStock,
      m.batchNumber,
      m.mfgDate,
      m.expiryDate,
      m.supplierName,
      m.rackShelf,
    ]);

    downloadCSV('Sher_Medical_Store_Medicines', headers, rows);
  };

  const handlePrintCatalog = () => {
    setPrintableDoc({
      type: 'medicines',
      data: filteredMedicines,
      format: 'a4',
    });
    printCurrentDoc();
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Medicine Inventory Management
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {filteredMedicines.length} of {medicines.length} Formulations
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Add, update, adjust stock, verify batches, and monitor shelf locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintCatalog}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Catalog</span>
          </button>
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
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setGlobalSearch(e.target.value);
            }}
            placeholder="Search by name, generic, barcode, batch..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Types</option>
            {MEDICINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div>
          <select
            value={selectedStockFilter}
            onChange={(e) => setSelectedStockFilter(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Barcode / ID</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Medicine & Generic</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Type & Strength</th>
                <th className="py-3 px-3">Company / Shelf</th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    if (sortBy === 'salePrice') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('salePrice');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Buy / Sale</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    if (sortBy === 'quantity') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('quantity');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    if (sortBy === 'expiryDate') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('expiryDate');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Batch / Expiry</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No medicines match your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const now = new Date();
                  const isExpired = med.expiryDate && new Date(med.expiryDate) < now;
                  const isLowStock =
                    med.quantity > 0 && med.quantity <= (med.minStock || settings.minStockDefault);
                  const isOutOfStock = med.quantity <= 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-900">{med.barcode || med.id}</div>
                        <div className="text-[10px] text-slate-400">{med.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {med.genericName || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {med.medicineType}
                        </span>
                        {med.strength && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {med.strength} {med.packSize ? `(${med.packSize})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{med.company || '—'}</div>
                        <div className="text-[11px] text-slate-400">
                          Shelf: <b className="text-slate-700">{med.rackShelf || 'Unset'}</b>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-800 text-sm">
                          {settings.currencySymbol} {med.salePrice}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {settings.currencySymbol} {med.purchasePrice}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div
                          className={`font-black text-sm ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-700'
                              : 'text-slate-800'
                          }`}
                        >
                          {med.quantity}
                        </div>
                        <div className="text-[10px] text-slate-400">Min: {med.minStock}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] text-slate-700">
                          {med.batchNumber || '—'}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            isExpired ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {med.expiryDate || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isExpired ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[10px]">
                            EXPIRED
                          </span>
                        ) : isOutOfStock ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[10px]">
                            OUT
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            LOW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingMedicine(med)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingStockMed(med);
                              setStockDelta(0);
                            }}
                            className="p-1.5 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-100 transition-colors"
                            title="Adjust Stock"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(med)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Medicine"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(med.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingMedicine ? 'Edit Medicine Formulation' : 'Register New Medicine'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in all 19 pharmacy record specifications
                </p>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* 1. Barcode */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 8964000101"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 2. Medicine Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Medicine Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Panadol 500mg"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. Generic Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic Formula</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Company */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Brand</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. GSK Pakistan"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 5. Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Analgesics, Antibiotics"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 6. Medicine Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage Form / Type</label>
                  <select
                    value={formData.medicineType}
                    onChange={(e) =>
                      setFormData({ ...formData, medicineType: e.target.value as MedicineType })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    {MEDICINE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Strength */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 10ml, 20%"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 8. Pack Size */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="e.g. 10x10 Tablets, 1 Bottle"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 9. Purchase Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Purchase Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 10. Sale Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sale Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 11. Initial Quantity */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Current Quantity in Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 12. Minimum Stock Alert */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minimum Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 13. Batch Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g. PN-8821"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 14. Manufacturing Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    value={formData.mfgDate}
                    onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 15. Expiry Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 16. Supplier */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 17. Rack / Shelf Location */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    value={formData.rackShelf}
                    onChange={(e) => setFormData({ ...formData, rackShelf: e.target.value })}
                    placeholder="e.g. Rack A-1, Drawer 3"
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 18. Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Medical Indications / Storage Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Keep refrigerated between 2C-8C. Used for post-operative inflammation..."
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingMedicine ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Medicine Modal */}
      {viewingMedicine && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                  {viewingMedicine.barcode || viewingMedicine.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {viewingMedicine.name}
                </h3>
                <p className="text-xs text-slate-500">{viewingMedicine.genericName}</p>
              </div>
              <button
                onClick={() => setViewingMedicine(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Company</span>
                <span className="font-bold text-slate-800">{viewingMedicine.company || '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Dosage Form</span>
                <span className="font-bold text-slate-800">
                  {viewingMedicine.medicineType} ({viewingMedicine.strength || 'N/A'})
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Current Stock</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {viewingMedicine.quantity} units (Min: {viewingMedicine.minStock})
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Shelf / Rack</span>
                <span className="font-bold text-slate-800">
                  {viewingMedicine.rackShelf || 'Unassigned'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Purchase Cost</span>
                <span className="font-bold text-slate-800">
                  {settings.currencySymbol} {viewingMedicine.purchasePrice}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Selling Retail Price</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {settings.currencySymbol} {viewingMedicine.salePrice}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Batch Number</span>
                <span className="font-mono font-bold text-slate-800">
                  {viewingMedicine.batchNumber || '—'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Expiry Date</span>
                <span className="font-bold text-slate-800">{viewingMedicine.expiryDate || '—'}</span>
              </div>
            </div>

            {viewingMedicine.description && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs">
                <span className="text-slate-400 block text-[10px] mb-1">Notes / Instructions</span>
                <p className="text-slate-700">{viewingMedicine.description}</p>
              </div>
            )}

            <button
              onClick={() => setViewingMedicine(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingStockMed && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Adjust Stock: {adjustingStockMed.name}
              </h3>
              <button
                onClick={() => setAdjustingStockMed(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                <span className="text-slate-500">Current Stock:</span>
                <span className="font-black text-slate-900 text-base">
                  {adjustingStockMed.quantity} units
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity Adjustment (positive to add, negative to reduce)
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +10 or -5"
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  New Resulting Stock:{' '}
                  <b className="text-slate-900">
                    {Math.max(0, adjustingStockMed.quantity + stockDelta)} units
                  </b>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="Inventory count correction">Inventory count correction</option>
                  <option value="Damaged / broken container">Damaged / broken container</option>
                  <option value="Expired batch disposal">Expired batch disposal</option>
                  <option value="Returned to supplier">Returned to supplier</option>
                  <option value="Customer return without bill">Customer return without bill</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingStockMed(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Apply Stock Adjustment
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
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Medicine?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to permanently delete this medicine from the dispensary database?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

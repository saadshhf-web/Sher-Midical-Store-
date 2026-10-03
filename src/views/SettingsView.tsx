import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Image,
  Upload,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Building,
  Printer,
  Shield,
  KeyRound,
  RotateCcw,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreLogoImage } from '../components/DefaultLogo';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateLogo,
    clearDemoData,
    clearAllData,
    showToast,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form states
  const [formData, setFormData] = useState({
    storeName: settings.storeName,
    subtitle: settings.subtitle,
    urduName: settings.urduName || 'شیر میڈیکل اسٹور',
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    invoiceFooter: settings.invoiceFooter,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    defaultInvoiceFormat: settings.defaultInvoiceFormat,
    showLogoOnInvoice: settings.showLogoOnInvoice,
    showPhoneOnInvoice: settings.showPhoneOnInvoice,
    showAddressOnInvoice: settings.showAddressOnInvoice,
    minStockDefault: settings.minStockDefault,
    expiryAlertDays: settings.expiryAlertDays,
    username: settings.username,
    newPassword: '',
    confirmPassword: '',
  });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Logo file upload handler
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 3MB max
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image file too large. Please select an image under 3MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        await updateLogo(base64);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveLogo = async () => {
    if (window.confirm('Are you sure you want to remove the custom logo? The default medical symbol will be used.')) {
      await updateLogo(null);
    }
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      storeName: formData.storeName,
      subtitle: formData.subtitle,
      urduName: formData.urduName,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      invoiceFooter: formData.invoiceFooter,
      currency: formData.currency,
      currencySymbol: formData.currencySymbol,
    });
  };

  const handleSaveInvoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      defaultInvoiceFormat: formData.defaultInvoiceFormat,
      showLogoOnInvoice: formData.showLogoOnInvoice,
      showPhoneOnInvoice: formData.showPhoneOnInvoice,
      showAddressOnInvoice: formData.showAddressOnInvoice,
      invoiceFooter: formData.invoiceFooter,
    });
  };

  const handleSaveStockSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      minStockDefault: Number(formData.minStockDefault) || 10,
      expiryAlertDays: Number(formData.expiryAlertDays) || 60,
    });
  };

  const handleSaveUserSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showToast('New passwords do not match!', 'error');
        return;
      }
      await updateSettings({
        username: formData.username,
        passwordHash: formData.newPassword,
      });
      showToast('Login credentials updated successfully!', 'success');
      setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } else {
      await updateSettings({
        username: formData.username,
      });
      showToast('Username updated successfully!', 'success');
    }
  };

  const handleClearDemoConfirm = async () => {
    if (
      window.confirm(
        'Clear all demo data? This will safely remove initial sample medicines, sales, and purchases, leaving your system clean for real business operations.'
      )
    ) {
      await clearDemoData();
    }
  };

  const handleClearAllConfirm = async () => {
    if (deleteConfirmText.trim().toUpperCase() === 'DELETE') {
      await clearAllData();
      setIsClearAllModalOpen(false);
      setDeleteConfirmText('');
    } else {
      showToast('Confirmation word did not match. Action cancelled.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              System Settings & Store Configuration
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              Control Panel
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Customize logo branding, invoice typography, stock alert thresholds, and security credentials.
          </p>
        </div>
      </div>

      {/* SECTION 1: Store Logo Management (Prompt Item 3 - Important) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Image className="w-5 h-5 text-emerald-600" />
              Store Logo Management System
            </h3>
            <p className="text-xs text-slate-500">
              Upload your own pharmacy store logo. It persists offline and displays in headers,
              the login page, receipts, invoices, and reports.
            </p>
          </div>
          {settings.storeLogo && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Custom Logo Active
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Logo Preview Box */}
          <div className="relative group p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-w-[160px] min-h-[140px]">
            <StoreLogoImage
              logoUrl={settings.storeLogo}
              size="xl"
              className="max-h-24 max-w-28 object-contain"
            />
            <span className="text-[10px] text-slate-400 font-semibold mt-2">
              {settings.storeLogo ? 'Current Active Logo' : 'Default Pharmacy Emblem'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 flex-1">
            <p className="text-xs text-slate-600">
              Supported file formats: <span className="font-bold">PNG, JPG, JPEG, WEBP, SVG</span>.
              The image is converted to local base64 format and stored inside your offline database.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>{settings.storeLogo ? 'Change Logo' : 'Browse / Upload Logo'}</span>
              </button>

              {settings.storeLogo && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Logo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Logo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Store Information */}
      <form
        onSubmit={handleSaveStoreInfo}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
      >
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            Store Information
          </h3>
          <p className="text-xs text-slate-500">
            Details printed on top of sales bills and customer receipts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Store Name *</label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subtitle / Slogan</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Urdu Label</label>
            <input
              type="text"
              value={formData.urduName}
              onChange={(e) => setFormData({ ...formData, urduName: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Store Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number(s)</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Currency Code</label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              placeholder="PKR"
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              placeholder="Rs."
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-800"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-xs">
            Invoice Footer Terms & Return Disclaimer
          </label>
          <textarea
            rows={2}
            value={formData.invoiceFooter}
            onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs"
          >
            Save Store Details
          </button>
        </div>
      </form>

      {/* SECTION 3: Invoice Print Settings */}
      <form
        onSubmit={handleSaveInvoiceSettings}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
      >
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            Invoice & Printing Preferences
          </h3>
          <p className="text-xs text-slate-500">
            Choose default receipt layout and customize printable header elements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Default Print Layout</label>
            <select
              value={formData.defaultInvoiceFormat}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultInvoiceFormat: e.target.value as 'a4' | 'thermal',
                })
              }
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
            >
              <option value="thermal">Thermal POS Receipt (80mm)</option>
              <option value="a4">Standard A4 Medical Invoice</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="showLogoOnInvoice"
              checked={formData.showLogoOnInvoice}
              onChange={(e) =>
                setFormData({ ...formData, showLogoOnInvoice: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="showLogoOnInvoice" className="font-semibold text-slate-700">
              Print Store Logo on Bill
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="showPhoneOnInvoice"
              checked={formData.showPhoneOnInvoice}
              onChange={(e) =>
                setFormData({ ...formData, showPhoneOnInvoice: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="showPhoneOnInvoice" className="font-semibold text-slate-700">
              Print Phone Number on Bill
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="showAddressOnInvoice"
              checked={formData.showAddressOnInvoice}
              onChange={(e) =>
                setFormData({ ...formData, showAddressOnInvoice: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="showAddressOnInvoice" className="font-semibold text-slate-700">
              Print Address on Bill
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs"
          >
            Save Print Preferences
          </button>
        </div>
      </form>

      {/* SECTION 4: Stock & Expiry Alert Thresholds */}
      <form
        onSubmit={handleSaveStockSettings}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
      >
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Stock & Expiry Alert Thresholds
          </h3>
          <p className="text-xs text-slate-500">
            Set global inventory replenishment limits and upcoming expiration horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Default Minimum Stock Level (Low Stock Warning)
            </label>
            <input
              type="number"
              min="1"
              value={formData.minStockDefault}
              onChange={(e) =>
                setFormData({ ...formData, minStockDefault: parseInt(e.target.value) || 10 })
              }
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Medicines with stock at or below this number trigger orange alert badges.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Expiry Alert Notice Period
            </label>
            <select
              value={formData.expiryAlertDays}
              onChange={(e) =>
                setFormData({ ...formData, expiryAlertDays: parseInt(e.target.value) || 60 })
              }
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            >
              <option value="30">30 Days (1 Month in advance)</option>
              <option value="60">60 Days (2 Months in advance)</option>
              <option value="90">90 Days (3 Months in advance)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Batches expiring within this window will appear under Expiring Soon.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs"
          >
            Save Alert Thresholds
          </button>
        </div>
      </form>

      {/* SECTION 5: User & Authentication Settings */}
      <form
        onSubmit={handleSaveUserSecurity}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
      >
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            User Security & Passwords
          </h3>
          <p className="text-xs text-slate-500">
            Change username or system password for local desktop access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">System Username *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-type new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs"
          >
            Update Credentials
          </button>
        </div>
      </form>

      {/* SECTION 6: Data Maintenance & Purging */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            Dispensary Data Management & System Reset
          </h3>
          <p className="text-xs text-slate-500">
            Reset software to zero-data fresh installation state, or clear all current inventory & transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Reset to Fresh Empty State</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Clears all medicines, customers, suppliers, purchases, sales, and expenses. Keeps store settings and login intact.
              </p>
            </div>
            <button
              onClick={handleClearDemoConfirm}
              className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              RESET TO FRESH STORE (ZERO DATA)
            </button>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
            <div>
              <h4 className="font-bold text-rose-900 text-xs">Clear All Store Records</h4>
              <p className="text-[11px] text-rose-700 mt-1">
                Permanently wipes all transaction tables, invoices, and ledger records with security confirmation.
              </p>
            </div>
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              CLEAR ALL DATA
            </button>
          </div>
        </div>
      </div>

      {/* Logo Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Store Logo Full Preview</h3>
            <div className="p-6 bg-slate-100 rounded-xl flex items-center justify-center">
              <StoreLogoImage logoUrl={settings.storeLogo} size="xl" className="max-h-36 max-w-36" />
            </div>
            <p className="text-xs text-slate-500">
              This logo will render on your receipts, login panel, and PDF/A4 printouts.
            </p>
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-rose-900">
              CRITICAL: Clear All Dispensary Data?
            </h3>
            <p className="text-xs text-slate-600">
              This action permanently deletes all medicine records, transactions, sales, and
              expenses. Type <b className="text-rose-700 font-mono">DELETE</b> below to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-center font-mono font-bold text-sm"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsClearAllModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllConfirm}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className={`flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all ${
                  deleteConfirmText.trim().toUpperCase() === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                    : 'bg-rose-300 cursor-not-allowed'
                }`}
              >
                Permanently Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

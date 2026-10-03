export type MedicineType =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Injection'
  | 'Cream'
  | 'Ointment'
  | 'Drops'
  | 'Inhaler'
  | 'Sachet'
  | 'Suspension'
  | 'Other';

export interface Medicine {
  id: string;
  barcode: string;
  name: string;
  genericName: string;
  company: string;
  category: string;
  medicineType: MedicineType;
  strength: string;
  packSize: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  supplierId?: string;
  supplierName: string;
  rackShelf: string;
  description: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId?: string;
  supplierName: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  batchNumber: string;
  unitPrice: number;
  purchasePrice: number;
  quantity: number;
  total: number;
  profit: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  totalProfit: number;
  paymentMethod: 'Cash' | 'Card' | 'Online / UPI';
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  previousBalance: number;
  notes: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  email: string;
  previousBalance: number;
  notes: string;
  isDemo?: boolean;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Electricity'
  | 'Rent'
  | 'Salary'
  | 'Transport'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  subtitle: string;
  urduName: string;
  address: string;
  phone: string;
  email: string;
  invoiceFooter: string;
  currency: string;
  currencySymbol: string;
  storeLogo: string | null; // Base64 data URL
  defaultInvoiceFormat: 'a4' | 'thermal';
  showLogoOnInvoice: boolean;
  showPhoneOnInvoice: boolean;
  showAddressOnInvoice: boolean;
  minStockDefault: number;
  expiryAlertDays: number; // 30, 60, 90
  username: string;
  passwordHash: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'pos'
  | 'medicines'
  | 'purchases'
  | 'sales'
  | 'customers'
  | 'suppliers'
  | 'stock'
  | 'expiry'
  | 'expenses'
  | 'profit'
  | 'reports'
  | 'backup'
  | 'settings';

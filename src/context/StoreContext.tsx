import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Customer,
  Expense,
  Medicine,
  NavigationTab,
  Purchase,
  Sale,
  StoreSettings,
  Supplier,
} from '../types';
import { StoreDB, DEFAULT_SETTINGS } from '../services/db';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface PrintableDoc {
  type: 'sale' | 'purchase' | 'medicines' | 'stock' | 'report' | 'customer' | 'supplier' | 'expenses' | 'profit' | 'expiry';
  data: any;
  format?: 'a4' | 'thermal';
}

interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  updateLogo: (base64Logo: string | null) => Promise<void>;
  
  // Auth
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  
  // Navigation
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  
  // Data
  medicines: Medicine[];
  purchases: Purchase[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  loading: boolean;

  // Actions
  addMedicine: (med: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Medicine>;
  updateMedicine: (id: string, med: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number, reason?: string) => Promise<void>;

  addPurchase: (pur: Omit<Purchase, 'id' | 'createdAt'>) => Promise<Purchase>;
  deletePurchase: (id: string, revertStock?: boolean) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;
  deleteSale: (id: string, revertStock?: boolean) => Promise<void>;

  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, cust: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addSupplier: (supp: Omit<Supplier, 'id' | 'createdAt'>) => Promise<Supplier>;
  updateSupplier: (id: string, supp: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, exp: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Management
  clearDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // UI helpers
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  globalSearch: string;
  setGlobalSearch: (term: string) => void;

  printableDoc: PrintableDoc | null;
  setPrintableDoc: (doc: PrintableDoc | null) => void;
  printCurrentDoc: (doc?: PrintableDoc) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sms_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('sms_user') || 'admin';
  });
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [printableDoc, setPrintableDoc] = useState<PrintableDoc | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize DB and load all data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await StoreDB.init();
      const currentSettings = await StoreDB.getSettings();
      setSettings(currentSettings);

      const [meds, purs, sls, custs, supps, exps] = await Promise.all([
        StoreDB.getAll<Medicine>('medicines'),
        StoreDB.getAll<Purchase>('purchases'),
        StoreDB.getAll<Sale>('sales'),
        StoreDB.getAll<Customer>('customers'),
        StoreDB.getAll<Supplier>('suppliers'),
        StoreDB.getAll<Expense>('expenses'),
      ]);

      setMedicines(meds.sort((a, b) => a.name.localeCompare(b.name)));
      setPurchases(purs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSales(sls.sort((a, b) => new Date(b.date + ' ' + (b.time || '')).getTime() - new Date(a.date + ' ' + (a.time || '')).getTime()));
      setCustomers(custs.sort((a, b) => a.name.localeCompare(b.name)));
      setSuppliers(supps.sort((a, b) => a.name.localeCompare(b.name)));
      setExpenses(exps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Error loading store data. Using cached state.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Auth functions
  const login = (u: string, p: string): boolean => {
    const validUser = settings.username || 'admin';
    const validPass = settings.passwordHash || 'admin123';
    if (u === validUser && p === validPass) {
      setIsAuthenticated(true);
      setCurrentUser(u);
      localStorage.setItem('sms_auth', 'true');
      localStorage.setItem('sms_user', u);
      showToast(`Welcome back, ${u}! Login successful.`, 'success');
      return true;
    }
    showToast('Invalid username or password. Default is admin / admin123', 'error');
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('sms_auth');
    localStorage.removeItem('sms_user');
    showToast('You have been logged out securely.', 'info');
  };

  // Settings
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StoreDB.saveSettings(updated);
    showToast('Settings saved successfully.', 'success');
  };

  const updateLogo = async (base64Logo: string | null) => {
    const updated = { ...settings, storeLogo: base64Logo };
    setSettings(updated);
    await StoreDB.saveSettings(updated);
    if (base64Logo) {
      showToast('Store logo updated and saved locally.', 'success');
    } else {
      showToast('Store logo removed. Using default pharmacy emblem.', 'info');
    }
  };

  // Medicine Actions
  const addMedicine = async (med: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> => {
    const newId = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullMed: Medicine = {
      ...med,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await StoreDB.put('medicines', fullMed);
    setMedicines((prev) => [...prev, fullMed].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`Medicine "${fullMed.name}" added successfully.`, 'success');
    return fullMed;
  };

  const updateMedicine = async (id: string, changes: Partial<Medicine>): Promise<void> => {
    const existing = medicines.find((m) => m.id === id);
    if (!existing) return;
    const updated: Medicine = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    await StoreDB.put('medicines', updated);
    setMedicines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    showToast(`Medicine "${updated.name}" updated.`, 'success');
  };

  const deleteMedicine = async (id: string): Promise<void> => {
    const target = medicines.find((m) => m.id === id);
    await StoreDB.delete('medicines', id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    showToast(`Medicine "${target?.name || id}" removed.`, 'info');
  };

  const adjustStock = async (id: string, delta: number, reason?: string): Promise<void> => {
    const target = medicines.find((m) => m.id === id);
    if (!target) return;
    const newQty = Math.max(0, target.quantity + delta);
    const updated: Medicine = {
      ...target,
      quantity: newQty,
      updatedAt: new Date().toISOString(),
    };
    await StoreDB.put('medicines', updated);
    setMedicines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    showToast(
      `Stock adjusted for ${target.name} (${delta > 0 ? '+' : ''}${delta} -> ${newQty} total) ${reason ? `[${reason}]` : ''}`,
      'success'
    );
  };

  // Purchase Actions
  const addPurchase = async (pur: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> => {
    const newId = `PUR-${Date.now().toString().slice(-6)}`;
    const fullPurchase: Purchase = {
      ...pur,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await StoreDB.put('purchases', fullPurchase);
    setPurchases((prev) => [fullPurchase, ...prev]);

    // Automatically increase medicine stock!
    const targetMed = medicines.find((m) => m.id === pur.medicineId);
    if (targetMed) {
      const updatedMed: Medicine = {
        ...targetMed,
        quantity: targetMed.quantity + pur.quantity,
        purchasePrice: pur.purchasePrice > 0 ? pur.purchasePrice : targetMed.purchasePrice,
        batchNumber: pur.batchNumber || targetMed.batchNumber,
        expiryDate: pur.expiryDate || targetMed.expiryDate,
        updatedAt: new Date().toISOString(),
      };
      await StoreDB.put('medicines', updatedMed);
      setMedicines((prev) => prev.map((m) => (m.id === targetMed.id ? updatedMed : m)));
    }

    showToast(`Purchase #${fullPurchase.invoiceNumber} recorded. Stock automatically updated.`, 'success');
    return fullPurchase;
  };

  const deletePurchase = async (id: string, revertStock: boolean = true): Promise<void> => {
    const pur = purchases.find((p) => p.id === id);
    if (!pur) return;
    await StoreDB.delete('purchases', id);
    setPurchases((prev) => prev.filter((p) => p.id !== id));

    if (revertStock && pur.medicineId) {
      const targetMed = medicines.find((m) => m.id === pur.medicineId);
      if (targetMed) {
        const revertedQty = Math.max(0, targetMed.quantity - pur.quantity);
        const updatedMed: Medicine = {
          ...targetMed,
          quantity: revertedQty,
          updatedAt: new Date().toISOString(),
        };
        await StoreDB.put('medicines', updatedMed);
        setMedicines((prev) => prev.map((m) => (m.id === targetMed.id ? updatedMed : m)));
      }
    }
    showToast(`Purchase invoice ${pur.invoiceNumber} deleted.`, 'info');
  };

  // Sale Actions
  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
    const newId = `SALE-${Date.now().toString().slice(-6)}`;
    const fullSale: Sale = {
      ...sale,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    // Decrement stock for all items
    const updatedMedicines = [...medicines];
    for (const item of fullSale.items) {
      const medIndex = updatedMedicines.findIndex((m) => m.id === item.medicineId);
      if (medIndex >= 0) {
        const currentMed = updatedMedicines[medIndex];
        const newQty = Math.max(0, currentMed.quantity - item.quantity);
        const updatedMed: Medicine = {
          ...currentMed,
          quantity: newQty,
          updatedAt: new Date().toISOString(),
        };
        updatedMedicines[medIndex] = updatedMed;
        await StoreDB.put('medicines', updatedMed);
      }
    }
    setMedicines(updatedMedicines);

    await StoreDB.put('sales', fullSale);
    setSales((prev) => [fullSale, ...prev]);

    // Update customer outstanding balance if remainingAmount > 0 and customer is selected
    if (fullSale.customerId && fullSale.remainingAmount > 0) {
      const cust = customers.find((c) => c.id === fullSale.customerId);
      if (cust) {
        const updatedCust = {
          ...cust,
          previousBalance: (cust.previousBalance || 0) + fullSale.remainingAmount,
        };
        await StoreDB.put('customers', updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === cust.id ? updatedCust : c)));
      }
    }

    showToast(`Invoice ${fullSale.invoiceNumber} completed! Stock decreased.`, 'success');
    return fullSale;
  };

  const deleteSale = async (id: string, revertStock: boolean = true): Promise<void> => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return;
    await StoreDB.delete('sales', id);
    setSales((prev) => prev.filter((s) => s.id !== id));

    if (revertStock) {
      const updatedMedicines = [...medicines];
      for (const item of sale.items) {
        const medIndex = updatedMedicines.findIndex((m) => m.id === item.medicineId);
        if (medIndex >= 0) {
          const currentMed = updatedMedicines[medIndex];
          const newQty = currentMed.quantity + item.quantity;
          const updatedMed = {
            ...currentMed,
            quantity: newQty,
            updatedAt: new Date().toISOString(),
          };
          updatedMedicines[medIndex] = updatedMed;
          await StoreDB.put('medicines', updatedMed);
        }
      }
      setMedicines(updatedMedicines);
    }
    showToast(`Sale invoice ${sale.invoiceNumber} deleted. Stock restored.`, 'info');
  };

  // Customer Actions
  const addCustomer = async (cust: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const newId = `CUST-${Math.floor(100 + Math.random() * 900)}`;
    const fullCust: Customer = {
      ...cust,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await StoreDB.put('customers', fullCust);
    setCustomers((prev) => [...prev, fullCust].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`Customer "${fullCust.name}" added.`, 'success');
    return fullCust;
  };

  const updateCustomer = async (id: string, changes: Partial<Customer>): Promise<void> => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) return;
    const updated: Customer = { ...existing, ...changes };
    await StoreDB.put('customers', updated);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    showToast(`Customer "${updated.name}" updated.`, 'success');
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const target = customers.find((c) => c.id === id);
    await StoreDB.delete('customers', id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast(`Customer "${target?.name || id}" removed.`, 'info');
  };

  // Supplier Actions
  const addSupplier = async (supp: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> => {
    const newId = `SUPP-${Math.floor(100 + Math.random() * 900)}`;
    const fullSupp: Supplier = {
      ...supp,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await StoreDB.put('suppliers', fullSupp);
    setSuppliers((prev) => [...prev, fullSupp].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`Supplier "${fullSupp.name}" added.`, 'success');
    return fullSupp;
  };

  const updateSupplier = async (id: string, changes: Partial<Supplier>): Promise<void> => {
    const existing = suppliers.find((s) => s.id === id);
    if (!existing) return;
    const updated: Supplier = { ...existing, ...changes };
    await StoreDB.put('suppliers', updated);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    showToast(`Supplier "${updated.name}" updated.`, 'success');
  };

  const deleteSupplier = async (id: string): Promise<void> => {
    const target = suppliers.find((s) => s.id === id);
    await StoreDB.delete('suppliers', id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showToast(`Supplier "${target?.name || id}" removed.`, 'info');
  };

  // Expense Actions
  const addExpense = async (exp: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    const newId = `EXP-${Math.floor(100 + Math.random() * 900)}`;
    const fullExp: Expense = {
      ...exp,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await StoreDB.put('expenses', fullExp);
    setExpenses((prev) => [fullExp, ...prev]);
    showToast(`Expense "${fullExp.description}" recorded.`, 'success');
    return fullExp;
  };

  const updateExpense = async (id: string, changes: Partial<Expense>): Promise<void> => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return;
    const updated: Expense = { ...existing, ...changes };
    await StoreDB.put('expenses', updated);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    showToast(`Expense updated.`, 'success');
  };

  const deleteExpense = async (id: string): Promise<void> => {
    await StoreDB.delete('expenses', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast(`Expense deleted.`, 'info');
  };

  // Data management
  const clearDemoData = async () => {
    await StoreDB.clearDemoData();
    await refreshAllData();
    showToast('Demo data cleared! System is ready for live entries.', 'success');
  };

  const clearAllData = async () => {
    await StoreDB.clearAllData();
    await refreshAllData();
    showToast('All transaction and inventory data cleared.', 'warning');
  };

  const printCurrentDoc = (doc?: PrintableDoc) => {
    if (doc) {
      setPrintableDoc(doc);
    }
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        updateLogo,
        isAuthenticated,
        currentUser,
        login,
        logout,
        currentTab,
        setCurrentTab,
        medicines,
        purchases,
        sales,
        customers,
        suppliers,
        expenses,
        loading,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        adjustStock,
        addPurchase,
        deletePurchase,
        addSale,
        deleteSale,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addExpense,
        updateExpense,
        deleteExpense,
        clearDemoData,
        clearAllData,
        refreshAllData,
        toasts,
        showToast,
        removeToast,
        globalSearch,
        setGlobalSearch,
        printableDoc,
        setPrintableDoc,
        printCurrentDoc,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

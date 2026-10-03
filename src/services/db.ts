import {
  Customer,
  Expense,
  Medicine,
  Purchase,
  Sale,
  StoreSettings,
  Supplier,
} from '../types';

const DB_NAME = 'SherMedicalStoreDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'SHER MEDICAL STORE',
  subtitle: 'Complete Medical Store Management System',
  urduName: 'شیر میڈیکل اسٹور',
  address: 'Shop # 14, Main Hospital Road, Lahore, Pakistan',
  phone: '+92 300 1234567 / 042-35890123',
  email: 'info@shermedicalstore.com',
  invoiceFooter:
    'Medicines once sold can be returned within 3 days with original bill and undamaged packaging. Store in cool and dry place. Wish you good health!',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  storeLogo: null,
  defaultInvoiceFormat: 'thermal',
  showLogoOnInvoice: true,
  showPhoneOnInvoice: true,
  showAddressOnInvoice: true,
  minStockDefault: 10,
  expiryAlertDays: 60,
  username: 'admin',
  passwordHash: 'admin123',
};

// Helper to open IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const stores = [
        'medicines',
        'purchases',
        'sales',
        'customers',
        'suppliers',
        'expenses',
        'settings',
      ];
      stores.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic Storage Bridge (IndexedDB with LocalStorage mirroring fallback)
export class StoreDB {
  private static isInitialized = false;

  public static async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const settings = await this.getSettings();
      if (!settings) {
        await this.saveSettings(DEFAULT_SETTINGS);
      }

      // One-time client purge of any previous demo data so existing browser sessions are completely fresh
      if (localStorage.getItem('sms_clean_slate_v1') !== 'true') {
        const stores = ['medicines', 'purchases', 'sales', 'customers', 'suppliers', 'expenses'];
        for (const store of stores) {
          await this.clearStore(store);
          localStorage.removeItem(`sms_${store}`);
        }
        localStorage.setItem('sms_clean_slate_v1', 'true');
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('Fallback initializing with LocalStorage:', e);
      this.initLocalStorageFallback();
      this.isInitialized = true;
    }
  }

  private static initLocalStorageFallback() {
    if (!localStorage.getItem('sms_settings')) {
      localStorage.setItem('sms_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (localStorage.getItem('sms_clean_slate_v1') !== 'true') {
      const stores = ['medicines', 'purchases', 'sales', 'customers', 'suppliers', 'expenses'];
      for (const store of stores) {
        localStorage.removeItem(`sms_${store}`);
      }
      localStorage.setItem('sms_clean_slate_v1', 'true');
    }
  }

  public static async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await openDatabase();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem(`sms_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    }
  }

  public static async getById<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await openDatabase();
      return new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as T) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const items = await this.getAll<any>(storeName);
      return items.find((item) => item.id === id) || null;
    }
  }

  public static async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback
    }
    // Also mirror to LocalStorage
    try {
      const current = await this.getAll<T>(storeName);
      const idx = current.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        current[idx] = item;
      } else {
        current.unshift(item);
      }
      localStorage.setItem(`sms_${storeName}`, JSON.stringify(current));
    } catch (err) {
      console.warn('LocalStorage mirror warning:', err);
    }
  }

  public static async bulkPut<T extends { id: string }>(
    storeName: string,
    items: T[]
  ): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback
    }
    try {
      localStorage.setItem(`sms_${storeName}`, JSON.stringify(items));
    } catch (e) {
      console.warn(e);
    }
  }

  public static async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    try {
      const current = await this.getAll<any>(storeName);
      const filtered = current.filter((x) => x.id !== id);
      localStorage.setItem(`sms_${storeName}`, JSON.stringify(filtered));
    } catch (e) {
      console.warn(e);
    }
  }

  public static async clearStore(storeName: string): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    localStorage.removeItem(`sms_${storeName}`);
  }

  public static async getSettings(): Promise<StoreSettings> {
    try {
      const record = await this.getById<{ id: string; settings: StoreSettings }>(
        'settings',
        'current_settings'
      );
      if (record && record.settings) {
        return { ...DEFAULT_SETTINGS, ...record.settings };
      }
    } catch {
      // fallback
    }
    const raw = localStorage.getItem('sms_settings');
    if (raw) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }

  public static async saveSettings(settings: StoreSettings): Promise<void> {
    const payload = { id: 'current_settings', settings };
    try {
      await this.put('settings', payload);
    } catch {
      // ignore
    }
    localStorage.setItem('sms_settings', JSON.stringify(settings));
  }

  public static async clearDemoData(): Promise<void> {
    const stores = ['medicines', 'purchases', 'sales', 'customers', 'suppliers', 'expenses'];
    for (const store of stores) {
      await this.clearStore(store);
      localStorage.removeItem(`sms_${store}`);
    }
  }

  public static async clearAllData(): Promise<void> {
    const stores = ['medicines', 'purchases', 'sales', 'customers', 'suppliers', 'expenses'];
    for (const store of stores) {
      await this.clearStore(store);
      localStorage.removeItem(`sms_${store}`);
    }
  }

  public static async exportBackupJSON(): Promise<string> {
    const settings = await this.getSettings();
    const medicines = await this.getAll<Medicine>('medicines');
    const purchases = await this.getAll<Purchase>('purchases');
    const sales = await this.getAll<Sale>('sales');
    const customers = await this.getAll<Customer>('customers');
    const suppliers = await this.getAll<Supplier>('suppliers');
    const expenses = await this.getAll<Expense>('expenses');

    const backup = {
      app: 'SHER MEDICAL STORE',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      medicines,
      purchases,
      sales,
      customers,
      suppliers,
      expenses,
    };

    return JSON.stringify(backup, null, 2);
  }

  public static async importBackupJSON(jsonStr: string): Promise<boolean> {
    try {
      const backup = JSON.parse(jsonStr);
      if (!backup || !backup.settings) {
        throw new Error('Invalid backup file format');
      }

      if (backup.settings) {
        await this.saveSettings(backup.settings);
      }

      const stores = [
        { name: 'medicines', data: backup.medicines || [] },
        { name: 'purchases', data: backup.purchases || [] },
        { name: 'sales', data: backup.sales || [] },
        { name: 'customers', data: backup.customers || [] },
        { name: 'suppliers', data: backup.suppliers || [] },
        { name: 'expenses', data: backup.expenses || [] },
      ];

      for (const item of stores) {
        await this.clearStore(item.name);
        if (item.data.length > 0) {
          await this.bulkPut(item.name, item.data);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      throw err;
    }
  }
}

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PrintModal } from './components/PrintModal';
import { ToastContainer } from './components/ToastContainer';

import { DashboardView } from './views/DashboardView';
import { POSView } from './views/POSView';
import { MedicinesView } from './views/MedicinesView';
import { PurchasesView } from './views/PurchasesView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { CustomersView } from './views/CustomersView';
import { SuppliersView } from './views/SuppliersView';
import { StockView } from './views/StockView';
import { ExpiryView } from './views/ExpiryView';
import { ExpensesView } from './views/ExpensesView';
import { ProfitView } from './views/ProfitView';
import { ReportsView } from './views/ReportsView';
import { BackupRestoreView } from './views/BackupRestoreView';
import { SettingsView } from './views/SettingsView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, currentTab, loading } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">SHER MEDICAL STORE</h2>
        <p className="text-xs text-slate-400 mt-1">
          Initializing offline local database...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSView />;
      case 'medicines':
        return <MedicinesView />;
      case 'purchases':
        return <PurchasesView />;
      case 'sales':
        return <SalesHistoryView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'stock':
        return <StockView />;
      case 'expiry':
        return <ExpiryView />;
      case 'expenses':
        return <ExpensesView />;
      case 'profit':
        return <ProfitView />;
      case 'reports':
        return <ReportsView />;
      case 'backup':
        return <BackupRestoreView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Application Header */}
      <Header
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Desktop Sidebar Navigation */}
        <Sidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Center Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Printable Document Dialog */}
      <PrintModal />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}

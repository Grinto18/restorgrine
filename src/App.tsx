/**
 * GRINE RESTAURANT POS - Main Application Entrypoint
 * Restaurant POS System for GRINE RESTAURANT (Good Food • Good Mood)
 */

import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { POSView } from './views/POSView';
import { TablesView } from './views/TablesView';
import { KitchenView } from './views/KitchenView';
import { InventoryView } from './views/InventoryView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { UsersView } from './views/UsersView';
import { PinAuthModal } from './components/PinAuthModal';
import { ShiftModal } from './components/ShiftModal';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';

const AppContent: React.FC = () => {
  const { activeView, setActiveView } = usePOS();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Top Header */}
      <Header
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* View Routing */}
        <main className="flex-1 flex overflow-hidden">
          {activeView === 'pos' && <POSView />}
          {activeView === 'tables' && <TablesView />}
          {activeView === 'kitchen' && <KitchenView />}
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'shifts' && (
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
              <div className="max-w-md w-full text-center space-y-4">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl transition-all active:scale-95"
                >
                  فتح نافذة إدارة الصندوق والوردية
                </button>
              </div>
            </div>
          )}
          {activeView === 'users' && <UsersView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      <ReceiptPreviewModal />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}

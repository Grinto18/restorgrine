/**
 * GRINE RESTAURANT POS - Main Navigation Sidebar
 * Responsive touch-friendly sidebar with active badges, hotkeys, and role filtering.
 */

import React from 'react';
import { usePOS } from '../context/POSContext';
import {
  ShoppingBag,
  LayoutGrid,
  ChefHat,
  Package,
  BarChart3,
  Coins,
  Users,
  Settings,
  Flame,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, t, kitchenTickets, products, currentUser } = usePOS();

  // Active tickets pending in kitchen
  const pendingKitchenCount = kitchenTickets.filter(
    (k) => k.status === 'NEW' || k.status === 'PREPARING'
  ).length;

  // Low stock products alert count
  const lowStockCount = products.filter(
    (p) => p.stockTracking && p.currentStock <= p.minStockAlert
  ).length;

  const navItems = [
    {
      id: 'pos',
      label: t.navSales,
      icon: <ShoppingBag className="w-5 h-5" />,
      hotkey: 'F1',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'tables',
      label: t.navTables,
      icon: <LayoutGrid className="w-5 h-5" />,
      hotkey: 'F2',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'kitchen',
      label: t.navKitchen,
      icon: <ChefHat className="w-5 h-5" />,
      badge: pendingKitchenCount > 0 ? pendingKitchenCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      hotkey: 'F6',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN'],
    },
    {
      id: 'inventory',
      label: t.navInventory,
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'reports',
      label: t.navReports,
      icon: <BarChart3 className="w-5 h-5" />,
      hotkey: 'F7',
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'shifts',
      label: t.navCashShift,
      icon: <Coins className="w-5 h-5" />,
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'users',
      label: t.navUsers,
      icon: <Users className="w-5 h-5" />,
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: <Settings className="w-5 h-5" />,
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
  ];

  return (
    <aside className="w-20 md:w-56 bg-slate-900 border-e border-slate-800 flex flex-col justify-between select-none shrink-0 py-3 z-20">
      <div className="flex flex-col gap-1.5 px-2">
        {navItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(currentUser.role);
          if (!isAllowed) return null;

          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id as any)}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-150 group text-start ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <div className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-amber-400/90'}`}>
                {item.icon}
              </div>

              <span className="hidden md:inline truncate">{item.label}</span>

              {/* Badge for Pending Kitchen or Low Stock */}
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`ms-auto hidden md:inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black shadow-sm ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {/* Keyboard shortcut hint */}
              {item.hotkey && (
                <span
                  className={`ms-auto hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-700 text-blue-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.hotkey}
                </span>
              )}

              {/* Active Golden Bar indicator on edge */}
              {isActive && (
                <span className="absolute top-2 bottom-2 start-0 w-1 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Branding Info */}
      <div className="px-3 pt-3 border-t border-slate-800/80 flex flex-col items-center md:items-start text-[11px] text-slate-400">
        <div className="hidden md:flex items-center gap-1 text-amber-500 font-semibold mb-0.5">
          <Flame className="w-3.5 h-3.5" />
          <span>GRINE v1.0.0</span>
        </div>
        <div className="hidden md:block text-slate-400 truncate w-full">
          Algerian Dinar (DA)
        </div>
      </div>
    </aside>
  );
};

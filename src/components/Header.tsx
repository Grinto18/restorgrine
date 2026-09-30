/**
 * GRINE RESTAURANT POS - Header Component
 * Displays branding, live clock, order type, shift status, thermal printer status,
 * language switcher, and active user badge.
 */

import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Printer, 
  Wifi, 
  WifiOff, 
  Globe, 
  Lock, 
  DollarSign, 
  UserCheck, 
  UtensilsCrossed, 
  ShoppingBag, 
  Truck, 
  Store 
} from 'lucide-react';
import { OrderType } from '../types/pos';

interface HeaderProps {
  onOpenPinModal: () => void;
  onOpenShiftModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPinModal, onOpenShiftModal }) => {
  const {
    t,
    isRtl,
    language,
    setLanguage,
    currentUser,
    activeShift,
    printerSettings,
    bridgeStatus,
    networkStatus,
    orderType,
    setOrderType,
    setActiveView,
    activeView,
    currentOrder,
  } = usePOS();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const orderTypes: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: 'dine_in', label: t.dineIn, icon: <UtensilsCrossed className="w-4 h-4" /> },
    { type: 'takeaway', label: t.takeaway, icon: <ShoppingBag className="w-4 h-4" /> },
    { type: 'delivery', label: t.delivery, icon: <Truck className="w-4 h-4" /> },
    { type: 'counter', label: t.counter, icon: <Store className="w-4 h-4" /> },
  ];

  return (
    <header className="h-16 bg-slate-900 border-b border-amber-900/30 px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30 shadow-md">
      {/* Brand & Time */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-amber-400/40 shadow-lg shadow-amber-900/30 flex items-center justify-center shrink-0">
            <img
              src="/src/assets/images/grine_restaurant_logo_1790804284076.jpg"
              alt="GRINE RESTAURANT"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails, replace with stylized letter
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-amber-400 text-lg leading-none">
                GRINE
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold leading-none">
                RESTAURANT
              </span>
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium tracking-wide">
              Good Food • Good Mood
            </div>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-800 mx-1 hidden lg:block" />

        {/* Live Date & Time */}
        <div className="hidden lg:flex flex-col text-xs text-slate-400 font-mono tabular-nums leading-tight">
          <span className="text-slate-200 font-bold">
            {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <span className="text-[10px] text-slate-400">
            {currentTime.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Center Zone: Order Type Switcher (When on POS screen) */}
      {activeView === 'pos' && (
        <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          {orderTypes.map((ot) => {
            const isSelected = orderType === ot.type;
            return (
              <button
                key={ot.type}
                type="button"
                onClick={() => setOrderType(ot.type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {ot.icon}
                <span>{ot.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right Zone: Shift Info, Printer Diagnostics, Language, Current User */}
      <div className="flex items-center gap-2">
        {/* Cash Register Shift Button */}
        <button
          type="button"
          onClick={onOpenShiftModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            activeShift
              ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/60'
              : 'bg-amber-950/50 border-amber-800/60 text-amber-400 hover:bg-amber-900/60 animate-pulse'
          }`}
          title={activeShift ? t.openShift : t.noShift}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {activeShift ? `${activeShift.expectedCash} DA` : t.startShift}
          </span>
        </button>

        {/* Printer & Bridge Status (Section 46 requirement: click opens printer settings) */}
        <button
          type="button"
          onClick={() => setActiveView('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            bridgeStatus === 'CONNECTED'
              ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800/50 text-rose-300'
          }`}
          title={`${t.paperWidth}: ${printerSettings.paperWidth} | ${
            bridgeStatus === 'CONNECTED' ? t.bridgeConnected : t.bridgeNotRunning
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px] font-bold">
            {printerSettings.paperWidth}
          </span>
          <span className="w-2 h-2 rounded-full inline-block animate-pulse bg-current" />
        </button>

        {/* Online / Offline status */}
        <div
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs ${
            networkStatus === 'ONLINE' ? 'text-slate-400' : 'text-amber-400 bg-amber-950/50 border border-amber-800/60'
          }`}
          title={networkStatus === 'ONLINE' ? t.online : t.offline}
        >
          {networkStatus === 'ONLINE' ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5" />}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`px-2 py-1 rounded font-bold transition-all ${
              language === 'ar' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            عربي
          </button>
          <button
            type="button"
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded font-bold transition-all ${
              language === 'fr' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded font-bold transition-all ${
              language === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EN
          </button>
        </div>

        {/* Active User & Switch PIN Button */}
        <button
          type="button"
          onClick={onOpenPinModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-100 transition-all shadow-sm active:scale-95"
          title={t.switchUser}
        >
          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left rtl:text-right hidden sm:block">
            <div className="text-xs font-bold leading-tight truncate max-w-[100px]">
              {currentUser.name.split(' ')[0]}
            </div>
            <div className="text-[10px] text-amber-400 uppercase font-semibold leading-none">
              {currentUser.role}
            </div>
          </div>
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};

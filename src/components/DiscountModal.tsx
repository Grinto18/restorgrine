/**
 * GRINE RESTAURANT POS - Discount Modal
 * Percentage or Fixed Amount with Manager PIN authorization for discounts > 20%.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { formatDZD } from '../i18n/translations';
import { Percent, DollarSign, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose }) => {
  const { currentOrder, applyDiscount, verifyManagerPin, restaurantSettings, currentUser, t } = usePOS();

  if (!isOpen) return null;

  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [val, setVal] = useState<string>('10');
  const [reason, setReason] = useState<string>('تخفيض زبون دائم');
  const [managerPin, setManagerPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const numVal = parseFloat(val) || 0;
  const maxCashierPercent = restaurantSettings.maxCashierDiscountPercent || 20;

  // Check if this requires manager approval
  const isManagerRequired =
    currentUser.role === 'CASHIER' &&
    ((type === 'PERCENT' && numVal > maxCashierPercent) ||
      (type === 'FIXED' && currentOrder.subtotal > 0 && (numVal / currentOrder.subtotal) * 100 > maxCashierPercent));

  const handleApply = () => {
    setError(null);
    if (numVal <= 0) {
      setError('يرجى تحديد قيمة تخفيض صالحة');
      return;
    }

    if (isManagerRequired) {
      if (!managerPin) {
        setError(t.managerAuthRequired);
        return;
      }
      if (!verifyManagerPin(managerPin)) {
        setError('رمز PIN للمسؤول غير صحيح!');
        return;
      }
    }

    applyDiscount(type, numVal, isManagerRequired ? 'Manager Authorized' : currentUser.name, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <span>{t.applyDiscount}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('PERCENT')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'PERCENT'
                  ? 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>نسبة مئوية (%)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('FIXED')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'FIXED'
                  ? 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>مبلغ ثابت (DA)</span>
            </button>
          </div>

          {/* Quick Presets */}
          {type === 'PERCENT' ? (
            <div className="flex gap-2">
              {[5, 10, 15, 20, 25, 30].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVal(p.toString())}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    val === p.toString()
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {[100, 200, 300, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setVal(amt.toString())}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    val === amt.toString()
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          )}

          {/* Value Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              {type === 'PERCENT' ? 'النسبة المئوية %' : 'المبلغ بالدينار الجزائري DA'}
            </label>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              min="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              سبب الخصم
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: خصم موظف، ضيافة، زبون مميز..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-700"
            />
          </div>

          {/* Manager Auth requirement banner */}
          {isManagerRequired && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>الخصم يتجاوز حد الكاشير ({maxCashierPercent}%) - إذن المسؤول مطلوب</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="أدخل رمز PIN للمسؤول (Manager PIN)..."
                className="w-full bg-slate-950 border border-amber-800/60 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

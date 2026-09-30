/**
 * GRINE RESTAURANT POS - Order Cancellation Modal
 * Captures cancellation reason and logs authorization trail.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { AlertOctagon, X, AlertTriangle } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ isOpen, onClose }) => {
  const { currentOrder, cancelCurrentOrder, verifyManagerPin, currentUser, t } = usePOS();

  if (!isOpen) return null;

  const [reason, setReason] = useState<string>('الزبون غير رأيه');
  const [customReason, setCustomReason] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isManagerRequired = currentUser.role === 'CASHIER';

  const defaultReasons = [
    'الزبون غير رأيه',
    'خطأ في تسجيل الأصناف',
    'تأخر في تحضير الطلب',
    'طلب تجريبي للاختبار',
    'أخرى',
  ];

  const handleConfirm = () => {
    setError(null);
    const finalReason = reason === 'أخرى' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('يرجى تحديد سبب الإلغاء');
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

    const ok = cancelCurrentOrder(finalReason, isManagerRequired ? managerPin : undefined);
    if (ok) {
      onClose();
    } else {
      setError('فشل إلغاء الطلب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="font-extrabold text-rose-400 text-sm flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            <span>{t.cancelOrder} • {currentOrder.orderNumber}</span>
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
          <p className="text-xs text-slate-300">
            سيتم إلغاء الطلب وتحرير الطاولة وتسجيل سبب الإلغاء في سجل الأمان والمراقبة.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              سبب الإلغاء
            </label>
            <div className="space-y-1.5">
              {defaultReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full text-start p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    reason === r
                      ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === 'أخرى' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="اكتب سبب الإلغاء..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
          )}

          {isManagerRequired && (
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/60 space-y-1.5">
              <label className="block text-[11px] font-bold text-amber-400">
                رمز PIN للمسؤول (Manager PIN)
              </label>
              <input
                type="password"
                maxLength={4}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="****"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
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
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
          >
            تأكيد إلغاء الطلب
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * GRINE RESTAURANT POS - Fast Touch PIN User Switch Modal
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Lock, X, AlertCircle, Shield } from 'lucide-react';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, switchUser, t } = usePOS();

  if (!isOpen) return null;

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    setError(null);
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto submit on 4th digit
        const ok = switchUser(nextPin);
        if (ok) {
          setPin('');
          onClose();
        } else {
          setError('رمز PIN غير صحيح');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold text-slate-100 text-sm">{t.switchUser}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Active User info */}
          <div className="text-center">
            <div className="text-xs text-slate-400">المستخدم الحالي:</div>
            <div className="font-extrabold text-slate-100 text-base">{currentUser.name}</div>
            <span className="inline-block mt-0.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
              {currentUser.role}
            </span>
          </div>

          {/* PIN Dots Display */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  idx < pin.length
                    ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                    : 'border-slate-700 bg-slate-950'
                }`}
              />
            ))}
          </div>

          {/* Quick Staff Hint */}
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
            <div className="font-bold text-slate-300 text-center mb-1">رموز الدخول السريعة المتاحة:</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>كاشير 1: <span className="font-mono text-amber-400 font-bold">0000</span></div>
              <div>المدير (Admin): <span className="font-mono text-amber-400 font-bold">1234</span></div>
              <div>المسؤول (Manager): <span className="font-mono text-amber-400 font-bold">2222</span></div>
              <div>المطبخ (Chef): <span className="font-mono text-amber-400 font-bold">3333</span></div>
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center justify-center gap-1.5 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono font-bold text-lg border border-slate-700 active:scale-95 transition-all shadow-sm"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 font-bold text-xs border border-slate-800 active:scale-95 transition-all"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono font-bold text-lg border border-slate-700 active:scale-95 transition-all shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 font-bold text-sm border border-slate-800 active:scale-95 transition-all"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

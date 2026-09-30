/**
 * GRINE RESTAURANT POS - Order Payment & Checkout Modal
 * Supports CASH (with auto-change, quick banknotes, numpad), CIB, DAHABIA, and OTHER.
 * Enforces: Received >= Total, prevents duplicate submission, prints receipt.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { PaymentMethod } from '../types/pos';
import { formatDZD } from '../i18n/translations';
import {
  Banknote,
  CreditCard,
  Wallet,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { currentOrder, payCurrentOrder, t } = usePOS();

  if (!isOpen) return null;

  const due = currentOrder.grandTotal;

  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [receivedInput, setReceivedInput] = useState<string>(due.toString());
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const receivedAmount = parseFloat(receivedInput) || 0;
  const changeDue = Math.max(0, receivedAmount - due);
  const isInsufficient = method === 'CASH' && receivedAmount < due;

  // Keypad Handlers
  const handleDigit = (digit: string) => {
    setErrorMessage(null);
    if (receivedInput === '0' || receivedInput === due.toString()) {
      setReceivedInput(digit);
    } else {
      setReceivedInput(receivedInput + digit);
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (receivedInput.length <= 1) {
      setReceivedInput('0');
    } else {
      setReceivedInput(receivedInput.slice(0, -1));
    }
  };

  const handleClear = () => {
    setErrorMessage(null);
    setReceivedInput('0');
  };

  const handleQuickAdd = (addAmount: number) => {
    setErrorMessage(null);
    setReceivedInput((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + addAmount).toString();
    });
  };

  const handlePreset = (exactVal: number) => {
    setErrorMessage(null);
    setReceivedInput(exactVal.toString());
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (method === 'CASH' && receivedAmount < due) {
      setErrorMessage(t.insufficientAmount);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await payCurrentOrder(method, receivedAmount, reference);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Payment failed');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-400" />
              <span>{t.paymentTitle}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {currentOrder.orderNumber}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Total Amount Due Banner */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {t.amountDue}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                {formatDZD(due)}
              </span>
            </div>

            <div className="text-end">
              <span className="text-xs text-slate-400 block">
                {currentOrder.items.length} أصناف
              </span>
              {currentOrder.discountAmount > 0 && (
                <span className="text-xs text-rose-400 font-bold font-mono">
                  خصم: -{formatDZD(currentOrder.discountAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t.paymentMethod}
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMethod('CASH');
                  setReceivedInput(due.toString());
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'CASH'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md ring-1 ring-emerald-500 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">{t.payCash}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('CIB');
                  setReceivedInput(due.toString());
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'CIB'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-md ring-1 ring-blue-500 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">{t.payCib}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('DAHABIA');
                  setReceivedInput(due.toString());
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'DAHABIA'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-md ring-1 ring-amber-500 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">{t.payDahabia}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('OTHER');
                  setReceivedInput(due.toString());
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  method === 'OTHER'
                    ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-md ring-1 ring-purple-500 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-xs">{t.payOther}</span>
              </button>
            </div>
          </div>

          {/* Cash Calculations Section */}
          {method === 'CASH' ? (
            <div className="space-y-3">
              {/* Received & Change Readouts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="text-xs text-slate-400 font-bold block mb-1">
                    {t.amountReceived}
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-400 tabular-nums">
                    {formatDZD(receivedAmount)}
                  </div>
                </div>

                <div
                  className={`border rounded-xl p-3 ${
                    isInsufficient
                      ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block mb-1">
                    {t.changeDue}
                  </span>
                  <div
                    className={`text-xl font-black font-mono tabular-nums ${
                      isInsufficient ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {isInsufficient ? 'المبلغ غير كافٍ' : formatDZD(changeDue)}
                  </div>
                </div>
              </div>

              {/* Quick Algerian Banknotes Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePreset(due)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                >
                  {t.exactAmount} ({due} DA)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(500)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-mono transition-all border border-slate-700"
                >
                  500 DA
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(1000)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-mono transition-all border border-slate-700"
                >
                  1 000 DA
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(2000)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-mono transition-all border border-slate-700"
                >
                  2 000 DA
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(5000)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-mono transition-all border border-slate-700"
                >
                  5 000 DA
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(500)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs font-bold font-mono transition-all border border-emerald-800"
                >
                  +500 DA
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(1000)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs font-bold font-mono transition-all border border-emerald-800"
                >
                  +1 000 DA
                </button>
              </div>

              {/* Touch Numpad for Cash Received */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-sm mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigit(digit)}
                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono font-bold text-lg border border-slate-700 active:scale-95 transition-all"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold text-sm border border-rose-800 active:scale-95 transition-all"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono font-bold text-lg border border-slate-700 active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-sm border border-slate-700 active:scale-95 transition-all"
                >
                  ⌫
                </button>
              </div>
            </div>
          ) : (
            /* Non-cash reference input */
            <div className="space-y-2 py-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                رقم الإيصال / المعاملة (اختياري)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="رقم مرجع CIB / Dahabia..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {t.cancel}
          </button>

          <button
            id="btn-confirm-payment-action"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isInsufficient}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-base shadow-lg shadow-emerald-900/40 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {isSubmitting ? 'جاري المعالجة...' : t.confirmPayment}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

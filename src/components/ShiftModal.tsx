/**
 * GRINE RESTAURANT POS - Cash Register Shift Management Modal
 * Start Shift (opening float), End Shift (actual cash vs expected, variance),
 * and Cash In / Cash Out (petty cash, expenses).
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { formatDZD } from '../i18n/translations';
import {
  Coins,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose }) => {
  const { activeShift, openShift, closeShift, addCashMovement, currentUser, t } = usePOS();

  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'status' | 'movement' | 'close'>('status');
  const [openingBalance, setOpeningBalance] = useState<string>('5000');
  const [actualCountedCash, setActualCountedCash] = useState<string>(
    activeShift ? activeShift.expectedCash.toString() : '0'
  );
  const [closeNotes, setCloseNotes] = useState<string>('');

  // Cash movement
  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT');
  const [movementAmount, setMovementAmount] = useState<string>('500');
  const [movementReason, setMovementReason] = useState<string>('شراء مستلزمات عاجلة');

  const handleOpenShift = () => {
    const amt = parseFloat(openingBalance) || 0;
    openShift(amt);
  };

  const handleCloseShift = () => {
    const actual = parseFloat(actualCountedCash) || 0;
    closeShift(actual, closeNotes);
    onClose();
  };

  const handleAddMovement = () => {
    const amt = parseFloat(movementAmount) || 0;
    if (amt <= 0 || !movementReason.trim()) return;
    addCashMovement(movementType, amt, movementReason.trim());
    setActiveTab('status');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-slate-100 text-sm">{t.shiftTitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {!activeShift ? (
            /* Open Shift Screen */
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-2">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-100 text-base">{t.startShift}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  يرجى عد النقد المتواجد في درج الكاشير قبل بدء تسجيل المبيعات
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  {t.openingBalance} (DA)
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2">
                {[0, 2000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOpeningBalance(preset.toString())}
                    className="flex-1 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800"
                  >
                    {preset} DA
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleOpenShift}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-98"
              >
                تأكيد فتح الوردية
              </button>
            </div>
          ) : (
            /* Active Shift Dashboard */
            <div className="space-y-4">
              {/* Tab Bar */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activeTab === 'status'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  حالة الصندوق
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('movement')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activeTab === 'movement'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  مصاريف / إيداع
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('close')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activeTab === 'close'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.closeShift}
                </button>
              </div>

              {activeTab === 'status' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">{t.openingBalance}</span>
                      <span className="text-base font-bold font-mono text-slate-200">
                        {formatDZD(activeShift.openingCash)}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">مبيعات كاش</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        +{formatDZD(activeShift.cashSales)}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">إيداع نقدي</span>
                      <span className="text-base font-bold font-mono text-blue-400">
                        +{formatDZD(activeShift.cashIn)}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">سحب / مصروفات</span>
                      <span className="text-base font-bold font-mono text-rose-400">
                        -{formatDZD(activeShift.cashOut)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block">
                        {t.expectedCash}
                      </span>
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {formatDZD(activeShift.expectedCash)}
                      </span>
                    </div>
                    <div className="text-end text-xs text-slate-400">
                      <div>المسؤول: {activeShift.userName}</div>
                      <div>
                        فُتحت:{' '}
                        {new Date(activeShift.openedAt).toLocaleTimeString('fr-DZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'movement' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType('CASH_OUT')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        movementType === 'CASH_OUT'
                          ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      <span>{t.cashOutAction}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('CASH_IN')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        movementType === 'CASH_IN'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>{t.cashInAction}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      المبلغ (DA)
                    </label>
                    <input
                      type="number"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      السبب / البيان
                    </label>
                    <input
                      type="text"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      placeholder="مثال: شراء خبز، شحن غاز، تسديد فواتير..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMovement}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    تسجيل حركة النقد
                  </button>
                </div>
              )}

              {activeTab === 'close' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">{t.expectedCash}:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {formatDZD(activeShift.expectedCash)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      {t.actualCash} (المبلغ المعدود باليد)
                    </label>
                    <input
                      type="number"
                      value={actualCountedCash}
                      onChange={(e) => setActualCountedCash(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Difference readout */}
                  {(() => {
                    const diff = (parseFloat(actualCountedCash) || 0) - activeShift.expectedCash;
                    return (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                          diff === 0
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : diff > 0
                            ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        <span>{t.difference}:</span>
                        <span className="font-mono text-sm">
                          {diff > 0 ? `+${diff} DA (فائض)` : diff < 0 ? `${diff} DA (عجز)` : 'متطابق تماماً 0 DA'}
                        </span>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      ملاحظات إغلاق الوردية
                    </label>
                    <input
                      type="text"
                      value={closeNotes}
                      onChange={(e) => setCloseNotes(e.target.value)}
                      placeholder="أي ملاحظات تخص الوردية..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseShift}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95"
                  >
                    تأكيد إغلاق الوردية واستخراج التقرير
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

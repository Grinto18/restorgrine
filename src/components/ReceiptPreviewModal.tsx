/**
 * GRINE RESTAURANT POS - Thermal Receipt Preview & Print Modal
 * Allows visual inspection of the 58mm / 80mm layout before printing.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { ThermalReceipt } from './ThermalReceipt';
import { Printer, X, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { PaperWidth } from '../types/pos';

export const ReceiptPreviewModal: React.FC = () => {
  const {
    previewReceiptOrder,
    setPreviewReceiptOrder,
    printerSettings,
    printReceipt,
    restaurantSettings,
    t,
  } = usePOS();

  const [activeWidth, setActiveWidth] = useState<PaperWidth>(printerSettings.paperWidth || '58mm');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{
    status: string;
    message: string;
    isSuccess: boolean;
  } | null>(null);

  if (!previewReceiptOrder) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintFeedback(null);
    try {
      const result = await printReceipt(previewReceiptOrder, previewReceiptOrder.printCount > 0);
      setPrintFeedback({
        status: result.status,
        message: result.message,
        isSuccess: result.success,
      });
    } catch (err: any) {
      setPrintFeedback({
        status: 'PRINT_FAILED',
        message: err?.message || 'Error executing print command',
        isSuccess: false,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-slate-100 text-sm">
              {t.printReceipt} • {previewReceiptOrder.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Width Toggle (Default 58mm) */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveWidth('58mm')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  activeWidth === '58mm'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                58mm (الافتراضي)
              </button>
              <button
                type="button"
                onClick={() => setActiveWidth('80mm')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  activeWidth === '80mm'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreviewReceiptOrder(null);
                setPrintFeedback(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex flex-col items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden printable-receipt">
            <ThermalReceipt
              order={previewReceiptOrder}
              paperWidth={activeWidth}
              restaurantName={restaurantSettings.restaurantName}
              restaurantSlogan={restaurantSettings.restaurantSlogan}
              phone={restaurantSettings.phone}
              address={restaurantSettings.address}
              isReprint={previewReceiptOrder.printCount > 0}
            />
          </div>

          {/* Print Feedback Notification */}
          {printFeedback && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs max-w-sm w-full flex items-start gap-2 ${
                printFeedback.isSuccess
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-700 text-rose-300'
              }`}
            >
              {printFeedback.isSuccess ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold uppercase tracking-wider text-[11px]">
                  {printFeedback.status}
                </div>
                <div className="mt-0.5 leading-normal opacity-90">
                  {printFeedback.message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPreviewReceiptOrder(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold transition-colors"
          >
            {t.close}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-98 disabled:opacity-50"
          >
            {isPrinting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>
              {previewReceiptOrder.printCount > 0 ? 'إعادة طباعة الوصل (Reprint)' : t.printReceipt}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

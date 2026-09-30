/**
 * GRINE RESTAURANT POS - Settings, Thermal Printer Config & Windows Bridge Diagnostics
 * Strictly supports 58mm narrow roll (default) and 80mm roll.
 * Connects to Windows Local Print Bridge (http://localhost:8008), prints real test receipt,
 * and maintains database backup / restore.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { formatDZD } from '../i18n/translations';
import { storage } from '../services/storage';
import {
  Settings,
  Printer,
  Database,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Download,
  Upload,
  Radio,
  Sliders,
  Store,
} from 'lucide-react';
import { PaperWidth, PrinterConnectionType } from '../types/pos';

export const SettingsView: React.FC = () => {
  const {
    restaurantSettings,
    updateRestaurantSettings,
    printerSettings,
    updatePrinterSettings,
    bridgeStatus,
    detectedPrinters,
    checkBridgeConnection,
    testPrint,
    exportDatabaseBackup,
    importDatabaseBackup,
    t,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'printer' | 'restaurant' | 'backup' | 'audit'>('printer');

  // Form local state
  const [localPrinter, setLocalPrinter] = useState({ ...printerSettings });
  const [localRestaurant, setLocalRestaurant] = useState({ ...restaurantSettings });
  const [isTestingBridge, setIsTestingBridge] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: string;
    message: string;
    isSuccess: boolean;
  } | null>(null);

  const [backupFileText, setBackupFileText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const auditLogs = storage.getAuditLogs();

  const handleTestBridge = async () => {
    setIsTestingBridge(true);
    setTestResult(null);
    try {
      await checkBridgeConnection();
    } finally {
      setIsTestingBridge(false);
    }
  };

  const handleExecuteTestPrint = async () => {
    setIsTestingBridge(true);
    setTestResult(null);
    try {
      const res = await testPrint();
      setTestResult({
        status: res.status,
        message: res.message,
        isSuccess: res.success,
      });
    } catch (e: any) {
      setTestResult({
        status: 'PRINT_FAILED',
        message: e?.message || 'Error occurred while testing print',
        isSuccess: false,
      });
    } finally {
      setIsTestingBridge(false);
    }
  };

  const handleSavePrinter = () => {
    updatePrinterSettings(localPrinter);
  };

  const handleSaveRestaurant = () => {
    updateRestaurantSettings(localRestaurant);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GRINE_Database_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!backupFileText.trim()) return;
    const ok = importDatabaseBackup(backupFileText);
    if (ok) {
      setImportStatus('تمت استعادة قاعدة البيانات بنجاح!');
      setBackupFileText('');
    } else {
      setImportStatus('فشلت الاستعادة: الملف غير صالح');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>{t.settingsTitle}</span>
        </h2>
        <div className="text-xs text-slate-400 mt-0.5">
          إعدادات الطابعات الحرارية (58mm/80mm)، جسر ويندوز (Windows Print Bridge)، والنسخ الاحتياطي
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="py-3 flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('printer')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'printer'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{t.printerSettings}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restaurant')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'restaurant'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>{t.restaurantInfo}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'backup'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{t.backupRestore}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{t.auditLogs}</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activeTab === 'printer' && (
          <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
            {/* Paper Width (Section 25 strictly: DEFAULT PAPER WIDTH = 58mm) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                {t.paperWidth} (عرض الورق)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLocalPrinter({ ...localPrinter, paperWidth: '58mm' })}
                  className={`p-3.5 rounded-xl border text-start transition-all ${
                    localPrinter.paperWidth === '58mm'
                      ? 'border-amber-400 bg-amber-950/40 text-amber-200 ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-100">58 مم (الافتراضي لمطعم GRINE)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    الرول الضيق القياسي (48-52 مم عرض طباعة)، خط مدمج عالي الكفاءة
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLocalPrinter({ ...localPrinter, paperWidth: '80mm' })}
                  className={`p-3.5 rounded-xl border text-start transition-all ${
                    localPrinter.paperWidth === '80mm'
                      ? 'border-amber-400 bg-amber-950/40 text-amber-200 ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-100">80 مم (الرول العريض)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    رول الإيصالات العريض القياسي (72-76 مم عرض طباعة)
                  </div>
                </button>
              </div>
            </div>

            {/* Connection Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t.connectionType}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['browser', 'bridge', 'lan'] as PrinterConnectionType[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocalPrinter({ ...localPrinter, connectionType: mode })}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      localPrinter.connectionType === mode
                        ? 'border-blue-500 bg-blue-950/40 text-blue-300 ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {mode === 'browser'
                      ? 'الطباعة عبر المتصفح'
                      : mode === 'bridge'
                      ? 'جسر ويندوز (Local Bridge)'
                      : 'طابعة شبكية LAN'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bridge Configuration (When bridge is selected) */}
            {localPrinter.connectionType === 'bridge' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.bridgeUrl}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localPrinter.bridgeUrl}
                      onChange={(e) => setLocalPrinter({ ...localPrinter, bridgeUrl: e.target.value })}
                      placeholder="http://localhost:8008"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleTestBridge}
                      disabled={isTestingBridge}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingBridge ? 'animate-spin' : ''}`} />
                      <span>{t.testConnection}</span>
                    </button>
                  </div>
                </div>

                {/* Bridge Status Indicator */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400">حالة الجسر في ويندوز:</span>
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      bridgeStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {bridgeStatus === 'CONNECTED' ? t.bridgeConnected : t.bridgeNotRunning}
                  </span>
                </div>

                {/* Detected Windows Printers */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.detectedPrinters}
                  </label>
                  <select
                    value={localPrinter.selectedPrinterName}
                    onChange={(e) =>
                      setLocalPrinter({ ...localPrinter, selectedPrinterName: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- حدد طابعة الإيصالات المثبتة --</option>
                    {detectedPrinters.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Test Receipt Output Banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.isSuccess
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-700 text-rose-300'
                }`}
              >
                {testResult.isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div>
                  <div className="font-extrabold uppercase tracking-wider text-[11px]">
                    {testResult.status}
                  </div>
                  <div className="mt-0.5 leading-relaxed">{testResult.message}</div>
                </div>
              </div>
            )}

            {/* Save & Test Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleExecuteTestPrint}
                disabled={isTestingBridge}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-extrabold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{t.printTestReceipt}</span>
              </button>

              <button
                type="button"
                onClick={handleSavePrinter}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{t.save} إعدادات الطابعة</span>
              </button>
            </div>
          </div>
        )}

        {/* Restaurant Info Tab */}
        {activeTab === 'restaurant' && (
          <div className="max-w-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">اسم المطعم</label>
              <input
                type="text"
                value={localRestaurant.restaurantName}
                onChange={(e) => setLocalRestaurant({ ...localRestaurant, restaurantName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">شعار المطعم (Slogan)</label>
              <input
                type="text"
                value={localRestaurant.restaurantSlogan}
                onChange={(e) => setLocalRestaurant({ ...localRestaurant, restaurantSlogan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الهاتف</label>
                <input
                  type="text"
                  value={localRestaurant.phone}
                  onChange={(e) => setLocalRestaurant({ ...localRestaurant, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">العنوان</label>
                <input
                  type="text"
                  value={localRestaurant.address}
                  onChange={(e) => setLocalRestaurant({ ...localRestaurant, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                الحد الأقصى لخصم الكاشير بدون إذن مدير (%)
              </label>
              <input
                type="number"
                value={localRestaurant.maxCashierDiscountPercent}
                onChange={(e) =>
                  setLocalRestaurant({
                    ...localRestaurant,
                    maxCashierDiscountPercent: parseInt(e.target.value) || 20,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveRestaurant}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ معلومات المطعم</span>
            </button>
          </div>
        )}

        {/* Backup & Restore Tab */}
        {activeTab === 'backup' && (
          <div className="max-w-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h4 className="font-extrabold text-sm text-slate-100 mb-1">{t.exportBackup}</h4>
              <p className="text-xs text-slate-400 mb-3">
                تصدير كافة قوائم الطعام، الطاولات، المبيعات، إعدادات الطابعات إلى ملف JSON محلي.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تحميل ملف النسخة الاحتياطية (JSON)</span>
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h4 className="font-extrabold text-sm text-slate-100 mb-1">{t.importBackup}</h4>
              <p className="text-xs text-slate-400 mb-2">
                الصق محتوى ملف النسخة الاحتياطية لاستعادة البيانات:
              </p>
              <textarea
                rows={4}
                value={backupFileText}
                onChange={(e) => setBackupFileText(e.target.value)}
                placeholder="الصق نص ملف JSON هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />

              {importStatus && (
                <div className="mt-2 text-xs font-bold text-amber-400">{importStatus}</div>
              )}

              <button
                type="button"
                onClick={handleImportBackup}
                disabled={!backupFileText.trim()}
                className="mt-3 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>استعادة البيانات الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <h3 className="font-extrabold text-sm text-slate-200 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>سجل الأمان والعمليات (Audit Log - آخر 500 عملية)</span>
            </h3>

            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 text-start">الوقت</th>
                    <th className="py-2.5 px-3 text-start">المستخدم</th>
                    <th className="py-2.5 px-3 text-start">نوع العملية</th>
                    <th className="py-2.5 px-3 text-start">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('fr-DZ', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{log.userName}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] uppercase font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * GRINE RESTAURANT POS - Table Floor & Restaurant Management View
 * Supports 30 tables with live statuses (Available, Occupied, Reserved, Cleaning),
 * elapsed timers, order totals in DA, Table Transfer, Table Merge, Reservation, and Quick Pay.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable } from '../types/pos';
import { formatDZD } from '../i18n/translations';
import {
  LayoutGrid,
  Users,
  Clock,
  ArrowRightLeft,
  Merge,
  BookmarkCheck,
  CheckCircle,
  Receipt,
  CreditCard,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';

export const TablesView: React.FC = () => {
  const {
    tables,
    selectedTable,
    selectTable,
    openTable,
    transferTable,
    mergeTables,
    reserveTable,
    releaseTable,
    orders,
    setActiveView,
    setPreviewReceiptOrder,
    t,
  } = usePOS();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTableModal, setActiveTableModal] = useState<RestaurantTable | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Compute stats
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  const filteredTables = tables.filter((table) => {
    if (filterStatus === 'all') return true;
    return table.status === filterStatus;
  });

  const getTableOrder = (table: RestaurantTable) => {
    if (!table.currentOrderId) return null;
    return orders.find((o) => o.id === table.currentOrderId);
  };

  const getElapsedMinutes = (openedAt?: string) => {
    if (!openedAt) return 0;
    const diff = Date.now() - new Date(openedAt).getTime();
    return Math.floor(diff / 60000);
  };

  const handleTableClick = (table: RestaurantTable) => {
    if (table.status === 'available') {
      openTable(table.id, 'dine_in');
      setActiveView('pos');
    } else {
      setActiveTableModal(table);
    }
  };

  const handleViewOrder = (table: RestaurantTable) => {
    selectTable(table);
    setActiveTableModal(null);
    setActiveView('pos');
  };

  const handleExecuteTransfer = () => {
    if (!activeTableModal || !transferTargetId) return;
    const ok = transferTable(activeTableModal.id, transferTargetId);
    if (ok) {
      setIsTransferModalOpen(false);
      setActiveTableModal(null);
    }
  };

  const handleExecuteMerge = () => {
    if (!activeTableModal || !mergeTargetId) return;
    const ok = mergeTables(activeTableModal.id, mergeTargetId);
    if (ok) {
      setIsMergeModalOpen(false);
      setActiveTableModal(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 select-none">
      {/* Top Header & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <span>إدارة صالة المطعم و الطاولات (30 طاولة)</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            عرض مباشر لحالة الجلوس، فترات المكوث، ومجموع الحسابات
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.allTables} ({tables.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('available')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'available'
                ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            {t.availableTables} ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('occupied')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'occupied'
                ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                : 'text-blue-400/80 hover:text-blue-300'
            }`}
          >
            {t.occupiedTables} ({occupiedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('reserved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'reserved'
                ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                : 'text-purple-400/80 hover:text-purple-300'
            }`}
          >
            {t.reservedTables} ({reservedCount})
          </button>
        </div>
      </div>

      {/* 30 Tables Grid */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredTables.map((table) => {
            const order = getTableOrder(table);
            const elapsed = getElapsedMinutes(table.openedAt);

            let statusBorder = 'border-emerald-600/40 bg-emerald-950/20';
            let statusBadge = 'bg-emerald-950 text-emerald-300 border-emerald-800';
            let statusText = 'شاغرة (متاحة)';

            if (table.status === 'occupied') {
              statusBorder = 'border-blue-500/50 bg-blue-950/30';
              statusBadge = 'bg-blue-950 text-blue-300 border-blue-700';
              statusText = 'مشغولة';
            } else if (table.status === 'reserved') {
              statusBorder = 'border-purple-500/50 bg-purple-950/30';
              statusBadge = 'bg-purple-950 text-purple-300 border-purple-700';
              statusText = 'محجوزة';
            } else if (table.status === 'cleaning') {
              statusBorder = 'border-amber-500/50 bg-amber-950/30';
              statusBadge = 'bg-amber-950 text-amber-300 border-amber-700';
              statusText = 'تنظيف';
            }

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => handleTableClick(table)}
                className={`relative rounded-2xl border p-3 flex flex-col justify-between h-36 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-start ${statusBorder}`}
              >
                {/* Table Header: Number & Seats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-100 text-base">
                      طاولة {table.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Users className="w-3 h-3" />
                    <span>{table.seats}</span>
                  </div>
                </div>

                {/* Center: Order Total or Status */}
                <div className="my-auto">
                  {table.status === 'occupied' && order ? (
                    <div>
                      <div className="text-[10px] text-slate-400">الحساب الحالي:</div>
                      <div className="text-base font-black font-mono text-amber-400 tabular-nums">
                        {formatDZD(order.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {order.items.length} أصناف
                      </div>
                    </div>
                  ) : table.status === 'reserved' ? (
                    <div className="text-xs text-purple-300 font-bold">
                      {table.notes || 'طاولة محجوزة مسبقاً'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-400/80 font-bold">
                      <Plus className="w-4 h-4" />
                      <span>اضغط لفتح طلب</span>
                    </div>
                  )}
                </div>

                {/* Footer: Elapsed time & Status tag */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded font-bold border ${statusBadge}`}>
                    {statusText}
                  </span>

                  {table.status === 'occupied' && (
                    <div className="flex items-center gap-1 font-mono text-slate-300">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{elapsed} د</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Detail & Actions Modal */}
      {activeTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-amber-400" />
                <span>طاولة {activeTableModal.number} • خيارات الطاولة</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTableModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Order Info */}
              {activeTableModal.currentOrderId && (() => {
                const order = getTableOrder(activeTableModal);
                if (!order) return null;
                return (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">رقم الطلب:</span>
                      <span className="font-mono font-bold text-amber-400">{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">المجموع الكلي:</span>
                      <span className="font-mono font-bold text-slate-100 text-sm">
                        {formatDZD(order.grandTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">الأصناف:</span>
                      <span className="text-slate-300">{order.items.length} أصناف</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleViewOrder(activeTableModal)}
                  className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>فتح الطلب في الكاشير</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const order = getTableOrder(activeTableModal);
                    if (order) setPreviewReceiptOrder(order);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <Receipt className="w-4 h-4" />
                  <span>طباعة حساب الطاولة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(true);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{t.transferTable}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMergeModalOpen(true);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <Merge className="w-4 h-4" />
                  <span>{t.mergeTables}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reserveTable(activeTableModal.id);
                    setActiveTableModal(null);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>{t.reserveTable}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    releaseTable(activeTableModal.id);
                    setActiveTableModal(null);
                  }}
                  className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-800"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.releaseTable} (إخلاء)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {isTransferModalOpen && activeTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <span>نقل طاولة {activeTableModal.number} إلى طاولة أخرى</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                اختر الطاولة الشاغرة البديلة:
              </label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="">-- حدد طاولة شاغرة --</option>
                {tables
                  .filter((t) => t.status === 'available')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      طاولة {t.number} ({t.seats} مقاعد)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={!transferTargetId}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs disabled:opacity-50"
              >
                تأكيد النقل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Tables Modal */}
      {isMergeModalOpen && activeTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <Merge className="w-4 h-4 text-purple-400" />
              <span>دمج طاولة {activeTableModal.number} مع طاولة أخرى</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                اختر الطاولة المشغولة لضم الحساب إليها:
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
              >
                <option value="">-- حدد طاولة مشغولة --</option>
                {tables
                  .filter((t) => t.status === 'occupied' && t.id !== activeTableModal.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      طاولة {t.number}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={!mergeTargetId}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs disabled:opacity-50"
              >
                تأكيد الدمج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

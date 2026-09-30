/**
 * GRINE RESTAURANT POS - Inventory & Warehouse Management View
 * Real stock tracking, inventory movements (Stock In, Waste, Adjustments, Sales),
 * low stock alerts, cost valuations in DA, and full audit trail.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Product } from '../types/pos';
import { formatDZD } from '../i18n/translations';
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Plus,
  X,
  History,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    products,
    updateProduct,
    inventoryMovements,
    recordInventoryAdjustment,
    restaurantSettings,
    t,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);

  // Adjustment modal state
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'WASTE' | 'ADJUSTMENT'>('STOCK_IN');
  const [adjustDelta, setAdjustDelta] = useState<string>('10');
  const [adjustReason, setAdjustReason] = useState<string>('توريد بضاعة جديدة من المورد');

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.nameAr.toLowerCase().includes(q) ||
      p.nameFr?.toLowerCase().includes(q) ||
      p.nameEn?.toLowerCase().includes(q)
    );
  });

  // Calculate total inventory valuation
  const totalStockValue = products.reduce((acc, p) => {
    if (!p.stockTracking) return acc;
    const unitCost = p.costPrice || p.price * 0.5;
    return acc + p.currentStock * unitCost;
  }, 0);

  const lowStockCount = products.filter((p) => p.stockTracking && p.currentStock <= p.minStockAlert).length;

  const handleExecuteAdjust = () => {
    if (!selectedProductForAdjust) return;
    const qty = parseFloat(adjustDelta) || 0;
    if (qty <= 0 && adjustType !== 'ADJUSTMENT') return;

    recordInventoryAdjustment(selectedProductForAdjust.id, adjustType, qty, adjustReason.trim());
    setSelectedProductForAdjust(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 select-none">
      {/* Top Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>{t.inventoryTitle}</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            متابعة حركة المخزون، الكميات المتوفرة، الهالك، والتكاليف بالدينار الجزائري
          </div>
        </div>

        {/* Inventory Summary Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">إجمالي قيمة المخزون</span>
              <span className="text-sm font-mono font-black text-emerald-400 tabular-nums">
                {formatDZD(totalStockValue)}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">تنبيهات انخفاض المخزون</span>
              <span className="text-sm font-mono font-black text-rose-400 tabular-nums">
                {lowStockCount} أصناف
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'stock'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            قائمة المخزون للأصناف ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'movements'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.movementHistory} ({inventoryMovements.length})
          </button>
        </div>

        {activeTab === 'stock' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المخزون..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl ps-9 pe-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col">
        {activeTab === 'stock' ? (
          /* Products Stock Table */
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-start">{t.productName}</th>
                  <th className="py-3 px-4 text-center">تتبع المخزون</th>
                  <th className="py-3 px-4 text-center">{t.currentStock}</th>
                  <th className="py-3 px-4 text-center">{t.minStock}</th>
                  <th className="py-3 px-4 text-center">{t.unitCost}</th>
                  <th className="py-3 px-4 text-center">{t.sellingPrice}</th>
                  <th className="py-3 px-4 text-center">{t.stockStatus}</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProducts.map((p) => {
                  const isLow = p.stockTracking && p.currentStock <= p.minStockAlert;
                  const isOut = p.stockTracking && p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{p.nameAr}</div>
                        <div className="text-[10px] text-slate-400">{p.nameFr || p.nameEn}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.stockTracking
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.stockTracking ? 'مفعل' : 'غير متتبع'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-100 text-sm">
                        {p.stockTracking ? `${p.currentStock} ${p.unit || ''}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {p.stockTracking ? `${p.minStockAlert} ${p.unit || ''}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {p.costPrice ? formatDZD(p.costPrice) : '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                        {formatDZD(p.price)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {p.stockTracking ? (
                          isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              نفد
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              منخفض
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              متوفر
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedProductForAdjust(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition-colors"
                        >
                          تسوية / تعديل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Movements History Table */
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-start">التاريخ والوقت</th>
                  <th className="py-3 px-4 text-start">الصنف</th>
                  <th className="py-3 px-4 text-center">نوع الحركة</th>
                  <th className="py-3 px-4 text-center">الكمية</th>
                  <th className="py-3 px-4 text-center">الرصيد بعد الحركة</th>
                  <th className="py-3 px-4 text-start">البيان / السبب</th>
                  <th className="py-3 px-4 text-start">المستخدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {inventoryMovements.map((mov) => {
                  const isPositive = mov.quantityDelta > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(mov.createdAt).toLocaleString('fr-DZ', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-200">
                        {mov.productName}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mov.type === 'STOCK_IN'
                              ? 'bg-emerald-950 text-emerald-300'
                              : mov.type === 'SALE_DEDUCTION'
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {mov.type === 'STOCK_IN'
                            ? 'توريد'
                            : mov.type === 'SALE_DEDUCTION'
                            ? 'بيع'
                            : mov.type === 'WASTE'
                            ? 'هالك'
                            : 'تسوية'}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-4 text-center font-mono font-bold text-sm ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {mov.newStock}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {mov.reason || (mov.orderId ? `طلب رقم #${mov.orderId.slice(-6)}` : '—')}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {mov.userName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-100">
                  تعديل مخزون: {selectedProductForAdjust.nameAr}
                </h4>
                <div className="text-xs text-amber-400 font-mono mt-0.5">
                  الرصيد الحالي: {selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForAdjust(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('STOCK_IN')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  adjustType === 'STOCK_IN'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                توريد (+)
              </button>

              <button
                type="button"
                onClick={() => setAdjustType('WASTE')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  adjustType === 'WASTE'
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                هالك / تالف (-)
              </button>

              <button
                type="button"
                onClick={() => setAdjustType('ADJUSTMENT')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  adjustType === 'ADJUSTMENT'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                جرد يدوي (=)
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                {adjustType === 'ADJUSTMENT' ? 'الكمية الإجمالية الجديدة' : 'الكمية المراد تعديلها'}
              </label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                min="1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                السبب أو رقم فاتورة التوريد
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="بيان حركة المخزون..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedProductForAdjust(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteAdjust}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
              >
                تأكيد حركة المخزون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

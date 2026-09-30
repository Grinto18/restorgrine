/**
 * GRINE RESTAURANT POS - Financial Reports & Sales Analytics View
 * Daily, weekly, monthly reports, payment breakdown (Cash, CIB, Dahabia),
 * top sellers, discount audit, cancellations, and CSV Export.
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatDZD } from '../i18n/translations';
import { Order } from '../types/pos';
import {
  BarChart3,
  Calendar,
  Download,
  CreditCard,
  Banknote,
  Sparkles,
  TrendingUp,
  Percent,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { orders, t } = usePOS();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);

      if (dateRange === 'today') {
        return orderDate >= startOfToday;
      } else if (dateRange === 'week') {
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= startOfWeek;
      } else if (dateRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= startOfMonth;
      }
      return true;
    });
  }, [orders, dateRange]);

  const paidOrders = filteredOrders.filter((o) => o.status === 'PAID');
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'CANCELLED');

  // Metrics calculations
  const totalSales = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalDiscount = paidOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const totalSubtotal = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0;

  // Payments breakdown
  const cashSales = paidOrders
    .filter((o) => o.payment?.method === 'CASH')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const cibSales = paidOrders
    .filter((o) => o.payment?.method === 'CIB')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const dahabiaSales = paidOrders
    .filter((o) => o.payment?.method === 'DAHABIA')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const otherSales = paidOrders
    .filter((o) => o.payment?.method === 'OTHER')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  // Top products calculation
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (!counts[item.productId]) {
          counts[item.productId] = {
            name: item.productNameAr,
            quantity: 0,
            revenue: 0,
          };
        }
        counts[item.productId].quantity += item.quantity;
        counts[item.productId].revenue += item.totalPrice;
      }
    }
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 8);
  }, [paidOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Type',
      'Table',
      'Status',
      'Subtotal (DA)',
      'Discount (DA)',
      'Total (DA)',
      'Payment Method',
      'Cashier',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('fr-DZ'),
      o.orderType,
      o.tableNumber || '',
      o.status,
      o.subtotal,
      o.discountAmount,
      o.grandTotal,
      o.payment?.method || '',
      o.cashierName,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRINE_Sales_Report_${dateRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 select-none">
      {/* Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>{t.reportsTitle}</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            تحليل الإيرادات، المدفوعات بالدينار الجزائري (DA)، والأصناف الأكثر طلباً
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'today'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'week'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              type="button"
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'month'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'all'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Main Analytics Cards */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400">{t.todaySales}</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-2 tabular-nums">
              {formatDZD(totalSales)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">صافي الإيرادات المحصلة</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400">{t.ordersCount}</span>
            <div className="text-2xl font-black font-mono text-blue-400 mt-2 tabular-nums">
              {paidOrders.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{cancelledOrders.length} طلبات ملغاة</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400">{t.avgOrderValue}</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-2 tabular-nums">
              {formatDZD(avgOrderValue)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">متوسط قيمة الفاتورة</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الخصومات الممنوحة</span>
            <div className="text-2xl font-black font-mono text-rose-400 mt-2 tabular-nums">
              {formatDZD(totalDiscount)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">تخفيضات معتمدة</span>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h3 className="font-extrabold text-sm text-slate-200">{t.paymentBreakdown}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">{t.payCash}</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {formatDZD(cashSales)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">{t.payCib}</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {formatDZD(cibSales)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">{t.payDahabia}</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {formatDZD(dahabiaSales)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">{t.payOther}</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {formatDZD(otherSales)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>{t.topSelling}</span>
            </h3>

            {topProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                لا توجد مبيعات مسجلة في هذا النطاق الزمني
              </div>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-200">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{p.quantity} طلب</span>
                      <span className="font-mono font-bold text-amber-400 tabular-nums">
                        {formatDZD(p.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancelled Orders Log */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>الطلبات الملغاة ({cancelledOrders.length})</span>
            </h3>

            {cancelledOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                لا توجد طلبات ملغاة في هذه الفترة
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cancelledOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-slate-950 p-2.5 rounded-xl border border-rose-900/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-rose-400">{o.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        السبب: {o.cancellationReason || 'غير محدد'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-mono font-bold text-slate-300">
                        {formatDZD(o.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">{o.cancelledBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

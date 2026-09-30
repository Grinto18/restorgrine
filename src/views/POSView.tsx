/**
 * GRINE RESTAURANT POS - Main POS Cashier Sales View
 * High-speed touch-friendly ordering interface with instant search, category filters,
 * responsive product grid, item variants, and reactive cart sidebar.
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatDZD } from '../i18n/translations';
import { Product } from '../types/pos';
import { ProductVariantModal } from '../components/ProductVariantModal';
import { PaymentModal } from '../components/PaymentModal';
import { DiscountModal } from '../components/DiscountModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Printer,
  XCircle,
  Percent,
  UtensilsCrossed,
  Tag,
  Flame,
  ChefHat,
  ShoppingBag,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const {
    categories,
    products,
    selectedCategory,
    setSelectedCategory,
    currentOrder,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    sendOrderToKitchen,
    selectedTable,
    orderType,
    setActiveView,
    setPreviewReceiptOrder,
    t,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.available);

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameFr?.toLowerCase().includes(q) ||
          p.nameEn?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const handleProductClick = (product: Product) => {
    // If product has variants (like Pizza L/XL) or modifiers, open modal
    if ((product.variants && product.variants.length > 0) || (product.modifiers && product.modifiers.length > 0)) {
      setSelectedProductForModal(product);
    } else {
      addItemToCart(product);
    }
  };

  const handleSendToKitchen = async () => {
    if (currentOrder.items.length === 0) return;
    setIsSendingToKitchen(true);
    try {
      await sendOrderToKitchen();
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">
      {/* ================= Center Area: Catalog & Products ================= */}
      <div className="flex-1 flex flex-col min-w-0 border-e border-slate-800">
        {/* Search Bar & Top Action Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              id="product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl ps-9 pe-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-500 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Table Switcher Indicator */}
          {orderType === 'dine_in' && (
            <button
              type="button"
              onClick={() => setActiveView('tables')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 transition-all shrink-0"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>
                {selectedTable ? `طاولة ${selectedTable.number}` : t.selectTable}
              </span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {t.allCategories}
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.nameAr}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-semibold">لم يتم العثور على أطباق مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((product) => {
                const hasVariants = product.variants && product.variants.length > 0;
                const isLowStock = product.stockTracking && product.currentStock <= product.minStockAlert;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-3 text-start flex flex-col justify-between transition-all duration-150 active:scale-[0.98] shadow-sm hover:shadow-lg hover:shadow-amber-500/5"
                  >
                    <div>
                      {/* Name & Subtitle */}
                      <h4 className="font-extrabold text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                        {product.nameAr}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {product.nameFr || product.nameEn}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {/* Price in Algerian Dinar */}
                      <div className="font-mono font-black text-amber-400 text-sm tabular-nums">
                        {hasVariants ? `من ${formatDZD(product.price)}` : formatDZD(product.price)}
                      </div>

                      {/* Add Button / Indicator */}
                      <div className="w-7 h-7 rounded-xl bg-slate-800 group-hover:bg-amber-500 text-slate-300 group-hover:text-slate-950 flex items-center justify-center transition-colors shadow-sm">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Low stock tag if tracked */}
                    {isLowStock && (
                      <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-rose-500" title="مخزون منخفض" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= Right Area: Order Cart Sidebar ================= */}
      <div className="w-80 lg:w-96 flex flex-col bg-slate-900 shrink-0 select-none shadow-xl z-10">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400">
                {currentOrder.orderNumber}
              </span>
              {currentOrder.tableNumber && (
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">
                  طاولة {currentOrder.tableNumber}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentOrder.items.length} أصناف • {currentOrder.orderType.toUpperCase()}
            </div>
          </div>

          {currentOrder.items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-slate-900 transition-colors"
              title={t.clearCart}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {currentOrder.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <UtensilsCrossed className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
              <div className="font-bold text-sm text-slate-300">{t.emptyCartTitle}</div>
              <div className="text-xs mt-1 leading-relaxed">{t.emptyCartSubtitle}</div>
            </div>
          ) : (
            currentOrder.items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-slate-100 truncate">
                      {item.productNameAr}
                    </div>
                    {item.selectedVariant && (
                      <span className="text-[10px] text-amber-400 font-semibold">
                        ({item.selectedVariant.nameAr})
                      </span>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        + {item.modifiers.map((m) => m.nameAr).join(', ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[10px] text-amber-300/90 italic">
                        * {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="font-mono font-bold text-amber-400 text-sm shrink-0 tabular-nums">
                    {formatDZD(item.totalPrice)}
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemFromCart(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals Summary */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>{t.subtotal}</span>
              <span className="font-mono tabular-nums">{formatDZD(currentOrder.subtotal)}</span>
            </div>

            {/* Discount Line */}
            {currentOrder.discountAmount > 0 && (
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>
                  {t.discount} ({currentOrder.discountValue}
                  {currentOrder.discountType === 'PERCENT' ? '%' : ' DA'})
                </span>
                <span className="font-mono tabular-nums">-{formatDZD(currentOrder.discountAmount)}</span>
              </div>
            )}

            {/* Tax Line if enabled */}
            {currentOrder.taxAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>{t.tax}</span>
                <span className="font-mono tabular-nums">+{formatDZD(currentOrder.taxAmount)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="font-extrabold text-sm text-slate-200">{t.grandTotal}</span>
              <span className="font-mono font-black text-2xl text-amber-400 tracking-tight tabular-nums">
                {formatDZD(currentOrder.grandTotal)}
              </span>
            </div>
          </div>

          {/* Quick Order Actions (Discount, Preview, Cancel) */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsDiscountOpen(true)}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Percent className="w-3 h-3 text-amber-400" />
              <span>{t.discount}</span>
            </button>

            <button
              id="btn-print-receipt"
              type="button"
              onClick={() => setPreviewReceiptOrder(currentOrder)}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1 transition-colors"
              title="معاينة وطباعة الفاتورة (F5)"
            >
              <Printer className="w-3 h-3 text-blue-400" />
              <span>معاينة (F5)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCancelOpen(true)}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-rose-400 flex items-center justify-center gap-1 transition-colors"
            >
              <XCircle className="w-3 h-3 text-rose-400" />
              <span>إلغاء</span>
            </button>
          </div>

          {/* Primary Action Buttons: Send to Kitchen & Payment */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleSendToKitchen}
              disabled={currentOrder.items.length === 0 || isSendingToKitchen}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChefHat className="w-4 h-4" />
              <span>{isSendingToKitchen ? 'جاري الإرسال...' : t.sendToKitchen}</span>
            </button>

            <button
              id="btn-pay-order"
              type="button"
              onClick={() => setIsPaymentOpen(true)}
              disabled={currentOrder.items.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.payOrder}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedProductForModal && (
        <ProductVariantModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}

      {isDiscountOpen && (
        <DiscountModal
          isOpen={isDiscountOpen}
          onClose={() => setIsDiscountOpen(false)}
        />
      )}

      {isCancelOpen && (
        <CancelOrderModal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
        />
      )}
    </div>
  );
};

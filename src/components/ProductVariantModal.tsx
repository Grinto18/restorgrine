/**
 * GRINE RESTAURANT POS - Product Variant, Extras & Notes Modal
 * Specifically supports Pizza L/XL sizes, sauces, extras, and kitchen notes.
 */

import React, { useState } from 'react';
import { Product, ProductVariant, ProductModifier } from '../types/pos';
import { usePOS } from '../context/POSContext';
import { formatDZD } from '../i18n/translations';
import { X, Plus, Check } from 'lucide-react';

interface ProductVariantModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductVariantModal: React.FC<ProductVariantModalProps> = ({ product, onClose }) => {
  const { addItemToCart, t } = usePOS();

  if (!product) return null;

  const variants = product.variants || [];
  const modifiers = product.modifiers || [];

  // Default to first variant if variants exist
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    variants.length > 0 ? variants[0].id : undefined
  );
  const [selectedModifiers, setSelectedModifiers] = useState<ProductModifier[]>([]);
  const [itemNotes, setItemNotes] = useState<string>('');

  const toggleModifier = (mod: ProductModifier) => {
    if (selectedModifiers.some((m) => m.id === mod.id)) {
      setSelectedModifiers(selectedModifiers.filter((m) => m.id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const totalPrice = basePrice + modifiersTotal;

  const handleAddToCart = () => {
    addItemToCart(product, selectedVariantId, selectedModifiers, itemNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="font-extrabold text-slate-100 text-base">{product.nameAr}</h3>
            <p className="text-xs text-slate-400">{product.nameFr || product.nameEn}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Variants Selection (e.g. Pizza L / XL) */}
          {variants.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                {t.size} / الحجم المطلوب
              </label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm">{v.nameAr}</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {formatDZD(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras / Modifiers (e.g. صلصة بيضاء, فرماج) */}
          {modifiers.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                {t.extras} / الإضافات
              </label>
              <div className="space-y-2">
                {modifiers.map((mod) => {
                  const isChecked = selectedModifiers.some((m) => m.id === mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod)}
                      className={`w-full p-2.5 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span>{mod.nameAr}</span>
                      </div>
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        +{formatDZD(mod.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {t.addNotes} / ملاحظات خاصة للمطبخ
            </label>
            <input
              type="text"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="مثال: بدون بصل، صوص حار زيادة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-start">
            <span className="text-[11px] text-slate-400 block">{t.grandTotal}</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {formatDZD(totalPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إلى الطلب</span>
          </button>
        </div>
      </div>
    </div>
  );
};

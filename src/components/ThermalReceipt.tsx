/**
 * GRINE RESTAURANT POS - Printable Thermal Receipt Component
 * Specifically designed for 58mm Narrow Roll (default ~48-52mm printable canvas)
 * and 80mm standard roll. High contrast, monospace alignment, zero clipping.
 */

import React from 'react';
import { Order, PaperWidth } from '../types/pos';
import { formatDZD } from '../i18n/translations';

interface ThermalReceiptProps {
  order: Order;
  paperWidth?: PaperWidth;
  restaurantName?: string;
  restaurantSlogan?: string;
  phone?: string;
  address?: string;
  isReprint?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  paperWidth = '58mm',
  restaurantName = 'GRINE RESTAURANT',
  restaurantSlogan = 'Good Food • Good Mood',
  phone = '+213 550 00 00 00',
  address = 'الجزائر العاصمة',
  isReprint = false,
}) => {
  const is58mm = paperWidth === '58mm';
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-DZ');
  const orderTime = new Date(order.createdAt).toLocaleTimeString('fr-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`font-mono text-black bg-white select-text mx-auto p-2 leading-tight ${
        is58mm ? 'w-[56mm] max-w-[56mm] text-[11px]' : 'w-[78mm] max-w-[78mm] text-[13px]'
      }`}
      style={{
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        fontFamily: "'Courier New', Courier, monospace, 'Cairo'",
      }}
    >
      {/* Reprint Banner if authorized reprint */}
      {isReprint && (
        <div className="text-center font-bold border-b border-black py-0.5 text-xs mb-1">
          *** إيصال معاد طباعته (REPRINT) ***
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-1">
        <h1 className="text-base font-black tracking-wider uppercase mb-0.5">{restaurantName}</h1>
        <div className="text-[10px] font-semibold">{restaurantSlogan}</div>
        <div className="text-[9px] text-gray-700">{address} • {phone}</div>
        <div className="border-b border-dashed border-black my-1" />
      </div>

      {/* Order Metadata */}
      <div className="text-[10px] space-y-0.5 mb-1">
        <div className="flex justify-between font-bold">
          <span>Order: {order.orderNumber}</span>
          <span>{orderDate}</span>
        </div>
        <div className="flex justify-between">
          <span>
            {order.tableNumber ? `Table: ${order.tableNumber}` : `Type: ${order.orderType.toUpperCase()}`}
          </span>
          <span>{orderTime}</span>
        </div>
        <div>Cashier: {order.cashierName}</div>
        <div className="border-b border-dashed border-black my-1" />
      </div>

      {/* Items Table Header */}
      <div className="flex justify-between font-bold text-[10px] border-b border-black pb-0.5 mb-1">
        <span>ARTICLE / QTE</span>
        <span>TOTAL</span>
      </div>

      {/* Item Lines */}
      <div className="space-y-1 mb-1">
        {order.items.map((item) => (
          <div key={item.id} className="text-[10px]">
            <div className="flex justify-between items-start">
              <span className="font-semibold pe-1 flex-1">
                {item.quantity} x {item.productNameAr}
                {item.selectedVariant && (
                  <span className="text-[9px] text-gray-700"> ({item.selectedVariant.nameAr})</span>
                )}
              </span>
              <span className="font-bold tabular-nums shrink-0">
                {formatDZD(item.totalPrice)}
              </span>
            </div>

            {/* Extras / Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ps-2 text-[9px] text-gray-600">
                {item.modifiers.map((m, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>+ {m.nameAr}</span>
                    <span>+{formatDZD(m.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div className="ps-2 text-[9px] italic text-gray-600">
                * {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-black my-1" />

      {/* Financial Totals */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal / المجموع:</span>
          <span className="tabular-nums">{formatDZD(order.subtotal)}</span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex justify-between font-semibold">
            <span>Discount / تخفيض:</span>
            <span className="tabular-nums">-{formatDZD(order.discountAmount)}</span>
          </div>
        )}

        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>TVA / الضريبة:</span>
            <span className="tabular-nums">+{formatDZD(order.taxAmount)}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between text-xs font-black border-t border-b border-black py-1 my-1">
          <span>TOTAL / المجموع الكلي:</span>
          <span className="tabular-nums text-sm">{formatDZD(order.grandTotal)}</span>
        </div>
      </div>

      {/* Payment Information */}
      {order.payment && (
        <div className="text-[10px] space-y-0.5 my-1">
          <div className="flex justify-between">
            <span>Payment / الدفع:</span>
            <span className="font-bold">{order.payment.method}</span>
          </div>
          {order.payment.method === 'CASH' && (
            <>
              <div className="flex justify-between">
                <span>Paid / المستلم:</span>
                <span className="tabular-nums">{formatDZD(order.payment.amountReceived)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change / الصرف المتبقي:</span>
                <span className="tabular-nums">{formatDZD(order.payment.changeGiven)}</span>
              </div>
            </>
          )}
          <div className="border-b border-dashed border-black my-1" />
        </div>
      )}

      {/* Multilingual Footer Gratitude as strictly requested */}
      <div className="text-center pt-1 text-[10px] space-y-0.5">
        <div className="font-bold">Thank you</div>
        <div>Merci</div>
        <div className="font-bold">شكراً لزيارتكم</div>
        <div className="text-[8px] text-gray-500 pt-1">
          {order.id} • {order.orderNumber}
        </div>
      </div>
    </div>
  );
};

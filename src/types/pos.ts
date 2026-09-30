/**
 * GRINE RESTAURANT POS - Data Models & Types
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

export interface User {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-digit PIN for rapid POS touch switching
  role: UserRole;
  active: boolean;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'counter';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  seats: number;
  status: TableStatus;
  currentOrderId?: string;
  openedAt?: string;
  waiterName?: string;
  notes?: string;
}

export type KitchenStation = 
  | 'GRILL' 
  | 'PIZZA' 
  | 'TACOS' 
  | 'SEAFOOD' 
  | 'DESSERT' 
  | 'DRINKS' 
  | 'MAIN_KITCHEN';

export interface Category {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  icon?: string;
  sortOrder: number;
  defaultStation: KitchenStation;
}

export interface ProductVariant {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  price: number; // in DZD (integer)
  sku?: string;
}

export interface ProductModifier {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  price: number; // additional price in DZD
}

export interface Product {
  id: string;
  categoryId: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  price: number; // Base price in DZD
  costPrice?: number;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  available: boolean;
  stockTracking: boolean;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  station: KitchenStation;
  variants?: ProductVariant[];
  modifiers?: ProductModifier[];
  sortOrder: number;
}

export interface CartItemModifier {
  modifierId: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  price: number;
}

export interface OrderItem {
  id: string; // unique item line id
  productId: string;
  productNameAr: string;
  productNameFr: string;
  productNameEn: string;
  selectedVariant?: {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    price: number;
  };
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  modifiers: CartItemModifier[];
  notes?: string;
  station: KitchenStation;
  kitchenStatus?: 'PENDING' | 'SENT' | 'PREPARING' | 'READY' | 'SERVED';
}

export type PaymentMethod = 'CASH' | 'CIB' | 'DAHABIA' | 'OTHER';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amountDue: number;
  amountReceived: number;
  changeGiven: number;
  reference?: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
}

export type OrderStatus = 'OPEN' | 'SENT_TO_KITCHEN' | 'PAID' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string; // GR-000001
  orderType: OrderType;
  tableNumber?: number;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  discountType?: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  discountApprovedBy?: string;
  discountReason?: string;
  taxAmount: number;
  grandTotal: number;
  status: OrderStatus;
  payment?: PaymentRecord;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  cashierId: string;
  cashierName: string;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  printCount: number;
  lastPrintedAt?: string;
  idempotencyKey?: string;
}

export type KitchenStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED';

export interface KitchenTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: number;
  items: OrderItem[];
  station: KitchenStation;
  status: KitchenStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cashierName: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'STOCK_IN' | 'SALE_DEDUCTION' | 'WASTE' | 'ADJUSTMENT' | 'RETURN' | 'CANCELLATION_REFUND';
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  orderId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface CashShift {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  cashSales: number;
  cibSales: number;
  dahabiaSales: number;
  otherSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface CashMovement {
  id: string;
  shiftId: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  reason: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type PaperWidth = '58mm' | '80mm';
export type PrinterConnectionType = 'browser' | 'bridge' | 'lan';

export interface PrinterSettings {
  paperWidth: PaperWidth;
  connectionType: PrinterConnectionType;
  bridgeUrl: string; // e.g. http://localhost:8008
  selectedPrinterName: string;
  lanPrinterIp: string;
  lanPrinterPort: number;
  autoPrintReceiptOnPayment: boolean;
  autoPrintKitchenOnOrder: boolean;
  openCashDrawerOnCashSale: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  restaurantSlogan: string;
  phone: string;
  address: string;
  city: string;
  taxRatePercent: number;
  enableTax: boolean;
  currencySymbol: string;
  receiptFooterAr: string;
  receiptFooterFr: string;
  receiptFooterEn: string;
  allowNegativeStock: boolean;
  maxCashierDiscountPercent: number;
  defaultPaperWidth: PaperWidth;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  reference?: string;
  createdAt: string;
}

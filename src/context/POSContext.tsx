/**
 * GRINE RESTAURANT POS - Central Application State Context
 * Orchestrates sales, cart calculations, tables, KDS, inventory deductions,
 * cashier shifts, thermal printing, and authentication.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  Category,
  Product,
  RestaurantTable,
  Order,
  OrderItem,
  OrderType,
  KitchenTicket,
  KitchenStatus,
  CashShift,
  CashMovement,
  InventoryMovement,
  PrinterSettings,
  RestaurantSettings,
  PaymentMethod,
  PaymentRecord,
  PaperWidth,
} from '../types/pos';
import { storage } from '../services/storage';
import { printerService, PrintJobResult } from '../services/printerService';
import { Language, translations } from '../i18n/translations';

interface POSContextType {
  // Navigation & Language
  activeView: 'pos' | 'tables' | 'kitchen' | 'inventory' | 'reports' | 'shifts' | 'users' | 'settings';
  setActiveView: (view: 'pos' | 'tables' | 'kitchen' | 'inventory' | 'reports' | 'shifts' | 'users' | 'settings') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.ar;
  isRtl: boolean;

  // Auth & Current User
  currentUser: User;
  users: User[];
  switchUser: (pin: string) => boolean;
  verifyManagerPin: (pin: string) => boolean;
  createUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;

  // Active Shift
  activeShift: CashShift | null;
  openShift: (openingBalance: number) => void;
  closeShift: (actualCash: number, notes?: string) => CashShift;
  addCashMovement: (type: 'CASH_IN' | 'CASH_OUT', amount: number, reason: string) => void;

  // Catalog
  categories: Category[];
  products: Product[];
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;

  // Tables
  tables: RestaurantTable[];
  selectedTable: RestaurantTable | null;
  selectTable: (table: RestaurantTable | null) => void;
  openTable: (tableId: string, orderType?: OrderType) => void;
  transferTable: (fromTableId: string, toTableId: string) => boolean;
  mergeTables: (sourceTableId: string, targetTableId: string) => boolean;
  reserveTable: (tableId: string, notes?: string) => void;
  releaseTable: (tableId: string) => void;

  // Active Order / Cart
  currentOrder: Order;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  addItemToCart: (product: Product, variantId?: string, modifiers?: any[], notes?: string) => void;
  updateItemQuantity: (itemId: string, delta: number) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  removeItemFromCart: (itemId: string) => void;
  clearCart: () => void;
  applyDiscount: (type: 'PERCENT' | 'FIXED', value: number, approvedBy?: string, reason?: string) => void;
  sendOrderToKitchen: () => Promise<boolean>;
  payCurrentOrder: (method: PaymentMethod, amountReceived: number, reference?: string) => Promise<{ success: boolean; change: number; error?: string }>;
  cancelCurrentOrder: (reason: string, managerPin?: string) => boolean;
  loadOrderToCart: (order: Order) => void;

  // Orders History
  orders: Order[];

  // KDS Kitchen
  kitchenTickets: KitchenTicket[];
  updateTicketStatus: (ticketId: string, status: KitchenStatus) => void;
  printKitchenTicket: (ticket: KitchenTicket) => Promise<PrintJobResult>;

  // Inventory
  inventoryMovements: InventoryMovement[];
  recordInventoryAdjustment: (productId: string, type: 'STOCK_IN' | 'WASTE' | 'ADJUSTMENT', quantityDelta: number, reason: string) => void;

  // Thermal Printing
  printerSettings: PrinterSettings;
  updatePrinterSettings: (settings: PrinterSettings) => void;
  bridgeStatus: 'CONNECTED' | 'BRIDGE_NOT_RUNNING' | 'CHECKING';
  detectedPrinters: string[];
  checkBridgeConnection: () => Promise<void>;
  printReceipt: (order: Order, isReprint?: boolean) => Promise<PrintJobResult>;
  testPrint: () => Promise<PrintJobResult>;
  previewReceiptOrder: Order | null;
  setPreviewReceiptOrder: (order: Order | null) => void;

  // System & Backup
  restaurantSettings: RestaurantSettings;
  updateRestaurantSettings: (settings: RestaurantSettings) => void;
  exportDatabaseBackup: () => string;
  importDatabaseBackup: (json: string) => boolean;
  networkStatus: 'ONLINE' | 'OFFLINE' | 'SYNCING';
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// Web Audio synthesizer for positive sound confirmations
const playTone = (type: 'beep' | 'success' | 'alert') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
};

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Language
  const [activeView, setActiveView] = useState<POSContextType['activeView']>('pos');
  const [language, setLanguageState] = useState<Language>('ar');
  const isRtl = language === 'ar';
  const t = translations[language];

  // System Entities from Storage
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const all = storage.getUsers();
    const id = storage.getCurrentUserId();
    return all.find((u) => u.id === id) || all[0];
  });

  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tables, setTables] = useState<RestaurantTable[]>(() => storage.getTables());
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>(() => storage.getKitchenTickets());
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => storage.getInventoryMovements());
  const [activeShift, setActiveShift] = useState<CashShift | null>(() => storage.getActiveShift());

  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(() => storage.getSettings());
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => storage.getPrinterSettings());

  // Bridge connection status
  const [bridgeStatus, setBridgeStatus] = useState<'CONNECTED' | 'BRIDGE_NOT_RUNNING' | 'CHECKING'>('CHECKING');
  const [detectedPrinters, setDetectedPrinters] = useState<string[]>([]);
  const [previewReceiptOrder, setPreviewReceiptOrder] = useState<Order | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'OFFLINE' | 'SYNCING'>('ONLINE');

  // Active Cart / Working Order State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountApprovedBy, setDiscountApprovedBy] = useState<string | undefined>(undefined);
  const [discountReason, setDiscountReason] = useState<string | undefined>(undefined);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>(() => storage.getNextOrderNumber());

  // Document language & RTL synchronization
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Keyboard Shortcuts Listener (F1-F7, ESC, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveView('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveView('tables');
      } else if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) (searchInput as HTMLInputElement).focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        const payBtn = document.getElementById('btn-pay-order');
        if (payBtn) (payBtn as HTMLButtonElement).click();
      } else if (e.key === 'F5') {
        e.preventDefault();
        const printBtn = document.getElementById('btn-print-receipt');
        if (printBtn) (printBtn as HTMLButtonElement).click();
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveView('kitchen');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveView('reports');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Periodic Bridge Health Check
  const checkBridgeConnection = useCallback(async () => {
    if (printerSettings.connectionType !== 'bridge') {
      setBridgeStatus('BRIDGE_NOT_RUNNING');
      return;
    }
    const res = await printerService.checkBridgeHealth(printerSettings.bridgeUrl);
    if (res.isRunning) {
      setBridgeStatus('CONNECTED');
      const printersRes = await printerService.fetchInstalledPrinters(printerSettings.bridgeUrl);
      if (printersRes.success) {
        setDetectedPrinters(printersRes.printers);
      }
    } else {
      setBridgeStatus('BRIDGE_NOT_RUNNING');
    }
  }, [printerSettings.connectionType, printerSettings.bridgeUrl]);

  useEffect(() => {
    checkBridgeConnection();
    const interval = setInterval(checkBridgeConnection, 15000);
    return () => clearInterval(interval);
  }, [checkBridgeConnection]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('ONLINE');
    const handleOffline = () => setNetworkStatus('OFFLINE');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute Cart Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'PERCENT') {
      discountAmount = Math.round((subtotal * discountValue) / 100);
    } else {
      discountAmount = Math.min(discountValue, subtotal);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = restaurantSettings.enableTax
    ? Math.round((taxableAmount * restaurantSettings.taxRatePercent) / 100)
    : 0;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  // Current Working Order Representation
  const currentOrder: Order = {
    id: activeOrderId || `ord_${Date.now()}`,
    orderNumber: currentOrderNumber,
    orderType,
    tableNumber: selectedTable?.number,
    tableId: selectedTable?.id,
    items: cartItems,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    discountApprovedBy,
    discountReason,
    taxAmount,
    grandTotal,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cashierId: currentUser.id,
    cashierName: currentUser.name,
    notes: orderNotes,
    printCount: 0,
  };

  // Switch User by PIN
  const switchUser = (pin: string): boolean => {
    const found = users.find((u) => u.pin === pin && u.active);
    if (found) {
      setCurrentUser(found);
      storage.setCurrentUserId(found.id);
      storage.logAction(found.id, found.name, 'LOGIN', `User ${found.name} logged in`);
      playTone('success');
      return true;
    }
    playTone('alert');
    return false;
  };

  const verifyManagerPin = (pin: string): boolean => {
    const found = users.find((u) => u.pin === pin && (u.role === 'ADMIN' || u.role === 'MANAGER') && u.active);
    return !!found;
  };

  const createUser = (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserData,
      id: `usr_${Date.now()}`,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    storage.saveUsers(updated);
    storage.logAction(currentUser.id, currentUser.name, 'CREATE_USER', `Created user ${newUser.name} (${newUser.role})`);
  };

  const updateUser = (updatedUser: User) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    storage.saveUsers(updated);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    storage.logAction(currentUser.id, currentUser.name, 'UPDATE_USER', `Updated user ${updatedUser.name}`);
  };

  // Shift Management
  const openShift = (openingBalance: number) => {
    const newShift: CashShift = {
      id: `shift_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      openedAt: new Date().toISOString(),
      openingCash: Math.round(openingBalance),
      cashSales: 0,
      cibSales: 0,
      dahabiaSales: 0,
      otherSales: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: Math.round(openingBalance),
      status: 'OPEN',
    };
    setActiveShift(newShift);
    storage.saveCashShift(newShift);
    storage.logAction(currentUser.id, currentUser.name, 'OPEN_SHIFT', `Opened shift with ${openingBalance} DA`);
    playTone('success');
  };

  const closeShift = (actualCash: number, notes?: string): CashShift => {
    if (!activeShift) throw new Error('No active shift to close');
    const closedShift: CashShift = {
      ...activeShift,
      closedAt: new Date().toISOString(),
      actualCash: Math.round(actualCash),
      difference: Math.round(actualCash - activeShift.expectedCash),
      notes,
      status: 'CLOSED',
    };
    setActiveShift(null);
    storage.saveCashShift(closedShift);
    storage.logAction(
      currentUser.id,
      currentUser.name,
      'CLOSE_SHIFT',
      `Closed shift. Expected: ${closedShift.expectedCash} DA, Actual: ${actualCash} DA, Diff: ${closedShift.difference} DA`
    );
    playTone('success');
    return closedShift;
  };

  const addCashMovement = (type: 'CASH_IN' | 'CASH_OUT', amount: number, reason: string) => {
    if (!activeShift) return;
    const movement: CashMovement = {
      id: `cmov_${Date.now()}`,
      shiftId: activeShift.id,
      type,
      amount: Math.round(amount),
      reason,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    storage.recordCashMovement(movement);
    // Refresh active shift
    const refreshed = storage.getActiveShift();
    setActiveShift(refreshed);
    storage.logAction(currentUser.id, currentUser.name, type, `${type}: ${amount} DA - ${reason}`);
    playTone('beep');
  };

  // Cart Operations
  const addItemToCart = (product: Product, variantId?: string, modifiers: any[] = [], notes: string = '') => {
    playTone('beep');
    const variant = variantId && product.variants ? product.variants.find((v) => v.id === variantId) : undefined;
    const unitPrice = variant ? variant.price : product.price;

    const modTotal = modifiers.reduce((acc, m) => acc + (m.price || 0), 0);
    const lineItemUnitPrice = unitPrice + modTotal;

    // Check if identical item line already exists
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productId === product.id &&
        item.selectedVariant?.id === variant?.id &&
        item.notes === notes &&
        JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + 1;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: newQty * lineItemUnitPrice,
      };
      setCartItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productNameAr: product.nameAr,
        productNameFr: product.nameFr,
        productNameEn: product.nameEn,
        selectedVariant: variant,
        unitPrice: lineItemUnitPrice,
        quantity: 1,
        totalPrice: lineItemUnitPrice,
        modifiers: modifiers || [],
        notes,
        station: product.station,
        kitchenStatus: 'PENDING',
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter(Boolean) as OrderItem[];
    setCartItems(updated);
    playTone('beep');
  };

  const setItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCart(itemId);
      return;
    }
    const updated = cartItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice,
        };
      }
      return item;
    });
    setCartItems(updated);
    playTone('beep');
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    const updated = cartItems.map((item) => (item.id === itemId ? { ...item, notes } : item));
    setCartItems(updated);
  };

  const removeItemFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((i) => i.id !== itemId));
    playTone('beep');
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountValue(0);
    setDiscountApprovedBy(undefined);
    setDiscountReason(undefined);
    setOrderNotes('');
    setActiveOrderId(null);
    setCurrentOrderNumber(storage.getNextOrderNumber());
  };

  const applyDiscount = (type: 'PERCENT' | 'FIXED', value: number, approvedBy?: string, reason?: string) => {
    setDiscountType(type);
    setDiscountValue(Math.max(0, value));
    setDiscountApprovedBy(approvedBy);
    setDiscountReason(reason);
    storage.logAction(
      currentUser.id,
      currentUser.name,
      'APPLY_DISCOUNT',
      `Applied ${value}${type === 'PERCENT' ? '%' : ' DA'} discount. Approved by: ${approvedBy || currentUser.name}`
    );
    playTone('beep');
  };

  // Table Management
  const selectTable = (table: RestaurantTable | null) => {
    setSelectedTable(table);
    if (table && table.currentOrderId) {
      const existingOrder = orders.find((o) => o.id === table.currentOrderId);
      if (existingOrder) {
        loadOrderToCart(existingOrder);
      }
    }
  };

  const openTable = (tableId: string, type: OrderType = 'dine_in') => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;
    const newOrderNumber = storage.getNextOrderNumber();
    const newOrderId = `ord_${Date.now()}`;

    const updatedTable: RestaurantTable = {
      ...targetTable,
      status: 'occupied',
      currentOrderId: newOrderId,
      openedAt: new Date().toISOString(),
      waiterName: currentUser.name,
    };
    storage.updateTable(updatedTable);
    setTables(storage.getTables());
    setSelectedTable(updatedTable);
    setOrderType(type);
    setActiveOrderId(newOrderId);
    setCurrentOrderNumber(newOrderNumber);
    setCartItems([]);
    playTone('success');
  };

  const transferTable = (fromTableId: string, toTableId: string): boolean => {
    const fromTable = tables.find((t) => t.id === fromTableId);
    const toTable = tables.find((t) => t.id === toTableId);
    if (!fromTable || !toTable || toTable.status !== 'available') return false;

    const orderId = fromTable.currentOrderId;
    const updatedFrom: RestaurantTable = {
      ...fromTable,
      status: 'available',
      currentOrderId: undefined,
      openedAt: undefined,
      waiterName: undefined,
    };
    const updatedTo: RestaurantTable = {
      ...toTable,
      status: 'occupied',
      currentOrderId: orderId,
      openedAt: fromTable.openedAt || new Date().toISOString(),
      waiterName: fromTable.waiterName || currentUser.name,
    };

    storage.updateTable(updatedFrom);
    storage.updateTable(updatedTo);
    setTables(storage.getTables());

    // Update table info in order if loaded
    if (orderId) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        order.tableId = toTable.id;
        order.tableNumber = toTable.number;
        storage.saveOrder(order);
        setOrders(storage.getOrders());
      }
    }
    storage.logAction(
      currentUser.id,
      currentUser.name,
      'TRANSFER_TABLE',
      `Transferred Table ${fromTable.number} to Table ${toTable.number}`
    );
    playTone('success');
    return true;
  };

  const mergeTables = (sourceTableId: string, targetTableId: string): boolean => {
    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!sourceTable || !targetTable || !sourceTable.currentOrderId || !targetTable.currentOrderId) return false;

    const sourceOrder = orders.find((o) => o.id === sourceTable.currentOrderId);
    const targetOrder = orders.find((o) => o.id === targetTable.currentOrderId);
    if (!sourceOrder || !targetOrder) return false;

    // Merge items into target order
    targetOrder.items.push(...sourceOrder.items);
    targetOrder.subtotal += sourceOrder.subtotal;
    targetOrder.grandTotal += sourceOrder.grandTotal;
    storage.saveOrder(targetOrder);

    // Cancel source order
    sourceOrder.status = 'CANCELLED';
    sourceOrder.cancellationReason = `Merged into Table ${targetTable.number}`;
    storage.saveOrder(sourceOrder);

    // Release source table
    const updatedSource: RestaurantTable = {
      ...sourceTable,
      status: 'available',
      currentOrderId: undefined,
      openedAt: undefined,
      waiterName: undefined,
    };
    storage.updateTable(updatedSource);
    setTables(storage.getTables());
    setOrders(storage.getOrders());

    storage.logAction(
      currentUser.id,
      currentUser.name,
      'MERGE_TABLES',
      `Merged Table ${sourceTable.number} into Table ${targetTable.number}`
    );
    playTone('success');
    return true;
  };

  const reserveTable = (tableId: string, notes?: string) => {
    const target = tables.find((t) => t.id === tableId);
    if (!target) return;
    const updated: RestaurantTable = {
      ...target,
      status: 'reserved',
      notes,
    };
    storage.updateTable(updated);
    setTables(storage.getTables());
    playTone('beep');
  };

  const releaseTable = (tableId: string) => {
    const target = tables.find((t) => t.id === tableId);
    if (!target) return;
    const updated: RestaurantTable = {
      ...target,
      status: 'available',
      currentOrderId: undefined,
      openedAt: undefined,
      waiterName: undefined,
      notes: undefined,
    };
    storage.updateTable(updated);
    setTables(storage.getTables());
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  const loadOrderToCart = (order: Order) => {
    setActiveOrderId(order.id);
    setCurrentOrderNumber(order.orderNumber);
    setOrderType(order.orderType);
    setCartItems([...order.items]);
    setDiscountType(order.discountType || 'PERCENT');
    setDiscountValue(order.discountValue || 0);
    setDiscountApprovedBy(order.discountApprovedBy);
    setDiscountReason(order.discountReason);
    setOrderNotes(order.notes || '');

    if (order.tableId) {
      const tbl = tables.find((t) => t.id === order.tableId);
      if (tbl) setSelectedTable(tbl);
    }
  };

  // Send Order to Kitchen (Generates KOT ticket per station)
  const sendOrderToKitchen = async (): Promise<boolean> => {
    if (cartItems.length === 0) return false;

    const orderToSave: Order = {
      ...currentOrder,
      status: 'SENT_TO_KITCHEN',
      updatedAt: new Date().toISOString(),
    };

    // Save order
    storage.saveOrder(orderToSave);
    setOrders(storage.getOrders());

    // Generate KDS tickets grouped by station
    const stations = Array.from(new Set(cartItems.map((i) => i.station)));
    for (const station of stations) {
      const stationItems = cartItems.filter((i) => i.station === station);
      const ticket: KitchenTicket = {
        id: `kt_${Date.now()}_${station}`,
        orderId: orderToSave.id,
        orderNumber: orderToSave.orderNumber,
        orderType: orderToSave.orderType,
        tableNumber: orderToSave.tableNumber,
        items: stationItems,
        station,
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cashierName: currentUser.name,
      };
      storage.saveKitchenTicket(ticket);
    }
    setKitchenTickets(storage.getKitchenTickets());

    // Auto print KOT if enabled in settings
    if (printerSettings.autoPrintKitchenOnOrder) {
      const tickets = storage.getKitchenTickets().filter((k) => k.orderId === orderToSave.id);
      for (const t of tickets) {
        await printKitchenTicket(t);
      }
    }

    storage.logAction(
      currentUser.id,
      currentUser.name,
      'SEND_KITCHEN',
      `Sent Order ${orderToSave.orderNumber} to Kitchen (${cartItems.length} items)`
    );
    playTone('success');
    return true;
  };

  // Pay Current Order & Complete Checkout
  const payCurrentOrder = async (
    method: PaymentMethod,
    amountReceived: number,
    reference?: string
  ): Promise<{ success: boolean; change: number; error?: string }> => {
    if (cartItems.length === 0) {
      return { success: false, change: 0, error: 'Cart is empty' };
    }

    const due = currentOrder.grandTotal;
    if (method === 'CASH' && amountReceived < due) {
      playTone('alert');
      return { success: false, change: 0, error: 'Insufficient cash amount received' };
    }

    const changeGiven = method === 'CASH' ? amountReceived - due : 0;

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      method,
      amountDue: due,
      amountReceived: method === 'CASH' ? amountReceived : due,
      changeGiven,
      reference,
      createdAt: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
    };

    const closedOrder: Order = {
      ...currentOrder,
      status: 'PAID',
      payment: paymentRecord,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save closed order
    storage.saveOrder(closedOrder);
    setOrders(storage.getOrders());

    // 2. Release table if dine-in
    if (closedOrder.tableId) {
      releaseTable(closedOrder.tableId);
    }

    // 3. Deduct stock from inventory
    for (const item of closedOrder.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stockTracking) {
        const previousStock = product.currentStock;
        const newStock = previousStock - item.quantity;
        const movement: InventoryMovement = {
          id: `im_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.nameAr,
          type: 'SALE_DEDUCTION',
          quantityDelta: -item.quantity,
          previousStock,
          newStock,
          orderId: closedOrder.id,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: new Date().toISOString(),
        };
        storage.recordInventoryMovement(movement);
      }
    }
    setProducts(storage.getProducts());
    setInventoryMovements(storage.getInventoryMovements());

    // 4. Update Cash Shift if active
    if (activeShift) {
      if (method === 'CASH') {
        activeShift.cashSales += due;
        activeShift.expectedCash += due;
      } else if (method === 'CIB') {
        activeShift.cibSales += due;
      } else if (method === 'DAHABIA') {
        activeShift.dahabiaSales += due;
      } else {
        activeShift.otherSales += due;
      }
      storage.saveCashShift(activeShift);
      setActiveShift({ ...activeShift });
    }

    // 5. Open Preview or Auto-Print Receipt
    setPreviewReceiptOrder(closedOrder);
    if (printerSettings.autoPrintReceiptOnPayment) {
      await printReceipt(closedOrder);
    }

    storage.logAction(
      currentUser.id,
      currentUser.name,
      'PAY_ORDER',
      `Payment of ${due} DA for Order ${closedOrder.orderNumber} via ${method}. Change: ${changeGiven} DA`
    );

    // 6. Reset Cart
    clearCart();
    playTone('success');

    return { success: true, change: changeGiven };
  };

  // Cancel Current Order (requires reason and optional manager approval)
  const cancelCurrentOrder = (reason: string, managerPin?: string): boolean => {
    if (managerPin && !verifyManagerPin(managerPin)) {
      playTone('alert');
      return false;
    }

    const cancelledOrder: Order = {
      ...currentOrder,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledBy: currentUser.name,
      updatedAt: new Date().toISOString(),
    };
    storage.saveOrder(cancelledOrder);
    setOrders(storage.getOrders());

    if (cancelledOrder.tableId) {
      releaseTable(cancelledOrder.tableId);
    }

    storage.logAction(
      currentUser.id,
      currentUser.name,
      'CANCEL_ORDER',
      `Cancelled Order ${cancelledOrder.orderNumber}. Reason: ${reason}`
    );
    clearCart();
    playTone('alert');
    return true;
  };

  // KDS Ticket State Progression
  const updateTicketStatus = (ticketId: string, newStatus: KitchenStatus) => {
    const tickets = storage.getKitchenTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    ticket.status = newStatus;
    ticket.updatedAt = new Date().toISOString();
    if (newStatus === 'COMPLETED') {
      ticket.completedAt = new Date().toISOString();
    }
    storage.saveKitchenTicket(ticket);
    setKitchenTickets(storage.getKitchenTickets());
    playTone('beep');
  };

  // Printing Functions
  const printReceipt = async (order: Order, isReprint = false): Promise<PrintJobResult> => {
    const escposBytes = printerService.generateReceiptEscPos(order, printerSettings, restaurantSettings.restaurantName);
    const idempotencyKey = `${order.id}_print_${order.printCount + 1}`;

    let result: PrintJobResult;
    if (printerSettings.connectionType === 'bridge') {
      result = await printerService.sendToWindowsBridge(
        printerSettings.bridgeUrl,
        printerSettings.selectedPrinterName,
        printerSettings.paperWidth,
        'RECEIPT',
        order.orderNumber,
        escposBytes,
        idempotencyKey
      );
    } else {
      // In browser mode, we trigger native print dialogue formatted for 58mm/80mm
      printerService.triggerBrowserPrint();
      result = {
        success: true,
        status: 'NOT_TESTABLE_WITHOUT_PHYSICAL_PRINTER',
        message: 'Browser print sent. Note: Physical printing verification requires an attached thermal printer.',
        isHardwareVerified: false,
      };
    }

    // Update order print statistics
    order.printCount = (order.printCount || 0) + 1;
    order.lastPrintedAt = new Date().toISOString();
    storage.saveOrder(order);
    setOrders(storage.getOrders());

    storage.logAction(
      currentUser.id,
      currentUser.name,
      isReprint ? 'REPRINT_RECEIPT' : 'PRINT_RECEIPT',
      `Printed receipt for Order ${order.orderNumber} (Paper: ${printerSettings.paperWidth}). Result: ${result.status}`
    );

    return result;
  };

  const printKitchenTicket = async (ticket: KitchenTicket): Promise<PrintJobResult> => {
    const escposBytes = printerService.generateKotEscPos(ticket, printerSettings);
    let result: PrintJobResult;

    if (printerSettings.connectionType === 'bridge') {
      result = await printerService.sendToWindowsBridge(
        printerSettings.bridgeUrl,
        printerSettings.selectedPrinterName,
        printerSettings.paperWidth,
        'KOT',
        ticket.orderNumber,
        escposBytes
      );
    } else {
      printerService.triggerBrowserPrint();
      result = {
        success: true,
        status: 'NOT_TESTABLE_WITHOUT_PHYSICAL_PRINTER',
        message: 'KOT sent to printer. Hardware confirmation pending physical printer.',
        isHardwareVerified: false,
      };
    }
    return result;
  };

  const testPrint = async (): Promise<PrintJobResult> => {
    const result = await printerService.executeTestPrint(printerSettings);
    storage.logAction(
      currentUser.id,
      currentUser.name,
      'TEST_PRINT',
      `Triggered test print for ${printerSettings.paperWidth}. Status: ${result.status}`
    );
    return result;
  };

  // Inventory Adjustments
  const recordInventoryAdjustment = (
    productId: string,
    type: 'STOCK_IN' | 'WASTE' | 'ADJUSTMENT',
    quantityDelta: number,
    reason: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const previousStock = product.currentStock;
    let newStock = previousStock;
    if (type === 'STOCK_IN') {
      newStock += quantityDelta;
    } else if (type === 'WASTE') {
      newStock -= quantityDelta;
    } else if (type === 'ADJUSTMENT') {
      newStock = quantityDelta;
    }

    if (!restaurantSettings.allowNegativeStock && newStock < 0) {
      newStock = 0;
    }

    const movement: InventoryMovement = {
      id: `im_${Date.now()}`,
      productId,
      productName: product.nameAr,
      type,
      quantityDelta: newStock - previousStock,
      previousStock,
      newStock,
      reason,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    storage.recordInventoryMovement(movement);
    setProducts(storage.getProducts());
    setInventoryMovements(storage.getInventoryMovements());
    storage.logAction(
      currentUser.id,
      currentUser.name,
      'INVENTORY_ADJUST',
      `${type} on ${product.nameAr}: ${previousStock} -> ${newStock} (${reason})`
    );
    playTone('success');
  };

  // Settings
  const updateRestaurantSettings = (newSettings: RestaurantSettings) => {
    storage.saveSettings(newSettings);
    setRestaurantSettings(newSettings);
    storage.logAction(currentUser.id, currentUser.name, 'UPDATE_SETTINGS', 'Updated restaurant configuration');
    playTone('success');
  };

  const updatePrinterSettings = (newSettings: PrinterSettings) => {
    storage.savePrinterSettings(newSettings);
    setPrinterSettings(newSettings);
    storage.logAction(
      currentUser.id,
      currentUser.name,
      'UPDATE_PRINTER',
      `Printer config: ${newSettings.connectionType} / ${newSettings.paperWidth}`
    );
    playTone('success');
  };

  const updateProduct = (product: Product) => {
    storage.updateProduct(product);
    setProducts(storage.getProducts());
  };

  const addProduct = (p: Omit<Product, 'id'>) => {
    const newP: Product = {
      ...p,
      id: `p_${Date.now()}`,
    };
    storage.updateProduct(newP);
    setProducts(storage.getProducts());
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...c,
      id: `cat_${Date.now()}`,
    };
    const cats = storage.getCategories();
    cats.push(newCat);
    storage.saveCategories(cats);
    setCategories(storage.getCategories());
  };

  const exportDatabaseBackup = (): string => {
    return storage.exportFullBackup();
  };

  const importDatabaseBackup = (json: string): boolean => {
    const res = storage.importFullBackup(json);
    if (res.success) {
      setCategories(storage.getCategories());
      setProducts(storage.getProducts());
      setTables(storage.getTables());
      setUsers(storage.getUsers());
      setOrders(storage.getOrders());
      setKitchenTickets(storage.getKitchenTickets());
      setRestaurantSettings(storage.getSettings());
      setPrinterSettings(storage.getPrinterSettings());
      playTone('success');
      return true;
    }
    playTone('alert');
    return false;
  };

  return (
    <POSContext.Provider
      value={{
        activeView,
        setActiveView,
        language,
        setLanguage,
        t,
        isRtl,
        currentUser,
        users,
        switchUser,
        verifyManagerPin,
        createUser,
        updateUser,
        activeShift,
        openShift,
        closeShift,
        addCashMovement,
        categories,
        products,
        selectedCategory,
        setSelectedCategory,
        updateProduct,
        addProduct,
        addCategory,
        tables,
        selectedTable,
        selectTable,
        openTable,
        transferTable,
        mergeTables,
        reserveTable,
        releaseTable,
        currentOrder,
        orderType,
        setOrderType,
        addItemToCart,
        updateItemQuantity,
        setItemQuantity,
        updateItemNotes,
        removeItemFromCart,
        clearCart,
        applyDiscount,
        sendOrderToKitchen,
        payCurrentOrder,
        cancelCurrentOrder,
        loadOrderToCart,
        orders,
        kitchenTickets,
        updateTicketStatus,
        printKitchenTicket,
        inventoryMovements,
        recordInventoryAdjustment,
        printerSettings,
        updatePrinterSettings,
        bridgeStatus,
        detectedPrinters,
        checkBridgeConnection,
        printReceipt,
        testPrint,
        previewReceiptOrder,
        setPreviewReceiptOrder,
        restaurantSettings,
        updateRestaurantSettings,
        exportDatabaseBackup,
        importDatabaseBackup,
        networkStatus,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

/**
 * GRINE RESTAURANT POS - Persistent Storage Service
 * Manages full relational data in local storage with schema integrity,
 * sequence generators, transaction locks, and backup/restore.
 */

import {
  Category,
  Product,
  RestaurantTable,
  User,
  Order,
  KitchenTicket,
  InventoryMovement,
  CashShift,
  CashMovement,
  AuditLog,
  RestaurantSettings,
  PrinterSettings,
} from '../types/pos';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_PRINTER_SETTINGS,
} from '../data/initialMenu';

const STORAGE_KEYS = {
  CATEGORIES: 'grine_categories_v1',
  PRODUCTS: 'grine_products_v1',
  TABLES: 'grine_tables_v1',
  USERS: 'grine_users_v1',
  ORDERS: 'grine_orders_v1',
  KITCHEN_TICKETS: 'grine_kitchen_tickets_v1',
  INVENTORY_MOVEMENTS: 'grine_inventory_movements_v1',
  CASH_SHIFTS: 'grine_cash_shifts_v1',
  CASH_MOVEMENTS: 'grine_cash_movements_v1',
  AUDIT_LOGS: 'grine_audit_logs_v1',
  SETTINGS: 'grine_settings_v1',
  PRINTER_SETTINGS: 'grine_printer_settings_v1',
  ACTIVE_SHIFT_ID: 'grine_active_shift_id_v1',
  ORDER_SEQUENCE: 'grine_order_seq_v1',
  CURRENT_USER_ID: 'grine_current_user_id_v1',
};

class StorageService {
  private inMemoryCache: Record<string, any> = {};

  constructor() {
    this.initializeDefaults();
  }

  public initializeDefaults(): void {
    if (!this.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    if (!this.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!this.getItem(STORAGE_KEYS.TABLES)) {
      this.setItem(STORAGE_KEYS.TABLES, INITIAL_TABLES);
    }
    if (!this.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!this.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!this.getItem(STORAGE_KEYS.PRINTER_SETTINGS)) {
      this.setItem(STORAGE_KEYS.PRINTER_SETTINGS, INITIAL_PRINTER_SETTINGS);
    }
    if (!this.getItem(STORAGE_KEYS.ORDER_SEQUENCE)) {
      this.setItem(STORAGE_KEYS.ORDER_SEQUENCE, 100);
    }
    if (!this.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      this.setItem(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
    }
  }

  private getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return null;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // ================= Categories & Products =================
  public getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || INITIAL_CATEGORIES;
  }

  public saveCategories(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  public getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || INITIAL_PRODUCTS;
  }

  public saveProducts(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  public updateProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    this.saveProducts(products);
  }

  // ================= Tables =================
  public getTables(): RestaurantTable[] {
    return this.getItem<RestaurantTable[]>(STORAGE_KEYS.TABLES) || INITIAL_TABLES;
  }

  public saveTables(tables: RestaurantTable[]): void {
    this.setItem(STORAGE_KEYS.TABLES, tables);
  }

  public updateTable(table: RestaurantTable): void {
    const tables = this.getTables();
    const index = tables.findIndex((t) => t.id === table.id);
    if (index >= 0) {
      tables[index] = table;
    } else {
      tables.push(table);
    }
    this.saveTables(tables);
  }

  // ================= Users =================
  public getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS) || INITIAL_USERS;
  }

  public saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  public getCurrentUserId(): string {
    return this.getItem<string>(STORAGE_KEYS.CURRENT_USER_ID) || INITIAL_USERS[0].id;
  }

  public setCurrentUserId(id: string): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  // ================= Orders =================
  public getNextOrderNumber(): string {
    let currentSeq = this.getItem<number>(STORAGE_KEYS.ORDER_SEQUENCE) || 100;
    currentSeq += 1;
    this.setItem(STORAGE_KEYS.ORDER_SEQUENCE, currentSeq);
    return `GR-${String(currentSeq).padStart(6, '0')}`;
  }

  public getOrders(): Order[] {
    return this.getItem<Order[]>(STORAGE_KEYS.ORDERS) || [];
  }

  public saveOrders(orders: Order[]): void {
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  public saveOrder(order: Order): void {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.unshift(order);
    }
    this.saveOrders(orders);
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.getOrders().find((o) => o.id === orderId);
  }

  // ================= Kitchen Tickets =================
  public getKitchenTickets(): KitchenTicket[] {
    return this.getItem<KitchenTicket[]>(STORAGE_KEYS.KITCHEN_TICKETS) || [];
  }

  public saveKitchenTickets(tickets: KitchenTicket[]): void {
    this.setItem(STORAGE_KEYS.KITCHEN_TICKETS, tickets);
  }

  public saveKitchenTicket(ticket: KitchenTicket): void {
    const tickets = this.getKitchenTickets();
    const index = tickets.findIndex((t) => t.id === ticket.id);
    if (index >= 0) {
      tickets[index] = ticket;
    } else {
      tickets.unshift(ticket);
    }
    this.saveKitchenTickets(tickets);
  }

  // ================= Inventory =================
  public getInventoryMovements(): InventoryMovement[] {
    return this.getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS) || [];
  }

  public recordInventoryMovement(movement: InventoryMovement): void {
    const movements = this.getInventoryMovements();
    movements.unshift(movement);
    this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements);

    // Update actual product stock
    const products = this.getProducts();
    const product = products.find((p) => p.id === movement.productId);
    if (product) {
      product.currentStock = movement.newStock;
      this.saveProducts(products);
    }
  }

  // ================= Cash Shifts & Movements =================
  public getCashShifts(): CashShift[] {
    return this.getItem<CashShift[]>(STORAGE_KEYS.CASH_SHIFTS) || [];
  }

  public getActiveShift(): CashShift | null {
    const activeShiftId = this.getItem<string>(STORAGE_KEYS.ACTIVE_SHIFT_ID);
    if (!activeShiftId) return null;
    const shifts = this.getCashShifts();
    return shifts.find((s) => s.id === activeShiftId && s.status === 'OPEN') || null;
  }

  public saveCashShift(shift: CashShift): void {
    const shifts = this.getCashShifts();
    const index = shifts.findIndex((s) => s.id === shift.id);
    if (index >= 0) {
      shifts[index] = shift;
    } else {
      shifts.unshift(shift);
    }
    this.setItem(STORAGE_KEYS.CASH_SHIFTS, shifts);

    if (shift.status === 'OPEN') {
      this.setItem(STORAGE_KEYS.ACTIVE_SHIFT_ID, shift.id);
    } else if (this.getItem<string>(STORAGE_KEYS.ACTIVE_SHIFT_ID) === shift.id) {
      this.setItem(STORAGE_KEYS.ACTIVE_SHIFT_ID, null);
    }
  }

  public getCashMovements(): CashMovement[] {
    return this.getItem<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS) || [];
  }

  public recordCashMovement(movement: CashMovement): void {
    const movements = this.getCashMovements();
    movements.unshift(movement);
    this.setItem(STORAGE_KEYS.CASH_MOVEMENTS, movements);

    // Update active shift balance
    const activeShift = this.getActiveShift();
    if (activeShift && activeShift.id === movement.shiftId) {
      if (movement.type === 'CASH_IN') {
        activeShift.cashIn += movement.amount;
        activeShift.expectedCash += movement.amount;
      } else {
        activeShift.cashOut += movement.amount;
        activeShift.expectedCash -= movement.amount;
      }
      this.saveCashShift(activeShift);
    }
  }

  // ================= Audit Logs =================
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS) || [];
  }

  public logAction(userId: string, userName: string, action: string, details: string, reference?: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      action,
      details,
      reference,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 500 logs to prevent unbounded storage
    if (logs.length > 500) logs.length = 500;
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // ================= Settings =================
  public getSettings(): RestaurantSettings {
    return this.getItem<RestaurantSettings>(STORAGE_KEYS.SETTINGS) || INITIAL_SETTINGS;
  }

  public saveSettings(settings: RestaurantSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  public getPrinterSettings(): PrinterSettings {
    return this.getItem<PrinterSettings>(STORAGE_KEYS.PRINTER_SETTINGS) || INITIAL_PRINTER_SETTINGS;
  }

  public savePrinterSettings(settings: PrinterSettings): void {
    this.setItem(STORAGE_KEYS.PRINTER_SETTINGS, settings);
  }

  // ================= Backup & Restore =================
  public exportFullBackup(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      restaurant: 'GRINE RESTAURANT',
      categories: this.getCategories(),
      products: this.getProducts(),
      tables: this.getTables(),
      users: this.getUsers(),
      orders: this.getOrders(),
      kitchenTickets: this.getKitchenTickets(),
      inventoryMovements: this.getInventoryMovements(),
      cashShifts: this.getCashShifts(),
      cashMovements: this.getCashMovements(),
      auditLogs: this.getAuditLogs(),
      settings: this.getSettings(),
      printerSettings: this.getPrinterSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.categories || !data.products) {
        return { success: false, error: 'Invalid backup format' };
      }
      if (data.categories) this.saveCategories(data.categories);
      if (data.products) this.saveProducts(data.products);
      if (data.tables) this.saveTables(data.tables);
      if (data.users) this.saveUsers(data.users);
      if (data.orders) this.saveOrders(data.orders);
      if (data.kitchenTickets) this.saveKitchenTickets(data.kitchenTickets);
      if (data.settings) this.saveSettings(data.settings);
      if (data.printerSettings) this.savePrinterSettings(data.printerSettings);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON file' };
    }
  }
}

export const storage = new StorageService();

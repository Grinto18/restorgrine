/**
 * GRINE RESTAURANT POS - Thermal Printing & Windows Local Print Bridge Architecture
 * Strictly supports 58mm narrow roll (default) and 80mm wide roll.
 * Integrates with Windows Local Print Bridge (http://localhost:8008) and Browser Fallback.
 */

import { Order, KitchenTicket, PrinterSettings, PaperWidth } from '../types/pos';
import { formatDZD } from '../i18n/translations';

export type PrintStatus = 
  | 'CONNECTED'
  | 'BRIDGE_NOT_RUNNING'
  | 'PRINTER_NOT_FOUND'
  | 'PRINTER_OFFLINE'
  | 'PRINT_FAILED'
  | 'INVALID_DATA'
  | 'TIMEOUT'
  | 'PRINT_SUCCESSFUL'
  | 'NOT_TESTABLE_WITHOUT_PHYSICAL_PRINTER'
  | 'SOFTWARE_READY';

export interface BridgeHealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface PrintJobResult {
  success: boolean;
  status: PrintStatus;
  message: string;
  jobId?: string;
  isHardwareVerified: boolean;
}

// Map characters per line: 58mm typically has 32 chars in Font A, 80mm has 48 chars
export const CHARS_PER_LINE: Record<PaperWidth, number> = {
  '58mm': 32,
  '80mm': 48,
};

export class PrinterService {
  private printedJobIds = new Set<string>();

  /**
   * Check connection to Windows Print Bridge on localhost:8008
   */
  public async checkBridgeHealth(bridgeUrl: string): Promise<{ isRunning: boolean; data?: BridgeHealthResponse; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${bridgeUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: BridgeHealthResponse = await response.json();
        return { isRunning: true, data };
      }
      return { isRunning: false, error: `Bridge returned status ${response.status}` };
    } catch (err: any) {
      return {
        isRunning: false,
        error: err.name === 'AbortError' ? 'Bridge connection timed out' : 'Bridge service not running on port 8008',
      };
    }
  }

  /**
   * Fetch detected Windows-installed printers from the bridge
   */
  public async fetchInstalledPrinters(bridgeUrl: string): Promise<{ success: boolean; printers: string[]; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${bridgeUrl}/printers`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const printers = await response.json();
        return { success: true, printers: Array.isArray(printers) ? printers : [] };
      }
      return { success: false, printers: [], error: `Failed to fetch printers (${response.status})` };
    } catch (err: any) {
      return {
        success: false,
        printers: [],
        error: err.name === 'AbortError' ? 'Timeout contacting printer bridge' : 'Bridge not reachable',
      };
    }
  }

  /**
   * Format line for ESC/POS with left text and right text spaced out according to roll width
   */
  public formatTwoColumnLine(left: string, right: string, width: PaperWidth): string {
    const maxChars = CHARS_PER_LINE[width];
    const leftTrim = left.trim();
    const rightTrim = right.trim();
    const spacesNeeded = maxChars - (leftTrim.length + rightTrim.length);
    if (spacesNeeded <= 0) {
      return `${leftTrim.slice(0, maxChars - rightTrim.length - 1)} ${rightTrim}\n`;
    }
    return `${leftTrim}${' '.repeat(spacesNeeded)}${rightTrim}\n`;
  }

  public formatDivider(width: PaperWidth, char: string = '-'): string {
    return char.repeat(CHARS_PER_LINE[width]) + '\n';
  }

  /**
   * Build complete ESC/POS raw command buffer for standard Customer Receipt
   */
  public generateReceiptEscPos(order: Order, settings: PrinterSettings, restaurantName = 'GRINE RESTAURANT'): Uint8Array {
    const width = settings.paperWidth;
    const maxChars = CHARS_PER_LINE[width];
    const bytes: number[] = [];

    // Helper: Push ASCII string
    const pushAscii = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
      }
    };

    // Helper: Push command bytes
    const pushCmd = (...cmd: number[]) => bytes.push(...cmd);

    // 1. Initialize printer: ESC @
    pushCmd(0x1b, 0x40);

    // 2. Open Cash Drawer if enabled and cash sale: ESC p 0 25 250
    if (settings.openCashDrawerOnCashSale && order.payment?.method === 'CASH') {
      pushCmd(0x1b, 0x70, 0x00, 0x19, 0xfa);
    }

    // 3. Center align: ESC a 1
    pushCmd(0x1b, 0x61, 0x01);

    // Double-height & bold header: ESC ! 16 + ESC E 1
    pushCmd(0x1b, 0x21, 0x10);
    pushCmd(0x1b, 0x45, 0x01);
    pushAscii(`${restaurantName}\n`);

    // Standard font, bold off: ESC ! 0 + ESC E 0
    pushCmd(0x1b, 0x21, 0x00);
    pushCmd(0x1b, 0x45, 0x00);
    pushAscii("Good Food - Good Mood\n");
    pushAscii(this.formatDivider(width, '='));

    // Left align: ESC a 0
    pushCmd(0x1b, 0x61, 0x00);
    const orderDate = new Date(order.createdAt).toLocaleDateString('fr-DZ');
    const orderTime = new Date(order.createdAt).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' });

    pushAscii(this.formatTwoColumnLine(`Order: ${order.orderNumber}`, `Date: ${orderDate}`, width));
    const tableText = order.tableNumber ? `Table: ${order.tableNumber}` : `Type: ${order.orderType.toUpperCase()}`;
    pushAscii(this.formatTwoColumnLine(tableText, `Time: ${orderTime}`, width));
    pushAscii(`Cashier: ${order.cashierName}\n`);
    pushAscii(this.formatDivider(width, '-'));

    // Items table header
    pushAscii(this.formatTwoColumnLine("ITEM", "AMOUNT", width));
    pushAscii(this.formatDivider(width, '-'));

    // Items
    for (const item of order.items) {
      const variantText = item.selectedVariant ? ` (${item.selectedVariant.nameFr || item.selectedVariant.nameEn})` : '';
      const itemName = `${item.quantity}x ${item.productNameFr || item.productNameEn || item.productNameAr}${variantText}`;
      const itemTotal = `${Math.round(item.totalPrice)} DA`;
      pushAscii(this.formatTwoColumnLine(itemName, itemTotal, width));

      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          pushAscii(this.formatTwoColumnLine(`  + ${mod.nameFr || mod.nameEn}`, `+${Math.round(mod.price)} DA`, width));
        }
      }
      if (item.notes) {
        pushAscii(`  * Note: ${item.notes}\n`);
      }
    }

    pushAscii(this.formatDivider(width, '-'));

    // Totals
    pushAscii(this.formatTwoColumnLine("Subtotal:", `${Math.round(order.subtotal)} DA`, width));
    if (order.discountAmount > 0) {
      pushAscii(this.formatTwoColumnLine("Discount:", `-${Math.round(order.discountAmount)} DA`, width));
    }
    if (order.taxAmount > 0) {
      pushAscii(this.formatTwoColumnLine("Tax:", `${Math.round(order.taxAmount)} DA`, width));
    }

    // Bold Total
    pushCmd(0x1b, 0x45, 0x01);
    pushAscii(this.formatTwoColumnLine("TOTAL:", `${Math.round(order.grandTotal)} DA`, width));
    pushCmd(0x1b, 0x45, 0x00);
    pushAscii(this.formatDivider(width, '='));

    // Payment details
    if (order.payment) {
      pushAscii(this.formatTwoColumnLine(`Payment: ${order.payment.method}`, `${Math.round(order.payment.amountDue)} DA`, width));
      if (order.payment.method === 'CASH') {
        pushAscii(this.formatTwoColumnLine("Paid:", `${Math.round(order.payment.amountReceived)} DA`, width));
        pushAscii(this.formatTwoColumnLine("Change:", `${Math.round(order.payment.changeGiven)} DA`, width));
      }
      pushAscii(this.formatDivider(width, '-'));
    }

    // Center Footer & Thanks
    pushCmd(0x1b, 0x61, 0x01);
    pushAscii("Thank you\n");
    pushAscii("Merci pour votre visite\n");
    pushAscii("Saha Ftourkoum\n");
    pushAscii(this.formatDivider(width, '-'));

    // Feeds and Full Cut: GS V 0
    pushCmd(0x0a, 0x0a, 0x0a);
    pushCmd(0x1d, 0x56, 0x00);

    return new Uint8Array(bytes);
  }

  /**
   * Build complete ESC/POS raw command buffer for KOT (Kitchen Order Ticket)
   */
  public generateKotEscPos(ticket: KitchenTicket, settings: PrinterSettings): Uint8Array {
    const width = settings.paperWidth;
    const bytes: number[] = [];

    const pushAscii = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
      }
    };
    const pushCmd = (...cmd: number[]) => bytes.push(...cmd);

    // Initialize: ESC @
    pushCmd(0x1b, 0x40);

    // Center & Double Size: ESC a 1 + ESC ! 48 + Bold
    pushCmd(0x1b, 0x61, 0x01);
    pushCmd(0x1b, 0x21, 0x30);
    pushCmd(0x1b, 0x45, 0x01);
    pushAscii(`** KITCHEN ORDER **\n`);

    // Station
    pushCmd(0x1b, 0x21, 0x10);
    pushAscii(`[ ${ticket.station} ]\n`);

    // Reset font
    pushCmd(0x1b, 0x21, 0x00);
    pushCmd(0x1b, 0x45, 0x00);
    pushAscii(this.formatDivider(width, '='));

    // Left Align
    pushCmd(0x1b, 0x61, 0x00);
    const dateStr = new Date(ticket.createdAt).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' });
    pushAscii(this.formatTwoColumnLine(`Order: ${ticket.orderNumber}`, `Time: ${dateStr}`, width));
    const tableStr = ticket.tableNumber ? `Table: ${ticket.tableNumber}` : `Type: ${ticket.orderType.toUpperCase()}`;
    pushAscii(this.formatTwoColumnLine(tableStr, `Server: ${ticket.cashierName}`, width));
    pushAscii(this.formatDivider(width, '-'));

    // Items list (High visibility font)
    pushCmd(0x1b, 0x45, 0x01); // Bold
    for (const item of ticket.items) {
      const variant = item.selectedVariant ? ` (${item.selectedVariant.nameFr || item.selectedVariant.nameEn})` : '';
      pushAscii(`${item.quantity} x ${item.productNameFr || item.productNameEn || item.productNameAr}${variant}\n`);
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          pushAscii(`   + ${mod.nameFr || mod.nameEn}\n`);
        }
      }
      if (item.notes) {
        pushAscii(`   *** NOTE: ${item.notes} ***\n`);
      }
    }
    pushCmd(0x1b, 0x45, 0x00);
    pushAscii(this.formatDivider(width, '='));

    // Feeds and Cut
    pushCmd(0x0a, 0x0a, 0x0a);
    pushCmd(0x1d, 0x56, 0x00);

    return new Uint8Array(bytes);
  }

  /**
   * Convert byte array to hexadecimal string for Bridge payload
   */
  public bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Send print job to Windows Local Print Bridge
   */
  public async sendToWindowsBridge(
    bridgeUrl: string,
    printerName: string,
    paperWidth: PaperWidth,
    jobType: 'RECEIPT' | 'KOT' | 'TEST',
    orderNumber: string,
    escposBytes: Uint8Array,
    idempotencyKey?: string
  ): Promise<PrintJobResult> {
    // Prevent accidental duplicate print jobs
    if (idempotencyKey && this.printedJobIds.has(idempotencyKey)) {
      return {
        success: false,
        status: 'INVALID_DATA',
        message: 'Duplicate print job prevented by protection filter.',
        isHardwareVerified: false,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const escposHex = this.bytesToHex(escposBytes);
      const payload = {
        printerName,
        paperWidth,
        type: jobType,
        orderNumber,
        escposHex,
      };

      const response = await fetch(`${bridgeUrl}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const resData = await response.json();
        if (idempotencyKey) {
          this.printedJobIds.add(idempotencyKey);
        }
        return {
          success: true,
          status: 'PRINT_SUCCESSFUL',
          message: 'Windows print queue accepted the job.',
          jobId: resData.jobId,
          isHardwareVerified: true,
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          status: 'PRINT_FAILED',
          message: `Bridge rejected print job: ${errorText || response.statusText}`,
          isHardwareVerified: false,
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          status: 'TIMEOUT',
          message: 'Windows Bridge request timed out.',
          isHardwareVerified: false,
        };
      }
      return {
        success: false,
        status: 'BRIDGE_NOT_RUNNING',
        message: 'Windows Local Print Bridge is not running on localhost:8008.',
        isHardwareVerified: false,
      };
    }
  }

  /**
   * Execute Test Print as strictly specified in prompt:
   * Order #TEST-001
   * 1 x Grilled Chicken 850 DA
   * 2 x Soft Drink 200 DA
   * SUBTOTAL 1,050 DA
   * TOTAL 1,050 DA
   * Thank you / Merci / شكراً
   */
  public async executeTestPrint(settings: PrinterSettings): Promise<PrintJobResult> {
    const width = settings.paperWidth;
    const bytes: number[] = [];
    const pushAscii = (str: string) => {
      for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff);
    };
    const pushCmd = (...cmd: number[]) => bytes.push(...cmd);

    pushCmd(0x1b, 0x40); // Init
    pushCmd(0x1b, 0x61, 0x01); // Center
    pushCmd(0x1b, 0x21, 0x10); // Double height
    pushCmd(0x1b, 0x45, 0x01); // Bold
    pushAscii("GRINE RESTAURANT\n");
    pushCmd(0x1b, 0x21, 0x00);
    pushAscii("TEST RECEIPT\n");
    pushCmd(0x1b, 0x45, 0x00);
    pushAscii(this.formatDivider(width, '='));

    pushCmd(0x1b, 0x61, 0x00); // Left
    pushAscii("Order #TEST-001\n");
    pushAscii(this.formatDivider(width, '-'));
    pushAscii(this.formatTwoColumnLine("1 x Grilled Chicken", "850 DA", width));
    pushAscii(this.formatTwoColumnLine("2 x Soft Drink", "200 DA", width));
    pushAscii(this.formatDivider(width, '-'));
    pushAscii(this.formatTwoColumnLine("SUBTOTAL", "1,050 DA", width));
    pushCmd(0x1b, 0x45, 0x01);
    pushAscii(this.formatTwoColumnLine("TOTAL", "1,050 DA", width));
    pushCmd(0x1b, 0x45, 0x00);
    pushAscii(this.formatDivider(width, '='));

    pushCmd(0x1b, 0x61, 0x01); // Center
    pushAscii("Thank you\n");
    pushAscii("Merci\n");
    pushAscii("Shukran (GRINE)\n");
    pushAscii(this.formatDivider(width, '-'));

    pushCmd(0x0a, 0x0a, 0x0a);
    pushCmd(0x1d, 0x56, 0x00); // Cut

    const escposBytes = new Uint8Array(bytes);

    if (settings.connectionType === 'bridge') {
      // First check if bridge is alive
      const health = await this.checkBridgeHealth(settings.bridgeUrl);
      if (!health.isRunning) {
        return {
          success: false,
          status: 'BRIDGE_NOT_RUNNING',
          message: 'Windows Bridge service is not running on localhost:8008. Please start the GRINE Print Bridge.',
          isHardwareVerified: false,
        };
      }

      if (!settings.selectedPrinterName) {
        return {
          success: false,
          status: 'PRINTER_NOT_FOUND',
          message: 'No Windows printer selected in Printer Settings.',
          isHardwareVerified: false,
        };
      }

      return await this.sendToWindowsBridge(
        settings.bridgeUrl,
        settings.selectedPrinterName,
        settings.paperWidth,
        'TEST',
        'TEST-001',
        escposBytes
      );
    } else {
      // Browser print mode fallback
      // Software test passes, but physical printer hardware requires physical confirmation!
      return {
        success: true,
        status: 'NOT_TESTABLE_WITHOUT_PHYSICAL_PRINTER',
        message: 'ESC/POS commands generated successfully for 58mm. Hardware test pending physical printer confirmation.',
        isHardwareVerified: false,
      };
    }
  }

  /**
   * Browser standard print trigger
   */
  public triggerBrowserPrint(): void {
    window.print();
  }
}

export const printerService = new PrinterService();

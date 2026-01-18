import { Order } from '@/types/adminOrder';

export interface ReceiptData {
  order: Order;
  receiptNumber: string;
  issuedDate: string;
  paymentMethod: string;
}

export class ReceiptGenerator {
  private static generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `RCP${timestamp}${random}`;
  }

  private static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'KES' ? 'KES' : currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static generateReceiptHTML(order: Order): string {
    const receiptNumber = this.generateReceiptNumber();
    const issuedDate = this.formatDate(new Date().toISOString());
    
    const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 15; // Flat shipping rate
    const total = order.total;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receiptNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: #f5f5f0;
            padding: 10px;
        }
        
        .receipt {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border: 2px solid #0a0a0a;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 1px dashed #0a0a0a;
            padding-bottom: 10px;
        }
        
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: #0a0a0a;
            margin-bottom: 5px;
        }
        
        .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 10px;
        }
        
        .section {
            margin-bottom: 15px;
        }
        
        .section-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 11px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            font-size: 10px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10px;
        }
        
        .items-table th {
            background: #0a0a0a;
            color: white;
            text-align: left;
            padding: 5px;
            font-size: 9px;
        }
        
        .items-table td {
            padding: 3px 5px;
            border-bottom: 1px dotted #ccc;
            font-size: 9px;
        }
        
        .totals {
            text-align: right;
            margin-top: 10px;
            font-size: 10px;
        }
        
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 2px;
        }
        
        .total-row.grand-total {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #0a0a0a;
            padding-top: 5px;
            margin-top: 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #0a0a0a;
            font-size: 9px;
            color: #666;
        }
        
        .shipping-status {
            background: #e8f5e8;
            color: #2d5a2d;
            padding: 5px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
            border: 1px solid #2d5a2d;
            font-size: 10px;
        }
        
        @media print {
            body { background: white; padding: 5px; }
            .receipt { box-shadow: none; max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">ARCSTARZ</div>
            <div>OFFICIAL RECEIPT</div>
        </div>
        
        <div class="receipt-info">
            <div>
                <div>Receipt: ${receiptNumber}</div>
                <div>Date: ${issuedDate}</div>
            </div>
            <div>
                <div>Order: ${order.id}</div>
                <div>Status: ${order.fulfillmentStatus?.toUpperCase() || 'PROCESSING'}</div>
            </div>
        </div>
        
        ${order.fulfillmentStatus === 'shipped' ? `
        <div class="shipping-status">
            🚚 ORDER SHIPPED
        </div>
        ` : ''}
        
        <div class="section">
            <div class="section-title">CUSTOMER</div>
            <div class="info-grid">
                <div>${order.userName}</div>
                <div>${order.userEmail}</div>
                <div>${order.userPhone || 'N/A'}</div>
                <div>${order.paymentMethod?.toUpperCase() || 'ONLINE'}</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">SHIPPING</div>
            <div style="font-size: 10px;">
                ${order.shippingDetails ? `
                    ${order.shippingDetails.firstName} ${order.shippingDetails.lastName}<br>
                    ${order.shippingDetails.address}<br>
                    ${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}
                ` : 'Shipping info not available'}
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">ITEMS</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>ITEM</th>
                        <th>SIZE</th>
                        <th>QTY</th>
                        <th>PRICE</th>
                        <th>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.selectedSize || 'N/A'}</td>
                            <td>${item.quantity}</td>
                            <td>${this.formatCurrency(item.price, order.currency)}</td>
                            <td>${this.formatCurrency(item.price * item.quantity, order.currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${this.formatCurrency(subtotal, order.currency)}</span>
                </div>
                <div class="total-row">
                    <span>Tax (10%):</span>
                    <span>${this.formatCurrency(tax, order.currency)}</span>
                </div>
                <div class="total-row">
                    <span>Shipping:</span>
                    <span>${this.formatCurrency(shipping, order.currency)}</span>
                </div>
                <div class="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>${this.formatCurrency(total, order.currency)}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div><strong>ARCSTARZ</strong> • Premium Fashion</div>
            <div>Thank you! • bashirali652@icloud.com</div>
        </div>
    </div>
</body>
</html>`;
  }

  static generateAndDownloadReceipt(order: Order): void {
    const receiptHTML = this.generateReceiptHTML(order);
    
    // Create a blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ARCSTARZ-Receipt-${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log(`✅ Receipt generated for order ${order.id}`);
  }

  static getReceiptHTML(order: Order): string {
    return this.generateReceiptHTML(order);
  }
}

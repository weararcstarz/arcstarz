'use client';

import { Order } from '@/types/adminOrder';
import { ReceiptGenerator } from '@/utils/receiptGenerator';

interface ReceiptViewerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptViewer({ order, isOpen, onClose }: ReceiptViewerProps) {
  if (!isOpen || !order) return null;

  const receiptHTML = ReceiptGenerator.generateReceiptHTML(order);

  const handleDownload = () => {
    if (order) {
      ReceiptGenerator.generateAndDownloadReceipt(order);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt - ${order.id}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0.5in; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A0A0A] text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Receipt - {order.id}</h2>
            <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
              {order.fulfillmentStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors rounded"
            >
              📄 Download
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors rounded"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors rounded"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-50">
          <div 
            id="receipt-content"
            dangerouslySetInnerHTML={{ __html: receiptHTML }}
            className="receipt-container p-4"
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-3 border-t flex justify-between items-center text-xs">
          <div className="text-gray-600">
            <strong>Order:</strong> {order.id} | 
            <strong> Customer:</strong> {order.userName} | 
            <strong> Total:</strong> ${order.total} {order.currency}
          </div>
          <div className="text-gray-500">
            Generated on {new Date().toLocaleDateString()}
          </div>
        </div>

        <style jsx>{`
          .receipt-container :global(body) {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .receipt-container :global(.receipt) {
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 4px;
          }
          
          @media print {
            .receipt-container :global(.receipt) {
              box-shadow: none;
              border: none;
              margin: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

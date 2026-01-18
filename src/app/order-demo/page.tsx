import OrderNumberDemo from '@/components/OrderNumberDemo';

export default function OrderDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🏷️ ARCSTARZ Order Numbering System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional order numbering system with unique sequential numbers for each product type.
            Each product gets its own counter (TSHIRT-0001, TSHIRT-0002, CAP-0001, etc.).
          </p>
        </div>
        
        <OrderNumberDemo />
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 System Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">✅ Core Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unique sequential order numbers</li>
                  <li>• Product-specific counters</li>
                  <li>• Persistent storage</li>
                  <li>• Payment confirmation handling</li>
                  <li>• Order status tracking</li>
                  <li>• Multi-product support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">🔧 Technical Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• TypeScript support</li>
                  <li>• Singleton pattern</li>
                  <li>• Error handling</li>
                  <li>• Console logging</li>
                  <li>• LocalStorage fallback</li>
                  <li>• Easy database integration</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">📝 Order Number Format</h3>
              <code className="text-sm bg-gray-800 text-green-400 px-3 py-2 rounded block">
                PRODUCTNAME-#### (e.g., TSHIRT-0001, CAP-0001, HOODIE-0001)
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Each product maintains its own sequential counter, ensuring unique order numbers across all products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

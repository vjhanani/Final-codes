import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

interface PurchaseRecord {
  id: number;
  studentRollNo: string;
  studentName: string;
  purchaseDate: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  totalAmount: number;
}

interface Analytics {
  totalRevenue: number;
  items: Record<string, { quantity: number; revenue: number }>;
}

export function ExtraBuyingHistory() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ totalRevenue: 0, items: {} });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [errorPurchases, setErrorPurchases] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch analytics (summary)
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/extras/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to fetch extras analytics', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    // Fetch individual purchase records
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/extras/purchases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPurchases(data.history || []);
        } else {
          setErrorPurchases('Failed to load purchase records.');
        }
      } catch (err) {
        console.error('Failed to fetch purchase history', err);
        setErrorPurchases('Failed to load purchase records.');
      } finally {
        setLoadingPurchases(false);
      }
    };

    fetchAnalytics();
    fetchPurchases();
  }, []);

  const totalRevenue = analytics.totalRevenue;
  const popularItems = Object.entries(analytics.items || {})
    .map(([name, stats]) => ({ name, quantity: stats.quantity, revenue: stats.revenue }))
    .sort((a, b) => b.quantity - a.quantity);

  const totalTransactions = popularItems.reduce((sum, i) => sum + i.quantity, 0);
  const avgTransactionValue = totalTransactions ? Math.round(totalRevenue / totalTransactions) : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Extra Buying History</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-2 border-black p-6">
          <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="border-2 border-black p-6">
          <p className="text-sm text-gray-600 mb-2">Total Items Sold</p>
          <p className="text-3xl font-bold">{totalTransactions}</p>
        </div>
        <div className="border-2 border-black p-6">
          <p className="text-sm text-gray-600 mb-2">Avg. Per Item</p>
          <p className="text-3xl font-bold">₹{avgTransactionValue}</p>
        </div>
      </div>

      {/* Popular Items */}
      {!loadingAnalytics && (
        <div className="border-2 border-black p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Most Popular Items
          </h3>
          <div className="space-y-3">
            {popularItems.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No purchase data yet</p>
            ) : (
              popularItems.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-300 w-8">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-600">
                        {item.quantity} sold • ₹{item.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-4 bg-gray-200 border border-black">
                      <div
                        className="h-full bg-black"
                        style={{
                          width: `${popularItems[0].quantity ? (item.quantity / popularItems[0].quantity) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recent Purchase Records Table */}
      <div className="border-2 border-black p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Recent Purchase Records
        </h3>

        {loadingPurchases ? (
          <p className="text-gray-400 text-center py-8">Loading purchase records…</p>
        ) : errorPurchases ? (
          <p className="text-red-500 text-center py-8">{errorPurchases}</p>
        ) : purchases.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No purchase records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left px-4 py-3 font-semibold">Student Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Roll No.</th>
                  <th className="text-left px-4 py-3 font-semibold">Purchase Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Item</th>
                  <th className="text-right px-4 py-3 font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 border-b border-gray-200 font-medium">{p.studentName}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-600">{p.studentRollNo}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-gray-600 whitespace-nowrap">
                      {formatDate(p.purchaseDate)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200">{p.itemName}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-right">{p.quantity}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-right font-semibold">
                      ₹{p.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={5} className="px-4 py-3 text-right border-t-2 border-black">Grand Total:</td>
                  <td className="px-4 py-3 text-right border-t-2 border-black">
                    ₹{purchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

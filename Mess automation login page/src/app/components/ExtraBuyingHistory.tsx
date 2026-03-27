import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp } from 'lucide-react';

interface Purchase {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

export function ExtraBuyingHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [analytics, setAnalytics] = useState<{ totalRevenue: number; items: Record<string, { quantity: number; revenue: number }> }>({ totalRevenue: 0, items: {} });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/extras/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to fetch extras analytics', err);
      }
    };
    fetchAnalytics();
  }, []);

  const totalRevenue = analytics.totalRevenue;
  const popularItems = Object.entries(analytics.items || {})
    .map(([name, stats]) => ({ name, quantity: stats.quantity, revenue: stats.revenue }))
    .sort((a, b) => b.quantity - a.quantity);

  const totalTransactions = popularItems.reduce((sum, i) => sum + i.quantity, 0);
  const avgTransactionValue = totalTransactions ? Math.round(totalRevenue / totalTransactions) : 0;

  return (
    <div className="space-y-6 w-250">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Extra Buying History</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-2 border-black p-6">
          <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">₹{totalRevenue}</p>
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
      <div className="border-2 border-black p-6">
        <h3 className="font-bold mb-4">Most Popular Items</h3>
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
                      {item.quantity} sold • ₹{item.revenue}
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
    </div>
  );
}

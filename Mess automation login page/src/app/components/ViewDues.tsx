import { useState, useEffect } from 'react';
import { Calendar, IndianRupee, ShoppingBag } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'charge' | 'extra' | 'payment' | 'rebate';
}

export function ViewDues() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({
    totalCharges: 0,
    totalExtras: 0,
    totalPayments: 0,
    totalRebates: 0,
    netDues: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch transactions
        const transRes = await fetch(`${API_HOST}/api/transactions/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch summary
        const summaryRes = await fetch(`${API_HOST}/api/transactions/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (transRes.ok && summaryRes.ok) {
          const transData = await transRes.json();
          const summaryData = await summaryRes.json();

          const mapped: Transaction[] = (transData || []).map((t: any) => ({
            id: String(t.transactionId),
            date: t.date,
            description: t.itemName || (t.type === 'charge' ? 'Monthly Mess Charge' : t.type),
            amount: parseFloat(t.amount),
            type: t.type.toLowerCase() as any
          }));

          setTransactions(mapped);
          setSummary(summaryData);
        }
      } catch (err) {
        console.error('Failed to fetch dues', err);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'charge':
      case 'monthly charge':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'extra':
      case 'extra item':
        return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'payment':
        return 'bg-green-50 border-green-200 text-green-600';
      case 'rebate':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">View Dues &amp; Transactions</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-600">Total Charges</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">₹{summary.totalCharges + summary.totalExtras}</p>
          <p className="text-xs text-gray-500 mt-1">Monthly: ₹{summary.totalCharges} | Extras: ₹{summary.totalExtras}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-3 rounded-full">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-600">Total Paid</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">₹{summary.totalPayments + summary.totalRebates}</p>
          <p className="text-xs text-gray-500 mt-1">Payments: ₹{summary.totalPayments} | Rebates: ₹{summary.totalRebates}</p>
        </div>

        <div className="bg-white border border-red-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-600">Net Dues</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">₹{summary.netDues}</p>
          <p className="text-xs text-gray-500 mt-1">Balance to be paid</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4 pb-3 border-b border-gray-200 text-gray-800">Transaction History</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No transactions yet</p>
          ) : (
            transactions.map((transaction) => {
              const style = getTransactionStyle(transaction.type);
              const isCredit = transaction.type === 'payment' || transaction.type === 'rebate';
              return (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${style.split(' ').slice(0, 2).join(' ')}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${style.split(' ')[2]}`}>
                      {isCredit ? '-' : '+'}₹{Math.abs(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
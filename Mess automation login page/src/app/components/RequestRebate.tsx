import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Trash2 } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
interface RebateRequest {
  id?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export function RequestRebate() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bdmr, setBdmr] = useState<number>(0);

  const [previousRequests, setPreviousRequests] = useState<RebateRequest[]>([]);

  useEffect(() => {
    const fetchRebates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_HOST}/api/rebate/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setPreviousRequests(data);
      } catch (err) {
        console.error('Failed to fetch rebates', err);
      }
    };
    fetchRebates();

    const fetchBDMR = async () => {
      try {
        const token = localStorage.getItem('token');
        const date = new Date();
        const configKey = `BDMR_${date.getFullYear()}_${date.getMonth() + 1}`;
        const res = await fetch(`${API_HOST}/api/config/${configKey}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBdmr(parseFloat(data.value) || 0);
        }
      } catch { /* Fail silently, bdmr remains 0 */ }
    };
    fetchBDMR();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      alert('End date cannot be before start date');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for the rebate request');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/rebate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ startDate, endDate, reason })
      });

      if (res.ok) {
        const data = await res.json();
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        alert(`Rebate request submitted successfully!\nDuration: ${days} day(s)\nYour request will be reviewed by the mess manager.`);
        
        setPreviousRequests([data.rebate, ...previousRequests]);
        setStartDate('');
        setEndDate('');
        setReason('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit rebate request');
      }
    } catch (err) {
      alert('Backend unreachable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Are you sure you want to cancel this rebate request?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/rebate/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPreviousRequests(previousRequests.filter(r => r.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete rebate');
      }
    } catch {
      alert('Network error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Request Mess Rebate</h2>
        <p className="text-sm mt-2 text-gray-600">
          Request a rebate for days when you won't be eating at the mess
        </p>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-2">Important Information:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Rebate requests must be submitted at least 2 days in advance</li>
            <li>You will receive a refund based on the BDMR (Base Daily Mess Rate)</li>
            <li>Approval is subject to mess manager's discretion</li>
            <li>Once approved, the rebate amount will be credited to your account</li>
          </ul>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          New Rebate Request
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={getTodayDate()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || getTodayDate()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Duration:</strong>{' '}
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
              </p>
              <p className="text-sm text-green-800 mt-1">
                <strong>Estimated Rebate:</strong> ₹
                {(Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) * bdmr}
                {' '}(based on BDMR: ₹{bdmr}/day)
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Reason for Rebate
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for your rebate request..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rebate Request'}
          </button>
        </form>
      </div>

      {/* Previous Requests */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Previous Rebate Requests</h3>

        {previousRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No previous rebate requests</p>
        ) : (
          <div className="space-y-3">
            {previousRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-800">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                    <p className="text-xs text-gray-500">
                      Submitted on {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-semibold ${
                        request.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {request.status}
                    </span>
                    {request.status === 'Pending' && (
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors flex items-center justify-center mt-1"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4 cursor-pointer" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

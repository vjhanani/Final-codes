import { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  rating: number;
  category: string;
  message: string;
  status: string;
  response: string;
}

export function FeedbackSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('pending');
  const [editResponse, setEditResponse] = useState<string>('');

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_HOST}/api/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((f: any) => ({
            id: f.id,
            studentId: f.Student?.rollNo || f.StudentRollNo,
            studentName: f.Student?.name || f.StudentRollNo,
            date: f.createdAt,
            rating: f.rating,
            category: f.category,
            message: f.comment || '',
            status: f.status || 'pending',
            response: f.response || ''
          }));
          setFeedbacks(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch feedbacks', err);
      }
    };
    fetchFeedbacks();
  }, []);

  const handleUpdateFeedback = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/feedback/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: editStatus, response: editResponse })
      });
      if (res.ok) {
        setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: editStatus, response: editResponse } : f));
        alert('Feedback updated successfully!');
      } else {
        alert('Failed to update feedback');
      }
    } catch (err) {
      alert('Error updating feedback');
    }
  };

  const categories = [
    { id: 'all', label: 'All Feedback' },
    { id: 'Food Quality', label: 'Food Quality' },
    { id: 'Service', label: 'Service' },
    { id: 'Cleanliness', label: 'Cleanliness' },
    { id: 'Other', label: 'Other' },
  ];

  const filteredFeedbacks =
    selectedCategory === 'all'
      ? feedbacks
      : feedbacks.filter((f) => f.category === selectedCategory);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedbacks.filter((f) => f.rating === rating).length,
    percentage: feedbacks.length
      ? (feedbacks.filter((f) => f.rating === rating).length / feedbacks.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6 w-250">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Student Feedback</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold">{avgRating}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(parseFloat(avgRating))
                      ? 'fill-black'
                      : 'fill-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">{feedbacks.length} reviews</p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="border-2 border-black p-6">
        <h3 className="font-bold mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {ratingDistribution.map((dist) => (
            <div key={dist.rating} className="flex items-center gap-3">
              <span className="w-12 text-sm">{dist.rating} stars</span>
              <div className="flex-1 h-6 bg-gray-200 border border-black">
                <div
                  className="h-full bg-black"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <span className="w-12 text-sm text-right">{dist.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 border-2 transition-colors ${
              selectedCategory === cat.id
                ? 'bg-black text-white border-black'
                : 'border-black hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <h3 className="font-bold">
          {selectedCategory === 'all' ? 'All Feedback' : categories.find((c) => c.id === selectedCategory)?.label}
          {' '}({filteredFeedbacks.length})
        </h3>
        
        {filteredFeedbacks.map((feedback) => (
          <div key={feedback.id} className="border-2 border-black p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold">{feedback.studentName}</h4>
                  <span className="text-sm text-gray-600">({feedback.studentId})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= feedback.rating ? 'fill-black' : 'fill-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(feedback.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className="text-xs px-2 py-1 border border-black bg-gray-100">
                {feedback.category}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
              <p className="text-sm flex-1">{feedback.message}</p>
            </div>

            {editingId === feedback.id ? (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="mb-3">
                  <label className="text-sm font-bold block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-48 border border-black p-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="text-sm font-bold block mb-1">Response</label>
                  <textarea
                    value={editResponse}
                    onChange={(e) => setEditResponse(e.target.value)}
                    className="w-full border border-black p-2"
                    rows={3}
                    placeholder="Write a response..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleUpdateFeedback(feedback.id);
                      setEditingId(null);
                    }}
                    className="px-4 py-2 bg-black text-white text-sm font-bold hover:bg-gray-800"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 border border-black text-sm font-bold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between items-start">
                <div>
                  <div className="text-sm">
                    <span className="font-bold">Status:</span>{' '}
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      feedback.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {feedback.status ? feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1) : 'Pending'}
                    </span>
                  </div>
                  {feedback.response && (
                    <div className="text-sm mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="font-bold mb-1">Manager Response:</p>
                      <p className="text-gray-700">{feedback.response}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingId(feedback.id);
                    setEditStatus(feedback.status || 'pending');
                    setEditResponse(feedback.response || '');
                  }}
                  className="px-3 py-1.5 border border-black text-xs font-bold hover:bg-gray-100"
                >
                  Respond / Update
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredFeedbacks.length === 0 && (
          <div className="border-2 border-gray-300 p-8 text-center text-gray-500">
            No feedback in this category
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-black p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="font-bold">Positive Trends</h4>
          </div>
          <p className="text-sm text-gray-600">
            {feedbacks.filter((f) => f.rating >= 4).length} positive reviews
          </p>
        </div>
        
        <div className="border-2 border-black p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h4 className="font-bold">Areas for Improvement</h4>
          </div>
          <p className="text-sm text-gray-600">
            {feedbacks.filter((f) => f.rating <= 2).length} reviews need attention
          </p>
        </div>
      </div>
    </div>
  );
}

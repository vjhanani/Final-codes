import { useState, useEffect } from 'react';
import { MessageSquare, Star, Send } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
interface FeedbackItem {
  id?: string;
  createdAt: string;
  category: string;
  rating: number;
  comment: string;
  status?: 'pending' | 'reviewed' | 'resolved'; // Status from backend
  response?: string;
}

export function Feedback() {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('Food Quality');
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [previousFeedback, setPreviousFeedback] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_HOST}/api/feedback/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setPreviousFeedback(data);
      } catch (err) {
        console.error('Failed to fetch feedback', err);
      }
    };
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please write your feedback');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, category, isAnonymous })
      });

      if (res.ok) {
        const data = await res.json();
        alert('Feedback submitted successfully! Thank you for your input.');
        setPreviousFeedback([data.feedback, ...previousFeedback]);
        setRating(0);
        setCategory('Food Quality');
        setComment('');
        setIsAnonymous(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit feedback');
      }
    } catch (err) {
      alert('Backend unreachable');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Feedback & Suggestions</h2>
        <p className="text-sm mt-2 text-gray-600">Help us improve your mess experience</p>
      </div>

      {/* Feedback Form */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          <MessageSquare className="w-6 h-6" />
          Submit New Feedback
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
            >
              <option value="Food Quality">Food Quality</option>
              <option value="Service">Service</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-lg font-semibold text-gray-700">
                  {rating === 1 && '⭐ Poor'}
                  {rating === 2 && '⭐⭐ Fair'}
                  {rating === 3 && '⭐⭐⭐ Good'}
                  {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                  {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Your Feedback</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience, suggestions, or concerns..."
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
            />
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-800"
            />
            <label htmlFor="anonymous" className="text-sm font-semibold text-gray-700">
              Submit anonymously
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Submit Feedback
          </button>
        </form>
      </div>

      {/* Previous Feedback */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Your Previous Feedback</h3>
        
        {previousFeedback.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No previous feedback</p>
        ) : (
          <div className="space-y-4">
            {previousFeedback.map((feedback: FeedbackItem) => (
              <div key={feedback.id || Math.random().toString()} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-800">{feedback.category}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          feedback.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : feedback.status === 'reviewed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {feedback.status ? feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1) : 'Received'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(feedback.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{feedback.comment}</p>
                {feedback.response && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                    <p className="font-semibold text-gray-800 mb-1">Response from Manager:</p>
                    <p className="text-gray-700">{feedback.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold mb-2 text-blue-900">How We Use Your Feedback</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>All feedback is reviewed by the mess management team</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Your suggestions help us improve menu and services</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Critical issues are addressed within 24-48 hours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Anonymous feedback option available for sensitive concerns</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
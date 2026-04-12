import { useState, useEffect } from 'react';
import { Send, Trash2, Megaphone } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_HOST}/api/announcement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        alert('Announcement created!');
        setTitle('');
        setContent('');
        fetchAnnouncements();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/announcement/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Megaphone className="w-6 h-6 text-blue-600" />
          Announcement Management
        </h2>
        <p className="text-sm mt-2 text-gray-600">Post updates and news for all students</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4">Create New Announcement</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Notice Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="e.g. Mess closed for maintenance"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Notice Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Details of the announcement..."
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors font-semibold"
          >
            <Send className="w-5 h-5" />
            Post Announcement
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4">Past Announcements</h3>
        {announcements.length === 0 ? (
          <p className="text-gray-500 bg-gray-50 p-6 text-center rounded-lg border border-dashed border-gray-300">No announcements posted yet.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="border border-gray-200 rounded-lg p-5 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{ann.title}</h4>
                  <p className="text-xs font-semibold text-gray-500 mb-3">{formatDate(ann.createdAt)}</p>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{ann.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                  title="Delete notice"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

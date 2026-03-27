import { useState, useEffect } from 'react';
import { Plus, Play, Square, BarChart3, Trash2 } from 'lucide-react';

interface PollOption {
  id: number;
  name: string;
  mealType: string;
  votes: number;
}

interface Poll {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  PollOptions: PollOption[];
}

export function PollManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBreakfast, setNewBreakfast] = useState('');
  const [newLunch, setNewLunch] = useState('');
  const [newDinner, setNewDinner] = useState('');

  const fetchPolls = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/poll', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
      }
    } catch (err) {
      console.error('Failed to fetch polls', err);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleCreatePoll = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const options: Record<string, string[]> = {};
      if (newBreakfast.trim()) options.Breakfast = newBreakfast.split('\n').map(s => s.trim()).filter(Boolean);
      if (newLunch.trim()) options.Lunch = newLunch.split('\n').map(s => s.trim()).filter(Boolean);
      if (newDinner.trim()) options.Dinner = newDinner.split('\n').map(s => s.trim()).filter(Boolean);

      const res = await fetch('http://localhost:5000/api/poll/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, description: newDesc, options })
      });
      if (res.ok) {
        alert('Poll created!');
        setShowCreateForm(false);
        setNewTitle(''); setNewDesc(''); setNewBreakfast(''); setNewLunch(''); setNewDinner('');
        fetchPolls();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create poll');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const startPoll = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/poll/start/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPolls();
    } catch { /* */ }
  };

  const endPoll = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/poll/end/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPolls();
    } catch { /* */ }
  };

  const deletePoll = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/poll/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPolls();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete poll');
      }
    } catch {
      alert('Network error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-600';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-600';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-600';
      default: return 'bg-gray-100 text-gray-800 border-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Poll Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Create New Poll
        </button>
      </div>

      {/* Create Poll Form */}
      {showCreateForm && (
        <div className="border-2 border-black p-6">
          <h3 className="text-lg font-bold mb-4">Create New Poll</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Poll Title</label>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black focus:outline-none" placeholder="Enter poll title" />
            </div>
            <div>
              <label className="block font-medium mb-2">Description</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black focus:outline-none" rows={2} placeholder="Enter description" />
            </div>
            <div>
              <label className="block font-medium mb-2">Breakfast Options (one per line)</label>
              <textarea value={newBreakfast} onChange={e => setNewBreakfast(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black focus:outline-none" rows={3} placeholder="Option 1&#10;Option 2" />
            </div>
            <div>
              <label className="block font-medium mb-2">Lunch Options (one per line)</label>
              <textarea value={newLunch} onChange={e => setNewLunch(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black focus:outline-none" rows={3} placeholder="Option 1&#10;Option 2" />
            </div>
            <div>
              <label className="block font-medium mb-2">Dinner Options (one per line)</label>
              <textarea value={newDinner} onChange={e => setNewDinner(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black focus:outline-none" rows={3} placeholder="Option 1&#10;Option 2" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button onClick={handleCreatePoll} disabled={isCreating} className={`px-6 py-2 text-white ${isCreating ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
                {isCreating ? 'Creating...' : 'Create Poll'}
              </button>
              <button onClick={() => setShowCreateForm(false)} className="px-6 py-2 border-2 border-black hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Polls List */}
      <div className="space-y-4">
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-green-100 border border-green-600">
            Active: {polls.filter((p) => p.status === 'active').length}
          </span>
          <span className="px-3 py-1 bg-blue-100 border border-blue-600">
            Scheduled: {polls.filter((p) => p.status === 'scheduled').length}
          </span>
          <span className="px-3 py-1 bg-gray-100 border border-gray-600">
            Closed: {polls.filter((p) => p.status === 'closed').length}
          </span>
        </div>

        {polls.length === 0 && (
          <div className="border-2 border-gray-300 p-8 text-center text-gray-500">No polls created yet</div>
        )}

        {polls.map((poll) => {
          const totalVotes = (poll.PollOptions || []).reduce((sum, o) => sum + o.votes, 0);
          return (
            <div key={poll.id} className="border-2 border-black p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{poll.title}</h3>
                    <span className={`text-xs px-2 py-1 border ${getStatusColor(poll.status)}`}>
                      {poll.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{poll.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {poll.startDate && <span>Started: {new Date(poll.startDate).toLocaleDateString()}</span>}
                    {poll.endDate && <><span>•</span><span>Ended: {new Date(poll.endDate).toLocaleDateString()}</span></>}
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {totalVotes} votes
                    </span>
                  </div>
                </div>
              </div>

              {/* Poll Options grouped by mealType */}
              {(poll.PollOptions || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {[...(poll.PollOptions || [])].sort((a, b) => b.votes - a.votes).map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">[{opt.mealType}] {opt.name}</span>
                          <span className="text-sm text-gray-600">{opt.votes} votes ({percentage}%)</span>
                        </div>
                        <div className="h-4 bg-gray-200 border border-black">
                          <div className="h-full bg-black transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  {poll.status === 'active' && (
                    <button onClick={() => endPoll(poll.id)}
                      className="flex items-center gap-2 px-3 py-2 border-2 border-black hover:bg-gray-100 text-sm">
                      <Square className="w-4 h-4" /> End Poll
                    </button>
                  )}
                  {poll.status === 'scheduled' && (
                    <button onClick={() => startPoll(poll.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-black text-white text-sm">
                      <Play className="w-4 h-4" /> Start Now
                    </button>
                  )}
                </div>
                <button onClick={() => deletePoll(poll.id)}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-600 rounded text-sm transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

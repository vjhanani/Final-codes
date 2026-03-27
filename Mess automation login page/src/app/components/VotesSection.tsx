import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

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

export function VotesSection() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
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
    fetchPolls();
  }, []);

  return (
    <div className="space-y-6 w-250">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">View Votes</h2>
        <p className="text-sm text-gray-600">{polls.length} Total Polls</p>
      </div>

      <div className="space-y-4">
        {polls.length === 0 && (
          <div className="border-2 border-gray-300 p-8 text-center text-gray-500">No polls available</div>
        )}

        {polls.map((poll) => {
          const totalVotes = (poll.PollOptions || []).reduce((sum, o) => sum + o.votes, 0);
          return (
            <div key={poll.id} className="border-2 border-black p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{poll.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{poll.description}</p>
                  {poll.startDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Started: {new Date(poll.startDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{totalVotes}</p>
                  <p className="text-xs text-gray-600">Total Votes</p>
                </div>
              </div>

              <div className="space-y-3">
                {[...(poll.PollOptions || [])].sort((a, b) => b.votes - a.votes).map((opt) => {
                  const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">[{opt.mealType}] {opt.name}</span>
                        <span className="text-sm text-gray-600">
                          {opt.votes} votes ({percentage}%)
                        </span>
                      </div>
                      <div className="h-6 bg-gray-200 border border-black">
                        <div
                          className="h-full bg-black transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

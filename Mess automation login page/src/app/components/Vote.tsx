import { useState, useEffect } from 'react';
import { ThumbsUp, Clock, CheckCircle2 } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
interface PollOption {
  id: number;
  name: string;
  mealType: string;
  votes: number;
}

interface PollData {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  PollOptions: PollOption[];
}

export function Vote() {
  const [polls, setPolls] = useState<PollData[]>([]);
  const [selections, setSelections] = useState<Record<number, Record<string, number>>>({});
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch(`${API_HOST}/api/poll`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch polls");
        
        const rawPolls = await res.json();
        // Standardize PollOptions casing just in case backend returns it differently
        const pollsData = rawPolls.map((p: any) => ({
          ...p,
          PollOptions: p.PollOptions || p.pollOptions || p.poll_options || []
        }));
        
        setPolls(pollsData);

        const myRes = await fetch(`${API_HOST}/api/poll/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (myRes.ok) {
          const myVotes = await myRes.json();
          
          const initialSelections: Record<number, Record<string, number>> = {};
          const initialVoted = new Set<number>();

          myVotes.forEach((vote: any) => {
            const pollId = vote.PollId;
            initialVoted.add(pollId);
            
            const poll = pollsData.find((p: PollData) => p.id === pollId);
            if (poll) {
              const option = poll.PollOptions?.find((o: PollOption) => o.id === vote.PollOptionId);
              if (option) {
                if (!initialSelections[pollId]) initialSelections[pollId] = {};
                initialSelections[pollId][option.mealType] = option.id;
              }
            }
          });

          setSelections(initialSelections);
          setVotedPolls(initialVoted);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const handleSelect = (pollId: number, mealType: string, optionId: number) => {
    setSelections(prev => ({
      ...prev,
      [pollId]: { ...(prev[pollId] || {}), [mealType]: optionId }
    }));
  };

  const handleSubmitVote = async (pollId: number) => {
    try {
      const token = localStorage.getItem('token');
      const poll = polls.find(p => p.id === pollId);
      const availableMealTypes = Array.from(new Set((poll?.PollOptions || []).map(opt => opt.mealType)));
      
      const pollSelections = selections[pollId] || {};
      const missingMeals = availableMealTypes.filter(meal => !pollSelections[meal]);

      if (missingMeals.length > 0) {
        alert(`Please select one option for: ${missingMeals.join(', ')}`);
        return;
      }

      const res = await fetch(`${API_HOST}/api/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pollId, votes: pollSelections })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Vote processed successfully!');
        setVotedPolls(prev => new Set(prev).add(pollId));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit vote');
      }
    } catch {
      alert('Network error');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Group options by mealType
  const groupByMeal = (options: PollOption[]) => {
    const grouped: Record<string, PollOption[]> = {};
    options.forEach(opt => {
      if (!grouped[opt.mealType]) grouped[opt.mealType] = [];
      grouped[opt.mealType].push(opt);
    });
    return grouped;
  };

  const activePolls = polls.filter(p => p.status === 'active');
  const closedPolls = polls.filter(p => p.status === 'closed');
  const scheduledPolls = polls.filter(p => p.status === 'scheduled');

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Menu Voting System</h2>
        <p className="text-sm mt-2 text-gray-600">Select one option per meal (Breakfast, Lunch, Dinner) and submit your vote!</p>
      </div>

      {loading && (
        <div className="bg-white border p-12 rounded-lg text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Fetching active polls...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-red-700 text-center">
          <p className="font-bold">Error loading polls</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Active Polls</h3>
          {activePolls.map(poll => {
            const grouped = groupByMeal(poll.PollOptions || []);
            const hasVoted = votedPolls.has(poll.id);
            const totalVotes = (poll.PollOptions || []).reduce((s, o) => s + o.votes, 0);
            return (
              <div key={poll.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-gray-800">{poll.title}</h4>
                    <p className="text-gray-600 mb-3">{poll.description}</p>
                    {poll.startDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Started {formatDate(poll.startDate)}</span>
                      </div>
                    )}
                  </div>
                  {hasVoted && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Voted
                    </span>
                  )}
                </div>

                {/* Options grouped by meal */}
                {Object.entries(grouped).map(([mealType, opts]) => (
                  <div key={mealType} className="mb-4">
                    <h5 className="font-bold text-gray-700 mb-2 border-b pb-1">{mealType}</h5>
                    <div className="space-y-2">
                      {[...opts].sort((a, b) => b.votes - a.votes).map(opt => {
                        const isSelected = selections[poll.id]?.[mealType] === opt.id;
                        return (
                          <div key={opt.id}
                            className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition ${
                              isSelected ? 'border-gray-800 bg-gray-100' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelect(poll.id, mealType, opt.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-gray-800 bg-gray-800' : 'border-gray-400'
                              }`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <span className="font-medium text-gray-800">{opt.name}</span>
                            </div>
                            {hasVoted && <span className="text-sm text-gray-500">{opt.votes} votes</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {hasVoted && (
                  <div className="mt-2 mb-3 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm text-center">
                    You have already voted on this poll, but you can change your selection above.
                  </div>
                )}
                <button
                  onClick={() => handleSubmitVote(poll.id)}
                  className="w-full mt-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <ThumbsUp className="w-5 h-5" /> {hasVoted ? 'Update Vote' : 'Submit Vote'}
                </button>

                <div className="mt-3 text-center text-sm text-gray-500">Total votes: {totalVotes}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Closed Polls */}
      {closedPolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Closed Polls</h3>
          {closedPolls.map(poll => {
            const totalVotes = (poll.PollOptions || []).reduce((s, o) => s + o.votes, 0);
            return (
              <div key={poll.id} className="bg-gray-50 border border-gray-300 rounded-lg p-6 opacity-90">
                <h4 className="text-xl font-bold mb-2">{poll.title}</h4>
                <p className="text-gray-600 mb-3">{poll.description}</p>
                <div className="space-y-2">
                  {[...(poll.PollOptions || [])].sort((a, b) => b.votes - a.votes).map(opt => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="flex items-center justify-between p-3 bg-white rounded">
                        <span className="font-medium">[{opt.mealType}] {opt.name}</span>
                        <span className="text-gray-600">{opt.votes} votes ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheduled Polls */}
      {scheduledPolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Upcoming Polls</h3>
          {scheduledPolls.map(poll => (
            <div key={poll.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-2">{poll.title}</h4>
              <p className="text-gray-600 mb-3">{poll.description}</p>
              <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">Scheduled</span>
            </div>
          ))}
        </div>
      )}

        </>
      )}

      {!loading && polls.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">No polls available</div>
      )}
    </div>
  );
}
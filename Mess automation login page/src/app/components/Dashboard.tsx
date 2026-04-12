import { useState, useEffect } from 'react';
import { Coffee, UtensilsCrossed, Moon, Megaphone } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayMenu, setTodayMenu] = useState<{ breakfast: string[]; lunch: string[]; dinner: string[] }>({
    breakfast: [],
    lunch: [],
    dinner: [],
  });
  const [extraTotal, setExtraTotal] = useState(0);
  const [bdmr, setBdmr] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTodayMenu = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_HOST}/api/menu/today`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTodayMenu({
            breakfast: data.menu?.Breakfast || [],
            lunch: data.menu?.Lunch || [],
            dinner: data.menu?.Dinner || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch today menu', err);
      }
    };

    const fetchExtrasTotal = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_HOST}/api/extras/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setExtraTotal(data.totalAmount || 0);
        }
      } catch {
        // student may not have extras
      }
    };

    const fetchBDMR = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const date = new Date();
        const configKey = `BDMR_${date.getFullYear()}_${date.getMonth() + 1}`;
        const res = await fetch(`${API_HOST}/api/config/${configKey}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.value) setBdmr(Number(data.value));
        }
      } catch (err) {
        console.error('Failed to fetch BDMR', err);
      }
    };

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
        console.error('Failed to fetch announcements', err);
      }
    };

    fetchTodayMenu();
    fetchExtrasTotal();
    fetchBDMR();
    fetchAnnouncements();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Campus Image Banner */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm font-semibold">CAMPUS IMAGE PLACEHOLDER</span>
        </div>
        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50">
          <h3 className="text-lg font-bold text-gray-800">P.K. Kelkar Hall</h3>
          <p className="text-sm text-gray-600">Indian Institute of Technology, Kanpur</p>
        </div>
      </div>

      {/* Date and Time */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{formatDate(currentTime)}</h2>
          <p className="text-xl text-gray-600">{formatTime(currentTime)}</p>
        </div>
      </div>

      {/* Today's Menu */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6 text-center pb-3 border-b-2 border-gray-800 text-gray-800">
          Today's Mess Menu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Breakfast */}
          <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-yellow-50">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="bg-yellow-200 p-3 rounded-full">
                <Coffee className="w-8 h-8 text-yellow-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Breakfast</h3>
            </div>
            <ul className="space-y-2">
              {todayMenu.breakfast.length > 0 ? todayMenu.breakfast.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                  <span>{item}</span>
                </li>
              )) : (
                <li className="text-gray-400 text-sm">No menu set for today</li>
              )}
            </ul>
          </div>

          {/* Lunch */}
          <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-orange-50">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="bg-orange-200 p-3 rounded-full">
                <UtensilsCrossed className="w-8 h-8 text-orange-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Lunch</h3>
            </div>
            <ul className="space-y-2">
              {todayMenu.lunch.length > 0 ? todayMenu.lunch.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                  <span>{item}</span>
                </li>
              )) : (
                <li className="text-gray-400 text-sm">No menu set for today</li>
              )}
            </ul>
          </div>

          {/* Dinner */}
          <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-blue-50">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="bg-blue-200 p-3 rounded-full">
                <Moon className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Dinner</h3>
            </div>
            <ul className="space-y-2">
              {todayMenu.dinner.length > 0 ? todayMenu.dinner.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                  <span>{item}</span>
                </li>
              )) : (
                <li className="text-gray-400 text-sm">No menu set for today</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <h2 className="text-2xl font-bold mb-6 mt-8 border-b-2 border-gray-800 text-gray-800 pb-3">
        Monthly Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2">Total Extras Spent (This Month)</p>
          <p className="text-5xl font-bold text-orange-600">₹{extraTotal}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2">Current BDMR Rate</p>
          <p className="text-5xl font-bold text-blue-600">{bdmr ? `₹${bdmr}/day` : 'Not Set'}</p>
        </div>
      </div>

      {/* Announcements */}
      <h2 className="text-2xl font-bold mb-6 mt-8 border-b-2 border-gray-800 text-gray-800 pb-3 flex items-center gap-2">
        <Megaphone className="w-6 h-6" />
        Latest Announcements
      </h2>
      <div className="space-y-4 pb-8">
        {announcements.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center text-gray-500">
            No active announcements at the moment.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg shadow-sm p-5">
              <h3 className="font-bold text-lg text-gray-900">{ann.title}</h3>
              <p className="text-xs text-blue-600 font-medium mb-3">
                {formatDate(new Date(ann.createdAt))} at {formatTime(new Date(ann.createdAt))}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap flex-1">{ann.content}</p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
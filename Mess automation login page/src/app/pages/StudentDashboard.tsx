import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Dashboard } from '@/app/components/Dashboard';
import { Profile } from '@/app/components/Profile';
import { BookExtras } from '@/app/components/BookExtras';
import { ViewDues } from '@/app/components/ViewDues';
import { Vote } from '@/app/components/Vote';
import { Feedback } from '@/app/components/Feedback';
import { RequestRebate } from '@/app/components/RequestRebate';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'extras':
        return <BookExtras />;
      case 'dues':
        return <ViewDues />;
      case 'vote':
        return <Vote />;
      case 'feedback':
        return <Feedback />;
      case 'rebate':
        return <RequestRebate />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-9/10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Placeholder - Add your IIT Kanpur logo here */}
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-xs font-semibold">LOGO</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Mess Automation System</h1>
              <p className="text-sm text-gray-600">IIT Kanpur</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Left Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden sticky top-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full px-6 py-4 text-left border-b border-gray-200 transition-colors font-medium ${
                activeTab === 'dashboard' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full px-6 py-4 text-left border-b border-gray-200 transition-colors font-medium ${
                activeTab === 'profile' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('extras')}
              className={`w-full px-6 py-4 text-left border-b border-gray-200 transition-colors font-medium ${
                activeTab === 'extras' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Book Extras
            </button>
            <button
              onClick={() => setActiveTab('dues')}
              className={`w-full px-6 py-4 text-left border-b border-gray-200 transition-colors font-medium ${
                activeTab === 'dues' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              View Dues
            </button>
            <button
              onClick={() => setActiveTab('vote')}
              className={`w-full px-6 py-4 text-left border-b border-gray-200 transition-colors font-medium ${
                activeTab === 'vote' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Vote
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full px-6 py-4 text-left border-b border-gray-200 transition-colors font-medium ${
                activeTab === 'feedback' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab('rebate')}
              className={`w-full px-6 py-4 text-left transition-colors font-medium ${
                activeTab === 'rebate' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Request Rebate
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}


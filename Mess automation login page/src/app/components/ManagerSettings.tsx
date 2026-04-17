import { useState } from 'react';
import { Lock, Save, X } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

export function ManagerSettings() {
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    if (!changePasswordData.oldPassword || !changePasswordData.newPassword) {
      setMessage({ text: 'All fields are required', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    setMessage({ text: '', type: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: changePasswordData.oldPassword,
          newPassword: changePasswordData.newPassword
        })
      });

      if (res.ok) {
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setChangePasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        setMessage({ text: err.error || 'Failed to change password', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Account Settings</h2>
      </div>

      <div className="border-2 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black">
          <Lock className="w-6 h-6" />
          <h3 className="text-xl font-bold">Change Password</h3>
        </div>

        {message.text && (
          <div className={`p-4 mb-6 border-2 ${
            message.type === 'success' ? 'bg-green-100 border-green-600 text-green-800' : 'bg-red-100 border-red-600 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              value={changePasswordData.oldPassword}
              onChange={e => setChangePasswordData({...changePasswordData, oldPassword: e.target.value})}
              className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none transition-colors"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={changePasswordData.newPassword}
              onChange={e => setChangePasswordData({...changePasswordData, newPassword: e.target.value})}
              className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none transition-colors"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Confirm New Password</label>
            <input
              type="password"
              value={changePasswordData.confirmPassword}
              onChange={e => setChangePasswordData({...changePasswordData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 border-2 border-black focus:bg-gray-50 focus:outline-none transition-colors"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isChangingPassword ? 'Changing Password...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => setChangePasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })}
              className="px-6 py-4 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="p-4 border-2 border-black bg-yellow-50">
        <p className="text-sm font-medium">
          <strong>Tip:</strong> Use a strong password with at least 8 characters, including letters and numbers, to keep your manager account secure.
        </p>
      </div>
    </div>
  );
}

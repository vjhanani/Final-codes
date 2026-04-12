import { User, Mail, Building, Camera, CheckCircle, XCircle, Phone, Edit2, Save, X, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
export function Profile() {
  const [studentData, setStudentData] = useState({
    name: 'Loading...',
    rollNumber: 'Loading...',
    email: 'Loading...',
    room: 'Loading...',
    phone: '',
    joinedDate: 'Loading...',
    messCard: 'Loading...',
    hasFace: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', room: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [showWebcam, setShowWebcam] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const webcamRef = useRef<Webcam>(null);

    // New states for change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_HOST}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Update real fields from DB
          setStudentData(prev => ({
            ...prev,
            name: data.name,
            rollNumber: data.rollNo,
            email: data.email,
            room: data.roomNo || 'Not provided',
            phone: data.phone || 'Not provided',
            messCard: data.messCardStatus,
            joinedDate: new Date(data.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            hasFace: !!data.facePhoto
          }));
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);
  const handleSaveProfile = async () => {
    if (!editData.name.trim()) {
      alert("Name cannot be empty");
      return;
    }
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editData.name,
          roomNo: editData.room,
          phone: editData.phone
        })
      });

      if (res.ok) {
        setStudentData(prev => ({
          ...prev,
          name: editData.name,
          room: editData.room,
          phone: editData.phone
        }));
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update profile');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setEditData({
      name: studentData.name,
      room: studentData.room === 'Not Assigned' ? '' : studentData.room,
      phone: studentData.phone || ''
    });
    setIsEditing(true);
  };

  const handleCapture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/auth/update-face-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: imageSrc })
      });

      if (res.ok) {
        alert("Face profile updated successfully!");
        setStudentData(prev => ({ ...prev, hasFace: true }));
        setShowWebcam(false);
      } else {
        const data = await res.json();
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setIsUploading(false);
    }
  };

const handleChangePassword = async () => {
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordError('New passwords do not match');
      return;
    }
    if (!changePasswordData.oldPassword || !changePasswordData.newPassword) {
      setChangePasswordError('All fields are required');
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordError('');
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
        alert('Password changed successfully!');
        setShowChangePassword(false);
        setChangePasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        // Optionally, log out the user or refresh token
      } else {
        const err = await res.json();
        setChangePasswordError(err.error || 'Failed to change password');
      }
    } catch (err) {
      setChangePasswordError('Network error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const cancelChangePassword = () => {
    setShowChangePassword(false);
    setChangePasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setChangePasswordError('');
  };


  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Student Profile</h2>
          {!isEditing ? (
            <button 
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                disabled={isSaving}
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6 pb-6 border-b border-gray-200 mb-6">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input 
                type="text"
                value={editData.name}
                onChange={e => setEditData({...editData, name: e.target.value})}
                className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none w-full bg-transparent px-1 py-1 mb-1"
                placeholder="Full Name"
              />
            ) : (
              <h3 className="text-2xl font-bold text-gray-800">{studentData.name}</h3>
            )}
            <p className="text-gray-600">Roll No: {studentData.rollNumber}</p>
            <div className="mt-2 flex items-center space-x-30">
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              Mess Card: {studentData.messCard}
            </span>
            <button 
                className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold hover:bg-red-200 transition-colors"
                onClick={() => setShowChangePassword(true)}
              >
                <Lock className="w-4 h-4 inline mr-1" /> Change Password
              </button>
            </div>
          </div>
        </div>

{/* Change Password Section */}
        {showChangePassword && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
            {changePasswordError && (
              <p className="text-red-600 text-sm mb-4">{changePasswordError}</p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={changePasswordData.oldPassword}
                  onChange={e => setChangePasswordData({...changePasswordData, oldPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={changePasswordData.newPassword}
                  onChange={e => setChangePasswordData({...changePasswordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                 type="password"
                  value={changePasswordData.confirmPassword}
                  onChange={e => setChangePasswordData({...changePasswordData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={cancelChangePassword}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold text-gray-800 truncate" title={studentData.email}>{studentData.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Building className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Room Number</p>
              {isEditing ? (
                 <input 
                   type="text"
                   value={editData.room}
                   onChange={e => setEditData({...editData, room: e.target.value})}
                   className="font-semibold text-gray-800 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none w-full bg-transparent px-1 mt-1"
                   placeholder="e.g. F401"
                 />
              ) : (
                <p className="font-semibold text-gray-800">{studentData.room || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Phone Number</p>
              {isEditing ? (
                 <input 
                   type="text"
                   value={editData.phone}
                   onChange={e => setEditData({...editData, phone: e.target.value})}
                   className="font-semibold text-gray-800 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none w-full bg-transparent px-1 mt-1"
                   placeholder="+91..."
                 />
              ) : (
                <p className="font-semibold text-gray-800">{studentData.phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-semibold text-gray-800">{studentData.joinedDate}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Face Authentication</p>
                {studentData.hasFace ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                        <CheckCircle className="w-3 h-3" /> Registered
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                        <XCircle className="w-3 h-3" /> Not Set
                    </span>
                )}
            </div>
            {!showWebcam ? (
                <button 
                    onClick={() => setShowWebcam(true)}
                    className="w-full py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                    <Camera className="w-4 h-4" />
                    {studentData.hasFace ? "Update Face Profile" : "Enrol Face ID"}
                </button>
            ) : (
                <div className="space-y-2">
                    <div className="relative aspect-video bg-black rounded overflow-hidden">
                        <Webcam 
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCapture}
                            disabled={isUploading}
                            className="flex-1 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {isUploading ? "Uploading..." : "Capture & Save"}
                        </button>
                        <button 
                            onClick={() => setShowWebcam(false)}
                            className="flex-1 py-1 bg-gray-200 text-gray-800 rounded text-xs font-bold hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
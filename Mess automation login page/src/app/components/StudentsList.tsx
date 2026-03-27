import { useState, useEffect } from 'react';
import { Search, Download, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  room: string;
  email: string;
  phone: string;
  messStatus: 'active' | 'suspended' | 'pending';
  hasFaceId: boolean;
  joinDate: string;
}

export function StudentsList() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((st: any) => ({
          id: st.rollNo,
          name: st.name,
          rollNumber: st.rollNo,
          room: st.roomNo || 'N/A',
          email: st.email,
          phone: st.phone || 'N/A',
          messStatus: (st.messCardStatus || 'pending').toLowerCase() as any,
          hasFaceId: !!st.facePhoto,
          joinDate: st.createdAt
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleStatus = async (rollNo: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/students/toggle-status/${rollNo}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to toggle status");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleDelete = async (rollNo: string) => {
    if (!window.confirm(`Are you sure you want to delete student ${rollNo}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/students/${rollNo}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Student deleted successfully");
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete student");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Student['messStatus']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-600';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-600';
    }
  };

  return (
    <div className="space-y-6 w-250">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Students</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800">
          <Download className="w-4 h-4" />
          Export List
        </button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll number, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        
        <div className="flex gap-2 text-sm">
          <span className="px-3 py-2 bg-green-100 border border-green-600">
            Active: {students.filter((s) => s.messStatus === 'active').length}
          </span>
          <span className="px-3 py-2 bg-yellow-100 border border-yellow-600">
            Pending: {students.filter((s) => s.messStatus === 'pending').length}
          </span>
          <span className="px-3 py-2 bg-red-100 border border-red-600">
            Suspended: {students.filter((s) => s.messStatus === 'suspended').length}
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="border-2 border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3 text-left">Roll Number</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Room</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Face ID</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Join Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr
                  key={student.id}
                  className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="px-4 py-3 font-medium">{student.rollNumber}</td>
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3">{student.room}</td>
                  <td className="px-4 py-3 text-sm">{student.email}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {student.hasFaceId ? '✅' : '❌'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 border ${getStatusColor(
                        student.messStatus
                      )}`}
                    >
                      {student.messStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(student.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleStatus(student.rollNumber)}
                        className={`px-2 py-1 text-xs border rounded transition-colors ${
                          student.messStatus === 'active' 
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                        }`}
                        title={student.messStatus === 'active' ? 'Suspend' : 'Activate'}
                      >
                        {student.messStatus === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(student.rollNumber)}
                        className="p-1 hover:bg-gray-200 rounded group"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No students found matching your search.
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredStudents.length} of {students.length} students
      </div>
    </div>
  );
}

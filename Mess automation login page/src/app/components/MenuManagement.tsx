import { useState, useEffect } from 'react';
import { Plus, Edit, Save, X } from 'lucide-react';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
interface MenuItem {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

interface DayMenu {
  day: string;
  date: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

export function MenuManagement() {
  const [activeTab, setActiveTab] = useState<'daily' | 'prebooking' | 'extras' | 'bdmr'>('daily');
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [weekMenu, setWeekMenu] = useState<DayMenu[]>([]);
  const [editingVals, setEditingVals] = useState<{ breakfast: string, lunch: string, dinner: string }>({ breakfast: '', lunch: '', dinner: '' });

  // Add Item Form State
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Snacks');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // BDMR State
  const [bdmr, setBdmr] = useState('70');

  const [extraItems, setExtraItems] = useState<any[]>([]);
  const [currentBookings, setCurrentBookings] = useState<any[]>([]);
  const [specialItems, setSpecialItems] = useState<any[]>([]);

  // Special Item Form State
  const [newSpecialName, setNewSpecialName] = useState('');
  const [newSpecialPrice, setNewSpecialPrice] = useState('');
  const [newSpecialMeal, setNewSpecialMeal] = useState('lunch');
  const [newSpecialDate, setNewSpecialDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_HOST}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Convert map to array
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mapped = days.map(day => {
          const dayData = data[day] || {};
          return {
            day,
            date: new Date().toISOString(), // Mocking date since backend only stores day names
            breakfast: dayData['Breakfast'] || [],
            lunch: dayData['Lunch'] || [],
            dinner: dayData['Dinner'] || [],
          };
        });
        setWeekMenu(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch menus', err);
    }
  };

  const fetchExtras = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_HOST}/api/extras`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.items.map((i: any) => ({
          id: String(i.id),
          name: i.name,
          price: parseFloat(i.price),
          mealType: i.mealType,
          isAvailable: i.isAvailable
        }));
        setExtraItems(items);
      }
    } catch (err) {
      console.error('Failed to fetch extras:', err);
    }
  };

  const fetchBDMR = async () => {
    try {
      const token = localStorage.getItem('token');
      const date = new Date();
      const configKey = `BDMR_${date.getFullYear()}_${date.getMonth() + 1}`;
      const res = await fetch(`${API_HOST}/api/config/${configKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBdmr(data.value);
      }
    } catch { /* */ }
  };

  const fetchSpecialItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/special-items/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSpecialItems(await res.json());
    } catch { /* */ }
  };

  useEffect(() => {
    fetchMenu();
    fetchExtras();
    fetchBDMR();
    fetchBookings();
    fetchSpecialItems();
  }, []);

  const handleSaveMenu = async (day: string) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        meals: {
          Breakfast: editingVals.breakfast.split('\n').map(s => s.trim()).filter(Boolean),
          Lunch: editingVals.lunch.split('\n').map(s => s.trim()).filter(Boolean),
          Dinner: editingVals.dinner.split('\n').map(s => s.trim()).filter(Boolean)
        }
      };

      const res = await fetch(`${API_HOST}/api/menu/day/${day}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingDay(null);
        fetchMenu();
        alert(`${day} menu updated!`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update menu');
      }
    } catch (err) {
      alert('Network error while saving menu');
    }
  };

  const renderDailyMenu = () => (
    <div className="space-y-4 w-250">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Weekly Menu</h3>
        <button className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-gray-100">
          <Plus className="w-4 h-4" />
          Add New Day
        </button>
      </div>

      {weekMenu.map((menu) => (
        <div key={menu.day} className="border-2 border-black p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold">{menu.day}</h4>
              <p className="text-sm text-gray-600">
                {new Date(menu.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {editingDay === menu.day ? (
                <>
                  <button
                    onClick={() => handleSaveMenu(menu.day)}
                    className="flex items-center gap-2 px-3 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDay(null)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditingVals({
                      breakfast: menu.breakfast.join('\n'),
                      lunch: menu.lunch.join('\n'),
                      dinner: menu.dinner.join('\n')
                    });
                    setEditingDay(menu.day);
                  }}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-black hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
              <div key={meal} className="border border-black p-4">
                <h5 className="font-bold mb-2 capitalize">{meal}</h5>
                {editingDay === menu.day ? (
                  <textarea
                    className="w-full p-2 border border-gray-300 text-sm"
                    rows={4}
                    value={editingVals[meal]}
                    onChange={(e) => setEditingVals(prev => ({ ...prev, [meal]: e.target.value }))}
                  />
                ) : (
                  <ul className="space-y-1 text-sm">
                    {menu[meal].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/extras/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
      if (res.ok) fetchExtras();
    } catch { /* */ }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/pre-booking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentBookings(data);
      }
    } catch { /* */ }
  };

  const handleCreateSpecial = async () => {
    if (!newSpecialName || !newSpecialPrice) return alert("Please enter name and price");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_HOST}/api/special-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newSpecialName,
          price: parseFloat(newSpecialPrice),
          meal: newSpecialMeal,
          date: newSpecialDate
        })
      });
      if (res.ok) {
        fetchSpecialItems();
        setNewSpecialName(''); setNewSpecialPrice('');
        alert("Special item created!");
      }
    } catch { /* */ }
  };

  const handleUpdateBDMR = async () => {
    try {
      const token = localStorage.getItem('token');
      const date = new Date();
      const configKey = `BDMR_${date.getFullYear()}_${date.getMonth() + 1}`;
      const res = await fetch(`${API_HOST}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: configKey, value: bdmr })
      });
      if (res.ok) alert("BDMR Settings Updated for this month!");
    } catch { alert("Network error"); }
  };

  const renderPreBooking = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Initiate New Special Pre-booking</h3>
        <div className="border-2 border-black p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input type="text" placeholder="Item Name" value={newSpecialName} onChange={e => setNewSpecialName(e.target.value)} className="p-2 border border-black" />
            <input type="number" placeholder="Cost" value={newSpecialPrice} onChange={e => setNewSpecialPrice(e.target.value)} className="p-2 border border-black" />
            <select value={newSpecialMeal} onChange={e => setNewSpecialMeal(e.target.value)} className="p-2 border border-black bg-white">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <input type="date" value={newSpecialDate} onChange={e => setNewSpecialDate(e.target.value)} className="p-2 border border-black" />
          </div>
          <button onClick={handleCreateSpecial} className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors">Create Pre-booking Item</button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Manage Active Special Items</h3>
        <div className="border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white text-sm text-left">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2">Meal</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {specialItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">₹{item.price}</td>
                  <td className="px-4 py-2 capitalize">{item.meal}</td>
                  <td className="px-4 py-2">{item.date}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        await fetch(`${API_HOST}/api/special-items/${item.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchSpecialItems();
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {specialItems.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No special items configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Current Pre-booking Requests</h3>
        <div className="border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white text-sm">
              <tr>
                <th className="px-4 py-2 text-left">Student</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Meal</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {currentBookings.map((b, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-2">{b.StudentRollNo}</td>
                  <td className="px-4 py-2">{b.dishName}</td>
                  <td className="px-4 py-2 capitalize">{b.meal}</td>
                  <td className="px-4 py-2">{b.date}</td>
                  <td className="px-4 py-2 font-medium">{b.status}</td>
                </tr>
              ))}
              {currentBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No active pre-bookings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBDMR = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">BDMR (Daily Mess Rate Settings)</h3>
      <div className="border-2 border-black p-6">
        <div className="max-w-xs">
          <label className="block font-medium mb-2">Base Daily Mess Rate (₹)</label>
          <input
            type="number"
            value={bdmr}
            onChange={e => setBdmr(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-2">This value is used for rebate and fine calculations.</p>
        </div>

        <button
          onClick={handleUpdateBDMR}
          className="mt-6 px-6 py-2 bg-black text-white hover:bg-gray-800"
        >
          Save BDMR Settings
        </button>
      </div>
    </div>
  );

  function renderExtrasManagement() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Extra Items Inventory</h3>
          <button
            onClick={() => setShowAddItemForm(!showAddItemForm)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>

        {showAddItemForm && (
          <div className="border-2 border-black p-6 bg-gray-50 space-y-4">
            <h4 className="font-bold">Add New Extra Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input type="text" placeholder="Item Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="p-2 border border-black" />
              <input type="number" placeholder="Price (₹)" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="p-2 border border-black" />
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="p-2 border border-black bg-white">
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="All">All</option>
              </select>
            </div>
            <button
              onClick={async () => {
                if (isAddingItem) return;
                setIsAddingItem(true);
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_HOST}/api/extras/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: newItemName, price: newItemPrice, mealType: newItemCategory, day: 'All' })
                  });
                  if (res.ok) {
                    fetchExtras();
                    setShowAddItemForm(false);
                    setNewItemName('');
                    setNewItemPrice('');
                  } else {
                    const err = await res.json();
                    alert(err.error || 'Failed to add item');
                  }
                } catch (err) {
                  alert('Network error');
                } finally {
                  setIsAddingItem(false);
                }
              }}
              disabled={isAddingItem}
              className={`px-6 py-2 text-white transition-colors ${isAddingItem ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                }`}
            >
              {isAddingItem ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        )}

        <div className="border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white text-sm">
              <tr>
                <th className="px-4 py-3 text-left">Item Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {extraItems.map((item) => (
                <tr key={item.id} className="border-t border-black">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 capitalize">{item.mealType}</td>
                  <td className="px-4 py-3">₹{item.price}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(item.id, item.isAvailable)}
                        className="text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem('token');
                          await fetch(`${API_HOST}/api/extras/delete/${item.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          fetchExtras();
                        }}
                        className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Menu Management</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-black">
        {[
          { id: 'daily', label: 'Daily Menu' },
          { id: 'prebooking', label: 'Pre-booking' },
          { id: 'extras', label: 'Extra Items' },
          { id: 'bdmr', label: 'BDMR Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                ? 'bg-black text-white'
                : 'hover:bg-gray-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'daily' && renderDailyMenu()}
        {activeTab === 'extras' && renderExtrasManagement()}
        {activeTab === 'prebooking' && renderPreBooking()}
        {activeTab === 'bdmr' && renderBDMR()}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Calendar } from 'lucide-react';

interface ExtraItem {
  id: string;
  name: string;
  price: number;
  mealType: string;
  isAvailable: boolean;
  stock: number; // plates left
}

interface PreBookItem {
  id: string;
  dishName: string;
  price: number;
  meal: 'breakfast' | 'lunch' | 'dinner';
  date: string;
  quantity: number;
}

export function BookExtras() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeSection, setActiveSection] =
    useState<'instant' | 'prebook'>('instant');

  // ✅ INSTANT PURCHASE ITEMS (with stock)
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/extras', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items.map((i: any) => ({
             id: String(i.id),
             name: i.name,
             price: parseFloat(i.price),
             mealType: i.mealType,
             isAvailable: i.isAvailable,
             stock: i.stockQuantity
          }));
          setExtraItems(items);
        }
      } catch (err) {
        console.error('Failed to fetch extras:', err);
      }
    };
    fetchExtras();
  }, [activeSection]);

  // ✅ PRE-BOOK STATE
  const [preBookings, setPreBookings] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/pre-booking/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMyBookings(await res.json());
    } catch { /* */ }
  };

  useEffect(() => {
    const fetchSpecialItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/special-items/available', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map to PreBookItem format
          setPreBookings(data.map((item: any) => ({
             ...item,
             dishName: item.name,
             quantity: 0
          })));
        }
      } catch (err) { /* */ }
    };
    if (activeSection === 'prebook') {
      fetchSpecialItems();
      fetchMyBookings();
    }
  }, [activeSection]);

  // 🔹 CART + STOCK LOGIC
  const addToCart = (itemId: string) => {
    setExtraItems(prev =>
      prev.map(item =>
        item.id === itemId && item.stock > 0
          ? { ...item, stock: item.stock - 1 }
          : item
      )
    );

    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setExtraItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, stock: item.stock + 1 } : item
      )
    );

    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId]--;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const getTotalAmount = () =>
    Object.entries(cart).reduce((total, [id, qty]) => {
      const item = extraItems.find(i => i.id === id);
      return total + (item ? item.price * qty : 0);
    }, 0);

  const handleCheckout = async () => {
    if (!Object.keys(cart).length) {
      alert('Your cart is empty!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const itemsPayload = Object.entries(cart).map(([itemId, quantity]) => ({
        itemId: parseInt(itemId),
        quantity
      }));

      const res = await fetch('http://localhost:5000/api/extras/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsPayload })
      });

      if (res.ok) {
        alert(`Order placed successfully! Total amount: ₹${getTotalAmount()}`);
        setCart({});
      } else {
        const err = await res.json();
        alert(err.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Backend connection failed');
    }
  };

  // 🔹 PRE-BOOK LOGIC — UNCHANGED
  const incrementPreBook = (index: number) => {
    setPreBookings(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: (item.quantity || 0) + 1 } : item
      )
    );
  };

  const decrementPreBook = (index: number) => {
    setPreBookings(prev =>
      prev.map((item, i) =>
        i === index && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  };

  const handlePreBookSubmit = async () => {
    const itemsToBook: PreBookItem[] = [];
    preBookings.forEach(item => {
      for(let i=0; i < (item.quantity || 0); i++) {
         itemsToBook.push(item);
      }
    });

    if (itemsToBook.length === 0) {
      alert('Please select at least one item to pre-book');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      for (const item of itemsToBook) {
        await fetch('http://localhost:5000/api/pre-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            dishName: item.dishName,
            meal: item.meal,
            date: item.date, // Use the date configured by manager
            SpecialItemId: item.id
          })
        });
      }

      alert(`Successfully placed ${itemsToBook.length} pre-bookings!`);
      setPreBookings(prev => prev.map(item => ({ ...item, quantity: 0 })));
      fetchMyBookings();
    } catch (err) {
      alert("Failed to connect to backend for pre-booking");
    }
  };

  const categories = [...new Set(extraItems.map(item => item.mealType))];
  const breakfastItems = preBookings.filter(item => item.meal === 'breakfast');
  const lunchItems = preBookings.filter(item => item.meal === 'lunch');
  const dinnerItems = preBookings.filter(item => item.meal === 'dinner');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Book Extra Items</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex gap-2">
        <button
          onClick={() => setActiveSection('instant')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
            activeSection === 'instant'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <ShoppingCart className="w-5 h-5 inline mr-2" />
          Instant Purchase
        </button>
        <button
          onClick={() => setActiveSection('prebook')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
            activeSection === 'prebook'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Pre-Book for Tomorrow
        </button>
      </div>

      {/* INSTANT PURCHASE */}
      {activeSection === 'instant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {categories.map(category => (
              <div key={category} className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">{category}</h3>
                {extraItems
                  .filter(item => item.mealType === category)
                  .map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg mb-3">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p>₹{item.price}</p>
                        <p className={`text-xs font-medium ${item.stock > 5 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.stock > 0 ? `${item.stock} plates left` : 'Sold Out'}
                        </p>
                      </div>

                      {item.isAvailable && item.stock > 0 && (
                        <div className="flex items-center gap-2">
                          {cart[item.id] ? (
                            <>
                              <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-gray-200 rounded-full">
                                <Minus className="w-4 h-4" />
                              </button>
                              <span>{cart[item.id]}</span>
                              <button onClick={() => addToCart(item.id)} className="w-8 h-8 bg-gray-800 text-white rounded-full">
                                <Plus className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addToCart(item.id)}
                              className="px-4 py-2 bg-gray-800 text-white rounded-lg"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* CART */}
          <div className="lg:col-span-1 bg-white border rounded-lg p-6 shadow-sm sticky top-6">
            <h3 className="text-xl font-bold mb-4">Your Cart</h3>
            {Object.keys(cart).length === 0 ? (
              <p className="text-gray-500 text-center">Your cart is empty</p>
            ) : (
              <>
                {Object.entries(cart).map(([id, qty]) => {
                  const item = extraItems.find(i => i.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex justify-between text-sm mb-2">
                      <span>{item.name} × {qty}</span>
                      <span>₹{item.price * qty}</span>
                    </div>
                  );
                })}
                <div className="border-t pt-4 font-bold">
                  Total: ₹{getTotalAmount()}
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-gray-800 text-white py-3 rounded-lg"
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRE-BOOK — COMPLETELY ORIGINAL */}
      {activeSection === 'prebook' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Pre-book your extra items for tomorrow.
            </p>
          </div>

          {( [['Breakfast', breakfastItems], ['Lunch', lunchItems], ['Dinner', dinnerItems]] as [string, PreBookItem[]][] ).map(
            ([title, items]) => (
              <div key={title} className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                {items.map((item, index) => {
                  const globalIndex = preBookings.findIndex(p => p === item);
                  const matchingBookings = myBookings.filter(b => b.SpecialItemId === parseInt(item.id) && b.date === item.date);

                  return (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.dishName}</span>
                          <span className="text-xs text-gray-500">Price: ₹{item.price} | Date: {item.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.quantity > 0 ? (
                            <div className="flex items-center gap-3">
                              <button onClick={() => decrementPreBook(globalIndex)} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-semibold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => incrementPreBook(globalIndex)} className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => incrementPreBook(globalIndex)}
                              className="px-6 py-2 rounded-lg font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {matchingBookings.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {matchingBookings.map((b, idx) => (
                            <div key={idx} className="ml-4 pl-4 py-2 border-l-4 border-green-500 bg-green-50/50 rounded-r-lg flex justify-between items-center text-sm shadow-sm hover:shadow transition-shadow">
                              <div>
                                <span className="text-green-800 font-medium">✓ Confirmed Pre-booking</span>
                                <span className="text-xs text-gray-500 ml-2 capitalize">({b.status})</span>
                              </div>
                              <span className="text-xs text-gray-400 pr-2">
                                {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <button
              onClick={handlePreBookSubmit}
              className="w-full bg-gray-800 text-white py-4 rounded-lg font-semibold hover:bg-gray-700 active:bg-gray-900 transition-colors"
            >
              Confirm Pre-bookings for Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../App.jsx';
import { apiUrl } from '../lib/api.js';

export default function AccountPanel({ open, onClose }) {
  const { user, token, logout, setUser } = useAuth();

  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [profStatus, setProfStatus] = useState('idle');
  const [profMsg, setProfMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (open && user && token && tab === 'orders') {
      fetchOrders();
    }
  }, [open, tab, user, token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/orders/my'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      const res = await fetch(apiUrl(`/api/orders/${id}/cancel`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.log(err);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      const data = await res.json();

      if (data.success) {
        setUser(prev => ({ ...prev, ...profile }));
        localStorage.setItem(
          "slokane_user",
          JSON.stringify({ ...user, ...profile })
        );
        alert("Profile updated");
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.log(err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">

      <div className="flex-1 bg-black/60" onClick={onClose}></div>

      <div className="w-full max-w-md bg-black text-white p-6 overflow-y-auto">

        <h2 className="text-xl font-bold mb-4">My Account</h2>

        <div className="mb-4">
          <p><b>Name:</b> {user?.name}</p>
          <p><b>Email:</b> {user?.email}</p>
        </div>

        <div className="flex gap-4 mb-4">
          <button onClick={() => setTab('orders')}>Orders</button>
          <button onClick={() => setTab('profile')}>Profile</button>
        </div>

        {tab === 'orders' && (
          <div>
            <button onClick={fetchOrders}>Refresh Orders</button>

            {loading ? (
              <p>Loading...</p>
            ) : (
              orders.map(o => (
                <div key={o.id} className="border p-2 mt-2">
                  <p>{o.product_name}</p>
                  <p>Status: {o.status}</p>
                  <button onClick={() => cancelOrder(o.id)}>Cancel</button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'profile' && (
          <form onSubmit={saveProfile}>
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile(p => ({ ...p, name: e.target.value }))
              }
              placeholder="Name"
            />

            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile(p => ({ ...p, phone: e.target.value }))
              }
              placeholder="Phone"
            />

            <button type="submit">Save</button>
          </form>
        )}

        <button onClick={() => { logout(); onClose(); }}>
          Logout
        </button>

      </div>
    </div>
  );
}

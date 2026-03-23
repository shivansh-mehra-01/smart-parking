import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:3000/api/auth/parkings')
      .then(res => {
        setParkings(res.data);
        if (res.data.length > 0) setSelectedParking(res.data[0]);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to connect to the server.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:3000/api/auth/login', {
        parking_name: selectedParking,
        device_key: deviceKey
      });
      onLogin(); // App.jsx will trigger state to mount the dashboard routes
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your Device Key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Background Ambience Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-primary/20 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-secondary/20 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-lg bg-surface-container-lowest p-10 md:p-14 rounded-[2.5rem] shadow-2xl relative z-10 border border-outline-variant/20 slide-up backdrop-blur-3xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] mx-auto flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined text-primary text-[40px]" data-icon="shield_lock">shield_lock</span>
          </div>
          <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Access Control</h2>
          <p className="mt-3 text-on-surface-variant font-bold text-sm tracking-widest uppercase">Authenticate Terminal</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-error/10 text-error text-sm font-bold flex rounded-xl items-center gap-3 border border-error/20 animate-wiggle">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="parking" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Select Facility</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl">location_city</span>
                <select
                  id="parking"
                  value={selectedParking}
                  onChange={(e) => setSelectedParking(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface font-bold appearance-none cursor-pointer hover:bg-surface-container shadow-sm"
                  required
                >
                  {parkings.length === 0 ? (
                    <option value="">Locating active facilities...</option>
                  ) : (
                    parkings.map(p => <option key={p} value={p}>{p}</option>)
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">expand_more</span>
              </div>
            </div>

            <div>
              <label htmlFor="device_key" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Hardware Key</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl">password</span>
                <input
                  id="device_key"
                  type="password"
                  value={deviceKey}
                  onChange={(e) => setDeviceKey(e.target.value)}
                  placeholder="Enter 12-digit terminal key"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface font-bold hover:bg-surface-container shadow-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedParking}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 mt-8 rounded-2xl text-sm font-extrabold text-on-primary bg-primary hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/40 disabled:opacity-50 disabled:transform-none transition-all transform hover:-translate-y-1 shadow-[0_8px_30px_rgb(var(--primary-rgb),0.3)]"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-xl">autorenew</span>
            ) : (
              <span className="material-symbols-outlined text-xl">login</span>
            )}
            {loading ? 'VERIFYING CREDENTIALS...' : 'AUTHORIZE ACCESS'}
          </button>
        </form>
      </div>
    </div>
  );
}

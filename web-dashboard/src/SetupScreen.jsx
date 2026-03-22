import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';

export default function SetupScreen({ onSetupComplete }) {
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchParkings = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
                const response = await fetch(`${API_BASE_URL}/parkings`);
                const data = await response.json();
                setParkings(data);
                if (data.length > 0) setSelectedId(data[0]._id);
            } catch (err) {
                console.error("Failed to fetch parkings", err);
                setError("Network error. Unable to load parking locations.");
            } finally {
                setLoading(false);
            }
        };
        fetchParkings();
    }, []);

    const handleSave = async () => {
        if (!selectedId) {
            setError("Please select a parking location.");
            return;
        }
        if (!pin) {
            setError("Please enter the Device Key.");
            return;
        }
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
            // verify from backend
            const response = await fetch(`${API_BASE_URL}/verify-device`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: selectedId,
                    deviceKey: pin
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Save to localStorage
                localStorage.setItem("adminParkingId", selectedId);
                onSetupComplete(selectedId);
            } else {
                setError(data.error || "Invalid Device Key.");
            }
        } catch(err) {
            setError("Network error. Unable to verify key.");
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="setup-header">
                    <Settings size={40} color="#3b82f6" />
                    <h2>Device Setup configuration</h2>
                    <p>Bind this tracking device to a specific parking location.</p>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
                        <span>Loading locations...</span>
                    </div>
                ) : (
                    <div className="setup-form">
                        <div className="form-group">
                            <label>Select Parking Location</label>
                            <select 
                                value={selectedId} 
                                onChange={(e) => setSelectedId(e.target.value)}
                                className="setup-select"
                            >
                                {parkings.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} - {p.city}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Device Key</label>
                            <input 
                                type="password" 
                                placeholder="Enter Access Key (e.g. DBMALL123)" 
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="setup-input"
                            />
                        </div>

                        {error && <div className="setup-error">{error}</div>}

                        <button onClick={handleSave} className="setup-button">
                            <Save size={20} />
                            <span>Save Configuration</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

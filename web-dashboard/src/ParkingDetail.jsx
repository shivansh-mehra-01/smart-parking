import { useState, useEffect } from "react";
import { MapPin, Loader2, Minus, Plus, RefreshCw, AlertCircle } from "lucide-react";

export default function ParkingDetail({ adminParkingId }) {
    const [parking, setParking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

    const fetchParkingData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/parkings`);
            const data = await response.json();
            
            const targetParking = data.find(p => p._id === adminParkingId);
            if (targetParking) {
                setParking(targetParking);
                setError(null);
            } else {
                setError("Parking location configuration lost. Please re-setup.");
            }
        } catch (error) {
            console.error("Error fetching parking data:", error);
            setError("Network Error: Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!adminParkingId) return;
        fetchParkingData();
        const interval = setInterval(fetchParkingData, 5000);
        return () => clearInterval(interval);
    }, [adminParkingId]);

    const handleSlotUpdate = async (newSlots) => {
        if (!parking || newSlots < 0 || newSlots > parking.totalSlots) return;
        setUpdating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/parkings/${parking._id}/slots`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availableSlots: newSlots })
            });
            if (response.ok) {
                setParking(prev => ({ ...prev, availableSlots: newSlots }));
            } else {
                alert("Failed to update slots. Server rejected.");
            }
        } catch(e) {
            console.error(e);
            alert("Network error updating slots.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading && !parking) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={48} color="#3b82f6" />
                <h2>Connecting to AI Tracking System...</h2>
            </div>
        );
    }

    if (error || !parking) {
        return (
            <div className="empty-state" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                <AlertCircle size={48} />
                <h2>{error || "Configuration Error"}</h2>
            </div>
        );
    }

    const avail = parking.availableSlots != null ? parking.availableSlots : 0;
    const total = parking.totalSlots != null ? parking.totalSlots : 1;
    const percentAvailable = Math.round((avail / total) * 100);
    const percentOccupied = 100 - percentAvailable;
    
    let statusClass = "status-available";
    let statusText = "Available";
    let circleClass = "available";

    if (avail === 0) {
        statusClass = "status-full";
        statusText = "FULL";
        circleClass = "full";
    } else if (percentAvailable <= 20) {
        statusClass = "status-busy";
        statusText = "ALMOST FULL";
        circleClass = "busy";
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '30px' }}>
            
            <div className="dashboard-header" style={{ textAlign: 'center' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <MapPin /> {parking.name} Environment
                </h1>
                <p>Edge System ID: {parking.parkingId}</p>
            </div>

            <div className="parking-card" style={{ width: '100%', padding: '20px', transform: 'none' }}>
                <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="card-title-group">
                        <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                        <h4 style={{ fontSize: '1.5rem' }}>Live Monitoring Active</h4>
                    </div>
                    <span className={`status-badge ${statusClass}`} style={{ fontSize: '1.2rem', padding: '10px 20px' }}>
                        {statusText}
                    </span>
                </div>
                
                <div className="card-body" style={{ padding: '60px 20px' }}>
                    <div 
                        className={`occupancy-circle ${circleClass}`}
                        style={{ "--percent": `${percentOccupied}%`, width: '250px', height: '250px' }}
                    >
                        <div className="circle-inner-text">
                            <span className="slot-count" style={{ fontSize: '4rem' }}>{avail}</span>
                            <span className="slot-label" style={{ fontSize: '1rem' }}>Available Slots</span>
                        </div>
                    </div>
                </div>
                
                <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                        <span>Total Capacity: <strong>{total}</strong></span>
                        <span>Occupancy: <strong>{percentOccupied}%</strong></span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)' }}>Manual AI Override</h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <button 
                                className="icon-button btn-danger" 
                                onClick={() => handleSlotUpdate(avail - 1)}
                                disabled={updating || avail <= 0}
                                title="Force Vehicle Entry"
                            >
                                <Minus size={24} />
                            </button>
                            <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>
                                Force Vehicle Entry/Exit
                            </span>
                            <button 
                                className="icon-button btn-secondary" 
                                onClick={() => handleSlotUpdate(avail + 1)}
                                disabled={updating || avail >= total}
                                title="Force Vehicle Exit"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                        {updating && (
                            <div style={{ textAlign: 'center', marginTop: '10px', color: 'var(--primary-color)', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                                <RefreshCw size={14} className="animate-spin" /> Synchronizing Edge Data...
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
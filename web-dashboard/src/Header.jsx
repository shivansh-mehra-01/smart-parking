import React from 'react';
import { Car, Clock, LogOut } from 'lucide-react';

export default function Header({ onLogout }) {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="header">
            <div className="header-logo">
                <Car size={28} color="#3b82f6" />
                <h2>Smart Parking Edge</h2>
            </div>
            <div className="header-info">
                <div className="live-indicator">
                    <span className="dot"></span>
                    Live Target
                </div>
                <div className="time-display">
                    <Clock size={18} />
                    <span>{time.toLocaleTimeString()}</span>
                </div>
                {onLogout && (
                    <button onClick={onLogout} className="icon-button" title="Disconnect Device">
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </header>
    );
}
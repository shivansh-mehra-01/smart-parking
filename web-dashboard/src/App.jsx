import React, { useState, useEffect } from "react";
import Header from "./Header";
import ParkingDetail from "./ParkingDetail";
import SetupScreen from "./SetupScreen";
import "./App.css";

function App() {
  const [adminParkingId, setAdminParkingId] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check local storage for existing config
    const savedConfig = localStorage.getItem("adminParkingId");
    if (savedConfig) {
      setAdminParkingId(savedConfig);
    }
    setIsChecking(false);
  }, []);

  const handleSetupComplete = (id) => {
    setAdminParkingId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminParkingId");
    setAdminParkingId(null);
  };

  if (isChecking) {
    return null; // Or a simple loading screen
  }

  if (!adminParkingId) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  return (
    <>
      <Header onLogout={handleLogout} />
      <div className="dashboard-container" style={{ maxWidth: '100%', padding: '40px' }}>
        <ParkingDetail adminParkingId={adminParkingId} />
      </div>
    </>
  );
}

export default App;
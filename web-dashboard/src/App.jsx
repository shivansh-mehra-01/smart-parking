import React from "react";
import Header from "./Header";
import ParkingDetail from "./ParkingDetail";

function App() {
  return (
    <>
      <Header/>
      <div className="dashboard-container">
        <div className="welcome-text">
          <h2>Live Slot Monitoring</h2>
        </div>
        <ParkingDetail/>
      </div>
    </>
  );
}

export default App;
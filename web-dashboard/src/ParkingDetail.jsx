import { useState, useEffect } from "react";

export default function ParkingDetail() {
    const [parkings, setParkings] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // Search storage

    const fetchParkingData = async () => {
        try {
            // Environment variable or localhost fallback
            const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
            let url = `${API_BASE_URL}/parkings`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0) {
                setParkings(data);
            }
        } catch (error) {
            console.error("Error fetching parking data:", error);
        }
    };

    useEffect(() => {
        fetchParkingData();
        const interval = setInterval(fetchParkingData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Logic: Naam ya ID match ho rahi hai toh dikhao
    const filteredParkings = parkings.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.parkingId && p.parkingId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="parking-list-container" style={{ flexDirection: "column", alignItems: "center" }}>
            
            {/* Search Input Box */}
            <div className="search-container">
                <input 
                    type="text" 
                    placeholder="Search Parking Name or ID... (e.g. Parking 1)" 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="parking-list-container">
                {filteredParkings.length > 0 ? (
                    filteredParkings.map((parking) => (
                        <div className="parking-detail" key={parking._id || parking.parkingId}>
                            <h4>{parking.name}</h4>
                            <p style={{ fontSize: "0.8rem", color: "#a0c4ff" }}>ID: {parking.parkingId || "N/A"}</p>
                            <h2>Available Slots</h2>
                            <h3>
                                {parking.availableSlots !== null && parking.totalSlots !== null
                                    ? `${parking.availableSlots}/${parking.totalSlots}`
                                    : "xx/xx"}
                            </h3>
                        </div>
                    ))
                ) : (
                    <div className="parking-detail" style={{ height: "100px", width: "100%" }}>
                        <h2>
                            {searchTerm ? "No Match Found" : "Loading Slots..."}
                        </h2>
                    </div>
                )}
            </div>
        </div>
    );
}
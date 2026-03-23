# 🅿️ Smart Parking System

A real-time smart parking management system that integrates OCR-based vehicle detection, a web dashboard for administrators, and a mobile app for users to find and navigate parking spaces.

---

## 🚀 Project Overview

This system automates parking management using computer vision and real-time data tracking.

### 🔄 How It Works
1. Vehicle arrives → Camera captures license plate  
2. OCR detects plate number  
3. Backend logs entry → Updates available slots  
4. Dashboard & mobile app update in real-time  
5. Vehicle exits → Duration calculated → Slot incremented  

---

## 🏗️ System Architecture

OCR Camera → Backend API → MongoDB Database → Web Dashboard / Mobile App

---

## 📦 Components

### 🖥️ Backend (Node.js + Express)
Handles all business logic and APIs.

**Features:**
- Vehicle entry/exit logging
- Slot management
- Pricing & booking handling
- Authentication
- Dashboard analytics

**Key Files:**
- app.js → Server setup  
- controllers/parkingController.js → Vehicle tracking logic  
- controllers/apiController.js → Dashboard APIs  
- models/Parking.js → Parking schema  
- models/Vehicle.js → Vehicle logs  

---

### 🌐 Web Dashboard (React + Vite + Tailwind)
Admin interface for parking management.

**Features:**
- Login (facility-based)
- Real-time occupancy
- Live vehicle tracking
- Booking export (CSV)
- Pricing management
- Analytics dashboard

**Pages:**
- Dashboard  
- Live Occupancy  
- Bookings  
- Pricing  
- Login  

---

### 📱 Mobile App (React Native + Expo)
User-facing application.

**Features:**
- Nearby parking discovery
- Real-time availability
- Interactive maps
- Navigation to parking
- Parking details (capacity, pricing)

**Screens:**
- Home  
- Map  
- Parking Details  
- Profile  

---

## 🗄️ Database (MongoDB)

### Parking Collection
- Name, address, city, area  
- GPS coordinates  
- Total slots & available slots  
- Parking type  
- Device key  

### Vehicle Collection
- License plate number  
- Entry & exit time  
- Duration  
- Status (inside/exited)  
- Camera source  

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /parkings | Get all parking facilities |
| GET | /occupancy/live | Live parked vehicles |
| GET | /dashboard/stats | Dashboard analytics |
| POST | /vehicle-entry | Log vehicle entry |
| POST | /vehicle-exit | Log vehicle exit |
| POST | /auth/login | Authenticate manager |
| GET | /bookings/today | Today's bookings |
| GET | /pricing | Get pricing |
| PUT | /pricing/:id | Update pricing |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Material UI |
| Mobile | React Native, Expo, TypeScript |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Maps | Google Maps API, OSRM |
| Location | Expo Location, Haversine Formula |
| OCR | EasyOCR / ALPR |

---

## 🔑 Key Features

- Real-time parking occupancy tracking  
- OCR-based license plate recognition  
- GPS-based parking discovery  
- Web dashboard for administrators  
- Mobile app for users  
- Pricing management system  
- Booking export (CSV)  
- Multi-type parking support  
- Analytics & reporting  

---

## 🔄 Data Flow Example

### 🚗 Vehicle Entry
- Camera detects plate → "ABC123"  
- API call → /vehicle-entry  
- Backend:
  - Creates vehicle record  
  - Decreases available slots  

### 🚙 Vehicle Exit
- Camera detects exit  
- API call → /vehicle-exit  
- Backend:
  - Sets exit time  
  - Calculates duration  
  - Increases available slots  

---

## 🚀 Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Netlify |
| Backend | Render |
| Mobile | Expo (APK / Play Store ready) |

---

## 🔐 Authentication

- Facility-based login  
- Uses Parking Name + Device Key  

---

## 📊 Future Improvements

- WebSockets for real-time updates  
- JWT-based authentication  
- Payment integration  
- Push notifications  
- AI-based parking prediction  
- Advanced analytics dashboard  

---

## 💡 Use Cases

- Shopping malls  
- Hospitals  
- Airports  
- Smart city infrastructure  

---

## 🧠 Author

Shivansh Mehra

---

## ⭐ Contributing

Contributions are welcome! Feel free to fork and improve the project.

---

## 📜 License

This project is licensed under the MIT License.
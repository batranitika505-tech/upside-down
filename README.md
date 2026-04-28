# ResQ – Hyperlocal Pune Disaster Intelligence Platform 🚩🛡️

**ResQ** is a state-of-the-art, real-time disaster management platform designed for the **Google Solution Challenge**. It transforms fragmented crisis data into a unified "Mission Control" for citizens, with a heavy focus on the unique geography of **Pune, India**.

## 🚨 The Core Problem
During floods, earthquakes, or civil unrest, situational awareness is often delayed. Citizens in Pune struggle to find:
- **Hyperlocal Precision**: Which specific streets in Kasba Peth or Hadapsar are flooded?
- **Immediate Guidance**: Where is the nearest open ground in Kothrud during an earthquake?
- **Unified Interface**: A single place for 40+ types of hazards, from chemical leaks to traffic accidents.

## ✨ Key Platform Features

### 1. Hyperlocal Pune Intelligence Expert 🧠
ResQ features a specialized **Pune-based AI Response Expert** that provides street-level safety advice:
- **Hyperlocal Safe/Danger Zones**: Hard-coded knowledge of Pune's riverbanks (Mutha/Mula), hilltops (Sinhagad/Taljai), and underground infrastructure (Metro stations).
- **Multilingual Support**: Mandatory language-first protocol (English, Hindi, Marathi, etc.) to ensure guidance is understood during panic.
- **AI-to-Map Synchronization**: When the AI mentions a location, the map automatically flies to that coordinate and highlights it with a unique purple sparkle marker.

### 2. Specialized 9-Domain Disaster Dashboard 🗺️
The map features an interactive, scrollable filter bar allowing users to pivot between specialized disaster focus modes:
- **🌊 FLOOD**: Focuses on water levels and high-ground shelters.
- **🏘️ EARTHQUAKE**: Prioritizes open fields and assembly grounds.
- **🔥 FIRE**: Highlights industrial hazards and firebreak zones.
- **🧪 TECH/MAN-MADE**: Specialized for chemical leaks and industrial accidents.
- **...and 5 others**: Biological, Security, Transport, Weather, and All Hazards.

### 3. Global Real-Time Places Search 🔍
Integrated with the **Photon (OSM) API**, ResQ allows users to search for any cafe, shop, or street in Pune instantly. The search is biased toward Pune coordinates, providing a seamless "Google Maps style" experience for reporting hazards at specific landmarks.

### 4. Categorized Citizen Reporting 📝
A robust reporting engine supporting **40+ disaster sub-types**. Citizens can report anything from a "Tsunami" to a "Train Derailment" in 3 clicks, with automatic categorization and severity levels.

## 🛠️ Advanced Technology Stack
- **Frontend**: React 19 + Vite (High-performance rendering)
- **Mapping Engine**: Leaflet with API-less Google Maps tiles and custom dark-themed CSS filters.
- **Real-Time Data**: Firebase Firestore (NoSQL) with high-frequency listeners.
- **AI Core**: Groq Llama-3.3-70b (Low-latency, high-reasoning disaster expert).
- **Location Services**: Photon API (OpenStreetMap-based live suggestions).
- **Styling**: Premium Glassmorphism with Vanilla CSS and Tailwind v4.

## 🗺️ The ResQ Workflow
1. **Identify**: User mentions a location in the AI Chat.
2. **Sync**: The map automatically centers on that location with a visual highlight.
3. **Filter**: The user selects a specific disaster type (e.g., FLOOD) to see relevant shelters.
4. **Report**: Citizen reports a hazard with street-level precision using live place suggestions.
5. **Navigate**: Integrated "Get Directions" button for the nearest verified safe zone.

## 🚀 Setup & Installation
1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file with your credentials:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_GROQ_API_KEY=...
   ```
4. Run locally: `npm run dev`

---
*Built with ❤️ for the Google Solution Challenge 2024.*

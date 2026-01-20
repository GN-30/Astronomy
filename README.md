# Vedic Astrology & Astronomy App (AI-Powered)

This is a modern, full-stack application that combines ancient Vedic Astrology with modern Astronomy and Artificial Intelligence. It provides accurate birth chart analysis, dynamic daily horoscopes, and matchmaking features.

## 🚀 Features

*   **Birth Chart Analysis**:
    *   Generates a detailed astrological report based on birth date, time, and location.
    *   **High Accuracy**: Uses the **Swiss Ephemeris** (`swisseph`) for precise planetary calculations (Signs, Degrees, Ascendant).
    *   **AI Interpretation**: Uses **Google Gemini Pro** to interpret the calculated data into meaningful insights (Personality, Career, Relations, Health).
    *   **Robust Fallback**: Includes a deterministic local engine that works even if the AI service is unavailable.
*   **Dynamic Daily Horoscope**:
    *   Provides predictions specific to the current date, accounting for planetary transits (Gochar).
*   **Kundli Matching**: Compatibility analysis for relationships.
*   **Responsive UI**: Built with React, Tailwind CSS, and Framer Motion for a smooth, mystical experience.

## 🛠 Tech Stack

### Frontend
*   **React 19** + **Vite** (Fast development & build)
*   **Tailwind CSS 4** (Styling)
*   **Framer Motion** (Animations)
*   **Lucide React** (Icons)
*   **Axios** (API Requests)

### Backend
*   **FastAPI** (High-performance Python framework)
*   **Swiss Ephemeris (`pyswisseph`)** (Professional-grade astronomical calculation library)
*   **Google Gemini AI** (LLM for astrological interpretation)
*   **Uvicorn** (ASGI Server)

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)

### 1. Backend Setup
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create a `.env` file in `backend/` and add your API keys:
    ```env
    GEMINI_API_KEY=your_google_gemini_key
    GEMINI_ANALYSIS_KEY=optional_separate_key_for_analysis
    ```
4.  Run the server:
    ```bash
    python main.py
    ```
    *Server runs at `http://localhost:8000`*

### 2. Frontend Setup
1.  Navigate to the frontend folder:
    ```bash
    cd astrology
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    *App runs at `http://localhost:5173`*

## 🚀 Deployment

### Backend (Render/Railway)
*   **Build Command**: `pip install -r requirements.txt`
*   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
*   **Environment Variables**: `GEMINI_API_KEY`

### Frontend (Vercel/Netlify)
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Environment Variable**: `VITE_API_URL` (e.g., `https://your-backend-app.onrender.com/api`)

## 🛡️ License
MIT License.

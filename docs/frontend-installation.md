# Frontend Installation Guide

## Prerequisites

- **Node.js 18+** — check with: `node --version`
- **npm 9+** — comes with Node.js, check with: `npm --version`
- **Backend server** — the frontend requires the backend API to be running (see `backend-installation.md`)

---

## Step-by-Step Installation

### Step 1: Navigate to the frontend directory

```bash
cd /home/mrdino/Desktop/DTC/clients/oraph_collabo/BudgetBeacon/frontend
```

### Step 2: Install Node.js dependencies

```bash
npm install
```

**What gets installed:**

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `react-dom` | React rendering for the browser |
| `react-router-dom` | Client-side routing (Home, Estimate, History pages) |
| `axios` | HTTP client for API calls to the backend |
| `recharts` | Charting library (bar charts on History page) |
| `lucide-react` | Icon library (navigation icons, status icons) |

**Dev dependencies:**
| Package | Purpose |
|---------|---------|
| `vite` | Build tool and dev server |
| `@vitejs/plugin-react` | React plugin for Vite |
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/postcss` | Tailwind PostCSS plugin |
| `autoprefixer` | CSS vendor prefixing |
| `eslint` | Code linting |

### Step 3: Start the development server

```bash
npm run dev
```

**Expected output:**
```
  VITE v8.0.10  ready in 285 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.0.20:5173/
```

### Step 4: Open the app in your browser

Navigate to: **http://localhost:5173/**

You should see the BudgetBeacon landing page with:
- A blue hero section with "Smart Cost Estimation for Your Business"
- Feature cards (Accurate Predictions, Confidence Scores, Fast & Accessible)
- A "How It Works" section

### Step 5: Verify backend connection

1. Click **"Get Started"** or navigate to **"New Estimate"** via the nav bar
2. Fill out the form with sample data:
   - Business Type: Agriculture
   - Location: Dar es Salaam
   - Material Cost: 500000
   - Transport Cost: 150000
   - Labor Cost: 200000
   - Production Days: 14
   - Quantity: 100
3. Click **"Get Estimate"**
4. You should see a result card showing the predicted cost, confidence score, risk level, and cost breakdown

> If you get a network error, make sure the backend is running on port 8000 (see backend installation guide).

---

## Project Structure

```
frontend/
├── index.html                     # Vite entry HTML
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
└── src/
    ├── main.jsx                   # React entry point
    ├── App.jsx                    # Root component with routing + navigation
    ├── index.css                  # Tailwind CSS imports
    ├── services/
    │   └── api.js                 # Axios API client
    ├── pages/
    │   ├── Home.jsx               # Landing page
    │   ├── NewEstimate.jsx        # Estimate form + results
    │   └── History.jsx            # Estimate history dashboard
    └── components/
        └── ResultCard.jsx         # Cost estimate results display
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |

---

## Pages Overview

### Home (`/`)
- Hero section with call-to-action
- 3 feature cards explaining the system
- "How It Works" step-by-step guide

### New Estimate (`/estimate`)
- Form with 7 input fields (business type, location, 3 cost fields, production days, quantity)
- Submit button that calls the backend API
- Results card displaying predicted cost, confidence bar, risk badge, and cost breakdown
- "New Estimate" button to reset and start over

### History (`/history`)
- 3 summary stat cards (total estimates, avg confidence, avg cost)
- Bar chart of recent 10 estimates
- Full table of all estimates with ID, business type, cost, confidence, risk, and date

---

## Customization

### Changing the API URL

Edit `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: "http://localhost:8000",  // Change this to your backend URL
  headers: { "Content-Type": "application/json" },
});
```

For production, change this to your deployed backend URL (e.g., `https://api.yourdomain.com`).

### Adding a new page

1. Create a new file in `src/pages/`, e.g., `Settings.jsx`
2. Import it in `App.jsx` and add a `<Route>`:

```jsx
import Settings from "./pages/Settings";

// Inside <Routes>
<Route path="/settings" element={<Settings />} />
```

3. Add a navigation link in the header:

```jsx
<Link to="/settings" className="...">Settings</Link>
```

---

## Production Build

To build the frontend for production deployment:

```bash
npm run build
```

This creates an optimized `dist/` folder with:
- Minified JavaScript and CSS
- Asset hashing for cache busting
- No dev-only code

Serve the `dist/` folder with Nginx, Apache, or any static file server:

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/BudgetBeacon/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
    }
}
```

---

## Troubleshooting

### "npm: command not found"
Install Node.js and npm:
```bash
# Ubuntu/Debian
sudo apt install nodejs npm

# Or use nvm (recommended for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

### "Module not found" errors
Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### CORS errors in browser
The backend allows these origins by default:
- `http://localhost:5173`
- `http://localhost:3000`

If your frontend runs on a different port/domain, update the CORS settings in `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://yourdomain.com"],
    ...
)
```

### Blank page / white screen
Open browser developer tools (F12) and check the Console tab for errors. Common issues:
- Backend not running (API calls fail)
- JavaScript syntax error in a page component
- Missing route — make sure the URL path matches a defined `<Route>`

### Port 5173 already in use
Vite will automatically try the next available port (5174, 5175, etc.). Check the terminal output for the correct URL.

---

## Quick Start (TL;DR)

```bash
cd /home/mrdino/Desktop/DTC/clients/oraph_collabo/BudgetBeacon/frontend
npm install
npm run dev
```

Then open **http://localhost:5173/** in your browser. Make sure the backend is running on port 8000 first.

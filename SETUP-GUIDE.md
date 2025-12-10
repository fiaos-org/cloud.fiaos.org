# Fiaphy Environmental Monitoring System - Setup Guide

## 🎯 Overview

This system consists of three main components:

1. **ESP8266 Device** - Collects sensor data every 2 seconds
2. **Supabase Database** - Stores all sensor readings
3. **Cloud Website** - Displays live and historical data

---

## 📊 System Architecture

```
ESP8266 Device (Station Mode)
    ↓ (loads JavaScript)
    ↓
device-uploader.js (from cloud.fiaos.org)
    ↓ (POST every 2 seconds)
    ↓
Supabase PostgreSQL Database
    ↓ (query via REST API)
    ↓
Website Dashboard + Datasets Page
```

---

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Run the SQL Schema

1. Go to your Supabase Dashboard: https://uopikbgoyrmtknbomvgo.supabase.co
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Open the file: `supabase-schema.sql`
5. Copy and paste the entire contents
6. Click **"Run"** to execute

This will create:
- `sensor_data` table with all required columns
- Indexes for fast queries (timestamp, GPS, IP)
- Row Level Security (RLS) policies for public read/write

### 1.2 Verify Database Setup

Run this query in SQL Editor:

```sql
SELECT COUNT(*) FROM sensor_data;
```

You should see `0` rows (empty table ready to receive data).

---

## 🔌 Step 2: Update ESP8266 Code

### 2.1 Add Script Loading to Embedded HTML

In your ESP8266 Arduino code, add this line **at the end of the HTML** (before `</body>`):

```html
<!-- Load device uploader from cloud -->
<script src="https://cloud.fiaos.org/fiaphy/javascript/device-uploader.js"></script>
```

**Full example location in your code:**

```cpp
const char PROGMEM HTML_PART_4[] = R"====(
    </div>

    <!-- EXISTING SCRIPTS -->
    <script>
    // ... your existing JavaScript ...
    </script>

    <!-- ADD THIS LINE: Load device uploader from cloud -->
    <script src="https://cloud.fiaos.org/fiaphy/javascript/device-uploader.js"></script>

</body>
</html>
)====";
```

### 2.2 What This Does

When the ESP8266 is in **Station Mode** (connected to internet):

1. The embedded webpage loads
2. It fetches `device-uploader.js` from cloud.fiaos.org
3. The script automatically:
   - Requests GPS location from the browser
   - Fetches IP address and country
   - Polls `/api/data` endpoint every 2 seconds
   - Uploads sensor data to Supabase

---

## 🌐 Step 3: Website Configuration

### 3.1 Files Overview

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Database schema (run in Supabase) |
| `fiaphy/javascript/device-uploader.js` | ESP8266 loads this to upload data |
| `fiaphy/javascript/live-data-fetcher.js` | Website loads this to display live data |
| `fiaphy/index.html` | Main dashboard (shows last 25 minutes) |
| `data/index.html` | Historical datasets page |

### 3.2 Credentials Location

All Supabase credentials are already configured in:

- ✅ `device-uploader.js` (lines 19-20)
- ✅ `live-data-fetcher.js` (lines 17-18)
- ✅ `data/index.html` (lines 190-191)

**Project URL:** `https://uopikbgoyrmtknbomvgo.supabase.co`  
**API Key:** `eyJhbGc...` (anon/public key)

---

## 🚀 Step 4: Deploy Website

### 4.1 Recommended: GitHub Pages (Free Static Hosting)

1. Push your `cloud.fiaos.org` folder to GitHub
2. Go to repository settings → Pages
3. Set source to `main` branch, `/` (root) folder
4. Click Save
5. Your site will be live at: `https://<username>.github.io/cloud.fiaos.org/`

### 4.2 Alternative: Netlify Drop

1. Go to https://app.netlify.com/drop
2. Drag and drop the `cloud.fiaos.org` folder
3. Instant deployment (no account needed)

### 4.3 Why NOT Vercel?

As you mentioned, Vercel uses server-side rendering which conflicts with the ESP8266's static webpage. GitHub Pages and Netlify work perfectly for static sites.

---

## 🔄 Step 5: How Data Flows

### Device → Database (Upload)

```
1. ESP8266 connects to WiFi (Station Mode)
2. User opens 192.168.1.X in browser
3. ESP8266 serves HTML with embedded dashboard
4. Browser loads device-uploader.js from cloud.fiaos.org
5. Script fetches /api/data every 2 seconds
6. Script POSTs data to Supabase REST API
7. Database stores: temperature, humidity, pressure, solar, heat flux, ΔT, GPS, IP, country
```

### Database → Website (Display)

```
1. User visits cloud.fiaos.org/fiaphy/
2. Browser loads live-data-fetcher.js
3. Script queries Supabase for data from last 25 minutes
4. Dashboard displays latest reading
5. Updates every 5 seconds (FIFO rolling window)
```

### Historical Data

```
1. User visits cloud.fiaos.org/data/
2. Page queries Supabase for all historical data (up to 10,000 records)
3. Groups data by GPS location and country
4. Shows expandable tables with filters
```

---

## 📱 Step 6: Testing the System

### 6.1 Test Database Connection

Open browser console on `cloud.fiaos.org/fiaphy/`:

```javascript
// Check live data fetcher
console.log(FiaphyLiveData.config);
await FiaphyLiveData.checkConnection();
```

Expected output:
```
[Live Data] Initializing Supabase connection...
[Live Data] ✓ Connection established
```

### 6.2 Test Device Upload

1. Power on ESP8266
2. Connect to `FiaPhy-Monitor` WiFi
3. Open `192.168.4.1` in browser
4. Click "Connect Cloud" button
5. Enter your WiFi credentials
6. Device connects and redirects to new IP
7. Open browser console
8. You should see:

```
[Device Uploader] Initializing...
[Device Uploader] GPS acquired: {latitude: 6.9271, longitude: 79.8612}
[Device Uploader] IP info acquired: {ip: "192.168.1.45", country: "Sri Lanka"}
[Device Uploader] Starting upload loop...
[Device Uploader] ✓ Data uploaded successfully at 2025-12-10T...
```

### 6.3 Verify Data in Supabase

1. Go to Supabase Dashboard → Table Editor
2. Open `sensor_data` table
3. You should see new rows appearing every 2 seconds

---

## 🎨 Step 7: Customize (Optional)

### Change Upload Interval

Edit `device-uploader.js` line 27:

```javascript
const UPLOAD_INTERVAL = 2000; // Change to 5000 for 5 seconds
```

### Change Live Data Window

Edit `live-data-fetcher.js` line 20:

```javascript
liveWindowMinutes: 25, // Change to 30 for 30-minute window
```

### Change Data Retention

Edit `supabase-schema.sql` line 76:

```sql
WHERE timestamp < NOW() - INTERVAL '90 days'; -- Change to 30, 60, 180 days
```

---

## 🐛 Troubleshooting

### Problem: Dashboard shows "No Device Connected"

**Solution:**
- Check if device is uploading (see console logs)
- Verify Supabase credentials are correct
- Check if data exists: `SELECT COUNT(*) FROM sensor_data WHERE timestamp > NOW() - INTERVAL '25 minutes'`

### Problem: Device uploader not loading

**Solution:**
- Verify ESP8266 is in Station Mode (connected to internet)
- Check if `device-uploader.js` is accessible: https://cloud.fiaos.org/fiaphy/javascript/device-uploader.js
- Check browser console for CORS errors

### Problem: GPS location not working

**Solution:**
- Browser must be accessed via HTTPS (GitHub Pages provides this)
- User must grant location permission
- GPS will be `null` if permission denied (data still uploads)

### Problem: IP address shows "0.0.0.0"

**Solution:**
- Check if `ipapi.co` is accessible from your network
- Fallback: Device will try to get IP from ESP8266's `/api/data` endpoint

---

## 📊 Database Schema Reference

### `sensor_data` Table Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Auto-incrementing primary key |
| `timestamp` | TIMESTAMPTZ | When data was recorded (server time) |
| `temperature` | NUMERIC(5,2) | Temperature in °C |
| `humidity` | NUMERIC(5,2) | Relative humidity % |
| `air_pressure` | NUMERIC(7,2) | Air pressure in hPa |
| `solar_radiation` | NUMERIC(7,2) | Solar radiation in W/m² |
| `heat_flux` | NUMERIC(7,2) | Heat flux in W/m² |
| `delta_temperature` | NUMERIC(5,2) | Temperature differential in °C |
| `gps_latitude` | NUMERIC(10,7) | GPS latitude |
| `gps_longitude` | NUMERIC(10,7) | GPS longitude |
| `ip_address` | VARCHAR(45) | Device IP address |
| `country` | VARCHAR(100) | Country from IP geolocation |
| `device_id` | VARCHAR(100) | Unique device identifier |
| `created_at` | TIMESTAMPTZ | Row creation time |

---

## 🔐 Security Notes

- **RLS Policies:** Row Level Security is enabled with public read/write
- **API Key:** Using `anon` key (safe for public websites)
- **Rate Limiting:** Supabase free tier: 500MB data, 2GB bandwidth/month
- **For Production:** Consider adding device authentication and rate limiting

---

## 📈 Next Steps

1. ✅ Run SQL schema in Supabase
2. ✅ Deploy website to GitHub Pages
3. ✅ Update ESP8266 code to load `device-uploader.js`
4. ✅ Test device upload in Station Mode
5. ✅ Verify data appears on dashboard
6. ✅ Check datasets page for historical data

---

## 🆘 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **ESP8266 Docs:** https://arduino-esp8266.readthedocs.io/
- **GitHub Pages:** https://pages.github.com/

---

**System Version:** 1.0.0  
**Last Updated:** December 10, 2025  
**Author:** Neksha DeSilva

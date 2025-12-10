# Fiaphy - Environmental Monitoring System

## Project Structure

```
fiaphy/
├── index.html              # Main HTML file
├── styles/
│   └── main.css           # Single CSS file (minimalist black & white design)
├── javascript/
│   ├── api.js             # API module - handles data fetching
│   ├── ui.js              # UI module - handles display updates
│   └── main.js            # Main application - coordinates everything
└── assets/                # Media files (logos, etc.)
```

## Features

- **Minimalist Design**: Pure black (#000000) and white (#ffffff) color scheme
- **No Borders**: Clean, borderless design with border-radius for subtle definition
- **Professional Typography**: Inter font family for modern, clean look
- **Responsive**: Fully responsive design for all screen sizes
- **Loading Screen**: Mandatory loading screen with logo and spinner
- **Real-time Monitoring**: Displays 6 environmental parameters:
  - Temperature (°C)
  - Humidity (%)
  - Air Pressure (hPa)
  - Solar Radiation (W/m²)
  - Heat Flux (W/m²)
  - Delta Temperature (°C)

## Assets

All assets are referenced from the main FiaOS domain:
- Logo: `https://fiaos.org/assets/media/umbrella-logo-clean.png`

## API Integration

The application uses a modular architecture:

1. **api.js**: Handles all API communication
   - `FiaphyAPI.fetchData()` - Fetch sensor data
   - `FiaphyAPI.startPolling()` - Start continuous polling
   - Currently uses mock data for demonstration

2. **ui.js**: Manages UI updates
   - `FiaphyUI.updateData()` - Update sensor displays
   - `FiaphyUI.updateConnectionStatus()` - Update connection indicator

3. **main.js**: Application coordinator
   - Initialization
   - Lifecycle management
   - Visibility handling

## Customization

To integrate with a real API:
1. Edit `javascript/api.js`
2. Update `config.apiEndpoint` with your API URL
3. Replace mock data logic in `fetchData()` with actual fetch calls

## Copyright

Copyrights © Neksha DeSilva and www.nekshadesilva.com. All rights reserved.
Part of FiaOS.org Research Initiative

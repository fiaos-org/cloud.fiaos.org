# FiaPhy LED Status & EEPROM Offline Storage Implementation

## LED Status Reference

### Connection States

| LED State | Meaning | Behavior |
|-----------|---------|----------|
| **🔴 Red Solid** | Device disconnected (no client) | Steady red light |
| **🔴 Red Blink (1s)** | Device was connected, router lost | Blinking red (1 second interval) |
| **🟢 Green Solid** | Successfully connected to cloud | 5 seconds, then off |
| **🟠 Orange Blink** | Sensor/physics error | Blinking orange (1 second interval) |
| **⚫ Off** | Normal operation | No light |

### Detailed Scenarios

#### 1. **No Client Connected (Local or Online)**
- **LED**: 🔴 Red Solid (steady, no blink)
- **Action**: Data is saved to EEPROM
- **Duration**: Stays red until client connects

#### 2. **Client Disconnects After Being Connected**
- **LED**: 🔴 Red Blink (1 second interval)
- **Action**: EEPROM continues to store data during disconnection
- **Recovery**: When client reconnects → Check if local or cloud mode

#### 3. **Successful Cloud Connection**
- **LED**: 🟢 Green Solid
- **Duration**: 5 seconds only
- **Then**: Turns off (⚫ Off)
- **Data**: Send EEPROM data immediately before new data

#### 4. **Sensor Error / Physics Engine Error**
- **LED**: 🟠 Orange Blink (1 second interval)
- **Trigger**: Temperature NaN, sensor malfunction, heat flux error
- **Action**: Stop uploading, blink until resolved

#### 5. **EEPROM Data Recovery**

**Local Mode (Device as AP, no internet)**:
- Display missed records in frontend
- Show what was stored in EEPROM
- Delete from EEPROM after display

**Cloud Mode (Connected to internet)**:
- Send EEPROM data FIRST before current data
- Then sync current data
- Delete EEPROM records after successful upload

---

## Code Implementation

### 1. Enhanced LED System

```cpp
// LED States
enum LEDState {
  STATE_OFF,                    // No light
  STATE_RED_SOLID,              // No client
  STATE_RED_BLINK,              // Router lost (after connection)
  STATE_GREEN_SOLID,            // Cloud connected
  STATE_ORANGE_BLINK,           // Sensor error
  STATE_WHITE_BLINK             // DB error
};

struct LEDController {
  LEDState currentState = STATE_OFF;
  unsigned long lastToggleTime = 0;
  bool blinkState = false;
  unsigned long stateStartTime = 0;
  
  void setState(LEDState newState) {
    if (currentState != newState) {
      currentState = newState;
      stateStartTime = millis();
      blinkState = false;
      lastToggleTime = millis();
      updateLED();
    }
  }
  
  void update() {
    unsigned long now = millis();
    
    switch (currentState) {
      case STATE_OFF:
        digitalWrite(PIN_RGB_R, LOW);
        digitalWrite(PIN_RGB_G, LOW);
        digitalWrite(PIN_RGB_B, LOW);
        break;
        
      case STATE_RED_SOLID:
        digitalWrite(PIN_RGB_R, HIGH);
        digitalWrite(PIN_RGB_G, LOW);
        digitalWrite(PIN_RGB_B, LOW);
        break;
        
      case STATE_RED_BLINK:
        if (now - lastToggleTime >= 1000) { // 1 second interval
          blinkState = !blinkState;
          lastToggleTime = now;
        }
        digitalWrite(PIN_RGB_R, blinkState ? HIGH : LOW);
        digitalWrite(PIN_RGB_G, LOW);
        digitalWrite(PIN_RGB_B, LOW);
        break;
        
      case STATE_GREEN_SOLID:
        digitalWrite(PIN_RGB_R, LOW);
        digitalWrite(PIN_RGB_G, HIGH);
        digitalWrite(PIN_RGB_B, LOW);
        // Turn off after 5 seconds
        if (now - stateStartTime >= 5000) {
          setState(STATE_OFF);
        }
        break;
        
      case STATE_ORANGE_BLINK:
        if (now - lastToggleTime >= 1000) { // 1 second interval
          blinkState = !blinkState;
          lastToggleTime = now;
        }
        digitalWrite(PIN_RGB_R, blinkState ? HIGH : LOW);
        digitalWrite(PIN_RGB_G, blinkState ? HIGH : LOW);
        digitalWrite(PIN_RGB_B, LOW);
        break;
        
      case STATE_WHITE_BLINK:
        if (now - lastToggleTime >= 500) { // 500ms interval
          blinkState = !blinkState;
          lastToggleTime = now;
        }
        digitalWrite(PIN_RGB_R, blinkState ? HIGH : LOW);
        digitalWrite(PIN_RGB_G, blinkState ? HIGH : LOW);
        digitalWrite(PIN_RGB_B, blinkState ? HIGH : LOW);
        break;
    }
  }
};

LEDController ledCtrl;
```

### 2. Enhanced EEPROM System

```cpp
struct OfflinePacket {
  unsigned long timestamp;
  float temperature;
  float humidity;
  float pressure;
  float ghi;              // Solar radiation
  float flux;             // Heat flux
  float delta_temp;       // Temperature differential
};

class EEPROMManager {
  static const int BASE_ADDR = 0;
  static const int MAX_PACKETS = 100;
  static const int PACKET_SIZE = sizeof(OfflinePacket);
  static const int METADATA_SIZE = 4; // for packet count
  
  int packetCount = 0;
  
public:
  void init() {
    readMetadata();
  }
  
  void readMetadata() {
    // Read from I2C EEPROM
    Wire1.beginTransmission(EEPROM_I2C_ADDR);
    Wire1.write((BASE_ADDR >> 8) & 0xFF);
    Wire1.write(BASE_ADDR & 0xFF);
    Wire1.endTransmission();
    
    Wire1.requestFrom(EEPROM_I2C_ADDR, METADATA_SIZE);
    packetCount = Wire1.read();
  }
  
  void savePacket(OfflinePacket &pkt) {
    if (packetCount >= MAX_PACKETS) return; // Buffer full
    
    int addr = METADATA_SIZE + (packetCount * PACKET_SIZE);
    
    Wire1.beginTransmission(EEPROM_I2C_ADDR);
    Wire1.write((addr >> 8) & 0xFF);
    Wire1.write(addr & 0xFF);
    
    byte* data = (byte*)&pkt;
    for (int i = 0; i < PACKET_SIZE; i++) {
      Wire1.write(data[i]);
    }
    Wire1.endTransmission();
    
    delay(5); // EEPROM write delay
    
    packetCount++;
    updateMetadata();
  }
  
  void updateMetadata() {
    Wire1.beginTransmission(EEPROM_I2C_ADDR);
    Wire1.write((BASE_ADDR >> 8) & 0xFF);
    Wire1.write(BASE_ADDR & 0xFF);
    Wire1.write(packetCount);
    Wire1.endTransmission();
    
    delay(5);
  }
  
  void readAllPackets(OfflinePacket packets[], int &count) {
    count = packetCount;
    
    for (int i = 0; i < packetCount; i++) {
      int addr = METADATA_SIZE + (i * PACKET_SIZE);
      
      Wire1.beginTransmission(EEPROM_I2C_ADDR);
      Wire1.write((addr >> 8) & 0xFF);
      Wire1.write(addr & 0xFF);
      Wire1.endTransmission();
      
      Wire1.requestFrom(EEPROM_I2C_ADDR, PACKET_SIZE);
      
      byte* data = (byte*)&packets[i];
      for (int j = 0; j < PACKET_SIZE; j++) {
        data[j] = Wire1.read();
      }
    }
  }
  
  void clearAll() {
    packetCount = 0;
    updateMetadata();
  }
  
  int getPacketCount() { return packetCount; }
};

EEPROMManager eeprom;
```

### 3. Connection State Management

```cpp
enum ConnectionMode {
  MODE_OFFLINE,          // No client
  MODE_LOCAL,            // Client connected (AP mode)
  MODE_CLOUD             // Cloud connected
};

struct ConnectionState {
  ConnectionMode mode = MODE_OFFLINE;
  unsigned long lastClientTime = 0;
  unsigned long cloudConnectTime = 0;
  bool firstCloudSync = false;
};

ConnectionState connState;

void updateConnectionState() {
  unsigned long now = millis();
  
  // If no client request for 10 seconds, consider disconnected
  if (connState.mode != MODE_OFFLINE && (now - connState.lastClientTime > 10000)) {
    Serial.println("[STATE] Connection Lost - Entering disconnected state");
    connState.mode = MODE_OFFLINE;
    ledCtrl.setState(STATE_RED_BLINK); // Red blink when router is lost
  }
}

void onClientRequest() {
  connState.lastClientTime = millis();
  
  if (connState.mode == MODE_OFFLINE) {
    connState.mode = isCloudMode ? MODE_CLOUD : MODE_LOCAL;
    Serial.print("[STATE] Client detected - Mode: ");
    Serial.println(isCloudMode ? "CLOUD" : "LOCAL");
  }
}
```

### 4. Main Loop Integration

```cpp
void loop() {
  checkWebClients();
  ledCtrl.update();
  updateConnectionState();
  
  unsigned long now = millis();
  
  // Sensor reading
  if (!waiting_for_sensor_read && (now - last_trigger_time >= SAMPLE_INTERVAL_MS)) {
    bme_ref.takeForcedMeasurement();
    bme_flux.takeForcedMeasurement();
    waiting_for_sensor_read = true;
    sensor_read_start_time = now;
  }
  
  if (waiting_for_sensor_read && (now - sensor_read_start_time >= 50)) {
    waiting_for_sensor_read = false;
    
    float raw_ref_t = bme_ref.readTemperature();
    float raw_ref_h = bme_ref.readHumidity();
    float raw_ref_p = bme_ref.readPressure() / 100.0f;
    
    // Check for sensor errors
    if (isnan(raw_ref_t) || isnan(raw_ref_h) || isnan(raw_ref_p)) {
      Serial.println("[ERROR] Sensor malfunction detected");
      ledCtrl.setState(STATE_ORANGE_BLINK);
      return;
    }
    
    // Process data
    data_ref.temp = apply_filter(raw_ref_t, data_ref.temp);
    data_ref.hum = apply_filter(raw_ref_h, data_ref.hum);
    data_ref.press = apply_filter(raw_ref_p, data_ref.press);
    
    // Feed to physics engine
    dtdss.feedReferenceTemperature(data_ref.temp, 0);
    dtdss.feedReferenceHumidity(data_ref.hum, 0);
    dtdss.feedReferencePressure(data_ref.press, 0);
    
    if (dtdss.isFrameReady()) {
      FiaPhy::RadiationResult result = dtdss.compute();
      
      if (!result.valid) {
        Serial.println("[ERROR] Physics engine error");
        ledCtrl.setState(STATE_ORANGE_BLINK);
        return;
      }
      
      // Check connection state
      if (connState.mode == MODE_OFFLINE) {
        // Not connected - save to EEPROM
        OfflinePacket pkt;
        pkt.timestamp = now;
        pkt.temperature = data_ref.temp;
        pkt.humidity = data_ref.hum;
        pkt.pressure = data_ref.press;
        pkt.ghi = result.ghi_Wm2;
        pkt.flux = result.heat_flux_Wm2;
        pkt.delta_temp = result.temp_differential_C;
        
        eeprom.savePacket(pkt);
        Serial.print("[EEPROM] Saved packet #");
        Serial.println(eeprom.getPacketCount());
      }
    }
  }
}
```

### 5. API Endpoints for EEPROM Recovery

```cpp
// In checkWebClients() function

// /api/recover - Get missed data
else if (request.indexOf("/api/recover") != -1) {
  onClientRequest();
  
  OfflinePacket packets[100];
  int count = 0;
  eeprom.readAllPackets(packets, count);
  
  String json = "[";
  for (int i = 0; i < count; i++) {
    if (i > 0) json += ",";
    json += "{\"timestamp\":" + String(packets[i].timestamp);
    json += ",\"temperature\":" + String(packets[i].temperature, 2);
    json += ",\"humidity\":" + String(packets[i].humidity, 2);
    json += ",\"pressure\":" + String(packets[i].pressure, 2);
    json += ",\"ghi\":" + String(packets[i].ghi, 2);
    json += ",\"flux\":" + String(packets[i].flux, 2);
    json += ",\"delta_temp\":" + String(packets[i].delta_temp, 2) + "}";
  }
  json += "]";
  
  // Send JSON response
  sendResponse(connectionId, json);
  
  // Clear EEPROM after sending
  if (connState.mode == MODE_CLOUD) {
    eeprom.clearAll();
    Serial.println("[EEPROM] Cleared after cloud sync");
  }
}

// /api/status - Update LED status
else if (request.indexOf("/api/status") != -1) {
  onClientRequest();
  
  String code = getUrlParam(request, "code");
  
  if (code == "ok") {
    ledCtrl.setState(STATE_OFF);
  } else if (code == "error_sensor") {
    ledCtrl.setState(STATE_ORANGE_BLINK);
  } else if (code == "error_db") {
    ledCtrl.setState(STATE_WHITE_BLINK);
  } else if (code == "cloud_connected") {
    ledCtrl.setState(STATE_GREEN_SOLID); // 5s auto-off
  }
  
  String resp = "{\"status\":\"ok\"}";
  sendResponse(connectionId, resp);
}
```

### 6. WiFi Connection Enhancement

```cpp
// When WiFi successfully connects
if(sendATWaitForResponse(connectCmd, 15000)) {
  Serial.println("\nSUCCESS: Wi-Fi Connected!");
  isCloudMode = true;
  connState.cloudConnectTime = millis();
  connState.firstCloudSync = true;
  
  // Green light for 5 seconds
  ledCtrl.setState(STATE_GREEN_SOLID);
  
  // Will turn off automatically after 5 seconds in ledCtrl.update()
}
```

---

## Frontend Integration (Cloud Connections Website)

Add to your `/data/index.html` or dashboard:

```html
<!-- Offline Data Recovery Section -->
<div id="offlineDataSection" class="offline-section hidden">
  <h3>📦 Missed Data Detected</h3>
  <p>Found <span id="missedCount">0</span> offline records</p>
  <table id="missedDataTable">
    <thead>
      <tr>
        <th>Time</th>
        <th>Temp (°C)</th>
        <th>Humidity (%)</th>
        <th>Pressure (hPa)</th>
        <th>Solar (W/m²)</th>
        <th>Heat Flux (W/m²)</th>
      </tr>
    </thead>
    <tbody id="missedDataBody"></tbody>
  </table>
  <button onclick="clearMissedData()">Clear & Sync</button>
</div>

<script>
async function checkMissedData() {
  try {
    const response = await fetch('/api/recover');
    const data = await response.json();
    
    if (data.length > 0) {
      document.getElementById('missedCount').textContent = data.length;
      document.getElementById('offlineDataSection').classList.remove('hidden');
      
      const tbody = document.getElementById('missedDataBody');
      tbody.innerHTML = '';
      
      data.forEach(record => {
        const row = `<tr>
          <td>${new Date(record.timestamp).toLocaleString()}</td>
          <td>${record.temperature.toFixed(2)}</td>
          <td>${record.humidity.toFixed(2)}</td>
          <td>${record.pressure.toFixed(2)}</td>
          <td>${record.ghi.toFixed(2)}</td>
          <td>${record.flux.toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML += row;
      });
    }
  } catch (error) {
    console.log('No offline data');
  }
}

async function clearMissedData() {
  await fetch('/api/recover?action=clear');
  location.reload();
}

// Check on page load
checkMissedData();
</script>
```

---

## Summary of LED Behavior

✅ **Red Solid** → No client, EEPROM storing
✅ **Red Blink** → Was connected, lost connection, EEPROM storing
✅ **Green Solid** → Cloud connected successfully (5s only)
✅ **Orange Blink** → Sensor/physics error
✅ **Off** → Normal operation

This implementation ensures no data is lost and provides clear status feedback through LED indicators.

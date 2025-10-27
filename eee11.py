"""
Finalized Smart Microgrid Simulation (Delhi) with Adaptive SOC-based Load Control
- Uses OpenWeather 3-hour forecast (free API)
- Handles units: power (W) and energy (Wh)
- Adaptive load control based on battery SOC
- Saves CSV and plots results
Author: Team MicroSmartGrid
"""

import requests
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta

# ---------------- CONFIG ----------------
API_KEY = "c99a471bf04d0b48427b23ec2bdfaaea"   # <- replace with your OpenWeather API key
LAT, LON = 28.6139, 77.2090     # Delhi coordinates

PANEL_AREA = 1.6                # m^2 per panel
EFFICIENCY = 0.18               # panel efficiency (fraction)
NUM_PANELS = 20                 # number of panels in array

BATTERY_CAPACITY_Wh = 5000      # battery capacity (Wh)
INITIAL_BATTERY_Wh = 2000       # initial stored energy (Wh)

# We'll request forecast and use next 24 hours (8 * 3h points)
FORECAST_POINTS = 8

# ---------------- fetch forecast (3-hourly) ----------------
def fetch_forecast_3h(lat, lon, api_key, points=FORECAST_POINTS):
    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        raise RuntimeError(f"Forecast API failed: {resp.status_code} {resp.text}")
    data = resp.json()
    lst = data.get("list", [])
    if not lst:
        raise RuntimeError("No forecast list found in response.")
    # use earliest consecutive 'points' items
    chosen = lst[:points]
    ghi = []
    times = []
    city = data.get("city", {}).get("name", "Unknown")
    for item in chosen:
        dt = datetime.fromtimestamp(item["dt"])
        clouds = item.get("clouds", {}).get("all", 0)
        # estimate GHI (W/m^2) from cloud cover: simple approximation
        ghi_val = max(0.0, (100 - clouds)) * 10.0   # maps 0% cloud -> 1000 W/m^2
        ghi.append(ghi_val)
        times.append(dt)
    return np.array(ghi), times, city

# ---------------- fallback synthetic (if API fails) ----------------
def synthetic_ghi(hours=24):
    times = [datetime.now() + timedelta(hours=h) for h in range(hours)]
    ghi = [max(0.0, 1000 * np.sin((h - 6) * np.pi / 12)) for h in range(hours)]
    return np.array(ghi), times

# ---------------- RUN ----------------
try:
    ghi_values, timestamps, city = fetch_forecast_3h(LAT, LON, API_KEY, points=FORECAST_POINTS)
    delta_t_hours = 3.0
    print(f"✅ Fetched {len(ghi_values)} forecast points for {city} (3-hour steps).")
except Exception as e:
    print("⚠️ Forecast fetch failed, using synthetic hourly data:", e)
    ghi_values, timestamps = synthetic_ghi(24)
    delta_t_hours = 1.0
    city = "Synthetic"

# ---------------- compute PV power (W) from GHI (W/m^2) ----------------
pv_power_W = ghi_values * PANEL_AREA * EFFICIENCY * NUM_PANELS   # in W

# ---------------- simulate microgrid ----------------
battery_Wh = INITIAL_BATTERY_Wh
battery_history = []
soc_history = []
pv_history = []
load_history = []
pv_used_energy_Wh = 0.0
total_load_energy_Wh = 0.0
charge_discharge_flag = []  # + for charging, - for discharging

for i, t in enumerate(timestamps):
    hour = t.hour
    pv_W = float(pv_power_W[i])

    # time-of-day base load (W)
    # Use hour-based pattern (works for both 3-hour and hourly timestamps)
    if 0 <= hour < 6:
        base_load_W = 150
    elif 6 <= hour < 9:
        base_load_W = 400
    elif 9 <= hour < 18:
        base_load_W = 300
    elif 18 <= hour < 22:
        base_load_W = 500
    else:
        base_load_W = 200

    # small stochastic variation
    base_load_W *= np.random.uniform(0.9, 1.1)

    # compute current SOC before adjustment
    soc_pct = 100.0 * battery_Wh / BATTERY_CAPACITY_Wh if BATTERY_CAPACITY_Wh > 0 else 0.0

    # -------- Adaptive load control based on SOC --------
    load_W = base_load_W
    if soc_pct < 20.0:
        load_W *= 0.9   # reduce non-critical load by 10%
    elif soc_pct > 80.0:
        load_W *= 1.05  # allow +5% extra load when battery nearly full

    # -------- energy for this interval (Wh) --------
    pv_energy_Wh = pv_W * delta_t_hours
    load_energy_Wh = load_W * delta_t_hours

    # what portion of load can be met by PV directly this interval
    pv_used_Wh = min(pv_energy_Wh, load_energy_Wh)
    pv_used_energy_Wh += pv_used_Wh
    total_load_energy_Wh += load_energy_Wh

    # net energy to battery (positive => charge battery, negative => discharge)
    net_Wh = pv_energy_Wh - load_energy_Wh

    # update battery (Wh) with clamp
    prev_batt = battery_Wh
    battery_Wh = max(0.0, min(BATTERY_CAPACITY_Wh, battery_Wh + net_Wh))

    # flag charge/discharge
    if battery_Wh > prev_batt:
        charge_discharge_flag.append(1)
    elif battery_Wh < prev_batt:
        charge_discharge_flag.append(-1)
    else:
        charge_discharge_flag.append(0)

    # record histories
    battery_history.append(battery_Wh)
    soc_history.append(100.0 * battery_Wh / BATTERY_CAPACITY_Wh)
    pv_history.append(pv_W)
    load_history.append(load_W)

# ---------------- metrics ----------------
efficiency_pct = (pv_used_energy_Wh / total_load_energy_Wh * 100.0) if total_load_energy_Wh > 0 else 0.0
avg_pv_W = np.mean(pv_history)
avg_load_W = np.mean(load_history)
final_soc = soc_history[-1] if soc_history else 0.0

print("\n=== Simulation Summary ===")
print(f"Location: {city}")
print(f"Data points: {len(pv_history)} (delta_t = {delta_t_hours} hours)")
print(f"Avg PV power: {avg_pv_W:.1f} W")
print(f"Avg Load: {avg_load_W:.1f} W")
print(f"Total load energy: {total_load_energy_Wh:.1f} Wh")
print(f"PV energy used to meet load: {pv_used_energy_Wh:.1f} Wh")
print(f"System efficiency (PV_used / Load): {efficiency_pct:.2f}%")
print(f"Final battery SOC: {final_soc:.2f}%")
print("==========================\n")

# ---------------- save CSV ----------------
df = pd.DataFrame({
    "time": timestamps,
    "pv_power_W": pv_history,
    "load_power_W": load_history,
    "battery_Wh": battery_history,
    "soc_pct": soc_history,
    "charge_flag": charge_discharge_flag
})
csv_name = "microgrid_delhi_results.csv"
df.to_csv(csv_name, index=False)
print(f"Saved results to {csv_name}")

# ---------------- plotting ----------------
plt.figure(figsize=(12, 7))

# subplot 1 : PV and Load (W)
ax1 = plt.gca()
ax1.plot(timestamps, pv_history, label="PV Power (W)", color="orange", linewidth=2)
ax1.plot(timestamps, load_history, label="Load (W)", color="blue", linestyle="--")
ax1.set_ylabel("Power (W)")
ax1.legend(loc="upper left")
ax1.grid(True)

# subplot 2 : Battery SOC (%) on secondary axis
ax2 = ax1.twinx()
ax2.plot(timestamps, soc_history, label="Battery SOC (%)", color="green", linewidth=2, alpha=0.8)
ax2.set_ylabel("Battery SOC (%)")
ax2.legend(loc="upper right")

plt.title("Smart Microgrid Simulation (Delhi) — PV vs Load and Battery SOC")
plt.xlabel("Time")
plt.tight_layout()
plt.show()

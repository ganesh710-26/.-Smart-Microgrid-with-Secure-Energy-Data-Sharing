"""
Smart Microgrid with Secure Energy Data Sharing (Delhi)
- Adaptive load control based on SOC
- OpenWeather forecast integration
- Blockchain-based data integrity verification
"""

import requests, json, hashlib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

# ----------------- CONFIG -----------------
API_KEY = "c99a471bf04d0b48427b23ec2bdfaaea"
LAT, LON = 28.6139, 77.2090
PANEL_AREA, EFFICIENCY, NUM_PANELS = 1.6, 0.18, 20
BATTERY_CAPACITY_Wh, INITIAL_BATTERY_Wh = 5000, 2000
FORECAST_POINTS = 8

# ----------------- BLOCKCHAIN SETUP -----------------
def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return private_key, private_key.public_key()


def sign_data(private_key, data):
    msg = json.dumps(data, sort_keys=True).encode()
    return private_key.sign(
        msg,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256()
    )


def verify_signature(public_key, data, sig):
    msg = json.dumps(data, sort_keys=True).encode()
    try:
        public_key.verify(
            sig,
            msg,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False


class Ledger:
    def __init__(self):
        self.chain = []

    def add_block(self, data, sig):
        prev_hash = self.chain[-1]["hash"] if self.chain else "0"
        rec = {
            "timestamp": str(datetime.now()),
            "data": data,
            "signature": sig.hex(),
            "prev_hash": prev_hash
        }
        rec_hash = hashlib.sha256(json.dumps(rec, sort_keys=True).encode()).hexdigest()
        rec["hash"] = rec_hash
        self.chain.append(rec)

    def verify_chain(self):
        for i in range(len(self.chain)):
            blk = self.chain[i]
            recal = hashlib.sha256(json.dumps({
                "timestamp": blk["timestamp"],
                "data": blk["data"],
                "signature": blk["signature"],
                "prev_hash": blk["prev_hash"]
            }, sort_keys=True).encode()).hexdigest()

            if recal != blk["hash"]:
                return False
            if i > 0 and blk["prev_hash"] != self.chain[i - 1]["hash"]:
                return False
        return True


# ----------------- FETCH FORECAST -----------------
def fetch_forecast_3h(lat, lon, key, points=FORECAST_POINTS):
    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={key}&units=metric"
    r = requests.get(url, timeout=15)
    data = r.json()
    lst = data.get("list", [])

    if not lst:
        raise RuntimeError("No forecast data.")

    sel = lst[:points]
    ghi, times = [], []
    for item in sel:
        clouds = item.get("clouds", {}).get("all", 0)
        ghi_val = max(0.0, (100 - clouds)) * 10.0
        ghi.append(ghi_val)
        times.append(datetime.fromtimestamp(item["dt"]))

    return np.array(ghi), times, data.get("city", {}).get("name", "Unknown")


# ----------------- SYNTHETIC BACKUP -----------------
def synthetic_ghi(hours=24):
    times = [datetime.now() + timedelta(hours=h) for h in range(hours)]
    ghi = [max(0.0, 1000 * np.sin((h - 6) * np.pi / 12)) for h in range(hours)]
    return np.array(ghi), times, "Synthetic"


# ----------------- RUN SIMULATION -----------------
try:
    ghi, ts, city = fetch_forecast_3h(LAT, LON, API_KEY)
    delta_t = 3.0
    print(f"✅ Fetched forecast for {city}")
except Exception as e:
    print("⚠️ API failed:", e)
    ghi, ts, city = synthetic_ghi(24)
    delta_t = 1.0

pv_W = ghi * PANEL_AREA * EFFICIENCY * NUM_PANELS
batt_Wh = INITIAL_BATTERY_Wh
records = []
private_key, public_key = generate_keys()
ledger = Ledger()

for i, t in enumerate(ts):
    hr = t.hour

    if 0 <= hr < 6:
        base = 150
    elif 6 <= hr < 9:
        base = 400
    elif 9 <= hr < 18:
        base = 300
    elif 18 <= hr < 22:
        base = 500
    else:
        base = 200

    base *= np.random.uniform(0.9, 1.1)

    soc_pct = 100 * batt_Wh / BATTERY_CAPACITY_Wh
    load_W = base * (0.9 if soc_pct < 20 else 1.05 if soc_pct > 80 else 1.0)

    pv_E = pv_W[i] * delta_t
    load_E = load_W * delta_t

    net = pv_E - load_E
    batt_Wh = max(0, min(BATTERY_CAPACITY_Wh, batt_Wh + net))

    record = {
        "time": str(t),
        "pv_W": pv_W[i],
        "load_W": load_W,
        "SOC_Wh": batt_Wh,
        "SOC_%": 100 * batt_Wh / BATTERY_CAPACITY_Wh
    }

    sig = sign_data(private_key, record)
    ledger.add_block(record, sig)
    records.append(record)

# ----------------- BLOCKCHAIN VERIFICATION -----------------
print("Ledger verification:", "✅ OK" if ledger.verify_chain() else "❌ Failed")
ledger.chain[3]["data"]["pv_W"] = 99999
print("After Tampering:", "✅ OK" if ledger.verify_chain() else "❌ Failed (Tampered!)")

# ----------------- PLOT (Enhanced Dual-Axis Layout) -----------------
import matplotlib.dates as mdates

df = pd.DataFrame(records)
df["time"] = pd.to_datetime(df["time"])

fig, ax1 = plt.subplots(figsize=(13, 7))
fig.patch.set_facecolor("#fafafa")

# --- PV Power ---
ax1.plot(df["time"], df["pv_W"], color="#f39c12", linewidth=2.5, label="PV Power (W)")
ax1.set_ylabel("PV Power (W)", color="#f39c12", fontsize=12)
ax1.tick_params(axis="y", labelcolor="#f39c12")
ax1.grid(True, linestyle="--", alpha=0.4)

# --- Load Power (Right Axis 1) ---
ax2 = ax1.twinx()
ax2.plot(df["time"], df["load_W"], color="#3498db", linestyle="--", linewidth=2.5, label="Load (W)")
ax2.set_ylabel("Load (W)", color="#3498db", fontsize=12)
ax2.tick_params(axis="y", labelcolor="#3498db")

# --- Battery SOC (Right Axis 2, scaled separately) ---
ax3 = ax1.twinx()
ax3.spines["right"].set_position(("axes", 1.1))  # shift the SOC axis slightly right
ax3.plot(df["time"], df["SOC_%"], color="#27ae60", linewidth=2.5, label="Battery SOC (%)")
ax3.set_ylabel("Battery SOC (%)", color="#27ae60", fontsize=12)
ax3.tick_params(axis="y", labelcolor="#27ae60")

# --- X-Axis formatting ---
ax1.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
ax1.xaxis.set_major_locator(mdates.AutoDateLocator(maxticks=8))
plt.setp(ax1.get_xticklabels(), rotation=30, ha="right", fontsize=10)
ax1.set_xlabel("Time", fontsize=12)

# --- Title ---
plt.title(f"Smart Microgrid Simulation — {city}", fontsize=15, fontweight="bold", pad=20)

# --- Combine all legends ---
lines, labels = [], []
for ax in [ax1, ax2, ax3]:
    l, lab = ax.get_legend_handles_labels()
    lines += l
    labels += lab
ax1.legend(lines, labels, loc="upper center", ncol=3, bbox_to_anchor=(0.5, -0.12), frameon=False)

plt.tight_layout(rect=[0, 0.05, 1, 1])
plt.show()

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import hashlib, json
from secureledger import Ledger, sign_data, verify_signature, generate_keys, fetch_forecast_3h, synthetic_ghi
from datetime import datetime, timedelta
import numpy as np

st.set_page_config(page_title="Smart Microgrid Dashboard", layout="wide")

st.title("🔋 Smart Microgrid with Secure Energy Data Sharing")
st.markdown("#### Real-time Solar + Load Simulation with Blockchain Verification")

# --- Initialize session state ---
if "ledger" not in st.session_state:
    st.session_state.private_key, st.session_state.public_key = generate_keys()
    st.session_state.ledger = Ledger()
    st.session_state.df = pd.DataFrame()
    st.session_state.records = []

# --- Sidebar controls ---
st.sidebar.header("⚙️ Controls")
api_key = st.sidebar.text_input("OpenWeather API Key", "c99a471bf04d0b48427b23ec2bdfaaea")
lat = st.sidebar.number_input("Latitude", value=28.6139)
lon = st.sidebar.number_input("Longitude", value=77.2090)

col1, col2, col3 = st.columns(3)

# --- Function to run simulation ---
def run_simulation():
    try:
        ghi, ts, city = fetch_forecast_3h(lat, lon, api_key)
        delta_t = 3.0
    except Exception:
        ghi, ts, city = synthetic_ghi(24)
        delta_t = 1.0

    PANEL_AREA, EFFICIENCY, NUM_PANELS = 1.6, 0.18, 20
    BATTERY_CAPACITY_Wh, INITIAL_BATTERY_Wh = 5000, 2000
    pv_W = ghi * PANEL_AREA * EFFICIENCY * NUM_PANELS
    batt_Wh = INITIAL_BATTERY_Wh
    records = []

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

        sig = sign_data(st.session_state.private_key, record)
        st.session_state.ledger.add_block(record, sig)
        records.append(record)

    df = pd.DataFrame(records)
    st.session_state.df = df
    st.session_state.records = records
    return df, city


# --- Button actions ---
if col1.button("⚡ Generate Data"):
    df, city = run_simulation()
    st.success(f"Data generated for {city} 🌞")
    st.dataframe(df.head())

if col2.button("🔍 Verify Ledger"):
    if st.session_state.ledger.verify_chain():
        st.success("✅ Ledger verified successfully. No tampering detected.")
    else:
        st.error("❌ Ledger verification failed! Data tampered.")

if col3.button("🧨 Tamper Test"):
    if len(st.session_state.ledger.chain) > 3:
        st.session_state.ledger.chain[3]["data"]["pv_W"] = 99999
        st.warning("⚠️ Tampered one block in the ledger for testing.")
    else:
        st.info("Generate data first to perform tamper test.")

# --- Graph plotting ---
if not st.session_state.df.empty:
    df = st.session_state.df
    df["time"] = pd.to_datetime(df["time"])

    fig, ax1 = plt.subplots(figsize=(10, 5))
    ax1.plot(df["time"], df["pv_W"], color="#f39c12", label="PV Power (W)", linewidth=2)
    ax1.set_ylabel("PV Power (W)", color="#f39c12")
    ax1.tick_params(axis="y", labelcolor="#f39c12")

    ax2 = ax1.twinx()
    ax2.plot(df["time"], df["load_W"], color="#3498db", linestyle="--", label="Load (W)", linewidth=2)
    ax2.set_ylabel("Load (W)", color="#3498db")
    ax2.tick_params(axis="y", labelcolor="#3498db")

    ax3 = ax1.twinx()
    ax3.spines["right"].set_position(("axes", 1.1))
    ax3.plot(df["time"], df["SOC_%"], color="#27ae60", linewidth=2, label="Battery SOC (%)")
    ax3.set_ylabel("Battery SOC (%)", color="#27ae60")
    ax3.tick_params(axis="y", labelcolor="#27ae60")

    ax1.set_xlabel("Time")
    plt.title("Smart Microgrid — Solar, Load & Battery SOC")
    ax1.grid(True, linestyle="--", alpha=0.4)

    lines, labels = [], []
    for ax in [ax1, ax2, ax3]:
        l, lab = ax.get_legend_handles_labels()
        lines += l
        labels += lab
    ax1.legend(lines, labels, loc="upper center", ncol=3, bbox_to_anchor=(0.5, -0.15))

    st.pyplot(fig)

import math
import random
import pandas as pd
def simulate_solar_power(hour):
    # Solar works from 6 AM to 6 PM
    if 6 <= hour <= 18:
        # Peak at noon (12 PM)
        power = max(0, math.sin((math.pi / 12) * (hour - 6))) * 5  # up to 5 kW
    else:
        power = 0
    return round(power, 2)
def simulate_load(hour):
    # Simple pattern of daily usage
    if 6 <= hour <= 9:       # morning
        load = random.uniform(3, 4)
    elif 10 <= hour <= 17:   # daytime
        load = random.uniform(2, 3)
    elif 18 <= hour <= 22:   # evening peak
        load = random.uniform(4, 5)
    else:                    # night
        load = random.uniform(1, 2)
    return round(load, 2)
class Battery:
    def __init__(self, capacity_kwh=10):
        self.capacity = capacity_kwh
        self.soc = 0.5 * capacity_kwh  # start at 50% full

    def update(self, generation, load):
        net_power = generation - load  # +ve means surplus

        # Charge or discharge
        self.soc += net_power * 0.9  # assume 90% efficiency

        # Limit SOC between 0 and full capacity
        self.soc = min(max(self.soc, 0), self.capacity)

        return round(self.soc, 2)
def run_simulation():
    battery = Battery(capacity_kwh=10)
    records = []

    for hour in range(0, 24):
        solar = simulate_solar_power(hour)
        load = simulate_load(hour)
        soc = battery.update(solar, load)
        net = round(solar - load, 2)

        records.append({
            "hour": hour,
            "solar_kW": solar,
            "load_kW": load,
            "battery_SOC_kWh": soc,
            "net_power_kW": net
        })

    df = pd.DataFrame(records)
    return df
if __name__ == "__main__":
    df = run_simulation()
    print(df)
import matplotlib.pyplot as plt

df = run_simulation()
plt.plot(df["hour"], df["solar_kW"], label="Solar Generation (kW)")
plt.plot(df["hour"], df["load_kW"], label="Load (kW)")
plt.plot(df["hour"], df["battery_SOC_kWh"], label="Battery SOC (kWh)")
plt.xlabel("Hour of Day")
plt.ylabel("Power (kW) / Energy (kWh)")
plt.legend()
plt.title("Smart Microgrid Simulation")
plt.show()

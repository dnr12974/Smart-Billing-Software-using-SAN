import os
import json
import pandas as pd
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(__file__)
LOG = os.path.join(BASE_DIR, "san_usage_log.csv")
OUT = os.path.join(BASE_DIR, "san_prediction.json")


def main():
    if not os.path.exists(LOG):
        print("Log file not found.")
        return

    df = pd.read_csv(LOG)
    if df.empty or df["sent_gb"].isnull().all():
        print("sent_gb column missing or empty, cannot predict.")
        return

    # Only consider sent_gb and number of backups
    df["sent_gb"] = pd.to_numeric(df["sent_gb"], errors="coerce").fillna(0)
    total_gb = float(df["total_gb"].iloc[-1])
    total_sent = df["sent_gb"].sum()
    num_backups = len(df)

    debug_path = os.path.join(BASE_DIR, "predict_usage_debug.txt")
    with open(debug_path, "w", encoding="utf-8") as debug_file:
        debug_file.write(f"num_backups={num_backups}, total_sent={total_sent}\n")

    if num_backups == 0 or total_sent == 0:
        print("Not enough data to predict.")
        return

    avg_per_backup = total_sent / num_backups
    remaining_gb = total_gb - total_sent
    if avg_per_backup <= 0:
        remaining_backups = None
    else:
        remaining_backups = int(remaining_gb // avg_per_backup)

    # Assume one backup per day
    if remaining_backups is not None and remaining_backups > 0:
        today = datetime.now()
        end_date = today + timedelta(days=remaining_backups)
        end_date_str = end_date.strftime("%Y-%m-%d")
    else:
        end_date_str = None

    result = {
        "total_sent_gb": total_sent,
        "total_gb": total_gb,
        "num_backups_done": num_backups,
        "avg_gb_per_backup": avg_per_backup,
        "remaining_backups": remaining_backups,
        "prediction_date": end_date_str
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print("Prediction written to", OUT)
    print(result)

if __name__ == "__main__":
    main()

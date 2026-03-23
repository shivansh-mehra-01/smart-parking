import cv2
from pymongo import MongoClient
from bson.objectid import ObjectId
import time
import re
import base64
import requests
import numpy as np
from datetime import datetime
from collections import Counter
from fast_alpr import ALPR
import easyocr
import Levenshtein

# ============================================================
#  NVIDIA API Config
# ============================================================

INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
API_KEY    = "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"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json"
}

# ============================================================
#  Gemma se Plate Padhna
# ============================================================

def read_plate_with_gemma(plate_image):
    try:
        _, buffer = cv2.imencode('.jpg', plate_image)
        img_b64   = base64.b64encode(buffer).decode('utf-8')

        payload = {
            "model": "google/gemma-3-27b-it",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}
                        },
                        {
                            "type": "text",
                            "text": (
                                "This is a vehicle license plate image. "
                                "Read the license plate number exactly. "
                                "Return ONLY the plate number, no spaces, "
                                "no explanation. Example: MH12AB1234"
                            )
                        }
                    ]
                }
            ],
            "max_tokens": 30,
            "temperature": 0.20,
            "top_p": 0.70,
            "stream": False
        }

        resp  = requests.post(INVOKE_URL, headers=HEADERS, json=payload, timeout=10)
        raw   = resp.json()["choices"][0]["message"]["content"].strip().upper()
        
        # Reject AI refusal messages or explanations
        if "UNABLE" in raw or "CANNOT" in raw or "SORRY" in raw:
            return None
            
        clean_text = re.sub(r'[^A-Z0-9]', '', raw)
        
        # Valid Indian plate length usually between 6 and 11 characters
        if len(clean_text) < 6 or len(clean_text) > 11:
            return None
            
        return clean_text

    except Exception as e:
        print(f"  [Gemma Error] {e}")
        return None


# ============================================================
#  Smart OCR — Gemma + EasyOCR
# ============================================================

reader = easyocr.Reader(['en'], gpu=False)

def clean_text(raw: str) -> str:
    text = re.sub(r"[^A-Z0-9]", "", raw.upper().strip())
    result = list(text)
    n2a = {"0":"O", "1":"I", "2":"Z", "3":"J", "4":"A", "5":"S", "6":"G", "7":"T", "8":"B", "9":"P"}
    for i in range(min(2, len(result))):
        if result[i] in n2a: result[i] = n2a[result[i]]
    a2n = {"O":"0", "I":"1", "Z":"2", "J":"3", "A":"4", "S":"5", "G":"6", "T":"7", "B":"8", "Q":"0", "D":"0"}
    if len(result) > 2 and result[2] in a2n: result[2] = a2n[result[2]]
    return "".join(result)

def is_valid_plate(text: str) -> bool:
    states = "AN|AP|AR|AS|BH|BR|CG|CH|DD|DL|GA|GJ|HP|HR|JH|JK|KA|KL|LA|LD|MH|ML|MN|MP|MZ|NL|OD|PB|PY|RJ|SK|TG|TN|TR|TS|UA|UK|UP|WB"
    return bool(re.match(rf"^({states})\d{{1,2}}[A-Z]{{0,3}}\d{{1,4}}$", text, re.IGNORECASE))

def smart_ocr(plate_image):
    results = []

    gemma_text = read_plate_with_gemma(plate_image)
    if gemma_text:
        cleaned_gemma = clean_text(gemma_text)
        if is_valid_plate(cleaned_gemma):
            results.append(("gemma", cleaned_gemma, 0.95))
            print(f"    [Gemma]   → {cleaned_gemma}")

    try:
        ocr_out    = reader.readtext(plate_image)
        easy_text  = re.sub(r'[^A-Z0-9]', '',
                            "".join([r[1] for r in ocr_out]).upper())
        if easy_text:
            cleaned_easy = clean_text(easy_text)
            easy_conf  = float(ocr_out[0][2]) if ocr_out else 0.0
            if is_valid_plate(cleaned_easy):
                results.append(("easyocr", cleaned_easy, easy_conf))
                print(f"    [EasyOCR] → {cleaned_easy} ({easy_conf:.2f})")
    except Exception as e:
        print(f"    [EasyOCR Error] {e}")

    if not results:
        return None, 0.0, "none"

    if len(results) >= 2:
        sim = Levenshtein.ratio(results[0][1], results[1][1])
        if sim > 0.8:
            print(f"    ✅ Match! ({sim:.2f})")
            return results[0][1], 0.98, "gemma+easyocr"

    best = sorted(results, key=lambda x: x[2], reverse=True)[0]
    return best[1], best[2], best[0]


# ============================================================
#  API Integration (Node.js backend)
# ============================================================
# When i want to use different parking lot then i have to change the target_parking_name in the init_db function

def init_db(base_url="http://localhost:3000/api", target_parking_name="DB City Mall Parking"):
    try:
        r = requests.get(f"{base_url}/parkings", timeout=5)
        if r.status_code == 200:
            parkings = r.json()
            if parkings:
                # Find DB City Mall specially, otherwise fallback to first
                chosen_parking = next((p for p in parkings if p.get('name') == target_parking_name), parkings[0])
                
                parking_id = chosen_parking["_id"]
                print(f"[API] Connected to Node.js backend. Camera assigned to: {chosen_parking['name']}")
                return {"base_url": base_url, "parking_id": parking_id}
            else:
                print("[API Warning] No parkings found in the Node.js backend. Run initParking.js")
                return {"base_url": base_url, "parking_id": None}
    except Exception as e:
        print(f"[API Error] Could not connect to Node.js backend at {base_url}: {e}")
    return None

def record_entry(conn, plate, source):
    if not conn or not conn.get("parking_id"): 
        print("  [Entry] ⚠️  No backend connection or parking ID.")
        return False
        
    payload = {
        "plateNumber": plate,
        "camera": source,
        "parkingId": conn["parking_id"]
    }
    try:
        r = requests.post(f"{conn['base_url']}/vehicle-entry", json=payload, timeout=5)
        data = r.json()
        if r.status_code == 200 and data.get("vehicle"):
            print(f"  [Entry] ✅ {plate} ANDAR AAYA — {datetime.now().strftime('%H:%M:%S')}")
            return data["vehicle"]["_id"]
        else:
            print(f"  [Entry] ⚠️  {data.get('message', data.get('error', 'Error'))}")
            return False
    except Exception as e:
        print(f"  [Entry Error] {e}")
        return False

def record_exit(conn, plate, source):
    if not conn: 
        return None
        
    try:
        r = requests.post(f"{conn['base_url']}/vehicle-exit", json={"plateNumber": plate}, timeout=5)
        data = r.json()
        if r.status_code == 200 and data.get("vehicle"):
            t_entry_str = data["vehicle"]["entryTime"].replace("Z", "+00:00")
            t_exit_str = data["vehicle"]["exitTime"].replace("Z", "+00:00")
            entry_dt = datetime.fromisoformat(t_entry_str)
            exit_dt = datetime.fromisoformat(t_exit_str)
            
            dur_mins = (exit_dt.timestamp() - entry_dt.timestamp()) / 60.0
            
            h, m = int(dur_mins // 60), int(dur_mins % 60)
            print(f"  [Exit] ✅ {plate} BAHAR GAYA — Duration: {h}h {m}m")
            return dur_mins
        else:
            print(f"  [Exit] ⚠️  {data.get('error', 'Error')}")
            return None
    except Exception as e:
        print(f"  [Exit Error] {e}")
        return None


# ============================================================
#  Camera Runner — Entry ya Exit mode
# ============================================================

def run_camera(mode, conn, alpr, camera_source=0, threshold=0.7):
    """
    mode = "entry"  → Plates detect karo, entry record karo
    mode = "exit"   → Plates detect karo, exit + duration record karo
    """

    cap = cv2.VideoCapture(camera_source)
    if not cap.isOpened():
        print(f"[Error] Camera {camera_source} nahi khula!")
        return

    is_entry      = (mode == "entry")
    color         = (0, 255, 0)   if is_entry else (0, 0, 255)
    mode_label    = "🟢 ENTRY CAM" if is_entry else "🔴 EXIT CAM"
    window_title  = f"LPR — {mode_label.upper()}"

    print(f"\n{'='*50}")
    print(f"  {mode_label} SHURU HUA")
    print(f"  Band karne ke liye 'Q' dabao")
    print(f"{'='*50}\n")

    last_api_call = 0
    api_cooldown  = 3.0
    recent_plates = {}     # plate → (last_time, conf, db_id)
    activity_log  = []     # screen display ke liye

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        now = time.time()
        h, w = frame.shape[:2]

        # Mode label screen par
        cv2.rectangle(frame, (0, 0), (w, 50), (30, 30, 30), -1)
        cv2.putText(frame, mode_label,
                    (15, 35), cv2.FONT_HERSHEY_SIMPLEX,
                    1.0, color, 2)
        cv2.putText(frame, datetime.now().strftime('%H:%M:%S'),
                    (w - 120, 35), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, (200, 200, 200), 1)

        # Plate detection
        alpr_results = alpr.predict(frame)

        for result in alpr_results:
            bbox = result.detection.bounding_box
            x1   = int(bbox.x1)
            y1   = int(bbox.y1)
            x2   = int(bbox.x2)
            y2   = int(bbox.y2)
            try:
                alpr_text = result.ocr.text if result.ocr and result.ocr.text else ""
            except Exception:
                alpr_text = ""
            plate_crop = frame[max(0,y1):max(0,y2), max(0,x1):max(0,x2)]

            if plate_crop.size > 0 and now - last_api_call > api_cooldown:

                print(f"\n[{mode.upper()} CAM] Plate mila: '{alpr_text}'")
                final_text, final_conf, source = smart_ocr(plate_crop)
                last_api_call = now

                if final_text and final_conf >= threshold:

                    # Fuzzy Auto-Correction
                    is_duplicate = False
                    matched_plate = None
                    for recent_plate, data in list(recent_plates.items()):
                        last_time, old_conf, old_db_id = data
                        if now - last_time < 20: # 20 second cooldown
                            if Levenshtein.distance(final_text, recent_plate) <= 2:
                                is_duplicate = True
                                matched_plate = recent_plate
                                break

                    if is_duplicate:
                        old_time, old_conf, old_db_id = recent_plates[matched_plate]
                        if final_conf > old_conf:
                            # Self-Correct: Nayi read better hai! Database aur Screen update karo
                            if is_entry and old_db_id is not None:
                                try:
                                    requests.put(f"{conn['base_url']}/vehicle/{old_db_id}", json={"plateNumber": final_text}, timeout=5)
                                except Exception as e:
                                    print(f"  [Auto-Correct Error] API error: {e}")
                                print(f"  [Auto-Correct] 🔄 {matched_plate} -> {final_text} (Conf {old_conf:.2f} -> {final_conf:.2f})")
                                
                                for i, log_item in enumerate(activity_log):
                                    if matched_plate in log_item:
                                        activity_log[i] = log_item.replace(matched_plate, final_text)

                            elif not is_entry and old_db_id is None:
                                dur = record_exit(conn, final_text, source)
                                if dur is not None:
                                    hh = int(dur // 60)
                                    mm = int(dur % 60)
                                    dur_str = f"{hh}h {mm}m" if hh > 0 else f"{mm}m"
                                    activity_log.insert(0, f"OUT  {final_text}   {dur_str}")
                                    old_db_id = "exited" 

                            del recent_plates[matched_plate]
                            recent_plates[final_text] = (now, final_conf, old_db_id)
                        else:
                            recent_plates[matched_plate] = (now, old_conf, old_db_id)
                            
                    else:
                        db_id = None
                        if is_entry:
                            db_id = record_entry(conn, final_text, source)
                            if db_id:
                                activity_log.insert(0,
                                    f"IN   {final_text}   {datetime.now().strftime('%H:%M')}")
                        else:
                            dur = record_exit(conn, final_text, source)
                            if dur is not None:
                                hh = int(dur // 60)
                                mm = int(dur % 60)
                                dur_str = f"{hh}h {mm}m" if hh > 0 else f"{mm}m"
                                activity_log.insert(0,
                                    f"OUT  {final_text}   {dur_str}")
                                db_id = "exited"

                        recent_plates[final_text] = (now, final_conf, db_id)
                        if len(activity_log) > 7:
                            activity_log.pop()

                    # Memory Cleanup
                    recent_plates = {p: data for p, data in recent_plates.items() if now - data[0] < 40}

                    # Bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame,
                                f"{final_text}  ({final_conf:.0%})",
                                (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                else:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 165, 0), 2)
                    cv2.putText(frame, "Reading...",
                                (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)

            else:
                # Cooldown mein — sirf ALPR text
                if alpr_text:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (200, 200, 0), 1)
                    cv2.putText(frame, alpr_text,
                                (x1, y1 - 8),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 0), 1)

        # Activity log — neeche strip
        log_y = h - (len(activity_log) * 28 + 10)
        cv2.rectangle(frame, (0, log_y - 10), (350, h), (20, 20, 20), -1)
        for i, log in enumerate(activity_log):
            lc = (0, 255, 100) if log.startswith("IN") else (100, 100, 255)
            cv2.putText(frame, log,
                        (10, log_y + i * 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, lc, 1)

        cv2.imshow(window_title, frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\n  [{mode.upper()} CAM] Band ho gaya.\n")


# ============================================================
#  Main — Pehle Entry, phir Exit
# ============================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description="LPR — Entry phir Exit")
    parser.add_argument("--source",    default=0,
                        help="Camera index ya video file (default: 0)")
    parser.add_argument("--uri",       default="http://localhost:3000/api")
    parser.add_argument("--threshold", type=float, default=0.7)
    args = parser.parse_args()

    src = int(args.source) if str(args.source).isdigit() else args.source

    # Setup
    alpr = ALPR(
        detector_model="yolo-v9-t-384-license-plate-end2end",
        ocr_model="global-plates-mobile-vit-v2-model"
    )
    conn = init_db(args.uri)

    print("\n" + "="*50)
    print("  LPR SYSTEM — Sequential Mode")
    print("  Step 1: ENTRY camera chalega")
    print("  Step 2: Q dabao → EXIT camera khulega")
    print("="*50)

    # ── STEP 1: ENTRY ──
    print("\n  ▶ ENTRY CAMERA shuru ho raha hai...")
    run_camera("entry", conn, alpr,
               camera_source=src,
               threshold=args.threshold)

    # ── STEP 2: EXIT ──
    print("\n  ▶ EXIT CAMERA shuru ho raha hai...")
    run_camera("exit", conn, alpr,
               camera_source=src,
               threshold=args.threshold)

    # No active MongoClient to close because we using HTTP Node.js Backend now
    print("\n✅ Dono cameras complete. Data MongoDB mein saved!")


if __name__ == "__main__":
    main()
from ultralytics import YOLO
import cv2
import easyocr
import re
from collections import Counter

# Load YOLO models
car_model = YOLO("yolov8n.pt")
plate_model = YOLO("license_plate_detector.pt")

# OCR reader
reader = easyocr.Reader(['en'])

# Camera
camera_source = "http://10.166.7.113:8080/video"
cap = cv2.VideoCapture(camera_source)

# Variables
last_plate = None
plate_buffer = []
frame_count = 0

# Indian number plate pattern (STRICT)
plate_pattern = r"^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"

# OCR correction function
def fix_ocr_errors(text):

    mapping = {
        "O":"0",
        "Q":"0",
        "D":"0",
        "I":"1",
        "L":"1",
        "Z":"2",
        "S":"5",
        "B":"8"
    }

    corrected = ""

    for c in text:
        if c in mapping:
            corrected += mapping[c]
        else:
            corrected += c

    return corrected


while True:

    ret, frame = cap.read()
    if not ret:
        break

    # Frame skipping (reduce CPU load)
    frame_count += 1
    if frame_count % 3 != 0:
        cv2.imshow("Smart Parking Camera", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break
        continue

    # Detect cars
    car_results = car_model(frame, conf=0.1)

    for r in car_results:
        for box in r.boxes:

            cls = int(box.cls[0])
            label = car_model.names[cls]

            if label == "car":

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Draw car bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)

                # Crop car region
                car_img = frame[y1:y2, x1:x2]

                # Detect license plate inside car
                plate_results = plate_model(car_img, conf=0.4, verbose=False)

                for pr in plate_results:
                    for pbox in pr.boxes:

                        px1, py1, px2, py2 = map(int, pbox.xyxy[0])

                        plate_img = car_img[py1:py2, px1:px2]

                        if plate_img.size == 0:
                            continue

                        # Resize plate for better OCR
                        plate_img = cv2.resize(plate_img, None, fx=2, fy=2)

                        # Show plate crop
                        cv2.imshow("Plate Crop", plate_img)

                        # OCR read
                        results = reader.readtext(plate_img)

                        for res in results:

                            # OCR confidence filter
                            if res[2] < 0.65:
                                continue

                            plate_text = res[1]

                            # Clean OCR text
                            plate_text = plate_text.upper()

                            # Remove unwanted characters
                            plate_text = re.sub(r'[^A-Z0-9]', '', plate_text)

                            # Fix common OCR mistakes
                            plate_text = fix_ocr_errors(plate_text)

                            # Validate Indian plate format
                            if re.match(plate_pattern, plate_text):

                                plate_buffer.append(plate_text)

                                # Stabilize OCR with majority vote
                                if len(plate_buffer) >= 5:

                                    final_plate = Counter(plate_buffer).most_common(1)[0][0]

                                    if final_plate != last_plate:

                                        print("Confirmed Plate:", final_plate)

                                        last_plate = final_plate

                                        # Draw plate text on frame
                                        cv2.putText(frame,
                                                    final_plate,
                                                    (x1, y1-30),
                                                    cv2.FONT_HERSHEY_SIMPLEX,
                                                    0.9,
                                                    (0,255,0),
                                                    2)

                                    plate_buffer.clear()

                        break   # avoid multiple plate boxes

    # Show main camera
    cv2.imshow("Smart Parking Camera", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
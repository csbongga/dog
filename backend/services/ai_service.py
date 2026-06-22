from ultralytics import YOLO
import cv2
import numpy as np
import os

# Load model globally
model_path = "best.pt"
if os.path.exists(model_path):
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Warning: Could not load model. Error: {e}")
        model = None
else:
    print(f"Warning: Model file {model_path} not found.")
    model = None

def run_segmentation(image_path: str, output_path: str, pixel_spacing_x: float, pixel_spacing_y: float):
    """
    Runs YOLOv11 segmentation on the image, saves the result, 
    and calculates the area in cm^2.
    """
    if model is None:
        # Fallback if model isn't loaded
        return {"area_cm2": 0.0, "result_path": image_path}
        
    img = cv2.imread(image_path)
    
    # Run Inference with retina_masks=True for smooth high-resolution masks
    results = model(img, retina_masks=True)
    
    area_cm2 = 0.0
    
    for r in results:
        # Draw bounding boxes and masks on the image
        # Using boxes=False and labels=False to only show the segmentation mask
        img_with_boxes = r.plot(boxes=False, labels=False)
        cv2.imwrite(output_path, img_with_boxes)
        
        # Calculate area if masks exist
        if r.masks is not None:
            total_pixels = 0.0
            # r.masks.xy is a list of polygons (one for each detection) in original image coordinates
            for segment in r.masks.xy:
                contour = np.array(segment, dtype=np.float32)
                # Calculate the area of the polygon in original pixel units
                total_pixels += cv2.contourArea(contour)
            
            # Area in mm^2 = total_pixels * spacing_x * spacing_y
            area_mm2 = total_pixels * pixel_spacing_x * pixel_spacing_y
            
            # Convert to cm^2
            area_cm2 = area_mm2 / 100.0
            
    return {"area_cm2": round(area_cm2, 2), "result_path": output_path}

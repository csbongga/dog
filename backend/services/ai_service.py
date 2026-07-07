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
    img_out = img.copy()
    
    # Configuration for erosion (shrinkage)
    # Increase these to shrink the mask more, decrease to shrink less.
    EROSION_KERNEL_SIZE = 7
    EROSION_ITERATIONS = 4
    
    for r in results:
        # Calculate area if masks exist
        if r.masks is not None:
            # 1. Rasterize YOLO polygons into a single binary mask
            h, w = img.shape[:2]
            binary_mask = np.zeros((h, w), dtype=np.uint8)
            
            for segment in r.masks.xy:
                contour = np.array(segment, dtype=np.int32)
                cv2.fillPoly(binary_mask, [contour], 255)
                
            # 2. Erode the mask (shrink it)
            kernel = np.ones((EROSION_KERNEL_SIZE, EROSION_KERNEL_SIZE), np.uint8)
            eroded_mask = cv2.erode(binary_mask, kernel, iterations=EROSION_ITERATIONS)
            
            # 3. Calculate new area from the eroded mask
            contours, _ = cv2.findContours(eroded_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            total_pixels = 0.0
            for contour in contours:
                total_pixels += cv2.contourArea(contour)
            
            # Area in mm^2 = total_pixels * spacing_x * spacing_y
            area_mm2 = total_pixels * pixel_spacing_x * pixel_spacing_y
            
            # Convert to cm^2
            area_cm2 = area_mm2 / 100.0
            
            # 4. Draw the new eroded mask onto the image (Visual Overlay)
            color = (0, 0, 255) # Red (BGR)
            alpha = 0.4
            
            # Apply transparent fill
            mask_indices = eroded_mask == 255
            overlay = img_out.copy()
            overlay[mask_indices] = color
            cv2.addWeighted(overlay, alpha, img_out, 1 - alpha, 0, img_out)
            
            # Draw crisp contour boundaries on top
            cv2.drawContours(img_out, contours, -1, color, 2)
            
    # Save the final image (with or without masks)
    cv2.imwrite(output_path, img_out)
            
    return {"area_cm2": round(area_cm2, 2), "result_path": output_path}

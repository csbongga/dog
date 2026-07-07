from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import init_db, get_db
from models import AnalysisHistory
import os
import shutil
from datetime import datetime

import os
os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)

app = FastAPI(title="Heart Segmentation API")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/results", StaticFiles(directory="results"), name="results")

# Setup CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/preview")
async def preview_dicom(file: UploadFile = File(...)):
    preview_name = f"preview_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}.png"
    file_path = f"uploads/{preview_name}.dcm"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    from services.dicom_service import process_dicom
    png_path = f"uploads/{preview_name}"
    process_dicom(file_path, png_path, brightness=1.0, contrast=1.0)
    
    # Clean up the original uploaded dicom preview to save space
    if os.path.exists(file_path):
        os.remove(file_path)
    
    return {"preview_url": png_path}

@app.post("/upload")
async def upload_dicom(
    file: UploadFile = File(...), 
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
    custom_name: str = Form(None),
    db: Session = Depends(get_db)
):
    # Save uploaded file
    file_path = f"uploads/{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process DICOM
    original_img_path = f"uploads/{datetime.now().strftime('%Y%m%d%H%M%S')}_orig.png"
    result_img_path = f"results/{datetime.now().strftime('%Y%m%d%H%M%S')}_result.png"
    
    from services.dicom_service import process_dicom
    from services.ai_service import run_segmentation
    
    spacing = process_dicom(file_path, original_img_path, brightness, contrast)
    
    # Run AI Model
    ai_result = run_segmentation(
        original_img_path, 
        result_img_path, 
        spacing["pixel_spacing_x"], 
        spacing["pixel_spacing_y"]
    )
    area = ai_result["area_cm2"]

    # Save to database
    history = AnalysisHistory(
        file_name=file.filename,
        custom_name=custom_name,
        original_image_path=original_img_path,
        result_image_path=ai_result["result_path"],
        area_cm2=area
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    
    return {
        "id": history.id,
        "file_name": history.file_name,
        "custom_name": history.custom_name,
        "original_image_path": history.original_image_path,
        "result_image_path": history.result_image_path,
        "area_cm2": history.area_cm2,
        "timestamp": history.timestamp,
        "polygon_points": ai_result.get("polygon_points", []),
        "image_width": ai_result.get("image_width", 0),
        "image_height": ai_result.get("image_height", 0),
        "pixel_spacing_x": spacing["pixel_spacing_x"],
        "pixel_spacing_y": spacing["pixel_spacing_y"]
    }

from pydantic import BaseModel
from typing import List
import cv2
import numpy as np

class UpdateMaskRequest(BaseModel):
    history_id: int
    polygon_points: List[List[int]]
    pixel_spacing_x: float
    pixel_spacing_y: float

@app.post("/update_mask")
def update_mask(req: UpdateMaskRequest, db: Session = Depends(get_db)):
    item = db.query(AnalysisHistory).filter(AnalysisHistory.id == req.history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    original_img = cv2.imread(item.original_image_path)
    if original_img is None:
        raise HTTPException(status_code=500, detail="Original image not found")
        
    # Convert points to contour format
    contour = np.array(req.polygon_points, dtype=np.int32)
    
    # Calculate area
    total_pixels = cv2.contourArea(contour)
    area_mm2 = total_pixels * req.pixel_spacing_x * req.pixel_spacing_y
    area_cm2 = round(area_mm2 / 100.0, 2)
    
    # Redraw the mask on the image
    img_out = original_img.copy()
    color = (0, 0, 255)
    cv2.drawContours(img_out, [contour], -1, color, 2, cv2.LINE_AA)
    
    # Overwrite the result image
    cv2.imwrite(item.result_image_path, img_out)
    
    # Update DB
    item.area_cm2 = area_cm2
    db.commit()
    db.refresh(item)
    
    return {"area_cm2": area_cm2, "result_image_path": item.result_image_path}

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(AnalysisHistory).order_by(AnalysisHistory.timestamp.desc()).all()

@app.delete("/history/{item_id}")
def delete_history(item_id: int, db: Session = Depends(get_db)):
    item = db.query(AnalysisHistory).filter(AnalysisHistory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Delete files
    if os.path.exists(item.original_image_path):
        os.remove(item.original_image_path)
    if os.path.exists(item.result_image_path):
        os.remove(item.result_image_path)
        
    db.delete(item)
    db.commit()
    return {"message": "Deleted successfully"}

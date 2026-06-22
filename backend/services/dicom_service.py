import pydicom
import numpy as np
from PIL import Image

def process_dicom(dicom_path: str, output_image_path: str, brightness: float = 1.0, contrast: float = 1.0):
    """
    Reads a DICOM file, saves it as a PNG, and returns the pixel spacing.
    Pixel spacing is usually a list of two values: [row_spacing, col_spacing] in mm.
    """
    ds = pydicom.dcmread(dicom_path)
    
    # Extract Pixel Data
    pixel_array = ds.pixel_array
    
    # Normalize pixel data to 0-255
    image_2d = pixel_array.astype(float)
    if image_2d.max() > 0:
        image_2d_scaled = (np.maximum(image_2d, 0) / image_2d.max()) * 255.0
    else:
        image_2d_scaled = image_2d
        
    # Apply brightness (CSS style multiplier)
    image_2d_scaled = image_2d_scaled * brightness
    
    # Apply contrast (CSS style)
    image_2d_scaled = (image_2d_scaled - 128.0) * contrast + 128.0
    
    image_2d_scaled = np.clip(image_2d_scaled, 0, 255).astype(np.uint8)
    
    # Convert to PIL Image and save
    img = Image.fromarray(image_2d_scaled)
    img.save(output_image_path)
    
    # Extract Pixel Spacing (in mm)
    pixel_spacing = [1.0, 1.0] # Default
    if hasattr(ds, 'PixelSpacing'):
        pixel_spacing = ds.PixelSpacing
    elif hasattr(ds, 'ImagerPixelSpacing'):
        pixel_spacing = ds.ImagerPixelSpacing
        
    return {
        "pixel_spacing_x": float(pixel_spacing[1]), # column spacing
        "pixel_spacing_y": float(pixel_spacing[0]), # row spacing
    }

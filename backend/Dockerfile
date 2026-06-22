FROM python:3.10-slim

WORKDIR /app



COPY requirements.txt .

# Install system dependencies needed for OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Expose port 8080
EXPOSE 8080

# Run Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

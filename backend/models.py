from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    file_name = Column(String, index=True)
    custom_name = Column(String, nullable=True)
    original_image_path = Column(String)
    result_image_path = Column(String)
    area_cm2 = Column(Float)

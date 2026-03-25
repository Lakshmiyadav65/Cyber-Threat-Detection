"""
Database setup — SQLite via SQLAlchemy
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./cyberguard.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    model_used = Column(String(50))
    prediction = Column(String(20))          # "malware" or "benign"
    confidence = Column(Float)               # probability score
    input_features = Column(Text)            # JSON string of input
    lime_explanation = Column(Text, nullable=True)   # JSON
    shap_explanation = Column(Text, nullable=True)   # JSON
    scan_id = Column(String(36), unique=True, index=True)  # UUID


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

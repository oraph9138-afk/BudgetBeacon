from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)
    business_type = Column(String, nullable=False)
    material_cost = Column(Float)
    transport_cost = Column(Float)
    labor_cost = Column(Float)
    production_days = Column(Integer)
    quantity = Column(Integer)
    location = Column(String)
    predicted_cost = Column(Float)
    confidence_pct = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    business_name = Column(String)
    phone = Column(String)
    created_at = Column(DateTime)

    estimates = relationship("Estimate", back_populates="user")


class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
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

    user = relationship("User", back_populates="estimates")


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

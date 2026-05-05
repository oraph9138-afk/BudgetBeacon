import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./oraph.db")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

BUSINESS_TYPES = ["agriculture", "retail", "manufacturing", "transport", "services"]
LOCATIONS = ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Zanzibar", "Mbeya", "Other"]
RISK_THRESHOLDS = {"low": 75, "medium": 50}

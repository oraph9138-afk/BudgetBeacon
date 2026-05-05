from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import estimate, history, ussd

app = FastAPI(
    title="Oraph AI Cost Estimator",
    description="AI-powered business cost estimation with confidence scoring",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(estimate.router)
app.include_router(history.router)
app.include_router(ussd.router)


@app.get("/")
def root():
    return {"message": "Oraph AI Cost Estimator API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

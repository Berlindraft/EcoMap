from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.api import router as api_router

app = FastAPI(title="EcoMap Cebu API", version="1.0.0")

# CORS – allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "EcoMap Cebu API is running 🚀"}


@app.get("/health")
def health():
    return {"status": "ok"}
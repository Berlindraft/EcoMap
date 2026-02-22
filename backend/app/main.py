from fastapi import FastAPI

app = FastAPI(title="My FastAPI App")

@app.get("/")
def root():
    return {"message": "FastAPI is running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
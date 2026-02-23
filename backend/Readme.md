# FastAPI Project

A modular FastAPI project template with AI inference-ready structure, designed for fast development and easy scalability.

## Project Structure

      fastapi_project/
      ├── app/
      │ ├── main.py # FastAPI application entry point
      │ ├── routes/ # API route definitions
      │ ├── models/ # Data models and schemas
      │ ├── services/ # Business logic or AI inference code
      │ └── core/ # Configuration, constants, utils
      ├── venv/ # Virtual environment (ignored in Git)
      └── requirements.txt # Project dependencies

## Setup Instructions

1. **Clone the repository**:
   
       git clone <repository-url>
       cd <project_name>  

Create and activate virtual environment:

Windows (PowerShell):

    python -m venv venv
    venv\Scripts\Activate.ps1

Windows (CMD):

    python -m venv venv
    venv\Scripts\activate.bat

Linux / Mac:

    python3 -m venv venv
    source venv/bin/activate

Install dependencies:

    pip install -r requirements.txt
    
Running the Application:
Start the FastAPI server using Uvicorn:

    uvicorn app.main:app --reload

--reload → auto reloads server on code changes (development only)

Access the API at: http://127.0.0.1:8000
Swagger docs: http://127.0.0.1:8000/docs
ReDoc docs: http://127.0.0.1:8000/redoc

Instructions in adding New Routes:

Create a new file in app/routes/, e.g. user.py:

    from fastapi import APIRouter
    router = APIRouter()
    
    @router.get("/users")
    def get_users():
        return {"users": []}

Register the router in app/main.py:

    from fastapi import FastAPI
    from routes.user import router as user_router
    
    app = FastAPI()
    app.include_router(user_router, prefix="/api")

Test endpoint:

    http://127.0.0.1:8000/api/users

Additional Info:

Using Services / AI Inference
Place business logic or AI model inference code in app/services/.
Example: services/inference.py
Import into routes as needed.
Version Control Tips
Do NOT commit venv/ or .env files.
Use .gitignore:

    venv/
    __pycache__/
    *.pyc
    .env

Track dependencies in requirements.txt:

    pip freeze > requirements.txt

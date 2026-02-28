tunnel url
npx -y localtunnel --port 8000

backend
uvicorn app.main:app --reload --host 0.0.0.0

frontend
npx expo start --tunnel
npx expo start --tunnel --clear


frontend
npx expo start --tunnel
npx expo start --tunnel --clear

backend
uvicorn app.main:app --reload --host 0.0.0.0
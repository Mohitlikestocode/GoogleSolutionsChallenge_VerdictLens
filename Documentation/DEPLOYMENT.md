# Deployment Guide - VerdictLens

This guide outlines how to deploy the VerdictLens AI Fairness Auditor to a production environment for hackathon submission.

This guide covers how to deploy the **VerdictLens AI Fairness Auditor** to production environments.

## Option 1: Railway (Recommended)

Railway is excellent for deploying full-stack applications with multiple services.

### 1. Deploy the Backend
1.  **New Project**: Create a new project on [Railway](https://railway.app/).
2.  **GitHub Repo**: Connect your GitHub repository.
3.  **Root Directory**: In the service settings, set the **Root Directory** to `/backend`.
4.  **Start Command**: Set the custom start command to:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
    ```
5.  **Environment Variables**:
    -   `GROQ_API_KEY`: Your Groq API key.
    -   `GOOGLE_API_KEY`: Your Gemini API key.
    -   `GEMINI_MODEL`: `gemini-1.5-pro` (or flash).
    -   `GROQ_MODEL`: `llama-3.3-70b-versatile`.
6.  **Public URL**: Enable "Generate Domain" in the Settings tab. Copy this URL (e.g., `https://backend-production.up.railway.app`).

### 2. Deploy the Frontend
1.  **Add Service**: Add another service from the same GitHub repo.
2.  **Root Directory**: Keep it as the project root (`/`).
3.  **Environment Variables**:
    -   `VITE_BACKEND_URL`: The Public URL of your Backend service (from step 6 above).
4.  **Railway Detection**: Railway will automatically detect the Vite app and use `npm run build` and `npm run start` (or serve the `dist` folder).
5.  **Public URL**: Enable "Generate Domain" for the frontend service.

---

## Option 2: Google Cloud Run (Backend Only)
Since this is a Google Solutions Hackathon, using Google Cloud Run is highly recommended for the backend.

### Prerequisites
1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2. Create a Google Cloud Project.

### Steps
1. **Initialize Project**:
   ```bash
   gcloud init
   ```
2. **Build and Deploy**:
   From the root of the project:
   ```bash
   gcloud run deploy verdictlens-backend --source ./backend --region us-central1 --allow-unauthenticated
   ```
3. **Set Environment Variables**:
   In the Google Cloud Console (Cloud Run > Edit & Deploy New Revision), add:
   - `GROQ_API_KEY`: Your Groq API key
   - `GOOGLE_API_KEY`: Your Gemini API key
   - `GEMINI_MODEL`: `gemini-1.5-pro`

---

## 3. Frontend Deployment (Vercel)
Vercel is the easiest way to deploy the React frontend.

### Steps
1. Push your code to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. **Set Environment Variables**:
   - `VITE_BACKEND_URL`: The URL of your deployed Cloud Run backend (e.g., `https://verdictlens-backend-xyz.a.run.app`)
4. Deploy!

---

## 3. Environment Variables Summary
Ensure both `.env` (backend) and Vercel (frontend) have the correct keys:

| Variable | Location | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Backend | Required for Gemini Pro/Flash |
| `GROQ_API_KEY` | Backend | Required for Llama 3 models |
| `VITE_BACKEND_URL` | Frontend | URL of the running FastAPI server |

---

## Common Issues
- **CORS Errors**: The backend is already configured to allow `*` origins, but if you have issues, ensure your Vercel URL is added to the `cors_origins` list in `backend/main.py`.
- **WebSocket URL**: The frontend automatically detects the protocol (ws vs wss) based on the `VITE_BACKEND_URL`.

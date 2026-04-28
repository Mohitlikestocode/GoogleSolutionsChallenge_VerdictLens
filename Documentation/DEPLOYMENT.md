# Deployment Guide - VerdictLens

This guide outlines how to deploy the VerdictLens AI Fairness Auditor to a production environment for hackathon submission.

## Architecture
- **Frontend**: React/Vite (Deployed to **Vercel** or **Firebase Hosting**)
- **Backend**: FastAPI/Python (Deployed to **Google Cloud Run** or **Railway**)

---

## 1. Backend Deployment (Google Cloud Run) - RECOMMENDED
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

## 2. Frontend Deployment (Vercel)
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

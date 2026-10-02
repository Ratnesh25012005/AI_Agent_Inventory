# Local Development & Installation Setup

## 1. Prerequisites
- Python 3.10.x
- Conda (Miniconda / Anaconda)
- Node.js 18+ & npm

## 2. Environment Variables
Create `.env` in the root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_anon_key
SUPABASE_SECRET_KEY=your_secret_service_key
GEMINI_API_KEY=your_gemini_api_key
```

## 3. Backend Setup
```bash
# Create and activate conda env
conda create -n inventory-ai python=3.10.13 -y
conda activate inventory-ai

# Install dependencies
cd backend
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

## 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:8000/health
- API Docs: http://localhost:8000/docs

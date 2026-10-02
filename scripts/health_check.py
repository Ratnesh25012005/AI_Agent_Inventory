import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

try:
    from app.core.config import settings
    print(f"[OK] Settings loaded. Project: {settings.PROJECT_NAME}")
    print(f"[OK] Supabase URL configured: {settings.SUPABASE_URL.split('@')[-1]}")
    print(f"[OK] Gemini key loaded (length: {len(settings.GEMINI_API_KEY)})")
    
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.get("/health")
    print(f"[OK] GET /health returned status: {response.status_code}")
    print(f"[OK] Health response: {response.json()}")
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("\n>>> ALL SYSTEM CHECKS PASSED SUCCESSFULLY! <<<")
except Exception as e:
    print(f"[ERROR] Health check failed: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)

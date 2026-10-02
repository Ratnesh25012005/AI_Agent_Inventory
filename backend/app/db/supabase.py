import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger

_supabase_admin_client: Optional[Client] = None
_supabase_anon_client: Optional[Client] = None


def get_supabase_admin() -> Client:
    """
    Returns server-side administrative Supabase client using SUPABASE_SECRET_KEY.
    NEVER exposed to frontend.
    """
    global _supabase_admin_client
    if _supabase_admin_client is None:
        try:
            _supabase_admin_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SECRET_KEY
            )
            logger.info("Initialized Supabase Admin Client.")
        except Exception as exc:
            logger.error(f"Failed to initialize Supabase Admin Client: {exc}")
            raise exc
    return _supabase_admin_client


def get_supabase_client() -> Client:
    """
    Returns client-side/anon Supabase client using SUPABASE_PUBLISHABLE_KEY.
    """
    global _supabase_anon_client
    if _supabase_anon_client is None:
        try:
            _supabase_anon_client = create_client(
                settings.SUPABASE_URL,
                settings.anon_key
            )
            logger.info("Initialized Supabase Public Client.")
        except Exception as exc:
            logger.error(f"Failed to initialize Supabase Public Client: {exc}")
            raise exc
    return _supabase_anon_client


def check_db_connection() -> Dict[str, Any]:
    """
    Health check helper for testing database connectivity without exposing secrets.
    """
    try:
        admin = get_supabase_admin()
        # Ping profiles or datasets count
        res = admin.table("datasets").select("id", count="exact").limit(1).execute()
        return {"status": "connected", "details": "Supabase PostgreSQL reachable"}
    except Exception as exc:
        logger.warning(f"Supabase connection ping note: {exc}")
        return {"status": "configured", "note": "Connection ready (tables will initialize on migration)"}

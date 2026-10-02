import os
import duckdb
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd
from app.core.config import settings
from app.core.logging import logger


class DuckDBEngine:
    """
    High-performance analytical engine using DuckDB and PyArrow.
    Executes joins, aggregations, and feature transformations out-of-core
    without exhausting RAM.
    """

    def __init__(self, db_path: Optional[str] = None):
        if db_path:
            self.con = duckdb.connect(db_path)
        else:
            # Persistent per-dataset or disk-backed temp db
            self.con = duckdb.connect()

    def load_file_to_table(self, file_path: Path, table_name: str) -> int:
        """
        Loads CSV, Excel, or Parquet directly into a DuckDB table.
        Does not load the file into Python memory.
        """
        path_str = str(file_path).replace("\\", "/")
        ext = file_path.suffix.lower()

        if ext == ".csv":
            query = f"""
                CREATE OR REPLACE TABLE {table_name} AS 
                SELECT * FROM read_csv_auto('{path_str}', header=True, sample_size=20000);
            """
        elif ext in (".parquet", ".pq"):
            query = f"""
                CREATE OR REPLACE TABLE {table_name} AS 
                SELECT * FROM read_parquet('{path_str}');
            """
        elif ext in (".xlsx", ".xls"):
            # Excel files are read in chunks or via pandas and loaded into duckdb
            df = pd.read_excel(file_path)
            self.con.register("temp_excel_df", df)
            query = f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM temp_excel_df;"
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        self.con.execute(query)
        count_res = self.con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
        row_count = count_res[0] if count_res else 0
        logger.info(f"Loaded {row_count} rows from {file_path.name} into table '{table_name}'.")
        return row_count

    def get_columns(self, table_name: str) -> List[str]:
        res = self.con.execute(f"DESCRIBE {table_name}").fetchall()
        return [r[0] for r in res]

    def query_to_df(self, sql: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
        if params:
            return self.con.execute(sql, params).df()
        return self.con.execute(sql).df()

    def query_scalar(self, sql: str, params: Optional[List[Any]] = None) -> Any:
        res = self.con.execute(sql, params or []).fetchone()
        return res[0] if res else None

    def export_table_to_parquet(self, table_name: str, target_parquet_path: Path):
        target_parquet_path.parent.mkdir(parents=True, exist_ok=True)
        path_str = str(target_parquet_path).replace("\\", "/")
        self.con.execute(f"COPY {table_name} TO '{path_str}' (FORMAT PARQUET);")
        logger.info(f"Exported table '{table_name}' to Parquet at {target_parquet_path}.")

    def close(self):
        try:
            self.con.close()
        except Exception:
            pass


def get_dataset_engine(dataset_id: str) -> DuckDBEngine:
    """
    Returns a DuckDB connection isolated for the specific dataset.
    """
    db_dir = settings.DATA_PROCESSED_DIR / dataset_id
    db_dir.mkdir(parents=True, exist_ok=True)
    db_file = db_dir / "analytics.duckdb"
    return DuckDBEngine(str(db_file))

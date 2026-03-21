import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))


def get_connection():
    """Return a new psycopg2 connection using env variables."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "deponds_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def get_cursor(conn):
    """Return a RealDictCursor (rows accessible by column name)."""
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

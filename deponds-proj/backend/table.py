
from db import get_connection

conn = get_connection()
conn.autocommit = True
cursor = conn.cursor()

cursor.execute("ALTER TABLE deposit_status ADD COLUMN IF NOT EXISTS bank_details TEXT")

cursor.close()
conn.close()
print("✅ Migration complete.")

from db import get_connection


def create_tables():
    conn = get_connection()
    conn.autocommit = True
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id              SERIAL PRIMARY KEY,
            user_name       TEXT UNIQUE NOT NULL,
            password        BYTEA,
            ip              TEXT,
            country         TEXT,
            name            TEXT,
            email           TEXT UNIQUE,
            reffered_by     TEXT,
            profile_pic     TEXT,
            balance         NUMERIC DEFAULT 0,
            login_attempts  INTEGER DEFAULT 0,
            freeze_time     TIMESTAMP,
            created         TIMESTAMP DEFAULT NOW()
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id              SERIAL PRIMARY KEY,
            session_token   TEXT UNIQUE NOT NULL,
            user_name       TEXT REFERENCES clients(user_name),
            expires         TIMESTAMP,
            user_agents     TEXT,
            local_ip        TEXT,
            public_ip       TEXT,
            region          TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin (
            id              SERIAL PRIMARY KEY,
            user_name       TEXT UNIQUE NOT NULL,
            password        BYTEA,
            email           TEXT,
            login_attempts  INTEGER DEFAULT 0,
            freeze_time     TIMESTAMP,
            profile_pic     TEXT,
            name            TEXT,
            country         TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_sessions (
            id              SERIAL PRIMARY KEY,
            session_token   TEXT UNIQUE NOT NULL,
            user_name       TEXT REFERENCES admin(user_name),
            expires         TIMESTAMP,
            user_agents     TEXT,
            region          TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS withdrawals (
            id              SERIAL PRIMARY KEY,
            user_name       TEXT REFERENCES clients(user_name),
            date            TIMESTAMP,
            amount          NUMERIC,
            bank_details    TEXT,
            status          TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deposit_status (
            id              SERIAL PRIMARY KEY,
            user_name       TEXT REFERENCES clients(user_name),
            date            TIMESTAMP,
            balance_added   NUMERIC,
            bank_details    TEXT,
            status          TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS packages (
            id          SERIAL PRIMARY KEY,
            user_name   TEXT REFERENCES clients(user_name),
            plan        TEXT,
            status      TEXT,
            expires     TIMESTAMP,
            earned      NUMERIC DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification (
            id          SERIAL PRIMARY KEY,
            user_name   TEXT REFERENCES clients(user_name),
            message     TEXT,
            date        TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS refferals (
            id          SERIAL PRIMARY KEY,
            reffered_by   TEXT REFERENCES clients(user_name),
            name        TEXT,
            plan        TEXT,
            date        TIMESTAMP
        )
    """)


    cursor.close()
    conn.close()
    print("✅ All tables created successfully!")


if __name__ == "__main__":
    create_tables()

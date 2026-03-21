import bcrypt
import secrets
import os
import sys
import hashlib
import logging
import psycopg2
from .IP.ip import full_IP
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from db import get_connection, get_cursor

logging.basicConfig(level=logging.INFO)


class Admin_login_management():
    def __init__(self):
        self.connect = get_connection()
        self.current_session = None
        logging.info(" ✅ ADMIN LOGGING PORTAL INITIALIZED SUCCESSFULLY")

    def login(self, username, email, password):
        cursor = get_cursor(self.connect)
        cursor.execute("DELETE FROM admin_sessions WHERE expires < %s", (datetime.now(),))
        cursor.execute(
            "SELECT id, user_name, password, email, login_attempts, freeze_time "
            "FROM admin WHERE user_name=%s AND email=%s",
            (username, email)
        )
        user = cursor.fetchone()

        if not user:
            logging.info("⚠ A user attempting to login but failed.")
            self.connect.commit()
            return {
                "success": False,
                "message": " Invalid Credentials"
            }

        if user['freeze_time']:
            if datetime.now() < user['freeze_time']:
                self.connect.commit()
                return {
                    "success": False,
                    "message": "Invalid Credentials!"
                }

        if user['password'] and bcrypt.checkpw(password.encode(), bytes(user['password'])):
            cursor.execute(
                "UPDATE admin SET freeze_time=%s, login_attempts=%s WHERE id=%s",
                (None, 0, user['id'])
            )
            token = secrets.token_hex(32)
            session_token = hashlib.sha256(token.encode()).hexdigest()
            expires = datetime.now() + timedelta(minutes=20)
            user_agent = full_IP["DEVICE-NAME"]
            region = f"{full_IP['COUNTRY']}, {full_IP['REGION']}"
            cursor.execute(
                "INSERT INTO admin_sessions (session_token, user_name, expires, user_agents, region) "
                "VALUES(%s, %s, %s, %s, %s)",
                (session_token, user['user_name'], expires, user_agent, region)
            )
            self.connect.commit()
            logging.info(' ✅ Admin just logged in successfully')
            return {
                "success": True,
                "session_token": token,
                "user_agent": user_agent,
                "region": region
            }

        else:
            attempts = user['login_attempts'] + 1
            input_freeze = None
            if attempts >= 3:
                input_freeze = datetime.now() + timedelta(minutes=30)
            cursor.execute(
                "UPDATE admin SET freeze_time=%s, login_attempts=%s WHERE id=%s",
                (input_freeze, attempts, user['id'])
            )
            self.connect.commit()
            logging.info(" 😢 Admin account was locked")
            return {
                "success": False,
                "message": "Invalid Credentials"
            }

    def verify(self, token):
        cursor = get_cursor(self.connect)
        token = hashlib.sha256(token.encode()).hexdigest()
        cursor.execute(
            "SELECT user_name, user_agents, expires, session_token "
            "FROM admin_sessions WHERE session_token=%s AND expires > %s",
            (token, datetime.now())
        )
        user = cursor.fetchone()

        if not user:
            logging.info(" 🔴 A user attempted accessing his account but failed")
            return {
                "success": False,
                "message": "Wrong Credentials!"
            }

        if user['user_agents'] != full_IP['DEVICE-NAME']:
            logging.info(" ⚠ Security alert! Admin device was changed")
            return {
                "success": False,
                "message": "Security Alert: Device changed!"
            }

        logging.info("✅ User taking actions while active😁")
        return {
            "success": True,
            "user_name": user['user_name'],
            "session_token": user['session_token'],
            "expires": str(user['expires'])
        }

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


class login_management():

    def __init__(self):
        self.connect = get_connection()
        self.current_session = None
        logging.info(" ✅ LOGGING PORTAL INITIALIZED SUCCESSFULLY")

    def login(self, username, email, password):
        cursor = get_cursor(self.connect)
        cursor.execute("DELETE FROM sessions WHERE expires < %s", (datetime.now(),))

        cursor.execute(
            "SELECT id, user_name, password, email, login_attempts, freeze_time "
            "FROM clients WHERE user_name=%s OR email=%s",
            (username, email)
        )
        user = cursor.fetchone()

        if not user:
            logging.info("⚠ A user attempting to login but failed.")
            self.connect.commit()
            return {
                "success": False,
                "message": "Incorrect username/password"
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
                "UPDATE clients SET freeze_time=%s, login_attempts=%s WHERE id=%s",
                (None, 0, user['id'])
            )
            token = secrets.token_hex(32)
            session_token = hashlib.sha256(token.encode()).hexdigest()
            expires = datetime.now() + timedelta(hours=2)
            user_agent = full_IP["DEVICE-NAME"]
            local_ip = full_IP["LOCAL-IP"]
            public_ip = full_IP["PUBLIC-IP"]
            region = f"{full_IP['COUNTRY']}, {full_IP['REGION']}"
            cursor.execute(
                "INSERT INTO sessions (session_token, user_name, expires, user_agents, local_ip, public_ip, region) "
                "VALUES(%s, %s, %s, %s, %s, %s, %s)",
                (session_token, user['user_name'], expires, user_agent, local_ip, public_ip, region)
            )
            self.connect.commit()
            logging.info(' ✅ A user just logged in successfully')
            return {
                "success": True,
                "session_token": token,
                "user_agent": user_agent,
                "local_ip": local_ip,
                "public_ip": public_ip,
                "region": region
            }

        else:
            attempts = user['login_attempts'] + 1
            input_freeze = None
            if attempts >= 3:
                input_freeze = datetime.now() + timedelta(seconds=20)
            cursor.execute(
                "UPDATE clients SET freeze_time=%s, login_attempts=%s WHERE id=%s",
                (input_freeze, attempts, user['id'])
            )
            self.connect.commit()
            logging.info(" 😢 A user's account was locked")
            return {
                "success": False,
                "message": "Invalid Credentials"
            }

    def verify(self, token):
        cursor = get_cursor(self.connect)
        token = hashlib.sha256(token.encode()).hexdigest()
        cursor.execute(
            "SELECT user_name, user_agents, expires, local_ip, session_token "
            "FROM sessions WHERE session_token=%s AND expires > %s",
            (token, datetime.now())
        )
        user = cursor.fetchone()

        if not user:
            logging.info(" 🔴 A user attempted login but failed")
            return {
                "success": False,
                "message": "Wrong Credentials!"
            }

        if user['user_agents'] != full_IP['DEVICE-NAME']:
            logging.info(" ⚠ A user changed their device")
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

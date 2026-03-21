import os
import sys
import bcrypt
import socket
import json
import requests
import logging
import psycopg2

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from db import get_connection, get_cursor

logging.basicConfig(level=logging.INFO)


class reg():
    def __init__(self):
        self.connect = get_connection()
        logging.info(" ✅ REGISTRATION PORTAL INITIALIZED SUCCESSFULLY")

    def re_g(self, name, username, email, password, reffered_by):
        device_name = socket.gethostname()
        device_ip = socket.gethostbyname(device_name)
        response = requests.get("https://ipinfo.io/json").json()
        IP = json.dumps(response)
        country = response['country']
        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=14))

        try:
            cursor = get_cursor(self.connect)
            cursor.execute(
                "INSERT INTO clients (user_name, password, ip, country, name, email, reffered_by) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (username, hashed_password, IP, country, name, email, reffered_by)
            )
            self.connect.commit()
            return {
                "success": True,
                "message": "✅ Registration successful"
            }
        except psycopg2.IntegrityError:
            self.connect.rollback()
            return {
                "success": False,
                "message": "Username or email already used"
            }

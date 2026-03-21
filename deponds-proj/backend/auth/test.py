import os
import sqlite3
import time
import json
import bcrypt
import socket
import requests
from datetime import datetime, timedelta
db = os.path.dirname(os.path.abspath(__file__))
d_b = os.path.join(db, "..", "user.db")
connect = sqlite3.connect(d_b)
cursor = connect.cursor()

class reg():
    def __init__(self,):
        pass
    def re_g(self):
        name = input("enter name:")
        username = input("username:")
        email = input("email")
        password = input("password")
        device_name = socket.gethostname()
        device_ip = socket.gethostbyname(device_name)
        response = requests.get("https://ipinfo.io/json").json()
        IP = json.dumps(response)
        country = response['country']
        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=14))
        class My_Error(Exception):
            def __init__(self):
                self.username = username
                super().__init__(f"Username {username} already used")

        try: 
            cursor.execute ("INSERT INTO clients (user_name, password, IP, country, name, email) VALUES (?,?,?,?,?,?)",
            (username, hashed_password, IP, country, name, email)
            )
            connect.commit()
            return {
                "success": True,
                "message": "Registration successful"
                }
        except sqlite3.IntegrityError:
            return {
                "success": False,
                "message": "User name {username} already used"
            }
        user = cursor.fetchone()
        cursor.execute("SELECT email FROM clients WHERE id=?",(user['id']))
        if user['email']:
            return {
                "success": False,
                "message": "Email already used"
            }
        connect.close()
see = reg()
see.re_g()
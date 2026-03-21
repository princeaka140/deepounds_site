import os
import sys
import logging
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from db import get_connection, get_cursor

logging.basicConfig(level=logging.INFO)


class Gateway_Management():
    def __init__(self):
        self.connect = get_connection()
        logging.info(" ✅ PAYMENT_GATEWAY PORTAL INITIALIZED SUCCESSFULLY")

    def payment_check(self, access_login):
        self.identify = access_login["user_name"]
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT balance FROM clients WHERE user_name=%s", (self.identify,))
        cursor.fetchone()
        return {
            "Success": True,
            "user_name": self.identify
        }

    def gateway(self, username, balance_added, status):
        if balance_added is not None:
            balance = balance_added
            date = datetime.now()
            cursor = get_cursor(self.connect)
            cursor.execute(
                "INSERT INTO deposit_status(user_name, balance_added, date, status) VALUES(%s, %s, %s, %s)",
                (username, balance, date, status)
            )
            cursor.execute("SELECT balance FROM clients WHERE user_name=%s", (username,))
            cursor.execute(
                "UPDATE clients SET balance = balance + %s WHERE user_name=%s",
                (balance, username)
            )
            self.connect.commit()
            return {"success": True, "message": "Deposit successful"}
        return {"success": False, "message": "Deposit failed"}

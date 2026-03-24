import os
import sys
import bcrypt
import logging
import traceback
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from db import get_connection, get_cursor

logging.basicConfig(level=logging.INFO)


class user():
    def __init__(self):
        self.connect = get_connection()
        logging.info(" ✅ USER PORTAL INITIALIZED SUCCESSFULLY")

    def add_profile(self, img_url, access_login):
        identify = access_login["user_name"]
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT profile_pic, id FROM clients WHERE user_name=%s", (identify,))
        u = cursor.fetchone()

        if access_login['success']:
            cursor.execute("UPDATE clients SET profile_pic=%s WHERE id=%s", (img_url, u['id']))
        self.connect.commit()
        return {
            "success": True,
            "message": "Updated successfully"
        }

    def stats(self, access_login):
        cursor = get_cursor(self.connect)
        username = access_login["user_name"]
        if not access_login.get("session_token"):
            return {"message": "User not active"}

        cursor.execute(
            "SELECT name, user_name, email, created, profile_pic, country, balance "
            "FROM clients WHERE user_name=%s",
            (username,)
        )
        u = cursor.fetchone()
        cursor.execute(
            "SELECT user_agents, public_ip, local_ip, region FROM sessions WHERE user_name=%s",
            (username,)
        )
        session = cursor.fetchone()
        cursor.execute(
            "SELECT plan FROM packages WHERE user_name=%s AND status=%s",
            (username, 'active')
        )
        my_plans = cursor.fetchall()

        cursor.execute(
            "SELECT plan FROM packages WHERE user_name=%s AND plan IS NOT NULL",
            (username,)
        )
        count = [row for row in cursor.fetchall()]
        active_plans = len(count)

        return {
            "Name": u['name'],
            "User_agents": session['user_agents'],
            "balance": float(u['balance']),
            "username": u['user_name'],
            "EMAIL": u['email'],
            "my_plans":  my_plans,
            "active_plans": active_plans,
            "REGISTERED AT": str(u['created']),
            "PROFILE_PIC": u['profile_pic'],
        }

    def notification(self, access_login):
        if not access_login.get("success"):
            return "User not Active"
        username = access_login.get('user_name')
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT * FROM notification WHERE user_name=%s", (username,))
        messages = cursor.fetchall()
        return [dict(row) for row in messages]

    def logout(self, access_login):
        cursor = get_cursor(self.connect)
        token = access_login["session_token"]
        cursor.execute("DELETE FROM sessions WHERE session_token=%s", (token,))
        self.connect.commit()
        return {
            "success": True,
            "message": "Logged out successfully"
        }

    def checkpw(self, access_login):
        username = access_login["user_name"]
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT password FROM clients WHERE user_name=%s", (username,))
        u = cursor.fetchone()
        if u:
            return bytes(u["password"])
        return None

    def change_password(self, old_password, new_password, access_login):
        check_pw = self.checkpw(access_login)
        cursor = get_cursor(self.connect)
        if not access_login["success"]:
            return {"message": "User not active"}

        if check_pw and bcrypt.checkpw(old_password.encode(), check_pw):
            username = access_login["user_name"]
            hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
            cursor.execute(
                "UPDATE clients SET password=%s WHERE user_name=%s",
                (hashed_password, username)
            )
            self.connect.commit()
            return {
                "success": True,
                "message": "✅ Password changed successfully"
            }
        else:
            return {"success": False, "message": "❌ Wrong password"}

    def refferal_link(self, access_login):
        username = access_login.get('user_name')
        if not username:
            return "User not found"
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT * FROM refferals WHERE reffered_by=%s",(username,))
        my_ref = cursor.fetchall()
        return {
            "ref_link": f"http://127.0.0.1:8000/register?ref={username}",
            "records": my_ref
            }

    def deposit(self, amount, status, bank_details, access_login):
        username = access_login.get("user_name")
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT balance FROM clients WHERE user_name=%s", (username,))
        u = cursor.fetchone()
        if amount < 4000:
            return "Minimum deposit is 4000 naira"
        if not access_login['success']:
            return {"message": "User not active"}

        date = datetime.now()
        cursor.execute(
            "INSERT INTO deposit_status(user_name, date, balance_added, status, bank_details) "
            "VALUES(%s, %s, %s, %s, %s) RETURNING id",
            (username, date, amount, status, bank_details)
        )
        with_id = cursor.fetchone()['id']
        self.connect.commit()
        return {"username": username, "queu_id": with_id, "status": "deposit pending"}

    def withdraw(self, amount, status, bank_details, access_login):
        username = access_login.get("user_name")
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT balance FROM clients WHERE user_name=%s", (username,))
        u = cursor.fetchone()
        if amount > u["balance"]:
            return "Insufficient funds"
        if amount < 600:
            return "Minimum withdrawal is 600 naira"
        if not access_login['success']:
            return {"message": "User not active"}

        date = datetime.now()
        cursor.execute(
            "INSERT INTO withdrawals(user_name, date, amount, status, bank_details) "
            "VALUES(%s, %s, %s, %s, %s) RETURNING id",
            (username, date, amount, status, bank_details)
        )
        with_id = cursor.fetchone()['id']
        self.connect.commit()
        return {"username": username, "queu_id": with_id, "status": "payment pending"}

    def package(self, package, access_login):
        username = access_login.get("user_name")
        cursor = get_cursor(self.connect)
        cursor.execute(
            "SELECT user_name, balance, name, reffered_by FROM clients WHERE user_name=%s",
            (username,)
        )
        user = cursor.fetchone()

        reffered_by = user["reffered_by"]
    
        if not user:
            return "User not active"
        if not reffered_by:
            return "no upline found"

        expires = datetime.now() + timedelta(hours=24 * 60)
        now = datetime.now()

        plans = {
            "plan1": ("plan_1", 4000, 480, reffered_by),
            "plan2": ("plan_2", 6000, 720, reffered_by),
            "plan3": ("plan_3", 10000, 1200, reffered_by),
            "plan4": ("plan_4", 20000, 2400, reffered_by),
            "plan5": ("plan_5", 50000, 50000, reffered_by),
            "plan6": ("plan_6", 100000, 12000, reffered_by),
            "plan7": ("plan_7", 200000, 24000, reffered_by),
            "plan8": ("plan_8", 300000, 36000, reffered_by),
        }

        if package not in plans:
            return "insufficient funds"

        plan_name, cost, ref_bonus, ref_user = plans[package]

        message = f"🎉 congratulations! your downline {user['name']}  purchased {plan_name} and you received a bonus of #{ref_bonus}"

        if upline['balance'] < cost:
            return "insufficient funds"

        cursor.execute(
            "INSERT INTO packages(user_name, plan, status, expires, earned) VALUES(%s, %s, %s, %s, %s)",
            (username, plan_name, 'active', expires, 0)
        )
        cursor.execute(
            "INSERT INTO refferals(name, reffered_by, plan, date) VALUES(%s, %s, %s, %s)",
            (user['name'], reffered_by, plan_name, now)
        )
        cursor.execute(
            "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
            (reffered_by, message, now)
        )
        cursor.execute(
            "UPDATE clients SET balance = balance - %s WHERE user_name=%s",
            (cost, username)
        )
        if ref_bonus and ref_user:
            cursor.execute(
                "UPDATE clients SET balance = balance + %s WHERE user_name=%s",
                (ref_bonus, ref_user)
            )
        self.connect.commit()
        return f"{package} purchased successfully"

    def auto_update(self):
        logging.info(" ✅ STARTED AUTO UPDATE")
        cursor = get_cursor(self.connect)
        cursor.execute("SELECT id, plan, earned, expires, user_name FROM packages")
        package_all = cursor.fetchall()

        plan_income = {
            "plan_1": 450,
            "plan_2": 650,
            "plan_3": 850,
            "plan_4": 1850,
            "plan_5": 4250,
            "plan_6": 6500,
            "plan_7": 11500,
            "plan_8": 15500,
        }

        for package in package_all:
            try:
                if not package['plan']:
                    logging.info("No plans purchased yet")
                    continue

                date = package["expires"]
                if date is None:
                    continue

                now = datetime.now()

                if date < now:
                    cursor.execute(
                        "UPDATE packages SET status=%s WHERE expires < %s",
                        ('expired', now)
                    )
                    message = f"Your {package['plan']} plan has expired"
                    cursor.execute(
                        "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
                        (package['user_name'], message, now)
                    )
                    self.connect.commit()
                    continue

                income = plan_income.get(package["plan"])
                if income and date > now:
                    message = f"Income of #{income:,} arrived"
                    cursor.execute(
                        "UPDATE packages SET earned = earned + %s WHERE id=%s",
                        (income, package['id'])
                    )
                    cursor.execute(
                        "UPDATE clients SET balance = balance + %s WHERE user_name=%s",
                        (income, package["user_name"])
                    )
                    cursor.execute(
                        "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
                        (package["user_name"], message, now)
                    )
                    self.connect.commit()
                    logging.info(f" ✅ {package['plan']} income updated successfully")

            except Exception:
                traceback.print_exc()

import os
import sys
import bcrypt
import logging
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from db import get_connection, get_cursor

logging.basicConfig(level=logging.INFO)


class admin():
    def __init__(self):
        self.connect = get_connection()
        logging.info(" ✅ ADMIN PORTAL INITIALIZED SUCCESSFULLY")

    def add_profile(self, img_url, access_login):
        identify = access_login["user_name"]
        if not access_login["success"]:
            return {"success": False, "message": "User not active"}

        cursor = get_cursor(self.connect)
        cursor.execute("SELECT profile_pic, id FROM admin WHERE user_name=%s", (identify,))
        user = cursor.fetchone()

        if not user:
            return {"success": False, "message": "User not active"}

        cursor.execute("UPDATE admin SET profile_pic=%s WHERE id=%s", (img_url, user['id']))
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
            "SELECT name, user_name, email, profile_pic, country FROM admin WHERE user_name=%s",
            (username,)
        )
        user = cursor.fetchone()
        cursor.execute(
            "SELECT user_agents, region FROM admin_sessions WHERE user_name=%s",
            (username,)
        )
        session = cursor.fetchone()
        return {
            "Name": user['name'],
            "User_agents": session['user_agents'],
            "username": user['user_name'],
            "EMAIL": user['email'],
            "PROFILE_PIC": user['profile_pic'],
            "REGION": session['region'],
        }

    def logout(self, access_login):
        cursor = get_cursor(self.connect)
        token = access_login["session_token"]
        cursor.execute("DELETE FROM admin_sessions WHERE session_token=%s", (token,))
        self.connect.commit()
        return {
            "success": True,
            "message": "Logged out successfully"
        }

    def withdrawals_pending(self, access_login):
        if access_login.get("success"):
            cursor = get_cursor(self.connect)
            cursor.execute(
                "SELECT id, user_name, date, amount, bank_details, status FROM withdrawals WHERE status=%s",
                ("pending",)
            )
            return [dict(row) for row in cursor.fetchall()]

    def withdrawals_approved(self, access_login):
        if access_login.get("success"):
            cursor = get_cursor(self.connect)
            cursor.execute(
                "SELECT id, user_name, date, amount, bank_details, status FROM withdrawals WHERE status=%s",
                ("approved",)
            )
            return [dict(row) for row in cursor.fetchall()]

    def withdrawals_rejected(self, access_login):
        if access_login.get("success"):
            cursor = get_cursor(self.connect)
            cursor.execute(
                "SELECT id, user_name, date, amount, bank_details, status FROM withdrawals WHERE status=%s",
                ("rejected",)
            )
            return [dict(row) for row in cursor.fetchall()]

    def deposits_pending(self, access_login):
        if access_login.get("success"):
            cursor = get_cursor(self.connect)
            cursor.execute(
                "SELECT id, user_name, date, balance_added, bank_details, status FROM deposit_status WHERE status=%s",
                ("pending",)
            )
            return [dict(row) for row in cursor.fetchall()]

    def deposits_approved(self, access_login):
        if access_login.get("success"):
            cursor = get_cursor(self.connect)
            cursor.execute(
                "SELECT id, user_name, date, balance_added, bank_details, status FROM deposit_status WHERE status=%s",
                ("successful",)
            )
            return [dict(row) for row in cursor.fetchall()]

    def deposits_rejected(self, access_login):
        if access_login.get("success"):
            cursor = get_cursor(self.connect)
            cursor.execute(
                "SELECT id, user_name, date, balance_added, bank_details, status FROM deposit_status WHERE status=%s",
                ("failed",)
            )
            return [dict(row) for row in cursor.fetchall()]

    def withdrawals_approve_reject(self, username, action, id, access_login):
        if not access_login.get('success'):
            return "unauthorized"
        cursor = get_cursor(self.connect)
        time = datetime.now()

        cursor.execute(
            "SELECT status, user_name, amount FROM withdrawals WHERE user_name=%s AND status=%s",
            (username, "pending")
        )
        withdrawal = cursor.fetchone()
        if not withdrawal:
            return "withdrawal record not found"

        cursor.execute("SELECT balance FROM clients WHERE user_name=%s", (withdrawal['user_name'],))
        user = cursor.fetchone()
        if not user:
            return "user not found"

        if action == "approve":
            message = f"🎉 your withdrawal of {withdrawal['amount']} was successful"
            cursor.execute(
                "UPDATE withdrawals SET status=%s WHERE user_name=%s AND status=%s AND id=%s",
                ('approved', withdrawal['user_name'], 'pending', id)
            )
            cursor.execute(
                "UPDATE clients SET balance = balance - %s WHERE user_name=%s",
                (withdrawal['amount'], withdrawal['user_name'])
            )
            cursor.execute(
                "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
                (withdrawal['user_name'], message, time)
            )
            self.connect.commit()
            return f"you successfully approved {withdrawal['user_name']}'s withdrawal"

        elif action == "reject":
            message = f"😢 your withdrawal of {withdrawal['amount']} was rejected! Contact support for help"
            cursor.execute(
                "UPDATE withdrawals SET status=%s WHERE user_name=%s AND status=%s AND id=%s",
                ('rejected', withdrawal['user_name'], 'pending', id)
            )
            cursor.execute(
                "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
                (withdrawal['user_name'], message, time)
            )
            self.connect.commit()
            return f"you successfully rejected {withdrawal['user_name']}'s withdrawal"

    def deposit_approve_reject(self, username, action, id, access_login):
        if not access_login.get('success'):
            return "unauthorized"
        cursor = get_cursor(self.connect)

        cursor.execute(
            "SELECT status, user_name, balance_added FROM deposit_status WHERE user_name=%s AND status=%s",
            (username, "pending")
        )
        deposit = cursor.fetchone()
        if not deposit:
            return "deposit record not found"

        cursor.execute("SELECT balance FROM clients WHERE user_name=%s", (deposit['user_name'],))
        user = cursor.fetchone()
        if not user:
            return "user not found"

        if action == "approve":
            message = f"🎉 your deposit of {deposit['balance_added']} has landed"
            time = datetime.now()
            cursor.execute(
                "UPDATE deposit_status SET status=%s WHERE user_name=%s AND status=%s AND id=%s",
                ('successful', deposit['user_name'], 'pending', id)
            )
            cursor.execute(
                "UPDATE clients SET balance = balance + %s WHERE user_name=%s",
                (deposit['balance_added'], deposit['user_name'])
            )
            cursor.execute(
                "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
                (username, message, time)
            )
            self.connect.commit()
            return f"you successfully approved {deposit['user_name']}'s deposit"

        elif action == "reject":
            message = f"😢 your deposit of {deposit['balance_added']} was rejected contact customer service for help"
            time = datetime.now()
            cursor.execute(
                "UPDATE deposit_status SET status=%s WHERE user_name=%s AND status=%s AND id=%s",
                ('failed', deposit['user_name'], 'pending', id)
            )
            cursor.execute(
                "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
                (username, message, time)
            )
            self.connect.commit()
            return f"you successfully rejected {deposit['user_name']}'s deposit"

    def bonus(self, username, bonus_package, access_login):
        if not access_login.get('success'):
            return "User not active"
        cursor = get_cursor(self.connect)
        package = bonus_package
        expires = datetime.now() + timedelta(hours=24 * 60)
        time = datetime.now()
        message = f"🎉 Congratulations You were gifted {package} package"
        cursor.execute(
            "INSERT INTO packages(user_name, plan, status, expires, earned) VALUES(%s, %s, %s, %s, %s)",
            (username, package, 'active', expires, 0)
        )
        cursor.execute(
            "INSERT INTO notification(user_name, message, date) VALUES(%s, %s, %s)",
            (username, message, time)
        )
        self.connect.commit()
        return f"You just gifted {username} a {package} package"

    def system_stats(self, access_login):
        if not access_login.get('success'):
            return {"message": "User not active"}

        cursor = get_cursor(self.connect)

        cursor.execute("SELECT COUNT(DISTINCT user_name) as total FROM clients")
        users = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM withdrawals WHERE status=%s", ("approved",))
        approved_with = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM withdrawals WHERE status=%s", ("rejected",))
        rejected_with = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM withdrawals WHERE status=%s", ("pending",))
        pending_with = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM deposit_status WHERE status=%s", ("failed",))
        rejected_dep = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM deposit_status WHERE status=%s", ("pending",))
        pending_dep = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) as total FROM deposit_status WHERE status=%s", ("successful",))
        approved_dep = cursor.fetchone()['total']

        cursor.execute("SELECT * FROM notification")
        notification = [dict(row) for row in cursor.fetchall()]

        cursor.execute(
            "SELECT COALESCE(SUM(balance_added), 0) as total FROM deposit_status WHERE status=%s",
            ('successful',)
        )
        deposit_amount = cursor.fetchone()['total']

        cursor.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status=%s",
            ('approved',)
        )
        withdrawn_amount = cursor.fetchone()['total']

        cursor.execute(
            "SELECT COALESCE(SUM(earned), 0) as total FROM packages WHERE status=%s",
            ('active',)
        )
        users_income = cursor.fetchone()['total']

        total_funds_flown = withdrawn_amount + deposit_amount + users_income
        revenue = deposit_amount - withdrawn_amount - users_income
        current_revenue = deposit_amount - withdrawn_amount
        revenue_analysis = f"{0.01 * float(revenue)}%"
        current_revenue_analysis = f"{0.01 * float(current_revenue)}%"

        return {
            "total_users": users,
            "approved_withdrawals": approved_with,
            "rejected_withdrawals": rejected_with,
            "pending_withdrawals": pending_with,
            "approved_deposits": approved_dep,
            "rejected_deposits": rejected_dep,
            "pending_deposits": pending_dep,
            "deposited_funds": float(deposit_amount),
            "withdrawn_funds": float(withdrawn_amount),
            "users_income": float(users_income),
            "total_funds_flown": float(total_funds_flown),
            "current_revenue": float(current_revenue),
            "current_revenue_analysis": current_revenue_analysis,
            "total_revenue": float(revenue),
            "total_revenue_analysis": revenue_analysis,
            "notifications": notification,
        }

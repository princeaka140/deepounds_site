from fastapi import FastAPI, Request
import os
import sys
import logging
import httpx
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),  '..')))

from auth.login import login_management
from payment_Gateway.payment import Gateway_Management

logging.basicConfig(level=logging.INFO)

hook = FastAPI()

logging.info(" ✅ PAYMENT_GATEWAY ACTIVE")

access_gateway = Gateway_Management()
access_login = login_management()
@hook.get('/')
def home():
    return {"message": "Server active!"}
@hook.post("/payment_gateway")
async def deposit(request:Request):
    payment_url = "http://127.0.0.1:7000/"
    url = "http://127.0.0.1:8000/payment_Gateway"
    seed = request.cookies.get("session_token")
    
    async with httpx.AsyncClient() as clients:
        try:
            token = await clients.post(url, cookies={"session_token": seed})
            ok = token.json()
            username = ok.get('user_name')
        except:
            username = None

        if not username:
            return {"success": False, "message": "User not Active"}

        try:
            response = await clients.get(payment_url, timeout=5)
            data = response.json()
            balance = data.get("balance")
            status = data.get("status")
        except Exception as err:
            balance = None
            status = None
            logging.info("Payment unsuccessful", err)
        
        user = {
            "user_name": username,
            "balance": balance,
            "status": status
        }
        username = user['user_name']
        balance = user['balance']
        status = user['status']
        print("Payment successfull!")
        return access_gateway.gateway(username, balance, status)
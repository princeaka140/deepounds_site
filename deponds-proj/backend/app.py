import logging
import asyncio
from fastapi import FastAPI, Request
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from auth.registration import reg
from auth.login import login_management
from auth.admin_login import Admin_login_management
from Work.user import user
from Work.admin import admin
from payment_Gateway.payment import Gateway_Management
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
app = FastAPI()

origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class login_url(BaseModel):
    username: str
    email: str
    password: str
class reg_url(BaseModel):
    name: str
    username: str
    email: str
    password: str
class verify_url(BaseModel):
    token: str
class change_pw_url(BaseModel):
    new_password: str
    old_password: str
class add_profile_url(BaseModel):
    image: str
class withdraw_url(BaseModel):
    amount_filled: int
    bank_details: str
class deposit_url(BaseModel):
    amount_filled: int
    bank_details: str
class dep_login(BaseModel):
    username : str
    email: str
    password: str
class adm_profile_url(BaseModel):
    image: str
class approve_reject(BaseModel):
    username: str
    action: str
    id: int
class package(BaseModel):
    plan: str
class bonus_package(BaseModel):
    username: str
    plan: str
class update_plans_url(BaseModel):
    command: str
access_reg = reg()
access_user = user()
access_log = login_management()
access_gateway = Gateway_Management()
access_admin = Admin_login_management()
ad_dashboard = admin()

@app.post("/update_plans")
async def updater(data: update_plans_url):
    if data.command == "update_packages":
        access_user.auto_update()

@app.get('/')
async def home():
    logging.info("Active")
    return {"message": "SERVER ACTIVE"}

@app.post('/login')
def log_in(data: login_url):
    submit = access_log.login(data.username, data.email, data.password,)
    response = JSONResponse(content=submit)
    if submit.get('success'):
        token = submit.get('session_token')
        response.set_cookie(
            key = "session_token",
            value = token,
            httponly = True,
            secure = True,
            samesite = "Strict",
            max_age = 4000
        )
    return response

@app.post('/register')
def register(data: reg_url, ref: str = None):
    reffered_by = ref
    submit = access_reg.re_g(data.name, data.username, data.email, data.password, reffered_by)
    return submit

@app.post('/add_profile')
def add_profile_pic(data: add_profile_url, auth: Request):
    token = auth.cookies.get("session_token")
    if not token:
        logging.info("User not active!")
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access.get("success"):
        logging.info("Security risk! Unknown access")
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
   
    submit = access_user.add_profile(data.image, access)
    return submit

@app.post('/logout')
def log_out(auth: Request):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return access_user.logout(access)

@app.post('/stats')
def stats_check(auth: Request):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return access_user.stats(access)

@app.post('/change_pw')
def cha_nge_pw(data: change_pw_url, auth: Request):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    submit = access_user.change_password(data.old_password, data.new_password, access)
    return submit

@app.post('/package')
def stats_check(auth: Request, data: package):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return access_user.package(data.plan, access)

@app.post('/refferal_link')
def ref_link(auth: Request):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return access_user.refferal_link(access)

@app.post('/notification')
def notifyk(auth: Request):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_log.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return access_user.notification(access)

@app.post('/deposit')
def with_draw(auth: Request, deposit: deposit_url):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code= 401, detail="Security risk! Unknown access")
    access = access_log.verify(token)
    if not access.get("success"):
        raise HTTPException(status_code= 401, detail= "session expired")
    status = "pending"
    return access_user.deposit(deposit.amount_filled, status, deposit.bank_details, access)

@app.post('/withdrawal')
def with_draw(auth: Request, withdraw: withdraw_url):
    token = auth.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code= 401, detail="Security risk! Unknown access")
    access = access_log.verify(token)
    if not access.get("success"):
        raise HTTPException(status_code= 401, detail= "session expired")
    status = "pending"
    return access_user.withdraw(withdraw.amount_filled, status, withdraw.bank_details, access)

@app.post('/auth_dep_ad_log')
def auth_dep(auth: dep_login):
    submit = access_admin.login(auth.username, auth.email, auth.password,)
    response = JSONResponse(content=submit)
    if submit.get('success'):
        token = submit.get('session_token')
        response.set_cookie(
            key = "ad_token",
            value = token,
            httponly = True,
            secure = True,
            samesite = "Strict",
            max_age = 4000
        )
    return response

@app.post('/dep_add_profile')
def add_profile_pic(data: adm_profile_url, auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        logging.info("User not active!")
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access.get("success"):
        logging.info("Security risk! Unknown access")
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
   
    submit = ad_dashboard.add_profile(data.image, access)
    return submit

@app.post('/dep_logout')
def log_out(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.logout(access)

@app.post('/dep_with_pending')
def with_check(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.withdrawals_pending(access)

@app.post('/dep_with_approved')
def with_check(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.withdrawals_approved(access)

@app.post('/dep_with_rejected')
def with_check(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.withdrawals_rejected(access)

@app.post('/dep_system_stats')
def system_stats_check(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.system_stats(access)

@app.post('/dep_bonus_package')
def system_stats_check(auth: Request, pack: bonus_package):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.bonus(pack.username, pack.plan, access)


@app.post('/dep_approve_reject_with')
def actions(auth: Request, data: approve_reject):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.withdrawals_approve_reject(data.username, data.action, data.id, access)

@app.post('/dep_dep_pending')
def dep_pending(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.deposits_pending(access)

@app.post('/dep_dep_approved')
def dep_approved(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.deposits_approved(access)

@app.post('/dep_dep_rejected')
def dep_rejected(auth: Request):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.deposits_rejected(access)

@app.post('/dep_approve_reject_dep')
def actions(auth: Request, data: approve_reject):
    token = auth.cookies.get("ad_token")
    if not token:
        raise HTTPException(status_code=401, detail="User not active!")
    access = access_admin.verify(token)
    if not access["success"]:
        raise HTTPException(status_code=401, detail="Security risk! Unknown access")
    return ad_dashboard.deposit_approve_reject(data.username, data.action, data.id, access)

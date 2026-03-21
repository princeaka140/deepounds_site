from fastapi import FastAPI

test = FastAPI()

@test.get('/')
def tst():
    return {"balance": 100, "status": "Unsuccessful"}
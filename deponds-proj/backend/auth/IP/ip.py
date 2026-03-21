import socket
import requests
device_name = socket.gethostname()
device_ip = socket.gethostbyname(device_name)
response = requests.get("https://ipinfo.io/json").json()
full_IP = {
        "DEVICE-NAME": device_name,
        "LOCAL-IP": device_ip,
        "PUBLIC-IP": response['ip'],
        "CITY": response['city'],
        "REGION": response['region'],
        "COUNTRY": response['country'],
        "ORG": response['org'],
        "LOC": response['loc'],
        "TIMEZONE": response['timezone']
}

ll = f"{full_IP['LOCAL-IP']}, {full_IP['PUBLIC-IP']}"
print(ll)
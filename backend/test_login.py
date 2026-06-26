import urllib.request
import urllib.error
import json

url = 'http://localhost:8000/api/auth/login/'
data = json.dumps({'username': 'kartikpaver', 'password': 'admin123'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    result = f"SUCCESS: {response.status}\n{response.read().decode('utf-8')}"
except urllib.error.HTTPError as e:
    result = f"HTTP ERROR: {e.code}\n{e.read().decode('utf-8')}"
except Exception as e:
    result = f"ERROR: {str(e)}"

with open('test_result.txt', 'w') as f:
    f.write(result)

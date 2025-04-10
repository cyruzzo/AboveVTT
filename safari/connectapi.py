#remember: pip install pyjwt cryptography requests
import jwt
import time
import requests
import os
import sys
import base64
import subprocess
import pprint

env = dict([a.split("=",1) for a in open('env').read().strip().split('\n')])

def generate_token():
    private_key = base64.b64decode(os.environ.get('PRIVATE_KEY_BASE64')).decode('utf-8')
    payload = {
        "iss": env['APP_STORE_CONNECT_API_ISSUER_ID'],
        "iat": int(time.time()) - 20,  # Issued at
        "exp": int(time.time()) + 19*60,  # 19 min max
        "aud": "appstoreconnect-v1",
    }
    headers = {
        "alg": "ES256",
        "kid": env['APP_STORE_CONNECT_API_KEY_ID']
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
    return token

def app_connect(token, url, json=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get("data")
    else:
        raise Exception(f"Error fetching data: {response.status_code} - {response.text}")

# Fetch latest TestFlight version
def fetch_latest_testflight_version(token, app_id):
    builds = app_connect(token,
                      f"https://api.appstoreconnect.apple.com/v1/builds?filter[app]={app_id}&sort=-version") or []
    if builds:
        latest_build = builds[0]  # First item is the latest version
        version = latest_build["attributes"]["version"]
        return int(version)
    return 1

def get_build_id(token, app_id, platform): # IOS/MAC_OS
    ret = app_connect(token, f"https://api.appstoreconnect.apple.com/v1/builds?filter[app]={app_id}&filter[preReleaseVersion.platform]={platform}&sort=-uploadedDate&limit=1")
    return ret[0].get('id'), ret[0].get('attributes').get('processingState')

def get_beta_groups(token, app_id):
    ret = app_connect(token, f"https://api.appstoreconnect.apple.com/v1/betaGroups?filter[app]={app_id}")
    ret = [x.get('id') for x in ret if not x.get('attributes').get('isInternalGroup')]
    return ret

def find_app(token, bundle):
    apps = app_connect(token,
                       f"https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]={bundle}")
    if apps:
        return apps[0]['id']
    raise Exception("No app found")

def get_build_detail(token, build):
    ret = app_connect(token,
                      f"https://api.appstoreconnect.apple.com/v1/builds/{build}?include=buildBetaDetail,betaAppReviewSubmission")
    detail = app_connect(token, ret.get('relationships').get('buildBetaDetail').get('links').get('related'))
    return detail.get('attributes')

def add_to_beta_group(token, group, build):
    url = f"https://api.appstoreconnect.apple.com/v1/betaGroups/{group}/relationships/builds"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    body = {
        "data": [
            {
                "type": "builds",
                "id": build
            }
        ]
    }    
    response = requests.post(url, headers=headers, json=body)
    if response.status_code in (200, 204):
        return True
    else:
        raise Exception(f"Error fetching data: {response.status_code} - {response.text}")

def add_to_beta_group_with_retry(token, group, build, retries=10):
    while retries > 0:
        try:
            return add_to_beta_group(token, group, build)
        except Exception as e:
            retries -= 1
            if not "Build is not assignable." in str(e): raise
        print("Failed ot add; retry in a few minutes...")
        time.sleep(60*3) # wait minutes
    raise Exception("too many retries")

def check_release(token,build):
    # unfortunately this could theoretically take a great deal of time (hours? days?)
    # at Apple... how long can our workflow jobs run?
    detail = get_build_detail(token, ios_build_id)
    pprint.pprint(detail)
    xstate = detail.get("externalBuildState")
    return xstate in ("READY_FOR_BETA_SUBMISSION",)

# Run the script
if __name__ == "__main__":
    token = generate_token()
    app_id = find_app(token, env["BUNDLE_ID"])
    current_version = fetch_latest_testflight_version(token,app_id)
    if sys.argv[1] == 'nextversion':
        #NOTE: if this does not work - we will need to move to VERSION in the Config.xcconfig file instead
        result = subprocess.run(["agvtool", "new-version", "-all", str(current_version + 1)], capture_output=True, text=True)
        print(result.stdout)
    elif sys.argv[1] == 'releasetotest':
        beta_groups = get_beta_groups(token, app_id)
        while 1:
            ios_build_id, valid = get_build_id(token, app_id, 'IOS')
            if valid != "VALID" or not check_release(token, ios_build_id):
                print("Waiting for IOS valid and external release validity")
                time.sleep(10)
                continue
            mac_build_id, valid = get_build_id(token, app_id, 'MAC_OS')
            if valid != "VALID" or not check_release(token, mac_build_id):
                print("Waiting for MAC valid and external release validity")
                time.sleep(10)
                continue            
            break
        for grp in beta_groups:
            print(f"Adding {ios_build_id} to {grp}")
            add_to_beta_group_with_retry(token, grp, ios_build_id)
            print(f"Adding {mac_build_id} to {grp}")
            add_to_beta_group_with_retry(token, grp, mac_build_id)
    else:
        raise Exception("no command")    


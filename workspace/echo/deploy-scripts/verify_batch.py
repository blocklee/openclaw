import json, urllib.request, time

contracts = [
    {"name": "AgentReputation", "address": "0x62c3DC9947FD2f566E62C55d815847B9d5747624", "args": ""},
    {"name": "GovernanceDAO", "address": "0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7", "args": ""},
    {"name": "AgentJury", "address": "0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D", "args": ""},
    {"name": "CreatorConfig", "address": "0x63016360C0A68Fad0529B85a320c94117994c56a", "args": ""},
    {"name": "PotentialEngine", "address": "0x6D1fc73342b32ea5E830E26C18b44Ea7422578eb", "args": ""},
    {"name": "ExitGasPool", "address": "0xd15c68d980B3Acce0121e52d0D55C73A79e2F3F2", "args": ""},
    {"name": "EmergencyIntervention", "address": "0xc402F9FF6591265A8A5f7Ac79577AC713a7Af94C", "args": ""},
    {"name": "LicenseNFT", "address": "0x34980A52885F78F75840F36AA6Cd6F06a8FEBA28", "args": "000000000000000000000000d8b299b5d236bcc251531531267fb4c433bd2245"},
]

compiler_version = "v0.8.20+commit.a1b79de6"
license_type = "3"  # MIT

print("=" * 60)
print("ECHO v0.4 Contract Verification - Blockscout API")
print("=" * 60)

for c in contracts:
    name = c["name"]
    address = c["address"]
    args = c["args"]

    # Read flattened source
    flat_file = f"/tmp/{name}_flat.sol"
    try:
        with open(flat_file) as f:
            source = f.read()
    except Exception as e:
        print(f"❌ {name}: Failed to read {flat_file}: {e}")
        continue

    payload = {
        "compiler_version": compiler_version,
        "source_code": source,
        "is_optimization_enabled": True,
        "optimization_runs": 200,
        "evm_version": "shanghai",
        "constructor_args": args,
        "autodetect_constructor_args": True if not args else False,
        "license_type": license_type,
    }

    data = json.dumps(payload).encode()
    url = f"https://qng.qitmeer.io/api/v2/smart-contracts/{address}/verification/via/flattened-code"
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            print(f"✅ {name}: {result.get('message', 'OK')}")
    except urllib.error.HTTPError as e:
        err = json.loads(e.read().decode()) if e.headers.get('content-type', '').startswith('application/json') else str(e)
        print(f"❌ {name}: HTTP {e.code} - {err}")
    except Exception as e:
        print(f"❌ {name}: {e}")

    # Small delay between requests
    time.sleep(2)

print("=" * 60)
print("All verification requests submitted.")
print("Check results at: https://qng.qitmeer.io/")

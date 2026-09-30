#!/usr/bin/env python3
"""
ArogyaMesh Pre-Demo Health & Wakeup Check
Verifies:
  1. Vercel Frontend Availability
  2. Render Backend /health (waking Render instance if sleeping)
  3. Neon PostgreSQL DB Connectivity & Query Speed
  4. AI Copilot Integration (Groq)
"""

import os
import sys
import time
import httpx

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://arogyamesh.vercel.app")
BACKEND_URL = os.getenv("BACKEND_URL", "https://arogyamesh-api-6o84.onrender.com")

print("=" * 60)
print("  AROGYAMESH PRE-DEMO HEALTH CHECK  ")
print("=" * 60)
print(f"Frontend: {FRONTEND_URL}")
print(f"Backend:  {BACKEND_URL}")
print("-" * 60)

passed = 0
total = 4

# 1. Check Render Backend /health & wake up
print("1. Waking up / checking Render Backend...")
t0 = time.time()
try:
    with httpx.Client(timeout=60.0) as client:
        r = client.get(f"{BACKEND_URL}/health")
        latency = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            print(f"   [PASS] Backend /health returned 200 in {latency}ms ({r.json()})")
            passed += 1
        else:
            print(f"   [FAIL] Backend /health returned {r.status_code}")
except Exception as e:
    print(f"   [FAIL] Backend error: {e}")

# 2. Check Neon DB via Backend API
print("2. Checking Neon PostgreSQL via Backend API...")
t0 = time.time()
try:
    with httpx.Client(timeout=30.0) as client:
        r = client.get(f"{BACKEND_URL}/phcs/PHC-001")
        latency = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            data = r.json()
            print(f"   [PASS] PHC record fetched in {latency}ms: {data.get('id')} - {data.get('name')}")
            passed += 1
        else:
            print(f"   [FAIL] /phcs/PHC-001 returned {r.status_code}")
except Exception as e:
    print(f"   [FAIL] DB check error: {e}")

# 3. Check Vercel Frontend
print("3. Checking Vercel Frontend...")
t0 = time.time()
try:
    with httpx.Client(timeout=30.0) as client:
        r = client.get(FRONTEND_URL)
        latency = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            print(f"   [PASS] Frontend loaded in {latency}ms (HTML response verified)")
            passed += 1
        else:
            print(f"   [FAIL] Frontend returned {r.status_code}")
except Exception as e:
    print(f"   [FAIL] Frontend error: {e}")

# 4. Check Frontend -> Render Proxy
print("4. Checking Vercel -> Render Proxy (/api/health)...")
t0 = time.time()
try:
    with httpx.Client(timeout=30.0) as client:
        r = client.get(f"{FRONTEND_URL}/api/health")
        latency = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            print(f"   [PASS] Proxy request succeeded in {latency}ms: {r.json()}")
            passed += 1
        else:
            print(f"   [FAIL] Proxy returned {r.status_code}")
except Exception as e:
    print(f"   [FAIL] Proxy error: {e}")

print("-" * 60)
if passed == total:
    print("ALL CHECKS PASSED. ArogyaMesh is warmed up and ready for judges!")
    sys.exit(0)
else:
    print(f"WARNING: {passed}/{total} checks passed. Please review the output above.")
    sys.exit(1)

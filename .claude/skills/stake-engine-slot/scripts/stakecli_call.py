#!/usr/bin/env python3
"""Call one tool on the community stakecli MCP server (github.com/mnemoo/cli) and print its JSON result.

    stakecli_call.py <tool> '<json args>' [timeout_seconds]

Auth comes from the macOS keychain entry stakecli's own login screen created; this script never sees or
passes the SID. Read-only: auth_status, list_teams, list_games, get_game, get_conversation,
validate_upload_path, plan_upload. Changes the platform: execute_upload, publish (confirm=true).
"""
import json
import os
import subprocess
import sys
import threading

tool, args = sys.argv[1], json.loads(sys.argv[2])
timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 600
env = dict(os.environ, STAKE_NO_UPDATE_CHECK="1")
p = subprocess.Popen(["stakecli", "mcp"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                     stderr=subprocess.DEVNULL, text=True, env=env)


def send(msg):
    p.stdin.write(json.dumps(msg) + "\n")
    p.stdin.flush()


send({"jsonrpc": "2.0", "id": 1, "method": "initialize",
      "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "stakecli_call", "version": "1"}}})
send({"jsonrpc": "2.0", "method": "notifications/initialized"})
send({"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": tool, "arguments": args}})
threading.Timer(timeout, p.kill).start()
code = 1
for line in p.stdout:
    try:
        msg = json.loads(line)
    except ValueError:
        continue
    if msg.get("id") == 2:
        result = msg.get("result") or {"error": msg.get("error")}
        print(json.dumps(result.get("structuredContent") or result, ensure_ascii=False, indent=1), flush=True)
        code = 0 if "result" in msg and not result.get("isError") else 1
        break
p.kill()
os._exit(code)  # the timer thread would otherwise keep the process alive

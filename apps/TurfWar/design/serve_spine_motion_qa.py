"""Local QA page and its explicit image-export endpoint. Never part of a build."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re, json

APP = Path(__file__).resolve().parent.parent
ROOT = APP.parents[2]
OUTPUT = APP / 'design/rebuild_20261023/qa'
OUTPUT.mkdir(parents=True, exist_ok=True)

class Handler(SimpleHTTPRequestHandler):
    def do_PUT(self):
        name = self.path.removeprefix('/capture/')
        if not self.path.startswith('/capture/') or not re.fullmatch(r'[a-zA-Z0-9_-]+\.(?:png|json)', name):
            self.send_error(400)
            return
        length = int(self.headers.get('Content-Length', '0'))
        if not 0 < length < 50000000:
            self.send_error(413)
            return
        data = self.rfile.read(length)
        if name.endswith('.json'):
            json.loads(data)
        elif not data.startswith(b'\x89PNG\r\n\x1a\n'):
            self.send_error(400)
            return
        (OUTPUT / name).write_bytes(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'saved')

class QAServer(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True

if __name__ == '__main__':
    QAServer(('127.0.0.1', 8318), partial(Handler, directory=str(ROOT / 'dist/turf-spine-motion'))).serve_forever()

"""Local-only sink for frames from the Spine viewer's Run motion QA button."""
import base64
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

OUT=Path(__file__).resolve().parents[1]/'source/spine_v2/qa'
OUT.mkdir(parents=True,exist_ok=True)

class Sink(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204);self.headers_();self.end_headers()
    def headers_(self):
        origin=self.headers.get('Origin','')
        if origin in ['http://127.0.0.1:4217','http://127.0.0.1:4197']:
            self.send_header('Access-Control-Allow-Origin',origin)
        self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
    def do_POST(self):
        d=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        name=Path(d['name']).name
        if 'report' in d:(OUT/name).write_text(json.dumps(d['report'],indent=2)+'\n')
        else:(OUT/name).write_bytes(base64.b64decode(d['data'].split(',',1)[1]))
        self.send_response(204);self.headers_();self.end_headers()
    def log_message(self,*args):pass

if __name__=='__main__':ThreadingHTTPServer(('127.0.0.1',4242),Sink).serve_forever()

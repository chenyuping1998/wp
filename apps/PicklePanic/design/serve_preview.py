"""Serve the offline style preview locally without dropping parallel asset loads."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewServer(ThreadingHTTPServer):
    # Pixi preloads 173 assets together; the default queue of 5 can drop requests.
    request_queue_size = 256


if __name__ == "__main__":
    preview = Path(__file__).resolve().parents[4] / "dist" / "picklepanic-playtest"
    handler = partial(SimpleHTTPRequestHandler, directory=str(preview))
    print("Pickle Panic offline preview: http://localhost:4197", flush=True)
    PreviewServer(("127.0.0.1", 4197), handler).serve_forever()

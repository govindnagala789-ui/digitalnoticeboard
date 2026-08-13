import http.server
import socketserver
import socket
import os

PORT = 8080

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == "__main__":
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    local_ip = get_local_ip()
    print("============================================================")
    print("CAMPUSCONNECT COLLEGE DIGITAL NOTICE BOARD SERVER")
    print("============================================================")
    print(f"Local Computer URL:   http://localhost:{PORT}")
    print(f"Mobile Chrome URL:    http://{local_ip}:{PORT}")
    print("============================================================")
    
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

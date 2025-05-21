import webview
import os
from flask import Flask, send_from_directory
import threading
import random # For a random port

# --- Flask App Setup to Serve Static Files ---
# The 'tutorai_app' subfolder contains your UI
static_dir = os.path.join(os.path.dirname(__file__), 'tutorai')
app = Flask(__name__, static_folder=static_dir, static_url_path='')

@app.route('/')
def index():
    """Serves the main index.html file."""
    return send_from_directory(static_dir, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serves other static files like CSS, JS, JSON, images."""
    return send_from_directory(static_dir, filename)

def run_flask_app(host='127.0.0.1', port=None):
    """Runs the Flask app in a separate thread."""
    if port is None:
        port = random.randint(49152, 65535) # Get a random free port
    print(f"Flask server starting on http://{host}:{port}")
    try:
        app.run(host=host, port=port, debug=False) # Set debug=False for production
    except OSError as e:
        if e.errno == 98: # Address already in use
            print(f"Port {port} is already in use. Trying another one...")
            run_flask_app(host=host, port=random.randint(49152, 65535))
        else:
            raise
    return port


# --- pywebview Window Creation ---
class Api:
    """
    Optional: You can define Python functions here that can be called from JavaScript.
    Example:
    def my_python_function(self, param):
        print(f"Called from JS with: {param}")
        return f"Hello from Python, {param}!"
    """
    pass


if __name__ == '__main__':
    flask_port = random.randint(49152, 65535) # Choose a random port

    # Start Flask in a separate thread
    # Use a daemon thread so it automatically exits when the main pywebview app exits
    flask_thread = threading.Thread(target=run_flask_app, args=('127.0.0.1', flask_port), daemon=True)
    flask_thread.start()

    print(f"Waiting for Flask server to start on port {flask_port}...")
    # A small delay to ensure Flask starts before pywebview tries to load the URL
    # You might need a more robust check in a production app
    import time
    time.sleep(1) # Adjust if needed

    api_instance = Api() # If you have Python functions to expose

    # Create the pywebview window
    # It will load its content from the Flask server
    window_url = f'http://127.0.0.1:{flask_port}/'
    print(f"Creating pywebview window with URL: {window_url}")

    webview.create_window(
        'TUTORAI Chat',      # Window title
        window_url,          # URL to load (our Flask server)
        js_api=api_instance, # Expose Python functions to JavaScript (optional)
        width=1000,          # Initial window width
        height=760,          # Initial window height
        resizable=True,
        # frameless=False,   # Set to True for a window without standard frame
        # easy_drag=True     # If frameless, allows dragging by clicking anywhere
    )

    # Start the pywebview event loop (and Flask in its thread)
    webview.start(debug=True) # Set debug=True for pywebview's own debugging features during development
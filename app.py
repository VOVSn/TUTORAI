import webview
import os
from flask import Flask, send_from_directory
import threading
import random # For a random port

# --- Flask App Setup to Serve Static Files ---
# The 'tutorai' subfolder contains your UI (corrected from 'tutorai_app')
static_dir = os.path.join(os.path.dirname(__file__), 'tutorai') # Corrected path
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
    actual_port = port
    if actual_port is None:
        actual_port = random.randint(49152, 65535) # Get a random free port
    
    is_running = False
    while not is_running:
        try:
            print(f"Attempting to start Flask server on http://{host}:{actual_port}")
            app.run(host=host, port=actual_port, debug=False) # Set debug=False for production
            is_running = True # Should not be reached if app.run is blocking
        except OSError as e:
            if e.errno == 98: # Address already in use
                print(f"Port {actual_port} is already in use. Trying another one...")
                actual_port = random.randint(49152, 65535)
            else:
                print(f"An unexpected OSError occurred: {e}")
                raise # Re-raise other OS errors
        except Exception as e:
            print(f"An unexpected error occurred while starting Flask: {e}")
            raise # Re-raise other exceptions
    # This part of the function (returning port) will not be reached if app.run() is blocking
    # and successful. The port is passed to the thread.
    # The function is run in a thread, so it doesn't need to return the port to the main thread here.


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
    # A more robust check might involve trying to connect to the port.
    import time
    time.sleep(2) # Increased sleep slightly, adjust if needed

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
        resizable=True,      # Window is resizable
        # min_size=(600, 400), # Optional: Set a minimum size if desired
        # frameless=False,   # Set to True for a window without standard frame
        # easy_drag=True     # If frameless, allows dragging by clicking anywhere
    )

    # Start the pywebview event loop (and Flask in its thread)
    # 1. Changed debug to False for pywebview's own devtools
    webview.start(debug=False)
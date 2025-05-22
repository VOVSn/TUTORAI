import webview
import os
import json
import threading
import random # For a random port
from flask import Flask, send_from_directory, jsonify # jsonify for potential API responses

# --- Flask App Setup to Serve Static Files ---
# The 'tutorai' subfolder contains your UI
static_dir_name = 'tutorai'
base_dir = os.path.dirname(__file__)
static_dir_path = os.path.join(base_dir, static_dir_name)

app = Flask(__name__, static_folder=static_dir_path, static_url_path='')

@app.route('/')
def index():
    """Serves the main index.html file."""
    return send_from_directory(static_dir_path, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serves other static files like CSS, JS, JSON, images."""
    return send_from_directory(static_dir_path, filename)

def run_flask_app(host='127.0.0.1', port=None):
    """Runs the Flask app in a separate thread."""
    actual_port = port
    if actual_port is None:
        actual_port = random.randint(49152, 65535)

    is_running = False
    while not is_running:
        try:
            print(f"Attempting to start Flask server on http://{host}:{actual_port}")
            app.run(host=host, port=actual_port, debug=False)
            is_running = True
        except OSError as e:
            if e.errno == 98: # Address already in use
                print(f"Port {actual_port} is already in use. Trying another one...")
                actual_port = random.randint(49152, 65535)
            else:
                print(f"An unexpected OSError occurred: {e}")
                raise
        except Exception as e:
            print(f"An unexpected error occurred while starting Flask: {e}")
            raise

# --- pywebview Window Creation ---
class Api:
    """
    API class for JavaScript to interact with Python backend for file operations.
    All file operations are relative to the 'tutorai' static directory.
    """
    def __init__(self, storage_path):
        self.storage_path = storage_path
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path, exist_ok=True)
        print(f"API initialized. Storage path for data files: {self.storage_path}")

    def _get_full_path(self, filename):
        # Ensure filename is just a name, not a path traversal attempt
        if '..' in filename or filename.startswith('/') or filename.startswith('\\'):
            raise ValueError("Invalid filename. Must not contain path traversal elements.")
        return os.path.join(self.storage_path, filename)

    def load_json_data(self, filename):
        """Loads JSON data from a file. Returns None if file not found or error."""
        filepath = self._get_full_path(filename)
        print(f"API: Attempting to load JSON from: {filepath}")
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f"API: Successfully loaded data from {filename}.")
                    return data
            else:
                print(f"API: File not found: {filename}. Returning None.")
                return None
        except json.JSONDecodeError as e:
            print(f"API Error: Could not decode JSON from {filename}: {e}. Returning None.")
            return None # Or raise an error that JS can catch
        except Exception as e:
            print(f"API Error: Could not load data from {filename}: {e}. Returning None.")
            return None # Or raise an error

    def save_json_data(self, filename, data):
        """Saves Python dictionary/list as JSON data to a file."""
        filepath = self._get_full_path(filename)
        print(f"API: Attempting to save JSON to: {filepath}")
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4) # indent for readability
            print(f"API: Successfully saved data to {filename}.")
            return {"success": True, "message": f"Data saved to {filename}"}
        except Exception as e:
            print(f"API Error: Could not save data to {filename}: {e}")
            return {"success": False, "message": str(e)}

    def delete_data(self, filename):
        """Deletes a file."""
        filepath = self._get_full_path(filename)
        print(f"API: Attempting to delete file: {filepath}")
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"API: Successfully deleted {filename}.")
                return {"success": True, "message": f"File {filename} deleted."}
            else:
                print(f"API: File not found for deletion: {filename}.")
                return {"success": False, "message": f"File {filename} not found."}
        except Exception as e:
            print(f"API Error: Could not delete {filename}: {e}")
            return {"success": False, "message": str(e)}

    # Example of a simple function callable from JS
    def greet(self, name):
        return f"Hello, {name}, from Python!"


if __name__ == '__main__':
    flask_port = random.randint(49152, 65535)

    flask_thread = threading.Thread(target=run_flask_app, args=('127.0.0.1', flask_port), daemon=True)
    flask_thread.start()

    print(f"Waiting for Flask server to start on port {flask_port}...")
    import time
    time.sleep(2)

    # The API will save files inside the 'tutorai' folder (static_dir_path)
    api_instance = Api(storage_path=static_dir_path)

    window_url = f'http://127.0.0.1:{flask_port}/'
    print(f"Creating pywebview window with URL: {window_url}")

    webview.create_window(
        'TUTORAI Chat',
        window_url,
        js_api=api_instance, # Make Python 'Api' class methods callable from JavaScript
        width=1000,
        height=760,
        resizable=True,
    )
    webview.start(debug=False) # Set debug=True for pywebview's dev tools if needed
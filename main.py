import os
import sys
import json
import socket
import time
import threading

# Import webview early to parallelize loading with the Node server port boot
try:
    import webview
except ImportError:
    webview = None

PORT = 8083

# ---------------------------------------------------------------------------
# Persistent storage
# Saves to questlog-data.json next to main.py.
# The Python-side closing handler acts as a safety net: even if the JS
# beforeunload / async save_data promise is abandoned when the window closes,
# we still flush _last_data to disk.
# ---------------------------------------------------------------------------
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "questlog-data.json")

EMPTY_JSON = '{"projects":[],"issues":[]}'


class StorageAPI:
    def __init__(self):
        self._last_data: str = EMPTY_JSON
        self._lock = threading.Lock()
        self._window = None
        self._dirty = False
        # Safety flag: block empty saves until we've confirmed non-empty data
        # exists this session. Prevents startup race conditions from wiping data.
        self._has_saved_nonempty: bool = False

    def set_window(self, window):
        self._window = window

    def close_app(self):
        """Close the pywebview window to leave the app."""
        if self._window:
            self._window.destroy()

    def spawn_notepad_widget(self):
        """Spawns a separate window for the mini notepad widget."""
        if hasattr(self, '_widget_window') and self._widget_window:
            return
        
        if not webview:
            print("[QuestLog] Error: 'webview' package is not available.")
            return

        widget_url = f"http://localhost:{PORT}?widget=true&desktop=true"
        self._widget_window = webview.create_window(
            "QuestLog Notepad",
            widget_url,
            js_api=self,
            width=340,
            height=280,
            frameless=True,
            on_top=True,
            background_color="#0a0a0f",
        )
        
        if sys.platform == "win32":
            def set_widget_icon():
                try:
                    import clr
                    clr.AddReference("System.Drawing")
                    from System.Drawing import Icon
                    icon_path = os.path.join(
                        os.path.dirname(os.path.abspath(__file__)),
                        "Gemini_Generated_Image_i5xvtni5xvtni5xv.ico",
                    )
                    if os.path.exists(icon_path):
                        self._widget_window.native.Icon = Icon(icon_path)
                except Exception as ex:
                    print("[QuestLog] Failed to set widget window icon:", ex)
            self._widget_window.events.before_show += set_widget_icon
            
        def on_widget_closing():
            self._widget_window = None
            
        self._widget_window.events.closing += on_widget_closing

    def close_notepad_widget(self):
        """Close the notepad widget window if it is open."""
        if hasattr(self, '_widget_window') and self._widget_window:
            try:
                self._widget_window.destroy()
            except Exception:
                pass
            self._widget_window = None

    def load_data(self) -> str:
        """Return the JSON string stored on disk, or empty state."""
        try:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        with self._lock:
                            self._last_data = content
                        # Mark that real data exists — allows future non-empty saves
                        # and unblocks the flush guard once user actually interacts.
                        # (Do NOT set _has_saved_nonempty here; that only unlocks
                        #  after the first real save_data call with non-empty data.)
                        return content
        except Exception as e:
            print("[QuestLog] StorageAPI.load_data error:", e)
        return EMPTY_JSON

    def save_data(self, data: str) -> bool:
        """Write the JSON string to disk and keep an in-memory copy."""
        try:
            parsed = json.loads(data)
            is_empty = not parsed.get("projects") and not parsed.get("issues")

            # Safety net: if no non-empty save has occurred yet this session,
            # reject empty saves. This blocks the startup race condition where
            # the JS front-end fires saveToDisk(EMPTY) before it has loaded
            # real data via the pywebview bridge.
            if is_empty and not self._has_saved_nonempty:
                print("[QuestLog] Blocked empty save_data (no non-empty save yet this session).")
                return True  # Lie to the client so it doesn't retry

            if not is_empty:
                self._has_saved_nonempty = True

        except Exception as e:
            print("[QuestLog] save_data parse error:", e)

        try:
            with self._lock:
                self._last_data = data
                self._dirty = True
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                f.write(data)
            return True
        except Exception as e:
            print("[QuestLog] StorageAPI.save_data error:", e)
            return False

    def flush(self):
        """Emergency flush — called from the Python closing handler."""
        try:
            with self._lock:
                data = self._last_data
                dirty = self._dirty
            if dirty:
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    f.write(data)
                print("[QuestLog] Emergency flush written to disk.")
        except Exception as e:
            print("[QuestLog] StorageAPI.flush error:", e)


def wait_for_port(port, timeout=15):
    """Wait for the local server port to become active."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(("localhost", port), timeout=0.5):
                return True
        except (socket.timeout, ConnectionRefusedError):
            time.sleep(0.05)
    return False


if __name__ == "__main__":
    # Write PID to file for process tracking
    pid_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.pid")
    try:
        with open(pid_file, "w") as f:
            f.write(str(os.getpid()))
    except Exception:
        pass

    # Windows taskbar icon grouping fix
    if sys.platform == "win32":
        try:
            import ctypes
            myappid = "google.questlog.desktop.v1"
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
        except Exception as e:
            print("[QuestLog] Failed to set AppUserModelID:", e)

    url = f"http://localhost:{PORT}/?desktop=true"

    if not wait_for_port(PORT):
        print(f"[QuestLog] Error: Dev server on port {PORT} did not start in time.")
        sys.exit(1)

    if not webview:
        print("[QuestLog] Error: 'webview' package is not installed. Run 'pip install pywebview'.")
        sys.exit(1)

    try:
        api = StorageAPI()

        window = webview.create_window(
            "QuestLog",
            url,
            js_api=api,
            width=1280,
            height=800,
            background_color="#0a0a0f",
            fullscreen=True,
        )

        api.set_window(window)

        # ------------------------------------------------------------------
        # Safety-net: flush data to disk when the window is about to close.
        # This catches the case where the JS async promise was abandoned.
        # ------------------------------------------------------------------
        def on_closing():
            print("[QuestLog] Window closing — running safety-net flush.")
            api.flush()

        window.events.closing += on_closing

        # ------------------------------------------------------------------
        # Custom taskbar / Alt+Tab icon
        # ------------------------------------------------------------------
        def set_custom_icon(*args):
            if sys.platform == "win32":
                try:
                    import clr
                    import ctypes
                    clr.AddReference("System.Drawing")
                    from System.Drawing import Icon

                    icon_path = os.path.join(
                        os.path.dirname(os.path.abspath(__file__)),
                        "Gemini_Generated_Image_i5xvtni5xvtni5xv.ico",
                    )
                    if os.path.exists(icon_path):
                        window.native.Icon = Icon(icon_path)
                        hwnd = int(window.native.Handle.ToInt64())
                        WM_SETICON = 0x0080
                        IMAGE_ICON = 1
                        LR_LOADFROMFILE = 0x00000010
                        user32 = ctypes.windll.user32
                        h_icon = user32.LoadImageW(
                            None, icon_path, IMAGE_ICON, 0, 0, LR_LOADFROMFILE
                        )
                        if h_icon:
                            user32.SendMessageW(hwnd, WM_SETICON, 0, h_icon)  # ICON_SMALL
                            user32.SendMessageW(hwnd, WM_SETICON, 1, h_icon)  # ICON_BIG
                except Exception as ex:
                    print("[QuestLog] Failed to set custom window icon:", ex)

        window.events.before_show += set_custom_icon

        webview.start()

    except Exception as e:
        print(f"[QuestLog] Could not launch window: {e}")
    finally:
        # Always clean up PID file
        try:
            if os.path.exists(pid_file):
                os.remove(pid_file)
        except Exception:
            pass

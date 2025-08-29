import platform
import subprocess
import os
import pyautogui
from typing import Dict, Any, Optional
import time

class SystemController:
    def __init__(self):
        self.os_type = platform.system()
        self.platform_info = platform.platform()
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        return {
            'os': self.os_type,
            'platform': self.platform_info,
            'python_version': platform.python_version(),
            'machine': platform.machine(),
            'processor': platform.processor()
        }
    
    def open_application(self, app_name: str) -> Dict[str, Any]:
        """Open system applications"""
        app_commands = {
            'Windows': {
                'calculator': 'calc.exe',
                'notepad': 'notepad.exe',
                'cmd': 'cmd.exe',
                'powershell': 'powershell.exe',
                'explorer': 'explorer.exe',
                'chrome': 'chrome.exe',
                'firefox': 'firefox.exe',
                'edge': 'msedge.exe'
            },
            'Darwin': {  # macOS
                'calculator': 'Calculator',
                'textedit': 'TextEdit',
                'terminal': 'Terminal',
                'finder': 'Finder',
                'safari': 'Safari',
                'chrome': 'Google Chrome',
                'firefox': 'Firefox'
            },
            'Linux': {
                'calculator': 'gnome-calculator',
                'gedit': 'gedit',
                'terminal': 'gnome-terminal',
                'nautilus': 'nautilus',
                'firefox': 'firefox',
                'chrome': 'google-chrome'
            }
        }
        
        try:
            commands = app_commands.get(self.os_type, {})
            command = commands.get(app_name.lower())
            
            if not command:
                return {
                    'success': False,
                    'message': f"Application '{app_name}' not found for {self.os_type}",
                    'available_apps': list(commands.keys())
                }
            
            if self.os_type == 'Windows':
                subprocess.Popen(command, shell=True)
            elif self.os_type == 'Darwin':
                subprocess.Popen(['open', '-a', command])
            else:  # Linux
                subprocess.Popen([command])
            
            return {
                'success': True,
                'message': f"Opened {app_name}",
                'command': command
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Failed to open {app_name}: {str(e)}"
            }
    
    def control_volume(self, action: str, level: Optional[int] = None) -> Dict[str, Any]:
        """Control system volume"""
        try:
            if self.os_type == 'Windows':
                if action == 'up':
                    subprocess.run(['nircmd.exe', 'changesysvolume', '2000'], check=True)
                elif action == 'down':
                    subprocess.run(['nircmd.exe', 'changesysvolume', '-2000'], check=True)
                elif action == 'mute':
                    subprocess.run(['nircmd.exe', 'mutesysvolume', '1'], check=True)
                elif action == 'unmute':
                    subprocess.run(['nircmd.exe', 'mutesysvolume', '0'], check=True)
                elif action == 'set' and level is not None:
                    volume = int(level * 655.35)  # Convert percentage to Windows volume
                    subprocess.run(['nircmd.exe', 'setsysvolume', str(volume)], check=True)
            
            elif self.os_type == 'Darwin':
                if action == 'up':
                    subprocess.run(['osascript', '-e', 'set volume output volume (output volume of (get volume settings) + 10)'], check=True)
                elif action == 'down':
                    subprocess.run(['osascript', '-e', 'set volume output volume (output volume of (get volume settings) - 10)'], check=True)
                elif action == 'mute':
                    subprocess.run(['osascript', '-e', 'set volume with output muted'], check=True)
                elif action == 'unmute':
                    subprocess.run(['osascript', '-e', 'set volume without output muted'], check=True)
                elif action == 'set' and level is not None:
                    subprocess.run(['osascript', '-e', f'set volume output volume {level}'], check=True)
            
            elif self.os_type == 'Linux':
                if action == 'up':
                    subprocess.run(['amixer', 'sset', 'Master', '5%+'], check=True)
                elif action == 'down':
                    subprocess.run(['amixer', 'sset', 'Master', '5%-'], check=True)
                elif action == 'mute':
                    subprocess.run(['amixer', 'sset', 'Master', 'mute'], check=True)
                elif action == 'unmute':
                    subprocess.run(['amixer', 'sset', 'Master', 'unmute'], check=True)
                elif action == 'set' and level is not None:
                    subprocess.run(['amixer', 'sset', 'Master', f'{level}%'], check=True)
            
            return {
                'success': True,
                'message': f"Volume {action} completed",
                'action': action,
                'level': level
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Volume control failed: {str(e)}"
            }
    
    def take_screenshot(self, filename: Optional[str] = None) -> Dict[str, Any]:
        """Take a screenshot"""
        try:
            if not filename:
                filename = f"screenshot_{int(time.time())}.png"
            
            screenshot = pyautogui.screenshot()
            screenshot.save(filename)
            
            return {
                'success': True,
                'message': "Screenshot taken successfully",
                'filename': filename,
                'size': screenshot.size
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Screenshot failed: {str(e)}"
            }
    
    def simulate_keystrokes(self, text: str, interval: float = 0.1) -> Dict[str, Any]:
        """Simulate keyboard input"""
        try:
            pyautogui.write(text, interval=interval)
            
            return {
                'success': True,
                'message': f"Typed: {text}",
                'length': len(text)
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Keystroke simulation failed: {str(e)}"
            }
    
    def get_active_window(self) -> Dict[str, Any]:
        """Get information about the active window"""
        try:
            if self.os_type == 'Windows':
                import win32gui
                hwnd = win32gui.GetForegroundWindow()
                window_title = win32gui.GetWindowText(hwnd)
                return {
                    'success': True,
                    'title': window_title,
                    'handle': hwnd
                }
            else:
                return {
                    'success': False,
                    'message': "Active window detection not implemented for this OS"
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f"Failed to get active window: {str(e)}"
            }

# Usage example
if __name__ == "__main__":
    controller = SystemController()
    
    print("System Info:", controller.get_system_info())
    print("Opening Calculator:", controller.open_application('calculator'))
    print("Taking Screenshot:", controller.take_screenshot())

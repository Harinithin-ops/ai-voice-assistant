from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import subprocess
import os
import platform
import webbrowser
from typing import Optional, Dict, Any
import requests
from bs4 import BeautifulSoup
import pyautogui
import json
import google.generativeai as genai
from dotenv import load_dotenv
from command_processor import AdvancedCommandProcessor
from web_scraper import AdvancedWebScraper, ScrapedContent
from ai_features import AIFeaturesManager

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Voice Assistant Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class CommandRequest(BaseModel):
    command: str
    use_gemini: Optional[bool] = False
    confidence: Optional[float] = 0.0
    recognition_method: Optional[str] = "web-api"
    context: Optional[Dict[str, Any]] = None

class CommandResponse(BaseModel):
    response: str
    action_taken: str
    success: bool
    data: Optional[Dict[Any, Any]] = None
    intent: Optional[Dict[str, Any]] = None

class ConversationRequest(BaseModel):
    user_id: str
    command: str
    response: str
    context: Optional[Dict[str, Any]] = None

class VoiceAssistant:
    def __init__(self):
        self.system_info = {
            "os": platform.system(),
            "platform": platform.platform(),
        }
        self.command_processor = AdvancedCommandProcessor()
        self.web_scraper = AdvancedWebScraper()
        self.ai_features = AIFeaturesManager()
        self.app_registry = self._load_app_registry()
        
    async def process_command(self, command: str, use_gemini: bool = False, context: Optional[Dict] = None) -> CommandResponse:
        """Main command processing logic with advanced NLP and AI features"""
        try:
            user_id = context.get('user_id', 'default_user') if context else 'default_user'
            contextual_info = await self.ai_features.get_contextual_response(user_id, command)
            
            enhanced_context = {**(context or {}), **contextual_info}
            
            result = await self.command_processor.process_command(command, enhanced_context)
            
            if 'ai features' in command.lower() or 'smart suggestions' in command.lower():
                suggestions = await self.ai_features.generate_proactive_suggestions(user_id)
                result['response'] = f"Here are some AI-powered suggestions based on your usage: {', '.join([s['title'] for s in suggestions[:3]])}"
                result['data'] = {'suggestions': suggestions}
            
            elif 'usage patterns' in command.lower() or 'analytics' in command.lower():
                analytics = await self.ai_features.analyze_usage_patterns(user_id)
                result['response'] = f"Your usage analytics: {analytics['usage_stats']['total_commands']} total commands, most used feature is {analytics['usage_stats']['most_used_feature']}"
                result['data'] = analytics
            
            elif 'smart home' in command.lower():
                smart_home_result = await self.ai_features.smart_home_integration(command)
                if smart_home_result['category']:
                    result['response'] = smart_home_result['message']
                    result['data'] = smart_home_result
            
            if result['success']:
                executed_result = await self._execute_action(result)
                result.update(executed_result)
            
            if (result.get('intent', {}).get('category') == 'ai_query' and 
                use_gemini and GEMINI_API_KEY):
                gemini_result = await self._gemini_query(command)
                if gemini_result['success']:
                    result['response'] = gemini_result['response']
            elif result.get('intent', {}).get('category') == 'information':
                scraping_result = await self._handle_information_with_scraping(result)
                if scraping_result:
                    result.update(scraping_result)
            # Fallback: for general AI queries without Gemini, try web scraping to provide helpful info
            elif result.get('intent', {}).get('category') == 'ai_query' and not use_gemini:
                try:
                    query_text = result.get('data', {}).get('query') or command
                    async with self.web_scraper as scraper:
                        search_results = await scraper.intelligent_search_and_scrape(query_text)
                        if search_results:
                            formatted_response = scraper.format_results_for_voice(search_results)
                            result['response'] = formatted_response
                            # Preserve original action but attach scraped data
                            existing_data = result.get('data') or {}
                            result['data'] = {**existing_data, 'search_results': search_results}
                except Exception as e:
                    # Non-fatal; keep original AI response
                    result.setdefault('warnings', []).append(f"scrape_fallback_failed: {e}")
            
            return CommandResponse(**result)
            
        except Exception as e:
            return CommandResponse(
                response=f"Sorry, I encountered an error: {str(e)}",
                action_taken="error",
                success=False
            )
    
    async def _execute_action(self, processed_result: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the actual system actions based on processed intent"""
        action = processed_result.get('action_taken', '')
        data = processed_result.get('data', {})
        
        try:
            if action == "open_website":
                url = data.get('url', '')
                key = (url or '').lower().strip()
                # Resolve via registry first (supports app/website aliases)
                reg = self.app_registry.get(key)
                if reg:
                    if reg.get('type') == 'app':
                        app_result = await self._open_application_by_name(key)
                        status = 'completed' if app_result.get('success') else 'failed'
                        return {'execution_status': status, 'app_result': app_result}
                    elif reg.get('type') == 'website':
                        url = reg.get('url') or url
                open_result = await self._open_url(url)
                status = 'completed' if open_result.get('success') else 'failed'
                return {'execution_status': status, 'open_result': open_result}
            
            elif action == "open_application":
                app_name = data.get('application', '')
                app_result = await self._open_application_by_name(app_name)
                status = 'completed' if app_result.get('success') else 'failed'
                return {'execution_status': status, 'app_result': app_result}
            
            elif action == "screenshot":
                screenshot = pyautogui.screenshot()
                filename = f"screenshot_{int(asyncio.get_event_loop().time())}.png"
                screenshot.save(filename)
                return {'execution_status': 'completed', 'filename': filename}
            
            elif action == "volume_control":
                direction = data.get('direction', 'up')
                vol_result = await self._control_volume(direction)
                status = 'completed' if vol_result.get('success') else 'failed'
                return {'execution_status': status, 'volume_result': vol_result}
            
            elif action == "web_search":
                query = data.get('query', '')
                search_result = await self._perform_web_search(query)
                status = 'completed' if search_result.get('success') else 'failed'
                return {'execution_status': status, 'search_result': search_result}

            # No matching action
            return {'execution_status': 'no_action'}
        except Exception as e:
            return {'execution_status': 'failed', 'error': str(e)}

    def _load_app_registry(self) -> Dict[str, Any]:
        """Load app/website aliases registry from scripts/app_registry.json if present."""
        try:
            base_dir = os.path.dirname(__file__)
            path = os.path.join(base_dir, 'app_registry.json')
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    aliases = data.get('aliases', {})
                    if isinstance(aliases, dict):
                        return aliases
        except Exception as e:
            print(f"Failed to load app registry: {e}")
        return {}
    
    async def _open_application_by_name(self, app_name: str) -> Dict[str, Any]:
        """Open application with smart name matching"""
        app_commands = {
            'Windows': {
                'calculator': 'calc.exe',
                'calc': 'calc.exe',
                'notepad': 'notepad.exe',
                'cmd': 'cmd.exe',
                'command prompt': 'cmd.exe',
                'powershell': 'powershell.exe',
                'explorer': 'explorer.exe',
                'file explorer': 'explorer.exe',
                'chrome': 'chrome.exe',
                'google chrome': 'chrome.exe',
                'firefox': 'firefox.exe',
                'edge': 'msedge.exe',
                'microsoft edge': 'msedge.exe',
                # Popular apps
                'vscode': 'Code.exe',
                'code': 'Code.exe',
                'visual studio code': 'Code.exe',
                'spotify': 'Spotify.exe',
                'discord': 'Discord.exe',
                'slack': 'slack.exe',
                'teams': 'Teams.exe',
                'zoom': 'Zoom.exe',
                'telegram': 'Telegram.exe',
                'whatsapp': 'WhatsApp.exe',
                'vlc': 'vlc.exe',
                'postman': 'Postman.exe',
                # Microsoft Office
                'word': 'WINWORD.EXE',
                'excel': 'EXCEL.EXE',
                'powerpoint': 'POWERPNT.EXE',
                'outlook': 'OUTLOOK.EXE'
            },
            'Darwin': {  # macOS
                'calculator': 'Calculator',
                'calc': 'Calculator',
                'textedit': 'TextEdit',
                'text edit': 'TextEdit',
                'terminal': 'Terminal',
                'finder': 'Finder',
                'safari': 'Safari',
                'chrome': 'Google Chrome',
                'google chrome': 'Google Chrome',
                'firefox': 'Firefox'
            },
            'Linux': {
                'calculator': 'gnome-calculator',
                'calc': 'gnome-calculator',
                'gedit': 'gedit',
                'text editor': 'gedit',
                'terminal': 'gnome-terminal',
                'nautilus': 'nautilus',
                'file manager': 'nautilus',
                'firefox': 'firefox',
                'chrome': 'google-chrome',
                'google chrome': 'google-chrome'
            }
        }
        # Protocol/URI handlers for Windows (and some cross-platform)
        protocol_map = {
            'whatsapp': 'whatsapp://',
            'telegram': 'tg://',
            'discord': 'discord://',
            'slack': 'slack://',
            'zoom': 'zoommtg://',
            'spotify': 'spotify://',
            'outlook': 'outlook://',
            'word': 'ms-word:',
            'excel': 'ms-excel:',
            'powerpoint': 'ms-powerpoint:',
            'settings': 'ms-settings:',
            'photos': 'ms-photos:',
            'vscode': 'vscode://',
            'code': 'vscode://',
            'notion': 'notion://',
            'mail': 'mailto:',
        }
        
        try:
            os_name = platform.system()
            commands = app_commands.get(os_name, {})

            # Registry-based resolution (apps and websites)
            alias_key = app_name.lower().strip()
            reg = self.app_registry.get(alias_key)
            if reg:
                reg_type = reg.get('type')
                if reg_type == 'website':
                    url = reg.get('url') or alias_key
                    open_result = await self._open_url(url)
                    return {
                        'success': open_result.get('success', False),
                        'message': f"Opened {alias_key} ({url})",
                        'command': url,
                        'open_result': open_result,
                    }
                elif reg_type == 'app':
                    # Try explicit OS command or path
                    if os_name == 'Windows' and reg.get('windows'):
                        try:
                            subprocess.Popen(reg['windows'], shell=True)
                            return {'success': True, 'message': f"Opened {alias_key}", 'command': reg['windows']}
                        except Exception:
                            pass
                    # Try protocol if provided
                    proto = reg.get('protocol')
                    if proto:
                        open_result = await self._open_url(proto)
                        if open_result.get('success'):
                            return {
                                'success': True,
                                'message': f"Opened {alias_key} via protocol",
                                'command': proto,
                                'open_result': open_result
                            }
            
            # Direct path support (e.g., C:\Program Files\App\App.exe or shortcuts)
            try:
                if os_name == 'Windows':
                    if app_name.endswith(('.exe', '.lnk')) or (':' in app_name and ('\\' in app_name or '/' in app_name)):
                        # Normalize to Windows style
                        path = app_name.replace('/', '\\')
                        if os.path.exists(path):
                            try:
                                os.startfile(path)  # type: ignore[attr-defined]
                            except Exception:
                                subprocess.Popen(['cmd', '/c', 'start', '', path], shell=True)
                            return {
                                'success': True,
                                'message': f"Opened {path}",
                                'command': path,
                                'method': 'direct_path'
                            }
            except Exception:
                pass

            key = app_name.lower()
            command = commands.get(key)
            
            if not command:
                for app_key, app_command in commands.items():
                    if app_name.lower() in app_key or app_key in app_name.lower():
                        command = app_command
                        break
            
            if not command:
                return {
                    'success': False,
                    'message': f"Application '{app_name}' not found for {os_name}",
                    'available_apps': list(commands.keys())
                }
            
            if os_name == 'Windows':
                exe = command
                # Try common install paths if not directly launchable from PATH
                pf = os.environ.get('ProgramFiles', r'C:\\Program Files')
                pfx86 = os.environ.get('ProgramFiles(x86)', r'C:\\Program Files (x86)')
                localapp = os.environ.get('LOCALAPPDATA', os.path.expanduser(r'~\\AppData\\Local'))
                common_paths = {
                    'chrome.exe': [
                        os.path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
                        os.path.join(pfx86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
                        os.path.join(localapp, 'Google', 'Chrome', 'Application', 'chrome.exe'),
                    ],
                    'msedge.exe': [
                        os.path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
                        os.path.join(pfx86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
                    ],
                    'firefox.exe': [
                        os.path.join(pf, 'Mozilla Firefox', 'firefox.exe'),
                        os.path.join(pfx86, 'Mozilla Firefox', 'firefox.exe'),
                    ],
                    'Code.exe': [
                        os.path.join(pf, 'Microsoft VS Code', 'Code.exe'),
                        os.path.join(localapp, 'Programs', 'Microsoft VS Code', 'Code.exe'),
                    ],
                    'Spotify.exe': [
                        os.path.join(localapp, 'Microsoft', 'WindowsApps', 'Spotify.exe'),
                        os.path.join(pf, 'Spotify', 'Spotify.exe'),
                    ],
                    'Discord.exe': [
                        os.path.join(localapp, 'Discord', 'Update.exe'),
                        os.path.join(localapp, 'Discord', 'Discord.exe'),
                    ],
                    'slack.exe': [
                        os.path.join(localapp, 'slack', 'slack.exe'),
                    ],
                    'Teams.exe': [
                        os.path.join(localapp, 'Microsoft', 'Teams', 'current', 'Teams.exe'),
                    ],
                    'Zoom.exe': [
                        os.path.join(pf, 'Zoom', 'bin', 'Zoom.exe'),
                        os.path.join(pfx86, 'Zoom', 'bin', 'Zoom.exe'),
                    ],
                    'Telegram.exe': [
                        os.path.join(pf, 'Telegram Desktop', 'Telegram.exe'),
                        os.path.join(pfx86, 'Telegram Desktop', 'Telegram.exe'),
                    ],
                    'WhatsApp.exe': [
                        os.path.join(localapp, 'WhatsApp', 'WhatsApp.exe'),
                    ],
                    'vlc.exe': [
                        os.path.join(pf, 'VideoLAN', 'VLC', 'vlc.exe'),
                        os.path.join(pfx86, 'VideoLAN', 'VLC', 'vlc.exe'),
                    ],
                    'Postman.exe': [
                        os.path.join(localapp, 'Postman', 'Postman.exe'),
                    ],
                    'WINWORD.EXE': [
                        os.path.join(pf, 'Microsoft Office', 'root', 'Office16', 'WINWORD.EXE'),
                        os.path.join(pfx86, 'Microsoft Office', 'root', 'Office16', 'WINWORD.EXE'),
                    ],
                    'EXCEL.EXE': [
                        os.path.join(pf, 'Microsoft Office', 'root', 'Office16', 'EXCEL.EXE'),
                        os.path.join(pfx86, 'Microsoft Office', 'root', 'Office16', 'EXCEL.EXE'),
                    ],
                    'POWERPNT.EXE': [
                        os.path.join(pf, 'Microsoft Office', 'root', 'Office16', 'POWERPNT.EXE'),
                        os.path.join(pfx86, 'Microsoft Office', 'root', 'Office16', 'POWERPNT.EXE'),
                    ],
                    'OUTLOOK.EXE': [
                        os.path.join(pf, 'Microsoft Office', 'root', 'Office16', 'OUTLOOK.EXE'),
                        os.path.join(pfx86, 'Microsoft Office', 'root', 'Office16', 'OUTLOOK.EXE'),
                    ],
                }

                launched = False
                # 1) Try direct name via PATH
                try:
                    subprocess.Popen(exe, shell=True)
                    launched = True
                except Exception:
                    launched = False
                # 2) Try cmd start
                if not launched:
                    try:
                        subprocess.Popen(['cmd', '/c', 'start', '', exe], shell=True)
                        launched = True
                    except Exception:
                        launched = False
                # 3) Try known install paths
                if not launched:
                    for candidate in common_paths.get(exe, []):
                        if os.path.exists(candidate):
                            try:
                                os.startfile(candidate)  # type: ignore[attr-defined]
                                launched = True
                                exe = candidate
                                break
                            except Exception:
                                try:
                                    subprocess.Popen(['cmd', '/c', 'start', '', candidate], shell=True)
                                    launched = True
                                    exe = candidate
                                    break
                                except Exception:
                                    continue
                if not launched:
                    return {
                        'success': False,
                        'message': f"Failed to launch {app_name} ({exe}). It may not be installed or accessible.",
                        'attempted': exe
                    }
            elif os_name == 'Darwin':
                subprocess.Popen(['open', '-a', command])
            else:  # Linux
                subprocess.Popen([command])
            
            return {
                'success': True,
                'message': f"Opened {app_name}",
                'command': command
            }
        
        except Exception as e:
            # Try protocol-based fallback if available
            proto = protocol_map.get(app_name.lower())
            if proto:
                open_result = await self._open_url(proto)
                if open_result.get('success'):
                    return {
                        'success': True,
                        'message': f"Opened {app_name} via protocol",
                        'command': proto,
                        'open_result': open_result
                    }
                else:
                    return {
                        'success': False,
                        'message': f"Failed to open {app_name}: {str(e)}",
                        'protocol_attempted': proto,
                        'open_result': open_result
                    }
            return {
                'success': False,
                'message': f"Failed to open {app_name}: {str(e)}"
            }
    
    async def _open_url(self, url: str) -> Dict[str, Any]:
        """Robustly open a URL or protocol across OSes."""
        try:
            if not url:
                return {'success': False, 'message': 'No URL provided'}

            # Ensure scheme for plain domains (http/https). Allow custom protocols as-is.
            lowered = url.lower().strip()
            if not (lowered.startswith(('http://', 'https://')) or ':' in lowered):
                url = f"https://{url}"

            os_name = platform.system()
            result: Dict[str, Any] = {'target': url}

            if os_name == 'Windows':
                try:
                    # This handles http(s) and registered URL protocols
                    os.startfile(url)  # type: ignore[attr-defined]
                    result.update({'success': True, 'method': 'os.startfile'})
                    return result
                except Exception as e1:
                    try:
                        # Fallback using cmd start (handles spaces)
                        subprocess.Popen(['cmd', '/c', 'start', '', url], shell=True)
                        result.update({'success': True, 'method': 'cmd start'})
                        return result
                    except Exception as e2:
                        result["error_detail"] = f"startfile: {e1}; cmd start: {e2}"

            elif os_name == 'Darwin':
                try:
                    subprocess.Popen(['open', url])
                    return {'success': True, 'method': 'open', 'target': url}
                except Exception as e1:
                    return {'success': False, 'message': f'macOS open failed: {e1}', 'target': url}

            else:  # Linux and others
                try:
                    subprocess.Popen(['xdg-open', url])
                    return {'success': True, 'method': 'xdg-open', 'target': url}
                except Exception as e1:
                    # Fallthrough to webbrowser below
                    result["error_detail"] = f"xdg-open failed: {e1}"

            # Generic fallback via Python's webbrowser
            try:
                opened = webbrowser.open_new_tab(url)
                return {'success': bool(opened), 'method': 'webbrowser', 'target': url}
            except Exception as e3:
                return {'success': False, 'message': f'webbrowser failed: {e3}', 'target': url}
        except Exception as e:
            # Outer safety net
            try:
                target = url  # may not exist if earlier failure changed scope
            except Exception:
                target = None
            return {'success': False, 'message': f'open_url failed: {e}', 'target': target}
    
    async def _control_volume(self, direction: str) -> Dict[str, Any]:
        """Control system volume"""
        try:
            os_name = platform.system()
            
            if os_name == 'Windows':
                if direction == 'up':
                    try:
                        subprocess.run(['nircmd.exe', 'changesysvolume', '2000'], check=True)
                    except:
                        pyautogui.press('volumeup')
                elif direction == 'down':
                    try:
                        subprocess.run(['nircmd.exe', 'changesysvolume', '-2000'], check=True)
                    except:
                        pyautogui.press('volumedown')
            
            elif os_name == 'Darwin':  # macOS
                if direction == 'up':
                    subprocess.run(['osascript', '-e', 'set volume output volume (output volume of (get volume settings) + 10)'], check=True)
                elif direction == 'down':
                    subprocess.run(['osascript', '-e', 'set volume output volume (output volume of (get volume settings) - 10)'], check=True)
            
            elif os_name == 'Linux':
                if direction == 'up':
                    subprocess.run(['amixer', 'sset', 'Master', '5%+'], check=True)
                elif direction == 'down':
                    subprocess.run(['amixer', 'sset', 'Master', '5%-'], check=True)
            
            return {
                'success': True,
                'message': f"Volume turned {direction}",
                'direction': direction
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Volume control failed: {str(e)}"
            }
    
    async def _perform_web_search(self, query: str) -> Dict[str, Any]:
        """Perform web search and return results"""
        try:
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            open_result = await self._open_url(search_url)
            
            return {
                'success': open_result.get('success', False),
                'message': f"Searching for '{query}' in your browser",
                'query': query,
                'url': search_url,
                'open_result': open_result
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Search failed: {str(e)}"
            }

    async def _gemini_query(self, command: str) -> Dict[str, Any]:
        """Use Gemini AI for general queries"""
        try:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(f"Answer this question concisely in 1-2 sentences: {command}")
            
            return {
                'success': True,
                'response': response.text,
                'action_taken': "ai_query",
                'data': {"model": "gemini-pro"}
            }
            
        except Exception as e:
            return {
                'success': False,
                'response': f"AI query failed: {str(e)}",
                'action_taken': "error"
            }

    async def _handle_information_with_scraping(self, processed_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Handle information requests with web scraping"""
        try:
            action = processed_result.get('action_taken', '')
            data = processed_result.get('data', {})
            
            if action == 'get_weather':
                location = data.get('location', 'your location')
                async with self.web_scraper as scraper:
                    weather_results = await scraper.scrape_by_intent(location, 'weather')
                    if weather_results:
                        weather_data = weather_results[0]
                        return {
                            'response': weather_data.content,
                            'data': {**data, 'scraped_data': weather_data.metadata}
                        }
            
            elif action == 'get_news':
                async with self.web_scraper as scraper:
                    news_results = await scraper.scrape_by_intent('latest news', 'news')
                    if news_results:
                        formatted_response = scraper.format_results_for_voice({'News': news_results})
                        return {
                            'response': formatted_response,
                            'data': {'scraped_results': len(news_results)}
                        }
            
            elif action == 'web_search':
                query = data.get('query', '')
                async with self.web_scraper as scraper:
                    search_results = await scraper.intelligent_search_and_scrape(query)
                    if search_results:
                        formatted_response = scraper.format_results_for_voice(search_results)
                        return {
                            'response': formatted_response,
                            'data': {'search_results': search_results}
                        }
            
            return None
            
        except Exception as e:
            return {
                'response': f"Web scraping failed: {str(e)}",
                'action_taken': 'scraping_error'
            }

# Initialize the voice assistant
assistant = VoiceAssistant()

@app.get("/")
async def root():
    return {"message": "AI Voice Assistant Backend is running!"}

@app.post("/api/process-command", response_model=CommandResponse)
async def process_command(request: CommandRequest):
    """Process voice commands with advanced NLP and AI features"""
    try:
        result = await assistant.process_command(
            request.command, 
            request.use_gemini,
            request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-features/store-conversation")
async def store_conversation(request: ConversationRequest):
    """Store conversation for AI learning"""
    try:
        await assistant.ai_features.store_conversation(
            request.user_id,
            request.command,
            request.response,
            request.context
        )
        return {"success": True, "message": "Conversation stored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-features/suggestions/{user_id}")
async def get_suggestions(user_id: str):
    """Get proactive AI suggestions for user"""
    try:
        suggestions = await assistant.ai_features.generate_proactive_suggestions(user_id)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-features/analytics/{user_id}")
async def get_analytics(user_id: str):
    """Get usage analytics and insights"""
    try:
        analytics = await assistant.ai_features.analyze_usage_patterns(user_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-features/smart-home")
async def smart_home_control(request: dict):
    """Smart home integration endpoint"""
    try:
        command = request.get('command', '')
        result = await assistant.ai_features.smart_home_integration(command)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "system": assistant.system_info,
        "gemini_configured": bool(GEMINI_API_KEY),
        "features": {
            "advanced_nlp": True,
            "ai_features": True,
            "conversation_memory": True,
            "smart_suggestions": True,
            "usage_analytics": True,
            "smart_home_integration": True,
            "command_categories": [category.value for category in assistant.command_processor.nlp.command_patterns.keys()],
            "active_timers": len(assistant.command_processor.active_timers)
        }
    }

@app.post("/api/analyze-command")
async def analyze_command(request: CommandRequest):
    """Analyze command intent without executing"""
    try:
        intent = assistant.command_processor.nlp.classify_command(request.command)
        return {
            "command": request.command,
            "category": intent.category.value,
            "action": intent.action,
            "entities": intent.entities,
            "confidence": intent.confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape-content")
async def scrape_content(request: dict):
    """Direct web scraping endpoint"""
    try:
        query = request.get('query', '')
        content_type = request.get('type', 'general')
        max_results = request.get('max_results', 5)
        
        async with AdvancedWebScraper() as scraper:
            if request.get('url'):
                result = await scraper.scrape_specific_site(request['url'])
                return {
                    'success': True,
                    'results': [result.__dict__],
                    'formatted_response': result.content
                }
            else:
                results = await scraper.intelligent_search_and_scrape(query, max_results)
                formatted_response = scraper.format_results_for_voice(results)
                
                serialized_results = {}
                for source, source_results in results.items():
                    serialized_results[source] = [result.__dict__ for result in source_results]
                
                return {
                    'success': True,
                    'results': serialized_results,
                    'formatted_response': formatted_response,
                    'total_results': sum(len(source_results) for source_results in results.values())
                }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'formatted_response': f"Scraping failed: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

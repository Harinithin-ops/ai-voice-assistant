import re
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import asyncio
from datetime import datetime, timedelta

class CommandCategory(Enum):
    SYSTEM_CONTROL = "system_control"
    WEB_NAVIGATION = "web_navigation"
    APPLICATION = "application"
    INFORMATION = "information"
    TIMER_REMINDER = "timer_reminder"
    ENTERTAINMENT = "entertainment"
    PRODUCTIVITY = "productivity"
    AI_QUERY = "ai_query"

@dataclass
class CommandIntent:
    category: CommandCategory
    action: str
    entities: Dict[str, Any]
    confidence: float
    raw_command: str

class NaturalLanguageProcessor:
    def __init__(self):
        self.command_patterns = {
            CommandCategory.WEB_NAVIGATION: [
                (r"(?:open|go to|navigate to|visit)\s+(?:the\s+)?(?:website\s+)?(.+?)(?:\s+(?:website|site|page))?$", "open_website"),
                (r"search\s+(?:for\s+)?(.+?)(?:\s+(?:on|in)\s+(.+?))?$", "web_search"),
                (r"(?:google|search)\s+(.+)", "web_search"),
            ],
            CommandCategory.APPLICATION: [
                (r"(?:open|launch|start|run)\s+(?:the\s+)?(.+?)(?:\s+(?:app|application|program))?$", "open_app"),
                (r"close\s+(?:the\s+)?(.+?)(?:\s+(?:app|application|program))?$", "close_app"),
                (r"switch\s+to\s+(.+)", "switch_app"),
            ],
            CommandCategory.SYSTEM_CONTROL: [
                (r"(?:take\s+(?:a\s+)?)?screenshot", "screenshot"),
                (r"(?:turn\s+)?volume\s+(up|down|off|on)", "volume_control"),
                (r"(?:set\s+)?volume\s+(?:to\s+)?(\d+)(?:%|percent)?", "set_volume"),
                (r"(?:turn\s+)?brightness\s+(up|down)", "brightness_control"),
                (r"(?:set\s+)?brightness\s+(?:to\s+)?(\d+)(?:%|percent)?", "set_brightness"),
                (r"(?:lock|sleep|shutdown|restart)\s+(?:the\s+)?(?:computer|system|pc)", "system_power"),
            ],
            CommandCategory.TIMER_REMINDER: [
                (r"(?:set\s+(?:a\s+)?)?timer\s+(?:for\s+)?(\d+)\s*(minute|min|second|sec|hour)s?", "set_timer"),
                (r"(?:remind\s+me\s+)?(?:in\s+)?(\d+)\s*(minute|min|hour)s?\s+(?:to\s+)?(.+)", "set_reminder"),
                (r"(?:what|show)\s+(?:are\s+)?(?:my\s+)?(?:timer|reminder)s?", "list_timers"),
                (r"(?:cancel|stop|delete)\s+(?:the\s+)?(?:timer|reminder)", "cancel_timer"),
            ],
            CommandCategory.INFORMATION: [
                (r"(?:what|tell\s+me)\s+(?:is\s+)?(?:the\s+)?weather\s*(?:like)?(?:\s+(?:in|for)\s+(.+?))?(?:\s+today)?", "get_weather"),
                (r"(?:what|show\s+me)\s+(?:are\s+)?(?:the\s+)?(?:latest\s+)?news", "get_news"),
                (r"(?:what|tell\s+me)\s+(?:is\s+)?(?:the\s+)?time", "get_time"),
                (r"(?:what|tell\s+me)\s+(?:is\s+)?(?:the\s+)?date", "get_date"),
                (r"(?:how\s+)?(?:much\s+)?(?:is\s+)?(.+?)\s+(?:in\s+)?(.+?)(?:\s+(?:currency|dollars|euros))?", "currency_convert"),
            ],
            CommandCategory.ENTERTAINMENT: [
                (r"tell\s+me\s+(?:a\s+)?joke", "tell_joke"),
                (r"(?:play|start)\s+(?:some\s+)?music", "play_music"),
                (r"(?:play|put\s+on)\s+(.+?)(?:\s+(?:song|music|track))?", "play_specific"),
                (r"(?:stop|pause)\s+(?:the\s+)?music", "stop_music"),
                (r"(?:what|tell\s+me)\s+(?:a\s+)?(?:fun\s+)?fact", "fun_fact"),
            ],
            CommandCategory.PRODUCTIVITY: [
                (r"(?:create|make|write)\s+(?:a\s+)?(?:new\s+)?(.+?)(?:\s+(?:file|document|note))?", "create_document"),
                (r"(?:open|edit)\s+(?:the\s+)?(.+?)(?:\s+(?:file|document))?", "open_document"),
                (r"(?:calculate|compute|what\s+is)\s+(.+)", "calculate"),
                (r"(?:translate|what\s+is)\s+(.+?)\s+(?:in|to)\s+(.+)", "translate"),
            ],
            CommandCategory.AI_QUERY: [
                (r"(?:what|who|when|where|why|how)\s+(.+)", "general_query"),
                (r"(?:explain|tell\s+me\s+about|describe)\s+(.+)", "explain"),
                (r"(?:help\s+me\s+(?:with\s+)?|assist\s+me\s+(?:with\s+)?|how\s+(?:do\s+i|can\s+i))\s+(.+)", "help_request"),
            ]
        }
        
        # Entity extractors
        self.entity_patterns = {
            'number': r'\b(\d+(?:\.\d+)?)\b',
            'time_unit': r'\b(second|sec|minute|min|hour|day|week|month|year)s?\b',
            'website': r'\b(?:www\.)?([a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|io|co|uk|de|fr|jp|cn))\b',
            'app_name': r'\b(chrome|firefox|safari|edge|calculator|notepad|word|excel|powerpoint|photoshop|spotify|discord|slack|zoom|teams)\b',
            'location': r'\b(?:in|for|at)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]*)*)\b'
        }

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities from text using regex patterns"""
        entities = {}
        
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                entities[entity_type] = matches
        
        return entities

    def classify_command(self, command: str) -> CommandIntent:
        """Classify command and extract intent"""
        command_lower = command.lower().strip()
        # Normalize trailing punctuation so commands like "Open Chrome." still match
        import re as _re
        command_clean = _re.sub(r"[\s]*[.!?]+$", "", command_lower)
        best_match = None
        best_confidence = 0.0
        
        for category, patterns in self.command_patterns.items():
            for pattern, action in patterns:
                match = re.search(pattern, command_clean)
                if match:
                    # Calculate confidence based on match quality
                    base_len = max(1, len(command_clean))
                    confidence = len(match.group(0)) / base_len
                    
                    if confidence > best_confidence:
                        entities = self.extract_entities(command)
                        
                        # Add matched groups as entities
                        for i, group in enumerate(match.groups()):
                            if group:
                                entities[f'param_{i+1}'] = [group.strip()]
                        
                        best_match = CommandIntent(
                            category=category,
                            action=action,
                            entities=entities,
                            confidence=confidence,
                            raw_command=command
                        )
                        best_confidence = confidence
        
        # Fallback to AI query if no specific pattern matches
        if not best_match:
            entities = self.extract_entities(command)
            best_match = CommandIntent(
                category=CommandCategory.AI_QUERY,
                action="general_query",
                entities=entities,
                confidence=0.5,
                raw_command=command
            )
        
        return best_match

class AdvancedCommandProcessor:
    def __init__(self):
        self.nlp = NaturalLanguageProcessor()
        self.active_timers = {}
        self.command_history = []
        self.context_memory = {}
        
    async def process_command(self, command: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Process a voice command with advanced NLP"""
        try:
            # Classify the command
            intent = self.nlp.classify_command(command)

            # Disambiguate 'open <thing>' between app vs website
            intent = self._maybe_redirect_open_to_app(intent)
            
            # Store in history
            self.command_history.append({
                'command': command,
                'intent': intent,
                'timestamp': datetime.now(),
                'context': context or {}
            })
            
            # Route to appropriate handler
            handler_map = {
                CommandCategory.WEB_NAVIGATION: self._handle_web_navigation,
                CommandCategory.APPLICATION: self._handle_application,
                CommandCategory.SYSTEM_CONTROL: self._handle_system_control,
                CommandCategory.TIMER_REMINDER: self._handle_timer_reminder,
                CommandCategory.INFORMATION: self._handle_information,
                CommandCategory.ENTERTAINMENT: self._handle_entertainment,
                CommandCategory.PRODUCTIVITY: self._handle_productivity,
                CommandCategory.AI_QUERY: self._handle_ai_query,
            }
            
            handler = handler_map.get(intent.category)
            if handler:
                result = await handler(intent)
            else:
                result = {
                    'success': False,
                    'response': f"I don't know how to handle {intent.category.value} commands yet.",
                    'action_taken': 'unknown_category'
                }
            
            # Add metadata
            result['intent'] = {
                'category': intent.category.value,
                'action': intent.action,
                'confidence': intent.confidence,
                'entities': intent.entities
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'response': f"Error processing command: {str(e)}",
                'action_taken': 'error',
                'error': str(e)
            }

    def _maybe_redirect_open_to_app(self, intent: CommandIntent) -> CommandIntent:
        """If user says 'open X' and X looks like a known application, redirect to app open."""
        try:
            if intent.category == CommandCategory.WEB_NAVIGATION and intent.action == 'open_website':
                name = intent.entities.get('param_1', [''])[0]
                if not name:
                    return intent

                raw = name.lower().strip()
                # Strip URL parts
                import re as _re
                raw = _re.sub(r'^https?://', '', raw)
                if raw.startswith('www.'):
                    raw = raw[4:]
                # Get base token (e.g., youtube.com -> youtube)
                base = raw.split('/')[0].split('.')[0]

                alias_map = {
                    # browsers
                    'chrome': 'chrome',
                    'firefox': 'firefox',
                    'edge': 'edge',
                    # editors/ide
                    'vscode': 'vscode',
                    'code': 'vscode',
                    'vs code': 'vscode',
                    'visual studio code': 'vscode',
                    # communication
                    'whatsapp': 'whatsapp',
                    'discord': 'discord',
                    'slack': 'slack',
                    'teams': 'teams',
                    'zoom': 'zoom',
                    'telegram': 'telegram',
                    # media
                    'spotify': 'spotify',
                    'vlc': 'vlc',
                    'youtube music': 'spotify',
                    # office
                    'word': 'word',
                    'excel': 'excel',
                    'powerpoint': 'powerpoint',
                    'outlook': 'outlook',
                    # dev
                    'postman': 'postman',
                }

                key = alias_map.get(base) or alias_map.get(raw) or alias_map.get(name.lower())
                if key:
                    # Redirect to app open intent
                    new_entities = dict(intent.entities)
                    new_entities['param_1'] = [key]
                    return CommandIntent(
                        category=CommandCategory.APPLICATION,
                        action='open_app',
                        entities=new_entities,
                        confidence=intent.confidence,
                        raw_command=intent.raw_command,
                    )
        except Exception:
            pass
        return intent
    
    async def _handle_web_navigation(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle web navigation commands"""
        if intent.action == "open_website":
            website = intent.entities.get('param_1', [''])[0]
            if not website:
                return {'success': False, 'response': "I couldn't identify which website to open."}
            
            # Smart website detection
            if not website.startswith(('http://', 'https://')):
                if '.' not in website:
                    # Common sites
                    site_shortcuts = {
                        'youtube': 'youtube.com',
                        'google': 'google.com',
                        'github': 'github.com',
                        'stackoverflow': 'stackoverflow.com',
                        'reddit': 'reddit.com',
                        'twitter': 'twitter.com',
                        'facebook': 'facebook.com'
                    }
                    website = site_shortcuts.get(website.lower(), f"{website}.com")
                website = f"https://{website}"
            
            return {
                'success': True,
                'response': f"Opening {website}",
                'action_taken': 'open_website',
                'data': {'url': website}
            }
        
        elif intent.action == "web_search":
            query = intent.entities.get('param_1', [''])[0]
            search_engine = intent.entities.get('param_2', ['google'])[0]
            
            return {
                'success': True,
                'response': f"Searching for '{query}' on {search_engine}",
                'action_taken': 'web_search',
                'data': {'query': query, 'engine': search_engine}
            }
        
        return {'success': False, 'response': "Unknown web navigation command."}
    
    async def _handle_application(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle application commands"""
        app_name = intent.entities.get('param_1', [''])[0]
        
        if intent.action == "open_app":
            return {
                'success': True,
                'response': f"Opening {app_name}",
                'action_taken': 'open_application',
                'data': {'application': app_name}
            }
        elif intent.action == "close_app":
            return {
                'success': True,
                'response': f"Closing {app_name}",
                'action_taken': 'close_application',
                'data': {'application': app_name}
            }
        elif intent.action == "switch_app":
            return {
                'success': True,
                'response': f"Switching to {app_name}",
                'action_taken': 'switch_application',
                'data': {'application': app_name}
            }
        
        return {'success': False, 'response': "Unknown application command."}
    
    async def _handle_system_control(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle system control commands"""
        if intent.action == "screenshot":
            return {
                'success': True,
                'response': "Taking a screenshot",
                'action_taken': 'screenshot'
            }
        elif intent.action == "volume_control":
            direction = intent.entities.get('param_1', [''])[0]
            return {
                'success': True,
                'response': f"Turning volume {direction}",
                'action_taken': 'volume_control',
                'data': {'direction': direction}
            }
        elif intent.action == "set_volume":
            level = intent.entities.get('param_1', ['50'])[0]
            return {
                'success': True,
                'response': f"Setting volume to {level}%",
                'action_taken': 'set_volume',
                'data': {'level': int(level)}
            }
        
        return {'success': False, 'response': "Unknown system control command."}
    
    async def _handle_timer_reminder(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle timer and reminder commands"""
        if intent.action == "set_timer":
            duration = intent.entities.get('param_1', ['5'])[0]
            unit = intent.entities.get('param_2', ['minute'])[0]
            
            # Convert to seconds
            multipliers = {'second': 1, 'sec': 1, 'minute': 60, 'min': 60, 'hour': 3600}
            seconds = int(duration) * multipliers.get(unit, 60)
            
            timer_id = f"timer_{len(self.active_timers) + 1}"
            self.active_timers[timer_id] = {
                'duration': seconds,
                'start_time': datetime.now(),
                'end_time': datetime.now() + timedelta(seconds=seconds)
            }
            
            return {
                'success': True,
                'response': f"Timer set for {duration} {unit}{'s' if int(duration) > 1 else ''}",
                'action_taken': 'set_timer',
                'data': {'timer_id': timer_id, 'duration': seconds, 'unit': unit}
            }
        
        elif intent.action == "list_timers":
            if not self.active_timers:
                return {
                    'success': True,
                    'response': "No active timers",
                    'action_taken': 'list_timers'
                }
            
            timer_list = []
            for timer_id, timer_data in self.active_timers.items():
                remaining = timer_data['end_time'] - datetime.now()
                if remaining.total_seconds() > 0:
                    timer_list.append(f"{timer_id}: {int(remaining.total_seconds())} seconds remaining")
                else:
                    timer_list.append(f"{timer_id}: Finished!")
            
            return {
                'success': True,
                'response': f"Active timers: {', '.join(timer_list)}",
                'action_taken': 'list_timers',
                'data': {'timers': timer_list}
            }
        
        return {'success': False, 'response': "Unknown timer command."}
    
    async def _handle_information(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle information requests"""
        if intent.action == "get_weather":
            location = intent.entities.get('param_1', ['your location'])[0]
            return {
                'success': True,
                'response': f"The weather in {location} is sunny with a high of 75°F",
                'action_taken': 'get_weather',
                'data': {'location': location}
            }
        elif intent.action == "get_news":
            return {
                'success': True,
                'response': "Here are the latest headlines: Technology stocks rise, AI breakthrough announced",
                'action_taken': 'get_news'
            }
        elif intent.action == "get_time":
            current_time = datetime.now().strftime("%I:%M %p")
            return {
                'success': True,
                'response': f"The current time is {current_time}",
                'action_taken': 'get_time',
                'data': {'time': current_time}
            }
        elif intent.action == "get_date":
            current_date = datetime.now().strftime("%A, %B %d, %Y")
            return {
                'success': True,
                'response': f"Today is {current_date}",
                'action_taken': 'get_date',
                'data': {'date': current_date}
            }
        
        return {'success': False, 'response': "Unknown information request."}
    
    async def _handle_entertainment(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle entertainment commands"""
        if intent.action == "tell_joke":
            jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "What do you call a fake noodle? An impasta!",
                "Why did the math book look so sad? Because it had too many problems!"
            ]
            import random
            joke = random.choice(jokes)
            return {
                'success': True,
                'response': joke,
                'action_taken': 'tell_joke'
            }
        elif intent.action == "play_music":
            return {
                'success': True,
                'response': "Starting music playback",
                'action_taken': 'play_music'
            }
        elif intent.action == "fun_fact":
            facts = [
                "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
                "A group of flamingos is called a 'flamboyance'.",
                "Bananas are berries, but strawberries aren't!",
                "The shortest war in history lasted only 38-45 minutes between Britain and Zanzibar in 1896."
            ]
            import random
            fact = random.choice(facts)
            return {
                'success': True,
                'response': f"Here's a fun fact: {fact}",
                'action_taken': 'fun_fact'
            }
        
        return {'success': False, 'response': "Unknown entertainment command."}
    
    async def _handle_productivity(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle productivity commands"""
        if intent.action == "calculate":
            expression = intent.entities.get('param_1', [''])[0]
            try:
                # Simple math evaluation (in production, use a proper math parser)
                # This is a simplified version for demo purposes
                result = "42"  # Placeholder
                return {
                    'success': True,
                    'response': f"The result of {expression} is {result}",
                    'action_taken': 'calculate',
                    'data': {'expression': expression, 'result': result}
                }
            except:
                return {
                    'success': False,
                    'response': f"I couldn't calculate {expression}",
                    'action_taken': 'calculate_error'
                }
        
        return {'success': False, 'response': "Unknown productivity command."}
    
    async def _handle_ai_query(self, intent: CommandIntent) -> Dict[str, Any]:
        """Handle general AI queries"""
        query = intent.entities.get('param_1', [intent.raw_command])[0]
        
        return {
            'success': True,
            'response': f"I understand you're asking about '{query}'. Let me help you with that information.",
            'action_taken': 'ai_query',
            'data': {'query': query, 'requires_ai': True}
        }

# Usage example
async def main():
    processor = AdvancedCommandProcessor()
    
    test_commands = [
        "Open YouTube",
        "Set a timer for 5 minutes",
        "What's the weather like in New York?",
        "Tell me a joke",
        "Take a screenshot",
        "Calculate 25 plus 17",
        "What is artificial intelligence?"
    ]
    
    for command in test_commands:
        result = await processor.process_command(command)
        print(f"Command: {command}")
        print(f"Response: {result['response']}")
        print(f"Intent: {result.get('intent', {})}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())

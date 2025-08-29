import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sqlite3
from dataclasses import dataclass, asdict
import numpy as np
from collections import defaultdict

@dataclass
class ConversationMemory:
    user_id: str
    timestamp: datetime
    command: str
    response: str
    context: Dict[str, Any]
    sentiment: float
    topics: List[str]

@dataclass
class UserPreference:
    user_id: str
    preference_type: str
    value: Any
    confidence: float
    last_updated: datetime

class AIFeaturesManager:
    def __init__(self):
        self.db_path = "ai_features.db"
        self.init_database()
        self.conversation_memory: List[ConversationMemory] = []
        self.user_preferences: Dict[str, List[UserPreference]] = defaultdict(list)
        self.learning_patterns = {}
        
    def init_database(self):
        """Initialize SQLite database for persistent storage"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Conversation memory table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversation_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                timestamp TEXT,
                command TEXT,
                response TEXT,
                context TEXT,
                sentiment REAL,
                topics TEXT
            )
        ''')
        
        # User preferences table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                preference_type TEXT,
                value TEXT,
                confidence REAL,
                last_updated TEXT
            )
        ''')
        
        # Usage analytics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                command_type TEXT,
                timestamp TEXT,
                success BOOLEAN,
                response_time REAL,
                context TEXT
            )
        ''')
        
        conn.commit()
        conn.close()

    async def store_conversation(self, user_id: str, command: str, response: str, 
                               context: Dict[str, Any] = None):
        """Store conversation in memory with context awareness"""
        if context is None:
            context = {}
            
        # Analyze sentiment and extract topics
        sentiment = self.analyze_sentiment(command + " " + response)
        topics = self.extract_topics(command)
        
        memory = ConversationMemory(
            user_id=user_id,
            timestamp=datetime.now(),
            command=command,
            response=response,
            context=context,
            sentiment=sentiment,
            topics=topics
        )
        
        self.conversation_memory.append(memory)
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO conversation_memory 
            (user_id, timestamp, command, response, context, sentiment, topics)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, memory.timestamp.isoformat(), command, response,
            json.dumps(context), sentiment, json.dumps(topics)
        ))
        conn.commit()
        conn.close()
        
        # Update learning patterns
        await self.update_learning_patterns(user_id, command, topics)

    def analyze_sentiment(self, text: str) -> float:
        """Simple sentiment analysis (in production, use proper NLP models)"""
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'like']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'error', 'problem']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count + negative_count == 0:
            return 0.0
        
        return (positive_count - negative_count) / (positive_count + negative_count)

    def extract_topics(self, text: str) -> List[str]:
        """Extract topics from text (simplified implementation)"""
        topic_keywords = {
            'weather': ['weather', 'temperature', 'rain', 'sunny', 'cloudy', 'forecast'],
            'news': ['news', 'headlines', 'breaking', 'update', 'current events'],
            'productivity': ['schedule', 'calendar', 'reminder', 'task', 'todo', 'meeting'],
            'entertainment': ['music', 'movie', 'video', 'game', 'fun', 'play'],
            'search': ['search', 'find', 'look up', 'google', 'information'],
            'system': ['open', 'close', 'launch', 'application', 'program', 'file']
        }
        
        text_lower = text.lower()
        detected_topics = []
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_topics.append(topic)
        
        return detected_topics

    async def update_learning_patterns(self, user_id: str, command: str, topics: List[str]):
        """Update learning patterns based on user interactions"""
        if user_id not in self.learning_patterns:
            self.learning_patterns[user_id] = {
                'command_frequency': defaultdict(int),
                'topic_preferences': defaultdict(int),
                'time_patterns': defaultdict(list),
                'success_rates': defaultdict(list)
            }
        
        patterns = self.learning_patterns[user_id]
        current_hour = datetime.now().hour
        
        # Update command frequency
        patterns['command_frequency'][command] += 1
        
        # Update topic preferences
        for topic in topics:
            patterns['topic_preferences'][topic] += 1
        
        # Update time patterns
        patterns['time_patterns'][current_hour].append(command)

    async def generate_proactive_suggestions(self, user_id: str) -> List[Dict[str, Any]]:
        """Generate proactive suggestions based on learning patterns"""
        suggestions = []
        
        if user_id not in self.learning_patterns:
            return suggestions
        
        patterns = self.learning_patterns[user_id]
        current_hour = datetime.now().hour
        
        # Time-based suggestions
        if current_hour in patterns['time_patterns']:
            common_commands = patterns['time_patterns'][current_hour]
            if len(common_commands) > 2:
                suggestions.append({
                    'type': 'time_based',
                    'title': 'Daily Routine Suggestion',
                    'description': f'You usually use voice commands around this time. Would you like me to prepare your daily briefing?',
                    'confidence': 0.8,
                    'action': 'daily_briefing'
                })
        
        # Topic-based suggestions
        top_topics = sorted(patterns['topic_preferences'].items(), key=lambda x: x[1], reverse=True)[:3]
        if top_topics:
            suggestions.append({
                'type': 'topic_based',
                'title': 'Personalized Content',
                'description': f'Based on your interests in {", ".join([t[0] for t in top_topics])}, here are some relevant updates.',
                'confidence': 0.75,
                'action': 'topic_updates'
            })
        
        return suggestions

    async def get_contextual_response(self, user_id: str, current_command: str) -> Dict[str, Any]:
        """Generate contextual response based on conversation history"""
        recent_memory = [m for m in self.conversation_memory 
                        if m.user_id == user_id and 
                        (datetime.now() - m.timestamp).seconds < 3600]  # Last hour
        
        if not recent_memory:
            return {'context': 'new_conversation', 'suggestions': []}
        
        # Analyze recent context
        recent_topics = []
        for memory in recent_memory[-5:]:  # Last 5 interactions
            recent_topics.extend(memory.topics)
        
        context_info = {
            'context': 'continuing_conversation',
            'recent_topics': list(set(recent_topics)),
            'conversation_length': len(recent_memory),
            'average_sentiment': np.mean([m.sentiment for m in recent_memory]),
            'suggestions': await self.generate_proactive_suggestions(user_id)
        }
        
        return context_info

    async def analyze_usage_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user usage patterns for insights"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get usage data from last 30 days
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        cursor.execute('''
            SELECT command_type, timestamp, success, response_time 
            FROM usage_analytics 
            WHERE user_id = ? AND timestamp > ?
        ''', (user_id, thirty_days_ago))
        
        usage_data = cursor.fetchall()
        conn.close()
        
        if not usage_data:
            return {'insights': [], 'recommendations': []}
        
        # Analyze patterns
        command_counts = defaultdict(int)
        success_rates = defaultdict(list)
        response_times = defaultdict(list)
        
        for command_type, timestamp, success, response_time in usage_data:
            command_counts[command_type] += 1
            success_rates[command_type].append(success)
            response_times[command_type].append(response_time)
        
        insights = []
        recommendations = []
        
        # Generate insights
        most_used = max(command_counts.items(), key=lambda x: x[1])
        insights.append({
            'type': 'usage_pattern',
            'title': 'Most Used Feature',
            'description': f'You use {most_used[0]} commands {most_used[1]} times this month',
            'confidence': 0.9
        })
        
        # Performance recommendations
        for command_type, times in response_times.items():
            avg_time = np.mean(times)
            if avg_time > 2.0:  # Slow response
                recommendations.append({
                    'type': 'performance',
                    'title': 'Optimization Opportunity',
                    'description': f'{command_type} commands are taking longer than usual. Consider optimizing your setup.',
                    'confidence': 0.7
                })
        
        return {
            'insights': insights,
            'recommendations': recommendations,
            'usage_stats': {
                'total_commands': sum(command_counts.values()),
                'most_used_feature': most_used[0],
                'average_success_rate': np.mean([np.mean(rates) for rates in success_rates.values()])
            }
        }

    async def smart_home_integration(self, command: str) -> Dict[str, Any]:
        """Smart home integration capabilities"""
        smart_home_commands = {
            'lights': ['turn on lights', 'turn off lights', 'dim lights', 'brighten lights'],
            'temperature': ['set temperature', 'increase temperature', 'decrease temperature'],
            'security': ['arm security', 'disarm security', 'check security status'],
            'entertainment': ['play music', 'pause music', 'change channel', 'volume up', 'volume down']
        }
        
        command_lower = command.lower()
        detected_category = None
        
        for category, commands in smart_home_commands.items():
            if any(cmd in command_lower for cmd in commands):
                detected_category = category
                break
        
        if detected_category:
            return {
                'category': detected_category,
                'action': 'smart_home_control',
                'status': 'simulated',  # In production, integrate with actual smart home APIs
                'message': f'Smart home {detected_category} command processed successfully'
            }
        
        return {'category': None, 'action': 'not_smart_home', 'status': 'ignored'}

# Global instance
ai_features_manager = AIFeaturesManager()

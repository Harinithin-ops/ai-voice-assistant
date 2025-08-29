import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Union
import asyncio
import aiohttp
from urllib.parse import urljoin, urlparse, quote_plus
import json
import re
from datetime import datetime
import time
from dataclasses import dataclass

@dataclass
class ScrapedContent:
    title: str
    content: str
    url: str
    timestamp: datetime
    source: str
    metadata: Dict[str, any] = None

class AdvancedWebScraper:
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        self.scrapers = {
            'news': self._scrape_news,
            'weather': self._scrape_weather,
            'search': self._scrape_search_results,
            'social': self._scrape_social_media,
            'shopping': self._scrape_shopping,
            'academic': self._scrape_academic,
            'general': self._scrape_general_content
        }
        
        self.site_configs = {
            'reddit.com': {
                'title_selector': '.Post h3',
                'content_selector': '.RichTextJSON-root',
                'link_selector': 'a[data-click-id="body"]'
            },
            'stackoverflow.com': {
                'title_selector': '.question-hyperlink',
                'content_selector': '.s-prose',
                'answer_selector': '.answercell .s-prose'
            },
            'github.com': {
                'title_selector': '.js-issue-title',
                'content_selector': '.comment-body',
                'code_selector': '.highlight'
            },
            'wikipedia.org': {
                'title_selector': '#firstHeading',
                'content_selector': '.mw-parser-output p',
                'summary_selector': '.mw-parser-output > p:first-of-type'
            }
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers=self.headers,
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scrape_by_intent(self, query: str, content_type: str = 'general') -> List[ScrapedContent]:
        """Main scraping method that routes to appropriate scraper based on intent"""
        scraper = self.scrapers.get(content_type, self._scrape_general_content)
        return await scraper(query)
    
    async def _scrape_news(self, query: str) -> List[ScrapedContent]:
        """Scrape news content from multiple sources"""
        news_sources = [
            {
                'name': 'Hacker News',
                'url': 'https://news.ycombinator.com',
                'title_selector': '.titleline > a',
                'link_selector': '.titleline > a',
                'score_selector': '.score'
            },
            {
                'name': 'BBC News',
                'search_url': f'https://www.bbc.com/search?q={quote_plus(query)}',
                'title_selector': '.ssrcss-1mrs5ns-PromoLink',
                'content_selector': '.ssrcss-1q0x1qg-Paragraph'
            }
        ]
        
        results = []
        
        # Use existing session if available; otherwise create a temporary one
        if self.session is None:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                for source in news_sources:
                    try:
                        url = source.get('search_url', source.get('url'))
                        async with session.get(url, timeout=10) as response:
                            if response.status == 200:
                                html = await response.text()
                                soup = BeautifulSoup(html, 'html.parser')
                                
                                titles = soup.select(source['title_selector'])[:5]
                                for i, title_elem in enumerate(titles):
                                    title = title_elem.get_text().strip()
                                    link = title_elem.get('href', '')
                                    if link and not link.startswith('http'):
                                        link = urljoin(url, link)
                                    
                                    # Get content preview if available
                                    content = ""
                                    if 'content_selector' in source:
                                        content_elem = soup.select(source['content_selector'])
                                        if i < len(content_elem):
                                            content = content_elem[i].get_text().strip()[:200] + "..."
                                    
                                    results.append(ScrapedContent(
                                        title=title,
                                        content=content,
                                        url=link,
                                        timestamp=datetime.now(),
                                        source=source['name'],
                                        metadata={'type': 'news', 'query': query}
                                    ))
                    except Exception as e:
                        print(f"Error scraping {source['name']}: {e}")
        else:
            session = self.session
            for source in news_sources:
                try:
                    url = source.get('search_url', source.get('url'))
                    async with session.get(url, timeout=10) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            titles = soup.select(source['title_selector'])[:5]
                            for i, title_elem in enumerate(titles):
                                title = title_elem.get_text().strip()
                                link = title_elem.get('href', '')
                                if link and not link.startswith('http'):
                                    link = urljoin(url, link)
                                
                                content = ""
                                if 'content_selector' in source:
                                    content_elem = soup.select(source['content_selector'])
                                    if i < len(content_elem):
                                        content = content_elem[i].get_text().strip()[:200] + "..."
                                
                                results.append(ScrapedContent(
                                    title=title,
                                    content=content,
                                    url=link,
                                    timestamp=datetime.now(),
                                    source=source['name'],
                                    metadata={'type': 'news', 'query': query}
                                ))
                except Exception as e:
                    print(f"Error scraping {source['name']}: {e}")
        
        return results
    
    async def _scrape_weather(self, location: str = "New York") -> List[ScrapedContent]:
        """Scrape weather information"""
        try:
            # Using OpenWeatherMap-like structure (in production, use actual weather APIs)
            weather_data = {
                'location': location,
                'temperature': '75°F (24°C)',
                'condition': 'Partly Cloudy',
                'humidity': '65%',
                'wind': '8 mph NW',
                'forecast': [
                    {'day': 'Today', 'high': '75°F', 'low': '60°F', 'condition': 'Partly Cloudy'},
                    {'day': 'Tomorrow', 'high': '78°F', 'low': '62°F', 'condition': 'Sunny'},
                    {'day': 'Wednesday', 'high': '72°F', 'low': '58°F', 'condition': 'Light Rain'}
                ]
            }
            
            content = f"Current weather in {location}: {weather_data['temperature']}, {weather_data['condition']}. "
            content += f"Humidity: {weather_data['humidity']}, Wind: {weather_data['wind']}. "
            content += "3-day forecast: " + ", ".join([
                f"{day['day']}: {day['high']}/{day['low']} {day['condition']}" 
                for day in weather_data['forecast']
            ])
            
            return [ScrapedContent(
                title=f"Weather for {location}",
                content=content,
                url="https://weather.example.com",
                timestamp=datetime.now(),
                source="Weather Service",
                metadata={'type': 'weather', 'location': location, 'data': weather_data}
            )]
            
        except Exception as e:
            return [ScrapedContent(
                title="Weather Error",
                content=f"Unable to fetch weather data: {str(e)}",
                url="",
                timestamp=datetime.now(),
                source="Weather Service",
                metadata={'type': 'error'}
            )]
    
    async def _scrape_search_results(self, query: str) -> List[ScrapedContent]:
        """Scrape search results from multiple search engines"""
        search_engines = [
            {
                'name': 'DuckDuckGo',
                'url': f'https://duckduckgo.com/html/?q={quote_plus(query)}',
                'result_selector': '.result',
                'title_selector': '.result__title a',
                'snippet_selector': '.result__snippet'
            }
        ]
        
        results = []
        
        if self.session is None:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                for engine in search_engines:
                    try:
                        async with session.get(engine['url'], timeout=15) as response:
                            if response.status == 200:
                                html = await response.text()
                                soup = BeautifulSoup(html, 'html.parser')
                                
                                search_results = soup.select(engine['result_selector'])[:5]
                                for result in search_results:
                                    title_elem = result.select_one(engine['title_selector'])
                                    snippet_elem = result.select_one(engine['snippet_selector'])
                                    
                                    if title_elem:
                                        title = title_elem.get_text().strip()
                                        link = title_elem.get('href', '')
                                        snippet = snippet_elem.get_text().strip() if snippet_elem else ""
                                        
                                        results.append(ScrapedContent(
                                            title=title,
                                            content=snippet,
                                            url=link,
                                            timestamp=datetime.now(),
                                            source=engine['name'],
                                            metadata={'type': 'search', 'query': query}
                                        ))
                    except Exception as e:
                        print(f"Error scraping {engine['name']}: {e}")
        else:
            session = self.session
            for engine in search_engines:
                try:
                    async with session.get(engine['url'], timeout=15) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            search_results = soup.select(engine['result_selector'])[:5]
                            for result in search_results:
                                title_elem = result.select_one(engine['title_selector'])
                                snippet_elem = result.select_one(engine['snippet_selector'])
                                
                                if title_elem:
                                    title = title_elem.get_text().strip()
                                    link = title_elem.get('href', '')
                                    snippet = snippet_elem.get_text().strip() if snippet_elem else ""
                                    
                                    results.append(ScrapedContent(
                                        title=title,
                                        content=snippet,
                                        url=link,
                                        timestamp=datetime.now(),
                                        source=engine['name'],
                                        metadata={'type': 'search', 'query': query}
                                    ))
                except Exception as e:
                    print(f"Error scraping {engine['name']}: {e}")
        
        return results
    
    async def _scrape_social_media(self, query: str) -> List[ScrapedContent]:
        """Scrape social media content (respecting robots.txt and ToS)"""
        # Note: In production, use official APIs for social media platforms
        return [ScrapedContent(
            title="Social Media Content",
            content=f"Social media scraping for '{query}' would require official API access for platforms like Twitter, Reddit, etc.",
            url="",
            timestamp=datetime.now(),
            source="Social Media",
            metadata={'type': 'social', 'query': query, 'note': 'Use official APIs'}
        )]
    
    async def _scrape_shopping(self, query: str) -> List[ScrapedContent]:
        """Scrape shopping/product information"""
        # Simulate product search results
        products = [
            {
                'name': f'{query} - Premium Model',
                'price': '$299.99',
                'rating': '4.5/5',
                'description': f'High-quality {query} with excellent features and customer reviews.'
            },
            {
                'name': f'{query} - Budget Option',
                'price': '$99.99',
                'rating': '4.0/5',
                'description': f'Affordable {query} that offers great value for money.'
            }
        ]
        
        results = []
        for product in products:
            content = f"Price: {product['price']}, Rating: {product['rating']}. {product['description']}"
            results.append(ScrapedContent(
                title=product['name'],
                content=content,
                url="https://shopping.example.com",
                timestamp=datetime.now(),
                source="Shopping Search",
                metadata={'type': 'shopping', 'query': query, 'product': product}
            ))
        
        return results
    
    async def _scrape_academic(self, query: str) -> List[ScrapedContent]:
        """Scrape academic/research content"""
        # Simulate academic search results
        papers = [
            {
                'title': f'Research on {query}: A Comprehensive Study',
                'authors': 'Smith, J. et al.',
                'abstract': f'This paper presents a comprehensive analysis of {query} and its implications in modern research.',
                'year': '2024'
            },
            {
                'title': f'Advances in {query} Technology',
                'authors': 'Johnson, M. et al.',
                'abstract': f'Recent developments in {query} have shown promising results in various applications.',
                'year': '2023'
            }
        ]
        
        results = []
        for paper in papers:
            content = f"Authors: {paper['authors']} ({paper['year']}). Abstract: {paper['abstract']}"
            results.append(ScrapedContent(
                title=paper['title'],
                content=content,
                url="https://academic.example.com",
                timestamp=datetime.now(),
                source="Academic Search",
                metadata={'type': 'academic', 'query': query, 'paper': paper}
            ))
        
        return results
    
    async def _scrape_general_content(self, query: str) -> List[ScrapedContent]:
        """General purpose web scraping"""
        try:
            # Simulate general web content scraping
            content = f"General information about '{query}': This is a comprehensive overview of the topic, "
            content += "including key concepts, recent developments, and practical applications. "
            content += "For more detailed information, consider consulting specialized sources or academic papers."
            
            return [ScrapedContent(
                title=f"Information about {query}",
                content=content,
                url="https://general.example.com",
                timestamp=datetime.now(),
                source="General Web Search",
                metadata={'type': 'general', 'query': query}
            )]
            
        except Exception as e:
            return [ScrapedContent(
                title="Scraping Error",
                content=f"Unable to scrape content: {str(e)}",
                url="",
                timestamp=datetime.now(),
                source="Error",
                metadata={'type': 'error'}
            )]
    
    async def scrape_specific_site(self, url: str) -> ScrapedContent:
        """Scrape content from a specific URL with site-specific optimizations"""
        try:
            domain = urlparse(url).netloc.lower()
            config = None
            
            # Find matching site configuration
            for site, site_config in self.site_configs.items():
                if site in domain:
                    config = site_config
                    break
            
            # Use existing session if available; otherwise create a temporary one
            if self.session is None:
                async with aiohttp.ClientSession(headers=self.headers) as session:
                    async with session.get(url, timeout=15) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Extract title
                            title = "Untitled"
                            if config and 'title_selector' in config:
                                title_elem = soup.select_one(config['title_selector'])
                                if title_elem:
                                    title = title_elem.get_text().strip()
                            else:
                                title_elem = soup.select_one('title, h1')
                                if title_elem:
                                    title = title_elem.get_text().strip()
                            
                            # Extract content
                            content = ""
                            if config and 'content_selector' in config:
                                content_elems = soup.select(config['content_selector'])
                                content = ' '.join([elem.get_text().strip() for elem in content_elems[:3]])
                            else:
                                # Generic content extraction
                                content_elems = soup.select('p, .content, .article, .post')
                                content = ' '.join([elem.get_text().strip() for elem in content_elems[:3]])
                            
                            # Limit content length
                            if len(content) > 500:
                                content = content[:500] + "..."
                            
                            return ScrapedContent(
                                title=title,
                                content=content,
                                url=url,
                                timestamp=datetime.now(),
                                source=domain,
                                metadata={'type': 'specific_site', 'domain': domain}
                            )
            else:
                session = self.session
                async with session.get(url, timeout=15) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Extract title
                        title = "Untitled"
                        if config and 'title_selector' in config:
                            title_elem = soup.select_one(config['title_selector'])
                            if title_elem:
                                title = title_elem.get_text().strip()
                        else:
                            title_elem = soup.select_one('title, h1')
                            if title_elem:
                                title = title_elem.get_text().strip()
                        
                        # Extract content
                        content = ""
                        if config and 'content_selector' in config:
                            content_elems = soup.select(config['content_selector'])
                            content = ' '.join([elem.get_text().strip() for elem in content_elems[:3]])
                        else:
                            # Generic content extraction
                            content_elems = soup.select('p, .content, .article, .post')
                            content = ' '.join([elem.get_text().strip() for elem in content_elems[:3]])
                        
                        # Limit content length
                        if len(content) > 500:
                            content = content[:500] + "..."
                        
                        return ScrapedContent(
                            title=title,
                            content=content,
                            url=url,
                            timestamp=datetime.now(),
                            source=domain,
                            metadata={'type': 'specific_site', 'domain': domain}
                        )
            
            # If we reached here, we couldn't fetch or parse
            return ScrapedContent(
                title="Scraping Failed",
                content=f"Unable to scrape content from {url}",
                url=url,
                timestamp=datetime.now(),
                source="Error",
                metadata={'type': 'error'}
            )
            
        except Exception as e:
            return ScrapedContent(
                title="Scraping Error",
                content=f"Error scraping {url}: {str(e)}",
                url=url,
                timestamp=datetime.now(),
                source="Error",
                metadata={'type': 'error', 'error': str(e)}
            )
    
    async def intelligent_search_and_scrape(self, query: str, max_results: int = 5) -> Dict[str, List[ScrapedContent]]:
        """Intelligent search that determines content type and scrapes accordingly"""
        query_lower = query.lower()
        
        # Determine content type based on query
        content_type = 'general'
        if any(word in query_lower for word in ['news', 'headlines', 'breaking', 'latest']):
            content_type = 'news'
        elif any(word in query_lower for word in ['weather', 'temperature', 'forecast', 'rain', 'sunny']):
            content_type = 'weather'
        elif any(word in query_lower for word in ['buy', 'price', 'shop', 'product', 'purchase']):
            content_type = 'shopping'
        elif any(word in query_lower for word in ['research', 'study', 'paper', 'academic', 'journal']):
            content_type = 'academic'
        elif any(word in query_lower for word in ['reddit', 'twitter', 'facebook', 'social']):
            content_type = 'social'
        
        # Perform scraping
        results = await self.scrape_by_intent(query, content_type)
        
        # Organize results by source
        organized_results = {}
        for result in results[:max_results]:
            source = result.source
            if source not in organized_results:
                organized_results[source] = []
            organized_results[source].append(result)
        
        return organized_results
    
    def format_results_for_voice(self, results: Dict[str, List[ScrapedContent]]) -> str:
        """Format scraping results for voice response"""
        if not results:
            return "I couldn't find any relevant information."
        
        response_parts = []
        total_results = sum(len(source_results) for source_results in results.values())
        
        response_parts.append(f"I found {total_results} results from {len(results)} sources.")
        
        for source, source_results in list(results.items())[:2]:  # Limit to 2 sources for voice
            response_parts.append(f"From {source}:")
            for result in source_results[:2]:  # Limit to 2 results per source
                # Truncate content for voice
                content = result.content[:100] + "..." if len(result.content) > 100 else result.content
                response_parts.append(f"{result.title}. {content}")
        
        return " ".join(response_parts)

# Usage example
async def main():
    async with AdvancedWebScraper() as scraper:
        # Test different scraping types
        news_results = await scraper.scrape_by_intent("artificial intelligence", "news")
        weather_results = await scraper.scrape_by_intent("New York", "weather")
        search_results = await scraper.intelligent_search_and_scrape("best programming languages 2024")
        
        print("News Results:", len(news_results))
        print("Weather Results:", len(weather_results))
        print("Search Results:", search_results)
        
        # Format for voice
        voice_response = scraper.format_results_for_voice(search_results)
        print("Voice Response:", voice_response)

if __name__ == "__main__":
    asyncio.run(main())

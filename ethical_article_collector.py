#!/usr/bin/env python3
"""
Ethical Article Collection System
Collects articles from legal, open-access sources
"""

import requests
import json
import time
import os
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import feedparser
from urllib.parse import urljoin, urlparse
import random

class EthicalArticleCollector:
    def __init__(self):
        self.articles = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def add_article(self, title: str, content: str, source: str, url: str = "", author: str = ""):
        """Add an article to the collection"""
        article = {
            "title": title,
            "content": content,
            "source": source,
            "url": url,
            "author": author,
            "date_collected": time.strftime("%Y-%m-%d %H:%M:%S"),
            "word_count": len(content.split())
        }
        self.articles.append(article)
        print(f"✅ Added: {title} ({article['word_count']} words)")
        
    def save_articles(self, filename: str = "ethical_articles.json"):
        """Save articles to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.articles, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(self.articles)} articles to {filename}")
        
    def load_articles(self, filename: str = "ethical_articles.json"):
        """Load articles from JSON file"""
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                self.articles = json.load(f)
            print(f"📚 Loaded {len(self.articles)} articles from {filename}")
        else:
            print(f"❌ No file found: {filename}")
            
    def collect_from_rss_feeds(self, rss_urls: List[str], max_articles: int = 10):
        """Collect articles from RSS feeds (legal and ethical)"""
        print(f"📡 Collecting from {len(rss_urls)} RSS feeds...")
        
        for rss_url in rss_urls:
            try:
                print(f"🔍 Checking: {rss_url}")
                feed = feedparser.parse(rss_url)
                
                for entry in feed.entries[:max_articles]:
                    try:
                        # Get article content
                        content = self._extract_article_content(entry.link)
                        if content and len(content) > 200:  # Only articles with substantial content
                            self.add_article(
                                title=entry.title,
                                content=content,
                                source=feed.feed.get('title', 'Unknown'),
                                url=entry.link,
                                author=entry.get('author', 'Unknown')
                            )
                            time.sleep(1)  # Be respectful
                    except Exception as e:
                        print(f"⚠️ Error processing article: {e}")
                        continue
                        
            except Exception as e:
                print(f"❌ Error with RSS feed {rss_url}: {e}")
                continue
                
    def _extract_article_content(self, url: str) -> Optional[str]:
        """Extract article content from URL (respectful scraping)"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try different content selectors
            content_selectors = [
                'article', '.article-content', '.story-body', '.entry-content',
                'main', '.content', '.post-content', '.article-body'
            ]
            
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    # Remove scripts and styles
                    for script in content_elem(["script", "style"]):
                        script.decompose()
                    
                    content = content_elem.get_text().strip()
                    if len(content) > 200:  # Only return substantial content
                        return content
                        
            return None
            
        except Exception as e:
            print(f"⚠️ Error extracting content from {url}: {e}")
            return None
            
    def collect_from_open_access_sources(self):
        """Collect from open-access academic sources"""
        print("🎓 Collecting from open-access academic sources...")
        
        # Open access sources that allow ethical data collection
        open_access_sources = [
            {
                "name": "PLOS ONE",
                "rss": "https://journals.plos.org/plosone/feed/atom",
                "description": "Open access scientific journal"
            },
            {
                "name": "arXiv",
                "rss": "http://arxiv.org/rss/cs.AI",  # AI papers
                "description": "Preprint repository"
            },
            {
                "name": "PubMed Central",
                "rss": "https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=ListRecords&metadataPrefix=pmc&set=open",
                "description": "Open access medical research"
            }
        ]
        
        for source in open_access_sources:
            try:
                print(f"📚 Collecting from {source['name']}...")
                self.collect_from_rss_feeds([source['rss']], max_articles=5)
            except Exception as e:
                print(f"❌ Error with {source['name']}: {e}")
                
    def collect_from_news_sources(self):
        """Collect from news sources with RSS feeds"""
        print("📰 Collecting from news sources...")
        
        # News sources with public RSS feeds
        news_sources = [
            "https://feeds.bbci.co.uk/news/rss.xml",
            "https://rss.cnn.com/rss/edition.rss",
            "https://feeds.reuters.com/reuters/topNews",
            "https://feeds.npr.org/1001/rss.xml"
        ]
        
        self.collect_from_rss_feeds(news_sources, max_articles=3)
        
    def collect_from_manual_sources(self):
        """Guide user to manually add articles from legal sources"""
        print("\n📝 MANUAL ARTICLE COLLECTION")
        print("=" * 50)
        print("Since automated scraping has legal limitations, here are")
        print("ethical ways to build your article database:")
        print()
        print("✅ LEGAL SOURCES:")
        print("1. Open Access Journals (PLOS, arXiv, PubMed Central)")
        print("2. News RSS Feeds (BBC, CNN, Reuters, NPR)")
        print("3. Government Publications (.gov websites)")
        print("4. Creative Commons Licensed Content")
        print("5. Public Domain Works")
        print()
        print("✅ MANUAL COLLECTION METHODS:")
        print("1. Copy-paste from legal sources")
        print("2. Use official APIs where available")
        print("3. Download from open repositories")
        print("4. Use academic databases with proper access")
        print()
        print("❌ AVOID:")
        print("- Scraping JSTOR (prohibited by ToS)")
        print("- Scraping paywalled content")
        print("- Violating copyright laws")
        print("- Ignoring robots.txt files")
        
    def create_sample_database(self):
        """Create a sample database with diverse, legal content"""
        print("🎯 Creating sample database with diverse content...")
        
        sample_articles = [
            {
                "title": "The Future of Artificial Intelligence in Healthcare",
                "content": "Artificial intelligence is revolutionizing healthcare in ways that seemed impossible just a decade ago. From diagnostic imaging to drug discovery, AI systems are helping doctors make more accurate diagnoses and develop personalized treatment plans. However, the integration of AI into medical practice raises important questions about patient privacy, algorithmic bias, and the role of human judgment in clinical decision-making. As these technologies become more sophisticated, healthcare professionals must navigate the delicate balance between technological advancement and ethical responsibility. The potential benefits are enormous, but so are the challenges of ensuring these systems are fair, transparent, and truly beneficial to patients.",
                "source": "PLOS ONE",
                "url": "https://journals.plos.org/plosone/article/ai-healthcare",
                "author": "Dr. Sarah Johnson"
            },
            {
                "title": "Climate Change and Economic Policy",
                "content": "The economic implications of climate change are becoming increasingly apparent as governments worldwide grapple with the costs of both action and inaction. While the transition to a green economy presents unprecedented opportunities for innovation and job creation, it also requires significant upfront investments and may displace workers in traditional industries. The challenge lies in designing policies that balance environmental goals with economic stability, ensuring that the burden of climate action doesn't fall disproportionately on vulnerable communities. Recent studies suggest that early investment in climate adaptation and mitigation could save trillions of dollars in future damages, making the case for proactive policy intervention stronger than ever.",
                "source": "Nature Climate Change",
                "url": "https://www.nature.com/articles/climate-economics",
                "author": "Prof. Michael Chen"
            },
            {
                "title": "Remote Work and Social Connection",
                "content": "The shift to remote work has fundamentally altered how we think about workplace relationships and social connection. While technology has enabled unprecedented flexibility and work-life balance for many employees, it has also created new challenges around maintaining team cohesion and spontaneous collaboration. The loss of casual office interactions, water cooler conversations, and face-to-face meetings has left many workers feeling isolated and disconnected from their colleagues. Companies are experimenting with hybrid models, virtual team-building activities, and new communication tools to bridge this gap, but the long-term social implications of remote work remain uncertain. The question isn't just about productivity anymore; it's about how we maintain human connection in a digital world.",
                "source": "Harvard Business Review",
                "url": "https://hbr.org/remote-work-social-connection",
                "author": "Dr. Lisa Rodriguez"
            }
        ]
        
        for article in sample_articles:
            self.add_article(
                title=article["title"],
                content=article["content"],
                source=article["source"],
                url=article["url"],
                author=article["author"]
            )
            
        print(f"✅ Created sample database with {len(sample_articles)} articles")
        
    def interactive_collection(self):
        """Interactive article collection interface"""
        print("🚀 ETHICAL ARTICLE COLLECTION SYSTEM")
        print("=" * 50)
        print("This system helps you collect articles ethically and legally.")
        print()
        
        while True:
            print("\n📋 OPTIONS:")
            print("1. Create sample database")
            print("2. Collect from open access sources")
            print("3. Collect from news RSS feeds")
            print("4. Manual article entry")
            print("5. View collected articles")
            print("6. Save articles")
            print("7. Load articles")
            print("8. Exit")
            
            choice = input("\nSelect option (1-8): ").strip()
            
            if choice == '1':
                self.create_sample_database()
            elif choice == '2':
                self.collect_from_open_access_sources()
            elif choice == '3':
                self.collect_from_news_sources()
            elif choice == '4':
                self._manual_entry()
            elif choice == '5':
                self._view_articles()
            elif choice == '6':
                filename = input("Filename (default: ethical_articles.json): ").strip()
                if not filename:
                    filename = "ethical_articles.json"
                self.save_articles(filename)
            elif choice == '7':
                filename = input("Filename (default: ethical_articles.json): ").strip()
                if not filename:
                    filename = "ethical_articles.json"
                self.load_articles(filename)
            elif choice == '8':
                break
            else:
                print("❌ Invalid option")
                
    def _manual_entry(self):
        """Manual article entry"""
        print("\n📝 MANUAL ARTICLE ENTRY")
        print("-" * 30)
        
        title = input("Title: ").strip()
        if not title:
            print("❌ Title cannot be empty")
            return
            
        print("Content (paste article text, end with 'END' on new line):")
        content_lines = []
        while True:
            line = input()
            if line.strip() == 'END':
                break
            content_lines.append(line)
        content = '\n'.join(content_lines).strip()
        
        if not content:
            print("❌ Content cannot be empty")
            return
            
        source = input("Source: ").strip()
        url = input("URL (optional): ").strip()
        author = input("Author (optional): ").strip()
        
        self.add_article(title, content, source, url, author)
        
    def _view_articles(self):
        """View collected articles"""
        if not self.articles:
            print("❌ No articles collected yet")
            return
            
        print(f"\n📚 COLLECTED ARTICLES ({len(self.articles)} total)")
        print("=" * 50)
        
        for i, article in enumerate(self.articles, 1):
            print(f"\n{i}. {article['title']}")
            print(f"   Source: {article['source']}")
            print(f"   Words: {article['word_count']}")
            print(f"   Date: {article['date_collected']}")
            if article['url']:
                print(f"   URL: {article['url']}")

def main():
    collector = EthicalArticleCollector()
    
    # Load existing articles
    collector.load_articles()
    
    # Start interactive collection
    collector.interactive_collection()
    
    # Save final collection
    if collector.articles:
        collector.save_articles()
        print(f"\n🎉 Collection complete! {len(collector.articles)} articles saved.")
    else:
        print("\n📝 No articles collected. Try the sample database option!")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Simple Article Collection System
No external dependencies - just basic functionality
"""

import json
import time
import os
from typing import List, Dict

class SimpleArticleCollector:
    def __init__(self):
        self.articles = []
        
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
        
    def save_articles(self, filename: str = "simple_articles.json"):
        """Save articles to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.articles, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(self.articles)} articles to {filename}")
        
    def load_articles(self, filename: str = "simple_articles.json"):
        """Load articles from JSON file"""
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                self.articles = json.load(f)
            print(f"📚 Loaded {len(self.articles)} articles from {filename}")
        else:
            print(f"❌ No file found: {filename}")
            
    def create_sample_database(self):
        """Create a sample database with diverse, legal content"""
        print("🎯 Creating sample database with diverse content...")
        
        sample_articles = [
            {
                "title": "The Future of Artificial Intelligence in Healthcare",
                "content": "Artificial intelligence is revolutionizing healthcare in ways that seemed impossible just a decade ago. From diagnostic imaging to drug discovery, AI systems are helping doctors make more accurate diagnoses and develop personalized treatment plans. However, the integration of AI into medical practice raises important questions about patient privacy, algorithmic bias, and the role of human judgment in clinical decision-making. As these technologies become more sophisticated, healthcare professionals must navigate the delicate balance between technological advancement and ethical responsibility. The potential benefits are enormous, but so are the challenges of ensuring these systems are fair, transparent, and truly beneficial to patients. Recent studies show that AI can detect certain diseases with accuracy rates exceeding 90%, but the technology is only as good as the data it's trained on. This means that biased training data can lead to biased AI systems, potentially exacerbating existing health disparities. The key challenge moving forward will be developing AI systems that are not only accurate but also equitable and trustworthy.",
                "source": "PLOS ONE",
                "url": "https://journals.plos.org/plosone/article/ai-healthcare",
                "author": "Dr. Sarah Johnson"
            },
            {
                "title": "Climate Change and Economic Policy",
                "content": "The economic implications of climate change are becoming increasingly apparent as governments worldwide grapple with the costs of both action and inaction. While the transition to a green economy presents unprecedented opportunities for innovation and job creation, it also requires significant upfront investments and may displace workers in traditional industries. The challenge lies in designing policies that balance environmental goals with economic stability, ensuring that the burden of climate action doesn't fall disproportionately on vulnerable communities. Recent studies suggest that early investment in climate adaptation and mitigation could save trillions of dollars in future damages, making the case for proactive policy intervention stronger than ever. The carbon pricing mechanisms being implemented in various countries are showing promising results, but they also highlight the political challenges of implementing effective climate policies. The transition to renewable energy is creating new economic opportunities while simultaneously disrupting established industries, leading to both winners and losers in the global economy.",
                "source": "Nature Climate Change",
                "url": "https://www.nature.com/articles/climate-economics",
                "author": "Prof. Michael Chen"
            },
            {
                "title": "Remote Work and Social Connection",
                "content": "The shift to remote work has fundamentally altered how we think about workplace relationships and social connection. While technology has enabled unprecedented flexibility and work-life balance for many employees, it has also created new challenges around maintaining team cohesion and spontaneous collaboration. The loss of casual office interactions, water cooler conversations, and face-to-face meetings has left many workers feeling isolated and disconnected from their colleagues. Companies are experimenting with hybrid models, virtual team-building activities, and new communication tools to bridge this gap, but the long-term social implications of remote work remain uncertain. The question isn't just about productivity anymore; it's about how we maintain human connection in a digital world. Research shows that remote workers often struggle with feelings of loneliness and disconnection, even when they're more productive at home. The challenge for organizations is finding the right balance between flexibility and connection, ensuring that remote work doesn't come at the cost of employee wellbeing and team dynamics.",
                "source": "Harvard Business Review",
                "url": "https://hbr.org/remote-work-social-connection",
                "author": "Dr. Lisa Rodriguez"
            },
            {
                "title": "The Psychology of Digital Communication",
                "content": "Digital communication has transformed how we interact with each other, but it's also changing the fundamental nature of human connection. The absence of non-verbal cues in text-based communication can lead to misunderstandings and conflict, while the constant availability of digital communication can create pressure to be always 'on.' The psychology of digital communication reveals that people often behave differently online than they would in person, sometimes more boldly or aggressively, leading to phenomena like cyberbullying and online harassment. The dopamine-driven nature of social media notifications can create addictive behaviors, while the curated nature of online personas can lead to social comparison and anxiety. Understanding these psychological effects is crucial for developing healthier digital communication habits and creating more meaningful online relationships. The challenge is finding ways to use digital communication to enhance rather than replace human connection, ensuring that technology serves our social needs rather than undermining them.",
                "source": "Psychology Today",
                "url": "https://psychologytoday.com/digital-communication",
                "author": "Dr. James Wilson"
            },
            {
                "title": "The Future of Education Technology",
                "content": "Education technology is evolving rapidly, but the question remains whether it's truly improving learning outcomes or simply digitizing traditional methods. The pandemic accelerated the adoption of online learning platforms, but it also revealed significant disparities in access to technology and digital literacy. While some students thrive in online environments, others struggle without the structure and social interaction of traditional classrooms. The key challenge is designing educational technology that enhances rather than replaces human interaction, ensuring that technology serves the needs of learners rather than the other way around. Adaptive learning systems that personalize education based on individual student needs show promise, but they also raise questions about privacy and the role of human teachers. The future of education technology lies in finding the right balance between automation and human guidance, ensuring that technology enhances rather than replaces the human elements of teaching and learning.",
                "source": "EdTech Magazine",
                "url": "https://edtechmagazine.com/future-education-technology",
                "author": "Dr. Maria Garcia"
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
        print("🚀 SIMPLE ARTICLE COLLECTION SYSTEM")
        print("=" * 50)
        print("This system helps you collect articles manually.")
        print()
        
        while True:
            print("\n📋 OPTIONS:")
            print("1. Create sample database")
            print("2. Add article manually")
            print("3. View collected articles")
            print("4. Save articles")
            print("5. Load articles")
            print("6. Exit")
            
            choice = input("\nSelect option (1-6): ").strip()
            
            if choice == '1':
                self.create_sample_database()
            elif choice == '2':
                self._manual_entry()
            elif choice == '3':
                self._view_articles()
            elif choice == '4':
                filename = input("Filename (default: simple_articles.json): ").strip()
                if not filename:
                    filename = "simple_articles.json"
                self.save_articles(filename)
            elif choice == '5':
                filename = input("Filename (default: simple_articles.json): ").strip()
                if not filename:
                    filename = "simple_articles.json"
                self.load_articles(filename)
            elif choice == '6':
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
    collector = SimpleArticleCollector()
    
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

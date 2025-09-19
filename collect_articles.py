#!/usr/bin/env python3
"""
Article Collection Script
Helps collect NYT/WSJ articles for the human writer RAG system
"""

import json
import os
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
import time

class ArticleCollector:
    def __init__(self):
        self.articles = []
        
    def add_manual_article(self, title: str, content: str, source: str, url: str = ""):
        """Manually add an article"""
        article = {
            "title": title,
            "content": content,
            "source": source,
            "url": url,
            "date_added": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.articles.append(article)
        print(f"Added: {title}")
        
    def save_articles(self, filename: str = "collected_articles.json"):
        """Save articles to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.articles, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(self.articles)} articles to {filename}")
        
    def load_articles(self, filename: str = "collected_articles.json"):
        """Load articles from JSON file"""
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                self.articles = json.load(f)
            print(f"Loaded {len(self.articles)} articles from {filename}")
        else:
            print(f"No file found: {filename}")
            
    def interactive_collection(self):
        """Interactive mode for collecting articles"""
        print("=== Article Collection Tool ===")
        print("Enter articles manually. Type 'done' when finished.")
        print("Type 'save' to save current collection.")
        print("Type 'load' to load existing collection.")
        print()
        
        while True:
            command = input("Command (add/save/load/done): ").strip().lower()
            
            if command == 'done':
                break
            elif command == 'save':
                filename = input("Filename (default: collected_articles.json): ").strip()
                if not filename:
                    filename = "collected_articles.json"
                self.save_articles(filename)
            elif command == 'load':
                filename = input("Filename (default: collected_articles.json): ").strip()
                if not filename:
                    filename = "collected_articles.json"
                self.load_articles(filename)
            elif command == 'add':
                print("\n--- Add New Article ---")
                title = input("Title: ").strip()
                if not title:
                    print("Title cannot be empty")
                    continue
                    
                print("Content (paste article text, end with 'END' on new line):")
                content_lines = []
                while True:
                    line = input()
                    if line.strip() == 'END':
                        break
                    content_lines.append(line)
                content = '\n'.join(content_lines).strip()
                
                if not content:
                    print("Content cannot be empty")
                    continue
                    
                source = input("Source (NYT/WSJ/etc): ").strip()
                url = input("URL (optional): ").strip()
                
                self.add_manual_article(title, content, source, url)
                print()
            else:
                print("Unknown command")

def main():
    collector = ArticleCollector()
    
    # Try to load existing articles
    collector.load_articles()
    
    # Start interactive collection
    collector.interactive_collection()
    
    # Save final collection
    if collector.articles:
        collector.save_articles()
        print(f"\nCollection complete! {len(collector.articles)} articles saved.")
    else:
        print("No articles collected.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Human Writer RAG System
Uses NYT/WSJ articles as knowledge base to generate human-like text
"""

import openai
import json
import numpy as np
from typing import List, Dict, Any
import os
from dataclasses import dataclass
import pickle
from sentence_transformers import SentenceTransformer
import requests
from bs4 import BeautifulSoup
import time

@dataclass
class Article:
    title: str
    content: str
    source: str
    url: str
    embedding: List[float] = None

class HumanWriterRAG:
    def __init__(self, openai_api_key: str):
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.articles: List[Article] = []
        self.embeddings_file = "article_embeddings.pkl"
        
    def add_article(self, title: str, content: str, source: str, url: str = ""):
        """Add an article to the knowledge base"""
        article = Article(title=title, content=content, source=source, url=url)
        article.embedding = self.embedding_model.encode(content).tolist()
        self.articles.append(article)
        print(f"Added article: {title}")
        
    def save_embeddings(self):
        """Save articles and embeddings to disk"""
        with open(self.embeddings_file, 'wb') as f:
            pickle.dump(self.articles, f)
        print(f"Saved {len(self.articles)} articles to {self.embeddings_file}")
        
    def load_embeddings(self):
        """Load articles and embeddings from disk"""
        if os.path.exists(self.embeddings_file):
            with open(self.embeddings_file, 'rb') as f:
                self.articles = pickle.load(f)
            print(f"Loaded {len(self.articles)} articles from {self.embeddings_file}")
        else:
            print("No saved embeddings found")
            
    def find_similar_articles(self, query: str, top_k: int = 3) -> List[Article]:
        """Find most similar articles to the query"""
        if not self.articles:
            return []
            
        query_embedding = self.embedding_model.encode(query)
        
        # Calculate similarities
        similarities = []
        for article in self.articles:
            similarity = np.dot(query_embedding, article.embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(article.embedding)
            )
            similarities.append((similarity, article))
            
        # Return top-k most similar articles
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [article for _, article in similarities[:top_k]]
        
    def generate_human_like_response(self, question: str, max_tokens: int = 300, use_advanced_prompt: bool = True) -> str:
        """Generate a human-like response using RAG"""
        
        # Find similar articles
        similar_articles = self.find_similar_articles(question, top_k=3)
        
        if not similar_articles:
            return "I don't have enough relevant articles in my knowledge base to answer this question."
            
        # Create context from similar articles
        context_examples = []
        for i, article in enumerate(similar_articles):
            # Extract first few sentences as style examples
            sentences = article.content.split('.')[:3]
            example_text = '. '.join(sentences) + '.'
            context_examples.append(f"Example {i+1} ({article.source}): {example_text}")
            
        context = "\n\n".join(context_examples)
        
        if use_advanced_prompt:
            # Simplified but effective AI detection evasion prompt
            system_prompt = f"""You are a human journalist writing for a major newspaper. Write naturally and conversationally.

CRITICAL RULES:
- Vary sentence lengths dramatically (mix short punchy sentences with longer flowing ones)
- Use contractions naturally (it's, don't, won't, etc.)
- Include occasional rhetorical questions or asides
- Start some sentences with conjunctions (But, And, So)
- Use slightly imperfect grammar that sounds natural
- Include one sentence fragment
- Avoid repetitive sentence starters
- Write like you're talking to a friend, not a robot
- DO NOT INCLUDE EM DASHES "—" ANYWHERE IN YOUR OUTPUT AT ALL!
- Have imperfection

STYLE EXAMPLES TO EMULATE:
{context}

Write a single paragraph answering the question. Sound completely human and natural."""
        else:
            # Original simpler prompt
            system_prompt = f"""You are a human writer who has studied thousands of New York Times and Wall Street Journal articles. 
Your writing style should mimic professional journalism with these characteristics:
- Varied sentence lengths and structures
- Natural transitions and flow
- Professional but accessible tone
- Occasional contractions and informal phrases
- Rich vocabulary but not overly complex
- Human-like imperfections and natural rhythm
- DO NOT INCLUDE EM DASHES "—" ANYWHERE IN YOUR OUTPUT AT ALL!
- Have imperfection

Here are some examples of the writing style you should emulate:
{context}

Write a single, well-crafted paragraph that answers the user's question in the style of these examples. Make it sound completely human and natural."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",  # Sometimes better at following specific instructions
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                max_tokens=max_tokens,
                temperature=0.9  # Higher temperature for more natural variation
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def generate_two_stage_response(self, question: str, max_tokens: int = 300) -> str:
        """Generate response using two-stage approach: RAG + Advanced Rewriting"""
        
        # Stage 1: Generate initial response with RAG
        initial_response = self.generate_human_like_response(question, max_tokens, use_advanced_prompt=False)
        
        if "Error" in initial_response or "don't have enough" in initial_response:
            return initial_response
        
        # Stage 2: Apply advanced rewriting prompt
        rewriting_prompt = f"""Rewrite this text to sound completely human. Make these specific changes:

1. Vary sentence lengths dramatically - mix very short sentences (3-8 words) with longer ones (20-30 words)
2. Use contractions naturally (it's, don't, won't, can't, etc.)
3. Start some sentences with conjunctions (But, And, So, Yet)
4. Include one rhetorical question
5. Add one sentence fragment (incomplete sentence)
6. Use slightly informal language and natural speech patterns
7. Include one parenthetical aside (like this)
8. Avoid repetitive sentence starters
9. Make it sound conversational, not robotic

Keep all the facts and meaning the same. Just make it sound like a real human wrote it.

TEXT TO REWRITE: {initial_response}"""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",  # Sometimes better at following specific instructions
                messages=[
                    {"role": "user", "content": rewriting_prompt}
                ],
                max_tokens=max_tokens,
                temperature=1.0  # Maximum temperature for most natural variation
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error in rewriting stage: {str(e)}"
    
    def add_article_from_url(self, url: str, source: str = "Unknown"):
        """Add an article by scraping from URL (use responsibly)"""
        try:
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to find title and content (adjust selectors based on site)
            title = soup.find('h1') or soup.find('title')
            title = title.get_text().strip() if title else "Untitled"
            
            # Try to find main content
            content_selectors = [
                'article', '.article-content', '.story-body', 
                '.entry-content', 'main', '.content'
            ]
            
            content = ""
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    content = content_elem.get_text().strip()
                    break
                    
            if not content:
                content = soup.get_text()[:2000]  # Fallback
                
            self.add_article(title, content, source, url)
            time.sleep(1)  # Be respectful with requests
            
        except Exception as e:
            print(f"Error adding article from {url}: {str(e)}")

def main():
    """Example usage"""
    # Initialize with your OpenAI API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Please set OPENAI_API_KEY environment variable")
        return
        
    rag = HumanWriterRAG(api_key)
    
    # Load existing articles
    rag.load_embeddings()
    
    # Example: Add some sample articles (replace with your actual articles)
    sample_articles = [
        {
            "title": "The Future of Artificial Intelligence",
            "content": "Artificial intelligence is rapidly transforming industries across the globe. From healthcare to finance, AI systems are becoming increasingly sophisticated, capable of tasks that once required human expertise. However, this technological revolution brings both opportunities and challenges that society must carefully navigate.",
            "source": "New York Times"
        },
        {
            "title": "Economic Outlook for 2024",
            "content": "As we enter 2024, economists are cautiously optimistic about the global economic outlook. While inflation remains a concern in many developed nations, there are signs that central banks' monetary policies are beginning to take effect. The job market continues to show resilience, though certain sectors face ongoing challenges.",
            "source": "Wall Street Journal"
        }
    ]
    
    # Add sample articles
    for article in sample_articles:
        rag.add_article(
            title=article["title"],
            content=article["content"],
            source=article["source"]
        )
    
    # Save embeddings
    rag.save_embeddings()
    
    # Example query
    question = "What are the main challenges facing the technology sector today?"
    
    print(f"Question: {question}")
    print("\n" + "="*50)
    
    # Test different approaches
    print("\n1. BASIC RAG RESPONSE:")
    basic_response = rag.generate_human_like_response(question, use_advanced_prompt=False)
    print(basic_response)
    
    print("\n2. ADVANCED RAG RESPONSE (with your prompt integrated):")
    advanced_response = rag.generate_human_like_response(question, use_advanced_prompt=True)
    print(advanced_response)
    
    print("\n3. TWO-STAGE RESPONSE (RAG + Advanced Rewriting):")
    two_stage_response = rag.generate_two_stage_response(question)
    print(two_stage_response)

if __name__ == "__main__":
    main()

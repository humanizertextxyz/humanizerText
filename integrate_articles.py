#!/usr/bin/env python3
"""
Integrate collected articles with the RAG system
"""

import json
import os
from human_writer_rag import HumanWriterRAG

def integrate_articles_with_rag():
    """Integrate collected articles with the RAG system"""
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Error: Please set your OPENAI_API_KEY environment variable")
        print("Run: export OPENAI_API_KEY='your-api-key-here'")
        return
    
    print("🔗 INTEGRATING ARTICLES WITH RAG SYSTEM")
    print("=" * 50)
    
    # Initialize RAG system
    rag = HumanWriterRAG(api_key)
    
    # Load existing articles
    article_files = [
        "ethical_articles.json",
        "collected_articles.json"
    ]
    
    total_articles = 0
    
    for filename in article_files:
        if os.path.exists(filename):
            print(f"📚 Loading articles from {filename}...")
            
            with open(filename, 'r', encoding='utf-8') as f:
                articles = json.load(f)
                
            for article in articles:
                rag.add_article(
                    title=article.get('title', 'Untitled'),
                    content=article.get('content', ''),
                    source=article.get('source', 'Unknown'),
                    url=article.get('url', '')
                )
                total_articles += 1
                
            print(f"✅ Loaded {len(articles)} articles from {filename}")
        else:
            print(f"⚠️ File not found: {filename}")
    
    if total_articles == 0:
        print("❌ No articles found. Please collect some articles first.")
        print("Run: python3 ethical_article_collector.py")
        return
    
    # Save embeddings
    rag.save_embeddings()
    print(f"💾 Saved embeddings for {total_articles} articles")
    
    # Test the system
    print("\n🧪 TESTING THE SYSTEM")
    print("=" * 30)
    
    test_questions = [
        "What are the main challenges with AI in healthcare?",
        "How is climate change affecting the economy?",
        "What are the social implications of remote work?"
    ]
    
    for question in test_questions:
        print(f"\n📝 Question: {question}")
        print("-" * 40)
        
        try:
            response = rag.generate_two_stage_response(question, max_tokens=200)
            print(f"Answer: {response}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n🎉 Integration complete! {total_articles} articles ready for use.")
    print("\n💡 Next steps:")
    print("1. Test with your own questions")
    print("2. Add more articles to improve results")
    print("3. Use the system for AI detection evasion")

if __name__ == "__main__":
    integrate_articles_with_rag()

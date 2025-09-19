#!/usr/bin/env python3
"""
Demonstration of RAG vs Regular Prompting
Shows the key differences in practice
"""

import os
from human_writer_rag import HumanWriterRAG

def demo_rag_vs_prompting():
    """Demonstrate the differences between RAG and regular prompting"""
    
    print("🔍 RAG vs Regular Prompting Demo")
    print("=" * 50)
    
    # Initialize RAG system
    rag = HumanWriterRAG("dummy-key")  # Using dummy key for demo
    
    # Add specific articles to knowledge base
    print("📚 Adding specific articles to knowledge base...")
    
    # Article 1: Focus on economic impact
    rag.add_article(
        title="Remote Work's Economic Impact",
        content="Remote work has fundamentally altered the economic landscape. Companies are saving billions on office space while employees are spending more on home office setups. The shift has created new economic winners and losers. Real estate markets in major cities are struggling as demand for office space plummets, while suburban home prices are soaring. Local businesses that relied on office workers are closing, but delivery services and home improvement companies are booming. It's a classic case of creative destruction in action.",
        source="Wall Street Journal"
    )
    
    # Article 2: Focus on psychological effects
    rag.add_article(
        title="The Isolation of Remote Work",
        content="The psychological toll of remote work is becoming increasingly apparent. Many employees report feeling disconnected from their colleagues and company culture. The lack of spontaneous interactions that used to happen in office hallways has created a sense of isolation. Some workers are struggling with the blurring of work and personal life boundaries. The constant video calls can be exhausting, and the absence of non-verbal cues makes communication more challenging. It's not just about productivity anymore; it's about human connection.",
        source="New York Times"
    )
    
    # Article 3: Focus on technology challenges
    rag.add_article(
        title="Tech Infrastructure for Remote Work",
        content="The technology infrastructure supporting remote work is still catching up to demand. Companies are investing heavily in cloud computing, cybersecurity, and collaboration tools. The shift has accelerated digital transformation by years. However, the digital divide has become more apparent, with some employees lacking reliable internet access or proper equipment. IT departments are overwhelmed with support requests, and cybersecurity threats have increased as more data moves outside corporate networks.",
        source="New York Times"
    )
    
    print("✅ Added 3 diverse articles to knowledge base")
    
    # Test question
    question = "What are the main challenges with remote work?"
    
    print(f"\n📝 QUESTION: {question}")
    print("=" * 50)
    
    # Show what RAG would do
    print("\n🎯 RAG APPROACH:")
    print("-" * 30)
    print("1. Finds most relevant articles from knowledge base")
    print("2. Uses their specific writing style and content")
    print("3. Generates response based on actual examples")
    
    # Show what regular prompting would do
    print("\n📝 REGULAR PROMPTING APPROACH:")
    print("-" * 30)
    print("1. Uses general model knowledge")
    print("2. Applies generic 'journalistic style'")
    print("3. No specific examples or content")
    
    print("\n🔍 KEY DIFFERENCES:")
    print("=" * 50)
    
    print("\n1️⃣ STYLE CONSISTENCY:")
    print("RAG: Uses actual writing patterns from your articles")
    print("Regular: Uses model's general understanding of 'journalistic style'")
    
    print("\n2️⃣ CONTENT RELEVANCE:")
    print("RAG: Pulls from articles most similar to your question")
    print("Regular: Relies on model's general knowledge")
    
    print("\n3️⃣ CUSTOMIZATION:")
    print("RAG: Adapts to your specific article collection")
    print("Regular: One-size-fits-all approach")
    
    print("\n4️⃣ CONSISTENCY:")
    print("RAG: Consistent with your knowledge base")
    print("Regular: May vary based on model's training")
    
    print("\n💡 WHEN TO USE EACH:")
    print("=" * 50)
    
    print("\n✅ USE RAG WHEN:")
    print("- You have a specific style you want to emulate")
    print("- You want topic-relevant responses")
    print("- You have a knowledge base of examples")
    print("- You need consistent output style")
    
    print("\n✅ USE REGULAR PROMPTING WHEN:")
    print("- You want general, creative responses")
    print("- You don't have specific examples")
    print("- You want maximum flexibility")
    print("- You're okay with generic style")
    
    print("\n🎯 FOR AI DETECTION EVASION:")
    print("RAG is better because:")
    print("- Uses real human writing patterns from your articles")
    print("- More natural variation based on actual examples")
    print("- Harder for detectors to identify as AI-generated")
    print("- Mimics specific writing styles more accurately")

if __name__ == "__main__":
    demo_rag_vs_prompting()

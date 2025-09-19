#!/usr/bin/env python3
"""
Simple test script for the Human Writer RAG system
"""

import os
from human_writer_rag import HumanWriterRAG

def test_system():
    """Test the human writer system with sample data"""
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Error: Please set your OPENAI_API_KEY environment variable")
        print("Run: export OPENAI_API_KEY='your-api-key-here'")
        return
    
    print("🚀 Initializing Human Writer RAG System...")
    
    # Initialize the system
    rag = HumanWriterRAG(api_key)
    
    # Add some sample articles (replace with your actual articles)
    print("📚 Adding sample articles...")
    
    sample_articles = [
        {
            "title": "The Future of Artificial Intelligence in Healthcare",
            "content": "Artificial intelligence is revolutionizing healthcare in ways that seemed impossible just a decade ago. From diagnostic imaging to drug discovery, AI systems are helping doctors make more accurate diagnoses and develop personalized treatment plans. However, the integration of AI into medical practice raises important questions about patient privacy, algorithmic bias, and the role of human judgment in clinical decision-making. As these technologies become more sophisticated, healthcare professionals must navigate the delicate balance between technological advancement and ethical responsibility.",
            "source": "New York Times"
        },
        {
            "title": "Economic Impact of Climate Change Policies",
            "content": "The transition to a green economy presents both unprecedented opportunities and significant challenges for businesses worldwide. Companies that adapt quickly to climate change regulations often find themselves at a competitive advantage, while those that resist change face mounting financial pressures. The shift toward renewable energy has created millions of new jobs while simultaneously displacing workers in traditional fossil fuel industries. Governments must carefully balance environmental goals with economic stability, ensuring that climate policies don't disproportionately burden vulnerable communities.",
            "source": "Wall Street Journal"
        },
        {
            "title": "The Evolution of Remote Work Culture",
            "content": "Remote work has fundamentally altered how we think about productivity, collaboration, and work-life balance. While many employees have embraced the flexibility of working from home, others struggle with isolation and the blurring of boundaries between personal and professional life. Companies are experimenting with hybrid models that combine the benefits of remote work with the social connections of office environments. The long-term implications of this shift remain uncertain, but one thing is clear: the traditional office-based work model has been permanently transformed.",
            "source": "New York Times"
        }
    ]
    
    # Add articles to the system
    for article in sample_articles:
        rag.add_article(
            title=article["title"],
            content=article["content"],
            source=article["source"]
        )
    
    # Save embeddings
    rag.save_embeddings()
    print(f"✅ Added {len(sample_articles)} articles to knowledge base")
    
    # Test questions
    test_questions = [
        "What are the main challenges facing AI in healthcare?",
        "How is climate change affecting the economy?",
        "What are the benefits and drawbacks of remote work?"
    ]
    
    print("\n" + "="*60)
    print("🧪 TESTING DIFFERENT APPROACHES")
    print("="*60)
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n📝 TEST QUESTION {i}: {question}")
        print("-" * 50)
        
        # Test 1: Basic RAG
        print("\n1️⃣ BASIC RAG RESPONSE:")
        basic_response = rag.generate_human_like_response(question, use_advanced_prompt=False)
        print(basic_response)
        
        # Test 2: Advanced RAG (with your prompt)
        print("\n2️⃣ ADVANCED RAG RESPONSE (with AI detection evasion):")
        advanced_response = rag.generate_human_like_response(question, use_advanced_prompt=True)
        print(advanced_response)
        
        # Test 3: Two-stage approach
        print("\n3️⃣ TWO-STAGE RESPONSE (RAG + Advanced Rewriting):")
        two_stage_response = rag.generate_two_stage_response(question)
        print(two_stage_response)
        
        print("\n" + "="*60)
    
    print("\n🎉 Testing complete!")
    print("\n💡 Tips:")
    print("- Compare the three approaches to see which works best for your needs")
    print("- The two-stage approach typically gives the best AI detection evasion")
    print("- Add more diverse articles to improve results")
    print("- Test with AI detection tools like GPTZero or Originality.ai")

if __name__ == "__main__":
    test_system()

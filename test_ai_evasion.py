#!/usr/bin/env python3
"""
Specialized test for AI detection evasion
Focuses on the most effective techniques
"""

import os
from human_writer_rag import HumanWriterRAG

def test_ai_evasion():
    """Test AI detection evasion with improved prompts"""
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Error: Please set your OPENAI_API_KEY environment variable")
        print("Run: export OPENAI_API_KEY='your-api-key-here'")
        return
    
    print("🚀 Testing AI Detection Evasion...")
    
    # Initialize the system
    rag = HumanWriterRAG(api_key)
    
    # Add diverse sample articles
    print("📚 Adding diverse sample articles...")
    
    sample_articles = [
        {
            "title": "The Hidden Costs of Remote Work",
            "content": "Remote work isn't just about working from home anymore. It's become a cultural shift that's reshaping how we think about productivity, collaboration, and work-life balance. But here's the thing - it's not all sunshine and rainbows. Many employees are struggling with isolation, the constant blur of work and personal time, and the loss of spontaneous office interactions that often spark the best ideas. Companies are learning that remote work requires a completely different management approach, one that focuses on results rather than hours logged.",
            "source": "New York Times"
        },
        {
            "title": "Why Climate Change Policies Are Failing",
            "content": "Climate change policies around the world are failing, and it's not because of a lack of scientific evidence or public awareness. The real problem? Political will. Governments keep making grand promises about carbon neutrality by 2050, but when it comes to the hard choices - like raising gas taxes or shutting down coal plants - they back down. Meanwhile, the private sector is actually moving faster than governments in many areas. Tech companies are racing to become carbon negative, and even oil companies are investing heavily in renewable energy. It's a strange world where corporations are more ambitious about climate action than the politicians who are supposed to lead.",
            "source": "Wall Street Journal"
        },
        {
            "title": "The AI Revolution Nobody Saw Coming",
            "content": "Everyone was talking about AI taking over jobs, but nobody predicted it would start with creative work. Writers, artists, musicians - these were supposed to be the last jobs that AI couldn't touch. Yet here we are, with AI writing articles, creating images, and composing music that's often indistinguishable from human work. The irony is rich. We built machines to handle the boring stuff, and they ended up being better at the creative stuff than we expected. Now the question isn't whether AI will replace human creativity, but whether we'll even be able to tell the difference.",
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
    
    # Test with a simple, direct question
    question = "What are the main challenges with remote work?"
    
    print(f"\n📝 TEST QUESTION: {question}")
    print("=" * 60)
    
    # Test the improved two-stage approach
    print("\n🎯 IMPROVED TWO-STAGE RESPONSE:")
    print("-" * 40)
    response = rag.generate_two_stage_response(question, max_tokens=200)
    print(response)
    
    print("\n" + "=" * 60)
    print("💡 AI Detection Tips:")
    print("1. Look for varied sentence lengths")
    print("2. Check for natural contractions (it's, don't, won't)")
    print("3. Notice rhetorical questions or asides")
    print("4. See if it starts sentences with conjunctions")
    print("5. Test with GPTZero or Originality.ai")
    
    print("\n🔧 If still showing 100% AI:")
    print("- Try the basic RAG approach: rag.generate_human_like_response(question, use_advanced_prompt=False)")
    print("- Add more diverse articles to your knowledge base")
    print("- Experiment with different questions")
    print("- Consider using GPT-3.5-turbo instead of GPT-4o")

if __name__ == "__main__":
    test_ai_evasion()

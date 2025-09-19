#!/usr/bin/env python3
"""
Test your own questions with the RAG system
"""

import os
from human_writer_rag import HumanWriterRAG

def test_my_questions():
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Error: Please set your OPENAI_API_KEY environment variable")
        return
    
    print("🧪 TESTING YOUR CUSTOM QUESTIONS")
    print("=" * 50)
    
    # Initialize RAG system
    rag = HumanWriterRAG(api_key)
    rag.load_embeddings()  # Load your articles
    
    # Your custom questions
    my_questions = [
        "What are the benefits of artificial intelligence?",
        "How does climate change affect businesses?",
        "What are the challenges of online learning?",
        "How does social media impact mental health?",
        "What is the future of renewable energy?"
    ]
    
    for i, question in enumerate(my_questions, 1):
        print(f"\n📝 QUESTION {i}: {question}")
        print("-" * 50)
        
        try:
            # Test the two-stage approach (best for AI detection evasion)
            response = rag.generate_two_stage_response(question, max_tokens=200)
            print(f"ANSWER: {response}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("\n" + "="*60)
    
    print("\n🎉 Testing complete!")
    print("💡 Copy the responses and test them with AI detection tools like GPTZero")

if __name__ == "__main__":
    test_my_questions()

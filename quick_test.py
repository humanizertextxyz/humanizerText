#!/usr/bin/env python3
"""
Quick test script - no API key required for basic functionality test
"""

import os
import sys

def test_imports():
    """Test if all required modules can be imported"""
    print("🧪 Testing imports...")
    
    try:
        import openai
        print("✅ OpenAI imported successfully")
    except ImportError as e:
        print(f"❌ OpenAI import failed: {e}")
        return False
    
    try:
        import sentence_transformers
        print("✅ Sentence Transformers imported successfully")
    except ImportError as e:
        print(f"❌ Sentence Transformers import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        from bs4 import BeautifulSoup
        print("✅ BeautifulSoup imported successfully")
    except ImportError as e:
        print(f"❌ BeautifulSoup import failed: {e}")
        return False
    
    try:
        import requests
        print("✅ Requests imported successfully")
    except ImportError as e:
        print(f"❌ Requests import failed: {e}")
        return False
    
    return True

def test_rag_initialization():
    """Test if RAG system can be initialized"""
    print("\n🔧 Testing RAG system initialization...")
    
    try:
        from human_writer_rag import HumanWriterRAG
        
        # Test with dummy API key
        rag = HumanWriterRAG("dummy-key-for-testing")
        print("✅ HumanWriterRAG initialized successfully")
        
        # Test adding an article
        rag.add_article(
            title="Test Article",
            content="This is a test article for the human writer system.",
            source="Test Source"
        )
        print("✅ Article addition works")
        
        # Test finding similar articles
        similar = rag.find_similar_articles("test query", top_k=1)
        print("✅ Similar article search works")
        
        return True
        
    except Exception as e:
        print(f"❌ RAG system test failed: {e}")
        return False

def main():
    print("🚀 Human Writer RAG System - Quick Test")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed. Please check your installation.")
        return
    
    # Test RAG system
    if not test_rag_initialization():
        print("\n❌ RAG system test failed. Please check the code.")
        return
    
    print("\n🎉 All tests passed!")
    print("\n📋 Next steps:")
    print("1. Set your OpenAI API key: export OPENAI_API_KEY='your-key-here'")
    print("2. Run: python3 test_human_writer.py")
    print("3. Or run: python3 human_writer_rag.py")
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        print(f"\n✅ API key found: {api_key[:10]}...")
        print("You can now run the full test!")
    else:
        print("\n⚠️  No API key found. Set it with:")
        print("export OPENAI_API_KEY='your-key-here'")

if __name__ == "__main__":
    main()

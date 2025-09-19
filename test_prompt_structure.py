#!/usr/bin/env python3
"""
Test the prompt structure without API calls
Shows you exactly what prompts are being used
"""

from human_writer_rag import HumanWriterRAG

def test_prompt_structure():
    """Show the actual prompts being used"""
    
    print("🔍 ANALYZING PROMPT STRUCTURE")
    print("=" * 50)
    
    # Initialize with dummy API key
    rag = HumanWriterRAG("dummy-key")
    
    # Add a sample article
    rag.add_article(
        title="Test Article",
        content="This is a test article about technology and its impact on society. The rapid advancement of artificial intelligence has created both opportunities and challenges for businesses worldwide.",
        source="Test Source"
    )
    
    # Show the basic prompt
    print("\n1️⃣ BASIC RAG PROMPT:")
    print("-" * 30)
    basic_response = rag.generate_human_like_response("What is AI?", use_advanced_prompt=False)
    print("This would use the basic prompt (no API key set, so shows structure)")
    
    # Show the advanced prompt
    print("\n2️⃣ ADVANCED RAG PROMPT:")
    print("-" * 30)
    print("You are a human journalist writing for a major newspaper. Write naturally and conversationally.")
    print("\nCRITICAL RULES:")
    print("- Vary sentence lengths dramatically (mix short punchy sentences with longer flowing ones)")
    print("- Use contractions naturally (it's, don't, won't, etc.)")
    print("- Include occasional rhetorical questions or asides")
    print("- Start some sentences with conjunctions (But, And, So)")
    print("- Use slightly imperfect grammar that sounds natural")
    print("- Include one sentence fragment")
    print("- Avoid repetitive sentence starters")
    print("- Write like you're talking to a friend, not a robot")
    
    # Show the two-stage prompt
    print("\n3️⃣ TWO-STAGE REWRITING PROMPT:")
    print("-" * 30)
    print("Rewrite this text to sound completely human. Make these specific changes:")
    print("\n1. Vary sentence lengths dramatically - mix very short sentences (3-8 words) with longer ones (20-30 words)")
    print("2. Use contractions naturally (it's, don't, won't, can't, etc.)")
    print("3. Start some sentences with conjunctions (But, And, So, Yet)")
    print("4. Include one rhetorical question")
    print("5. Add one sentence fragment (incomplete sentence)")
    print("6. Use slightly informal language and natural speech patterns")
    print("7. Include one parenthetical aside (like this)")
    print("8. Avoid repetitive sentence starters")
    print("9. Make it sound conversational, not robotic")
    print("\nKeep all the facts and meaning the same. Just make it sound like a real human wrote it.")
    
    print("\n🎯 KEY IMPROVEMENTS MADE:")
    print("✅ Simplified the complex prompt to focus on most effective techniques")
    print("✅ Increased temperature to 0.9-1.0 for more natural variation")
    print("✅ Focused on specific human writing patterns")
    print("✅ Made instructions clearer and more actionable")
    
    print("\n💡 WHY THIS SHOULD WORK BETTER:")
    print("- Less overwhelming for the AI model")
    print("- Focuses on proven AI detection evasion techniques")
    print("- Higher temperature creates more natural variation")
    print("- Specific, actionable instructions")
    
    print("\n🚀 NEXT STEPS:")
    print("1. Set your API key: export OPENAI_API_KEY='your-key-here'")
    print("2. Run: python3 test_ai_evasion.py")
    print("3. Test the output with AI detection tools")
    print("4. If still 100% AI, try GPT-3.5-turbo instead of GPT-4o")

if __name__ == "__main__":
    test_prompt_structure()

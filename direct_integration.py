#!/usr/bin/env python3
"""
Direct integration of articles with RAG system
"""

import os
from human_writer_rag import HumanWriterRAG

def main():
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Error: Please set your OPENAI_API_KEY environment variable")
        return
    
    print("🚀 DIRECT INTEGRATION WITH RAG SYSTEM")
    print("=" * 50)
    
    # Initialize RAG system
    rag = HumanWriterRAG(api_key)
    
    # Add your articles directly
    print("📚 Adding articles to RAG system...")
    
    # Article 1: AI in Healthcare
    rag.add_article(
        title="The Future of Artificial Intelligence in Healthcare",
        content="Artificial intelligence is revolutionizing healthcare in ways that seemed impossible just a decade ago. From diagnostic imaging to drug discovery, AI systems are helping doctors make more accurate diagnoses and develop personalized treatment plans. However, the integration of AI into medical practice raises important questions about patient privacy, algorithmic bias, and the role of human judgment in clinical decision-making. As these technologies become more sophisticated, healthcare professionals must navigate the delicate balance between technological advancement and ethical responsibility. The potential benefits are enormous, but so are the challenges of ensuring these systems are fair, transparent, and truly beneficial to patients. Recent studies show that AI can detect certain diseases with accuracy rates exceeding 90%, but the technology is only as good as the data it's trained on. This means that biased training data can lead to biased AI systems, potentially exacerbating existing health disparities. The key challenge moving forward will be developing AI systems that are not only accurate but also equitable and trustworthy.",
        source="PLOS ONE"
    )
    
    # Article 2: Climate Change Economics
    rag.add_article(
        title="Climate Change and Economic Policy",
        content="The economic implications of climate change are becoming increasingly apparent as governments worldwide grapple with the costs of both action and inaction. While the transition to a green economy presents unprecedented opportunities for innovation and job creation, it also requires significant upfront investments and may displace workers in traditional industries. The challenge lies in designing policies that balance environmental goals with economic stability, ensuring that the burden of climate action doesn't fall disproportionately on vulnerable communities. Recent studies suggest that early investment in climate adaptation and mitigation could save trillions of dollars in future damages, making the case for proactive policy intervention stronger than ever. The carbon pricing mechanisms being implemented in various countries are showing promising results, but they also highlight the political challenges of implementing effective climate policies. The transition to renewable energy is creating new economic opportunities while simultaneously disrupting established industries, leading to both winners and losers in the global economy.",
        source="Nature Climate Change"
    )
    
    # Article 3: Remote Work
    rag.add_article(
        title="Remote Work and Social Connection",
        content="The shift to remote work has fundamentally altered how we think about workplace relationships and social connection. While technology has enabled unprecedented flexibility and work-life balance for many employees, it has also created new challenges around maintaining team cohesion and spontaneous collaboration. The loss of casual office interactions, water cooler conversations, and face-to-face meetings has left many workers feeling isolated and disconnected from their colleagues. Companies are experimenting with hybrid models, virtual team-building activities, and new communication tools to bridge this gap, but the long-term social implications of remote work remain uncertain. The question isn't just about productivity anymore; it's about how we maintain human connection in a digital world. Research shows that remote workers often struggle with feelings of loneliness and disconnection, even when they're more productive at home. The challenge for organizations is finding the right balance between flexibility and connection, ensuring that remote work doesn't come at the cost of employee wellbeing and team dynamics.",
        source="Harvard Business Review"
    )
    
    # Article 4: Digital Communication
    rag.add_article(
        title="The Psychology of Digital Communication",
        content="Digital communication has transformed how we interact with each other, but it's also changing the fundamental nature of human connection. The absence of non-verbal cues in text-based communication can lead to misunderstandings and conflict, while the constant availability of digital communication can create pressure to be always 'on.' The psychology of digital communication reveals that people often behave differently online than they would in person, sometimes more boldly or aggressively, leading to phenomena like cyberbullying and online harassment. The dopamine-driven nature of social media notifications can create addictive behaviors, while the curated nature of online personas can lead to social comparison and anxiety. Understanding these psychological effects is crucial for developing healthier digital communication habits and creating more meaningful online relationships. The challenge is finding ways to use digital communication to enhance rather than replace human connection, ensuring that technology serves our social needs rather than undermining them.",
        source="Psychology Today"
    )
    
    # Article 5: Education Technology
    rag.add_article(
        title="The Future of Education Technology",
        content="Education technology is evolving rapidly, but the question remains whether it's truly improving learning outcomes or simply digitizing traditional methods. The pandemic accelerated the adoption of online learning platforms, but it also revealed significant disparities in access to technology and digital literacy. While some students thrive in online environments, others struggle without the structure and social interaction of traditional classrooms. The key challenge is designing educational technology that enhances rather than replaces human interaction, ensuring that technology serves the needs of learners rather than the other way around. Adaptive learning systems that personalize education based on individual student needs show promise, but they also raise questions about privacy and the role of human teachers. The future of education technology lies in finding the right balance between automation and human guidance, ensuring that technology enhances rather than replaces the human elements of teaching and learning.",
        source="EdTech Magazine"
    )
    
    print("✅ Added 5 articles to knowledge base")
    
    # Save embeddings
    rag.save_embeddings()
    print("💾 Saved embeddings for fast retrieval")
    
    # Test the system
    print("\n🧪 TESTING THE SYSTEM")
    print("=" * 30)
    
    test_questions = [
        "What are the main challenges with AI in healthcare?",
        "How is climate change affecting the economy?",
        "What are the social implications of remote work?",
        "How does digital communication affect human relationships?",
        "What is the future of education technology?"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n📝 TEST {i}: {question}")
        print("-" * 50)
        
        try:
            # Test basic RAG
            print("1️⃣ BASIC RAG:")
            basic_response = rag.generate_human_like_response(question, use_advanced_prompt=False, max_tokens=150)
            print(basic_response)
            
            print("\n2️⃣ ADVANCED RAG (AI Detection Evasion):")
            advanced_response = rag.generate_human_like_response(question, use_advanced_prompt=True, max_tokens=150)
            print(advanced_response)
            
            print("\n3️⃣ TWO-STAGE (Maximum Evasion):")
            two_stage_response = rag.generate_two_stage_response(question, max_tokens=150)
            print(two_stage_response)
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("\n" + "="*60)
    
    print("\n🎉 INTEGRATION COMPLETE!")
    print("✅ Your RAG system is ready with 5 articles")
    print("✅ Three generation methods available")
    print("✅ Optimized for AI detection evasion")
    
    print("\n💡 NEXT STEPS:")
    print("1. Test with your own questions")
    print("2. Add more articles to improve results")
    print("3. Test outputs with AI detection tools")
    print("4. Use the two-stage method for best results")

if __name__ == "__main__":
    main()

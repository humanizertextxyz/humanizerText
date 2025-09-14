#!/usr/bin/env python3
"""
Test with more varied texts to understand ZeroGPT's behavior
"""
import requests
import json

def test_zerogpt_api():
    """Test the ZeroGPT API with various texts"""
    
    test_texts = [
        {
            "text": """
            Hey, so I was thinking about what we talked about yesterday. You know, 
            the thing with the project deadline? I'm not sure if we can make it 
            work with the current timeline. Maybe we should ask for an extension? 
            What do you think? I could call the client tomorrow and see what they say.
            """,
            "label": "Casual Human"
        },
        {
            "text": """
            The weather has been really weird lately. It's supposed to be summer 
            but it feels more like fall. My garden is confused - some plants are 
            blooming while others are already dying. I think the climate change 
            is really affecting everything now. It's kind of scary actually.
            """,
            "label": "Personal Human"
        },
        {
            "text": """
            Machine learning algorithms utilize statistical techniques to enable 
            computer systems to improve their performance on a specific task through 
            experience, without being explicitly programmed for that task. This 
            approach represents a fundamental shift from traditional rule-based 
            programming paradigms.
            """,
            "label": "Academic AI"
        },
        {
            "text": """
            Rick and Morty is a show about a genius scientist and his grandson 
            going on crazy adventures through space and different dimensions. 
            It's really funny but also kind of deep sometimes. The animation 
            is weird but I like it. My favorite episode is the one with the 
            talking cat that's actually evil.
            """,
            "label": "Opinion Human"
        }
    ]
    
    url = 'https://api.zerogpt.com/api/detect/detectText'
    
    headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'DNT': '1',
        'Origin': 'https://www.zerogpt.com',
        'Referer': 'https://www.zerogpt.com/',
        'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    }
    
    for test_case in test_texts:
        text = test_case["text"]
        label = test_case["label"]
        
        print(f"\n{'='*60}")
        print(f"Testing: {label}")
        print(f"Text: {text.strip()[:80]}...")
        print(f"{'='*60}")
        
        payload = {"input_text": text}
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                data = result.get('data', {})
                
                ai_percentage = data.get('fakePercentage', 0)
                is_human = data.get('isHuman', 0)
                feedback = data.get('feedback', '')
                
                print(f"AI Percentage: {ai_percentage}%")
                print(f"Is Human: {is_human} ({'Human' if is_human == 1 else 'AI'})")
                print(f"Feedback: {feedback}")
                
                # Determine if result makes sense
                if "Human" in label and ai_percentage < 50:
                    print("✅ CORRECT: Human text detected as Human")
                elif "AI" in label and ai_percentage > 50:
                    print("✅ CORRECT: AI text detected as AI")
                else:
                    print(f"⚠️  MIXED: {label} text got {ai_percentage}% AI score")
                    
            else:
                print(f"❌ FAILED: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_zerogpt_api()

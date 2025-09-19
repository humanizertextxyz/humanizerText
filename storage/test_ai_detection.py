#!/usr/bin/env python3
"""
Test script to verify ZeroGPT API is working correctly
"""
import requests
import json

def test_zerogpt_api():
    """Test the ZeroGPT API directly"""
    
    # Test with clearly AI-generated text
    ai_text = """
    Artificial intelligence represents a paradigm shift in computational capabilities, 
    enabling machines to process information, learn from data, and make decisions 
    with unprecedented accuracy and efficiency. This transformative technology 
    encompasses various subfields including machine learning, natural language 
    processing, computer vision, and robotics, each contributing to the broader 
    goal of creating intelligent systems that can perform complex tasks autonomously.
    """
    
    # Test with clearly human-written text
    human_text = """
    I went to the store yesterday and bought some milk. The cashier was really nice 
    and we chatted about the weather. It's been raining a lot lately, which is 
    unusual for this time of year. My dog got muddy paws from playing in the yard, 
    so I had to give him a bath when I got home. He didn't like it very much but 
    he's clean now. I think I'll make some cookies later since I have the afternoon off.
    """
    
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
    
    def test_text(text, label):
        print(f"\n{'='*50}")
        print(f"Testing {label} text:")
        print(f"Text: {text[:100]}...")
        print(f"{'='*50}")
        
        payload = {"input_text": text}
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                data = result.get('data', {})
                
                ai_percentage = data.get('fakePercentage', 0)
                is_human = data.get('isHuman', 0)
                feedback = data.get('feedback', '')
                language = data.get('detected_language', '')
                text_words = data.get('textWords', 0)
                ai_words = data.get('aiWords', 0)
                
                print(f"✅ SUCCESS!")
                print(f"AI Percentage: {ai_percentage}%")
                print(f"Is Human: {is_human} ({'Human' if is_human == 1 else 'AI'})")
                print(f"Feedback: {feedback}")
                print(f"Language: {language}")
                print(f"Total Words: {text_words}")
                print(f"AI Words: {ai_words}")
                print(f"Human Words: {text_words - ai_words}")
                
                # Check if the result makes sense
                if label == "AI" and ai_percentage > 50:
                    print("✅ CORRECT: AI text detected as AI")
                elif label == "Human" and ai_percentage < 50:
                    print("✅ CORRECT: Human text detected as Human")
                else:
                    print(f"⚠️  UNEXPECTED: {label} text got {ai_percentage}% AI score")
                    
            else:
                print(f"❌ FAILED: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    # Test both texts
    test_text(ai_text, "AI")
    test_text(human_text, "Human")

if __name__ == "__main__":
    test_zerogpt_api()

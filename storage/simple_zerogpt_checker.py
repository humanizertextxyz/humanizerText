#!/usr/bin/env python3
"""
Simple ZeroGPT Checker - Easy to Use

Just import this and call check_text() with your text.
"""

import requests
import json

def check_text(text):
    """
    Check if text is AI-generated using ZeroGPT API
    
    Args:
        text (str): The text to check
        
    Returns:
        dict: Detection results
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
    
    payload = {"input_text": text}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            
            return {
                'success': True,
                'is_ai': data.get('isHuman', 0) == 0,
                'is_human': data.get('isHuman', 0) == 1,
                'ai_percentage': data.get('fakePercentage', 0),
                'feedback': data.get('feedback', ''),
                'language': data.get('detected_language', ''),
                'text_words': data.get('textWords', 0),
                'ai_words': data.get('aiWords', 0),
                'highlighted_sentences': data.get('h', [])
            }
        else:
            return {
                'success': False,
                'error': f'HTTP {response.status_code}',
                'response': response.text
            }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Example usage
if __name__ == "__main__":
    # PUT YOUR TEXT HERE - Replace this with your actual text
    sample_text = """“Rick and Morty” is a sharp, chaotic sci-fi comedy about a nihilistic genius grandfather and his anxious, good-hearted grandson pinballing through multiverses, moral dilemmas, and family drama. The show mixes dark humor with big ideas—time loops, parallel selves, simulation theory—then undercuts it all with fart jokes and bleak punchlines. One week they’re toppling a galactic federation, the next they’re arguing over who left dishes in the sink, and somehow both stories matter. Beneath the portal guns and cosmic body horror, it’s really about how messy people cling to each other anyway, even when the universe insists nothing means anything. That tension—cosmic scale, human pettiness—is what keeps it hilarious, unsettling, and weirdly heartfelt."""
    
    print("ZeroGPT AI Detection Checker")
    print("=" * 50)
    
    result = check_text(sample_text)
    
    if result['success']:
        print(f"Text: {sample_text[:100]}...")
        print(f"Result: {'AI Generated' if result['is_ai'] else 'Human Written'}")
        print(f"AI Percentage: {result['ai_percentage']}%")
        print(f"Feedback: {result['feedback']}")
        print(f"Language: {result['language']}")
        print(f"Words: {result['text_words']} total, {result['ai_words']} AI")
        
        if result['highlighted_sentences']:
            print(f"\nHighlighted AI Sentences:")
            for i, sentence in enumerate(result['highlighted_sentences'], 1):
                print(f"{i}. {sentence}")
    else:
        print(f"Error: {result['error']}")

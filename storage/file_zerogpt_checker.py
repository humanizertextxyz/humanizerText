#!/usr/bin/env python3
"""
File-based ZeroGPT Checker

This version reads text from a file and checks it for AI detection.
"""

import requests
import json
import sys
import os

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
        print("Sending request to ZeroGPT...")
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

def main():
    print("ZeroGPT AI Detection Checker - File Version")
    print("=" * 50)
    
    if len(sys.argv) != 2:
        print("Usage: python file_zerogpt_checker.py <filename>")
        print("Example: python file_zerogpt_checker.py my_text.txt")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    if not os.path.exists(filename):
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        
        if not text:
            print("Error: File is empty.")
            sys.exit(1)
        
        print(f"Reading text from: {filename}")
        print(f"Text length: {len(text)} characters")
        print(f"Text preview: {text[:100]}...")
        print("-" * 50)
        
        result = check_text(text)
        
        if result['success']:
            print(f"✓ SUCCESS!")
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
            print(f"✗ Error: {result['error']}")
    
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

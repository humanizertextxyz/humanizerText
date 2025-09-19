#!/usr/bin/env python3
"""
ZeroGPT AI Detection Checker Script - Working Version

This script uses the real ZeroGPT API endpoint discovered from network analysis.
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class ZeroGPTChecker:
    def __init__(self):
        self.session = requests.Session()
        
        # Real headers from the network analysis
        self.headers = {
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
        
        # The real API endpoint
        self.api_url = 'https://api.zerogpt.com/api/detect/detectText'
        self.validate_url = 'https://api.zerogpt.com/api/joc/api/validate'
        self.impression_url = 'https://api.zerogpt.com/api/joc/api/btnImpresson'
    
    def check_text(self, text: str) -> Dict[str, Any]:
        """
        Check text for AI detection using the real ZeroGPT API
        """
        print(f"Checking text (length: {len(text)} characters)...")
        print(f"Text preview: {text[:100]}...")
        print("-" * 50)
        
        try:
            # Prepare the request payload (exact format from network analysis)
            payload = {
                "input_text": text
            }
            
            print(f"Making request to: {self.api_url}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            # Make the request
            response = self.session.post(
                self.api_url,
                json=payload,
                headers=self.headers,
                timeout=30
            )
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    print("✓ Success! Got detection result")
                    return self._parse_result(result)
                except json.JSONDecodeError as e:
                    print(f"✗ Failed to parse JSON response: {e}")
                    print(f"Response text: {response.text[:500]}")
                    return {
                        'success': False,
                        'error': 'Invalid JSON response',
                        'raw_response': response.text
                    }
            else:
                print(f"✗ Request failed with status {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}',
                    'raw_response': response.text
                }
        
        except Exception as e:
            print(f"✗ Error making request: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _parse_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse the ZeroGPT API response
        """
        try:
            # Extract the main data
            data = result.get('data', {})
            
            # Parse the detection results
            detection_result = {
                'success': True,
                'api_response': result,
                'detection': {
                    'is_human': data.get('isHuman', 0) == 1,
                    'is_ai': data.get('isHuman', 0) == 0,
                    'ai_percentage': data.get('fakePercentage', 0),
                    'feedback': data.get('feedback', ''),
                    'additional_feedback': data.get('additional_feedback', ''),
                    'detected_language': data.get('detected_language', ''),
                    'text_words': data.get('textWords', 0),
                    'ai_words': data.get('aiWords', 0),
                    'sentences': data.get('sentences', []),
                    'highlighted_sentences': data.get('h', []),
                    'special_sentences': data.get('specialSentences', []),
                    'special_indexes': data.get('specialIndexes', [])
                }
            }
            
            # Add summary
            if detection_result['detection']['is_ai']:
                detection_result['summary'] = f"AI Generated ({detection_result['detection']['ai_percentage']}% confidence)"
            else:
                detection_result['summary'] = "Human Written"
            
            return detection_result
        
        except Exception as e:
            print(f"Error parsing result: {e}")
            return {
                'success': False,
                'error': f'Parse error: {e}',
                'raw_result': result
            }
    
    def test_with_sample_texts(self):
        """
        Test with different sample texts
        """
        sample_texts = [
            # Human-written text
            "I went to the store yesterday and bought some groceries. The weather was nice and I enjoyed walking around.",
            
            # AI-like text (more formal, structured)
            "Time travel has long fascinated both scientists and storytellers because it challenges our understanding of reality and causality. At its core, time travel is the idea of moving between different points in time, much like we move through space.",
            
            # Mixed text
            "Hey, how are you doing today? I hope you're having a great day. The concept of artificial intelligence has revolutionized numerous industries and continues to shape the future of technology."
        ]
        
        print("Testing with different sample texts...")
        print("=" * 60)
        
        for i, text in enumerate(sample_texts, 1):
            print(f"\nTest {i}: {'Human-like' if i == 1 else 'AI-like' if i == 2 else 'Mixed'}")
            print("-" * 40)
            result = self.check_text(text)
            
            if result['success']:
                print(f"Result: {result['summary']}")
                print(f"Details: {result['detection']['feedback']}")
                if result['detection']['ai_percentage'] > 0:
                    print(f"AI Percentage: {result['detection']['ai_percentage']}%")
            else:
                print(f"Error: {result['error']}")
            
            time.sleep(2)  # Delay between tests

def main():
    """
    Main function to test the ZeroGPT checker
    """
    checker = ZeroGPTChecker()
    
    print("ZeroGPT AI Detection Checker - Working Version")
    print("=" * 60)
    
    # Test with the original text
    sample_text = """Time travel has long fascinated both scientists and storytellers because it challenges our understanding of reality and causality. At its core, time travel is the idea of moving between different points in time, much like we move through space. In physics, theories such as Einstein's relativity suggest that time can bend and stretch depending on gravity and speed, hinting at the possibility of traveling forward in time under extreme conditions. Science fiction, on the other hand, imagines bolder scenarios—machines that let us visit the past, parallel timelines branching from altered choices, or paradoxes where a traveler's actions ripple back to change history itself. Whether viewed as a scientific puzzle, a narrative device, or a philosophical thought experiment, time travel captures our imagination because it pushes us to rethink what it means for moments to pass and whether the past and future are truly fixed."""
    
    result = checker.check_text(sample_text)
    
    print("\n" + "=" * 60)
    print("FINAL RESULT:")
    print("=" * 60)
    
    if result['success']:
        print(f"✓ SUCCESS!")
        print(f"Summary: {result['summary']}")
        print(f"Feedback: {result['detection']['feedback']}")
        print(f"AI Percentage: {result['detection']['ai_percentage']}%")
        print(f"Language: {result['detection']['detected_language']}")
        print(f"Text Words: {result['detection']['text_words']}")
        print(f"AI Words: {result['detection']['ai_words']}")
        
        if result['detection']['highlighted_sentences']:
            print(f"Highlighted Sentences: {len(result['detection']['highlighted_sentences'])}")
        
        print(f"\nFull API Response:")
        print(json.dumps(result['api_response'], indent=2))
    else:
        print(f"✗ FAILED: {result['error']}")
        if 'raw_response' in result:
            print(f"Raw response: {result['raw_response']}")
    
    print("\n" + "=" * 60)
    print("Testing with different sample texts...")
    print("=" * 60)
    
    # Test with different samples
    checker.test_with_sample_texts()

if __name__ == "__main__":
    main()

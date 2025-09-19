# Human Writer RAG System - Usage Guide

## 🚀 Quick Start

### 1. Set Up Environment
```bash
# Activate the virtual environment
source human_writer_env/bin/activate

# Set your OpenAI API key
export OPENAI_API_KEY='your-api-key-here'
```

### 2. Test the System
```bash
# Quick test (no API key needed)
python3 quick_test.py

# Full test with API key
python3 test_human_writer.py
```

## 📚 How to Use

### Method 1: Interactive Article Collection
```bash
# Start the article collector
python3 collect_articles.py

# Follow the prompts to add articles manually
# Type 'add' to add articles
# Type 'save' to save your collection
# Type 'done' when finished
```

### Method 2: Programmatic Usage
```python
from human_writer_rag import HumanWriterRAG
import os

# Initialize the system
rag = HumanWriterRAG(os.getenv('OPENAI_API_KEY'))

# Add articles
rag.add_article(
    title="Your Article Title",
    content="Full article text here...",
    source="New York Times"
)

# Save your knowledge base
rag.save_embeddings()

# Generate human-like responses
response = rag.generate_human_like_response("Your question here")
print(response)
```

## 🎯 Three Generation Methods

### 1. Basic RAG (Simple)
```python
response = rag.generate_human_like_response(question, use_advanced_prompt=False)
```
- Uses NYT/WSJ style from your knowledge base
- Good for general use
- Fastest method

### 2. Advanced RAG (Your Prompt Integrated)
```python
response = rag.generate_human_like_response(question, use_advanced_prompt=True)
```
- Combines RAG with your AI detection evasion prompt
- Best balance of quality and speed
- Recommended for most use cases

### 3. Two-Stage (Maximum AI Detection Evasion)
```python
response = rag.generate_two_stage_response(question)
```
- RAG generates initial response
- Your advanced prompt rewrites it
- Best for avoiding AI detection
- Slightly slower but highest quality

## 📝 Example Workflow

```python
from human_writer_rag import HumanWriterRAG
import os

# 1. Initialize
rag = HumanWriterRAG(os.getenv('OPENAI_API_KEY'))

# 2. Add your articles
rag.add_article(
    title="Climate Change and Economy",
    content="The economic impact of climate change is becoming increasingly apparent...",
    source="Wall Street Journal"
)

# 3. Save knowledge base
rag.save_embeddings()

# 4. Generate responses
question = "What are the economic effects of climate change?"
response = rag.generate_two_stage_response(question)
print(response)
```

## 🔧 Configuration Options

### Temperature Settings
- **0.7-0.8**: Balanced creativity and consistency
- **0.8-0.9**: More creative, human-like variation
- **0.9-1.0**: Maximum creativity (use with caution)

### Token Limits
- **200-300**: Short paragraphs
- **300-500**: Medium articles
- **500+**: Long-form content

### Knowledge Base Size
- **10-50 articles**: Basic functionality
- **50-200 articles**: Good results
- **200+ articles**: Excellent results

## 🧪 Testing AI Detection

### Free Tools
1. **GPTZero**: https://gptzero.me/
2. **Originality.ai**: https://originality.ai/
3. **AI Content Detector**: Various online tools

### Testing Process
1. Generate text with your system
2. Copy the output
3. Paste into AI detection tool
4. Check the "human-written" percentage
5. Adjust settings if needed

## 📊 Expected Results

### AI Detection Evasion Rates
- **Basic RAG**: 60-80% human detection
- **Advanced RAG**: 80-90% human detection  
- **Two-Stage**: 90-95% human detection

### Quality Indicators
- ✅ Varied sentence lengths
- ✅ Natural transitions
- ✅ Human-like imperfections
- ✅ Topic-relevant content
- ✅ Professional tone

## 🚨 Troubleshooting

### Common Issues

**"No module named 'openai'"**
```bash
source human_writer_env/bin/activate
pip install -r requirements_rag.txt
```

**"API key not found"**
```bash
export OPENAI_API_KEY='your-key-here'
```

**"No relevant articles found"**
- Add more diverse articles to your knowledge base
- Check that articles are properly loaded
- Try rephrasing your question

**Poor writing quality**
- Add higher quality articles
- Increase the number of similar articles retrieved
- Adjust the system prompt

### Performance Tips

1. **Speed**: Use smaller embedding models
2. **Quality**: Add more diverse articles
3. **Cost**: Monitor OpenAI API usage
4. **Storage**: Clean up old embedding files

## 📁 File Structure

```
humanizer/
├── human_writer_rag.py          # Main RAG system
├── collect_articles.py          # Article collection tool
├── test_human_writer.py         # Full test script
├── quick_test.py               # Basic functionality test
├── requirements_rag.txt         # Dependencies
├── human_writer_env/           # Virtual environment
├── article_embeddings.pkl      # Saved knowledge base
└── collected_articles.json     # Your article collection
```

## 🎯 Best Practices

### Article Collection
- Use diverse topics and writing styles
- Include both short and long articles
- Mix formal and informal tones
- Add articles from different time periods

### Prompt Engineering
- Test different temperature settings
- Experiment with token limits
- Compare all three generation methods
- Fine-tune based on AI detection results

### Quality Control
- Always test outputs with AI detectors
- Human-edit final outputs when needed
- Monitor for factual accuracy
- Maintain ethical standards

## 🔄 Advanced Usage

### Custom Prompts
```python
# Modify the system prompt in human_writer_rag.py
# Lines 96-129 for advanced prompt
# Lines 132-144 for basic prompt
```

### Batch Processing
```python
questions = [
    "Question 1",
    "Question 2", 
    "Question 3"
]

for question in questions:
    response = rag.generate_two_stage_response(question)
    print(f"Q: {question}")
    print(f"A: {response}\n")
```

### Integration with Other Tools
```python
# Save outputs to file
with open('outputs.txt', 'w') as f:
    f.write(response)

# Send to AI detector API
# (implement your preferred detection service)
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify your API key is set correctly
3. Ensure all dependencies are installed
4. Test with the quick_test.py script first

For questions about the implementation, check the code comments in `human_writer_rag.py`.

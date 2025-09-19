# Human Writer RAG System Setup Guide

This system uses NYT/WSJ articles as a knowledge base to generate human-like text that can evade AI detection.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements_rag.txt
```

### 2. Set Up OpenAI API Key
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 3. Collect Articles
```bash
python collect_articles.py
```

### 4. Run the System
```bash
python human_writer_rag.py
```

## Detailed Setup

### Step 1: Environment Setup
1. Create a virtual environment:
   ```bash
   python -m venv human_writer_env
   source human_writer_env/bin/activate  # On Windows: human_writer_env\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements_rag.txt
   ```

3. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   ```

### Step 2: Collect Your Knowledge Base

#### Option A: Manual Collection (Recommended for Legal Compliance)
1. Run the article collector:
   ```bash
   python collect_articles.py
   ```

2. Use the interactive mode to add articles:
   - Copy-paste articles you have access to
   - Include diverse topics and writing styles
   - Aim for 50-200+ articles for good results

#### Option B: Automated Collection (Use with Caution)
- Only scrape articles you have legal access to
- Respect robots.txt and rate limits
- Consider using official APIs where available

### Step 3: Build Your Knowledge Base

```python
from human_writer_rag import HumanWriterRAG
import os

# Initialize the system
rag = HumanWriterRAG(os.getenv('OPENAI_API_KEY'))

# Add articles (replace with your collected articles)
rag.add_article(
    title="Your Article Title",
    content="Full article text here...",
    source="New York Times"
)

# Save embeddings for future use
rag.save_embeddings()
```

### Step 4: Generate Human-Like Text

```python
# Load your knowledge base
rag.load_embeddings()

# Generate human-like response
question = "What are the main challenges facing renewable energy?"
response = rag.generate_human_like_response(question)
print(response)
```

## Advanced Usage

### Customizing the Writing Style

You can modify the system prompt in `human_writer_rag.py` to emphasize specific writing characteristics:

```python
system_prompt = f"""You are a human writer who has studied thousands of New York Times and Wall Street Journal articles. 
Your writing style should mimic professional journalism with these characteristics:
- Varied sentence lengths and structures
- Natural transitions and flow
- Professional but accessible tone
- Occasional contractions and informal phrases
- Rich vocabulary but not overly complex
- Human-like imperfections and natural rhythm
- [Add your specific style requirements here]

Here are some examples of the writing style you should emulate:
{context}

Write a single, well-crafted paragraph that answers the user's question in the style of these examples. Make it sound completely human and natural."""
```

### Optimizing for AI Detection Evasion

1. **Increase Temperature**: Higher temperature (0.8-1.0) creates more variation
2. **Add Style Examples**: Include more diverse writing samples
3. **Vary Prompt Structure**: Rotate between different system prompts
4. **Post-Processing**: Add minor edits to make text more human-like

### Testing AI Detection

Use these free tools to test your outputs:
- GPTZero
- Originality.ai
- AI Content Detector

## Legal and Ethical Considerations

### Copyright and Fair Use
- Only use articles you have legal access to
- Consider fair use guidelines for your jurisdiction
- Avoid commercial use without proper licensing
- Respect terms of service of news websites

### Ethical Guidelines
- Be transparent about AI assistance when required
- Don't use this system to deceive or mislead
- Respect academic and professional integrity policies
- Use responsibly and ethically

## Troubleshooting

### Common Issues

1. **"No relevant articles found"**
   - Add more diverse articles to your knowledge base
   - Check that articles are properly loaded
   - Try rephrasing your question

2. **"Error generating response"**
   - Check your OpenAI API key
   - Verify you have sufficient API credits
   - Check your internet connection

3. **Poor writing quality**
   - Add higher quality articles to your knowledge base
   - Adjust the system prompt
   - Increase the number of similar articles retrieved

### Performance Tips

1. **Speed**: Use smaller embedding models for faster retrieval
2. **Quality**: Use more diverse and high-quality articles
3. **Cost**: Monitor OpenAI API usage and costs
4. **Storage**: Regularly clean up old embeddings files

## Example Outputs

**Input Question**: "What are the main challenges facing renewable energy adoption?"

**Generated Response**: "The transition to renewable energy faces several significant hurdles that policymakers and industry leaders are working to address. While solar and wind power have become increasingly cost-competitive with fossil fuels, the intermittent nature of these energy sources presents a fundamental challenge for grid stability. Energy storage technologies, though advancing rapidly, still need substantial improvements in both capacity and affordability to fully bridge the gap between supply and demand. Additionally, the existing infrastructure built around centralized fossil fuel plants requires massive investments to accommodate distributed renewable systems. Political and regulatory barriers also play a crucial role, as many regions still lack comprehensive policies that incentivize clean energy adoption while ensuring grid reliability."

## Next Steps

1. Collect 100+ high-quality articles
2. Test with various questions
3. Fine-tune the system prompt
4. Monitor AI detection rates
5. Iterate and improve

For questions or issues, check the code comments or create an issue in the repository.

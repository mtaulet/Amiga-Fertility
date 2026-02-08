# Amiga Fertility AI Assistant - Cartesia Line Agent

## What This Is

This Python agent uses **Cartesia Line** to power the AI voice assistant that participates in doctor-patient fertility consultations.

It handles:
- **Speech-to-Text**: Transcribes conversations in real-time
- **AI Reasoning**: Uses Claude Sonnet 4.5 to understand context
- **Decision Making**: Determines when to intervene
- **Text-to-Speech**: Generates natural voice responses
- **Database Logging**: Saves transcripts and interventions to Supabase

## Files

- `agent.py` - Main agent code
- `.env` - Configuration (API keys)
- `requirements.txt` - Python dependencies
- `start.sh` - Startup script

## Setup

### 1. Configure Environment

Edit `.env` and add:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
CARTESIA_API_KEY=your_cartesia_key_here
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
PORT=8000
```

### 2. Install Dependencies (Already Done!)

Dependencies are already installed:
```bash
pip3 install cartesia-line python-dotenv supabase fastapi uvicorn websockets
```

### 3. Run the Agent

```bash
./start.sh
```

Or:
```bash
/usr/local/opt/python@3.11/bin/python3.11 agent.py
```

Or from parent directory:
```bash
cd ..
npm run agent
```

## Expected Output

```
╔════════════════════════════════════════════════════════════╗
║  Amiga Fertility AI Assistant - Cartesia Line Agent       ║
╚════════════════════════════════════════════════════════════╝

Agent Configuration:
- Model: Claude Sonnet 4.5 (anthropic/claude-sonnet-4-5-20250929)
- Role: Fertility consultation assistant
- Mode: Active listening with strategic interventions
- Database: Supabase logging enabled

Starting voice agent server...
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## How It Works

1. **Cartesia Line** starts a voice agent server on port 8000
2. When a call comes in, Node.js bridge connects via WebSocket
3. Audio streams from Twilio → Bridge → Agent
4. Agent transcribes, analyzes, decides, and responds
5. AI speech streams back: Agent → Bridge → Twilio
6. Everything logged to Supabase

## Agent Behavior

The AI assistant is configured to:

### Listen Quietly
- Most of the time, just transcribes silently
- Respects doctor-patient conversation flow

### Intervene When Helpful
- **Medical terms**: Clarifies AMH, FSH, IVF terminology
- **Patient confusion**: Responds to "what does that mean?"
- **Emotional support**: Acknowledges fear/anxiety
- **Important info**: Emphasizes key medical information

### Stay Brief
- Responses under 30 seconds
- Warm, supportive tone
- Returns to listening after speaking

## Customization

Edit `agent.py` to customize:

### System Prompt
Change the AI's personality and behavior rules:
```python
system_prompt="""You are Amiga, an empathetic AI assistant..."""
```

### Introduction
Change what the AI says when joining the call:
```python
introduction="Hello! I'm Amiga, your AI assistant..."
```

### Tools
Add custom functions the AI can call:
```python
tools=[end_call, custom_function]
```

## Testing

### Test Locally

```bash
# Start agent
./start.sh

# In another terminal, test with cartesia CLI
cartesia chat 8000
```

### Test with Real Calls

1. Start this agent
2. Start Node.js bridge (in parent directory)
3. Start Next.js app
4. Make a test call via the UI

## Troubleshooting

### Import Errors

**Problem**: `ModuleNotFoundError: No module named 'line'`

**Solution**:
```bash
pip3 install cartesia-line
```

### Port Already in Use

**Problem**: `Address already in use`

**Solution**:
```bash
lsof -ti:8000 | xargs kill -9
```

### API Key Errors

**Problem**: `Invalid API key`

**Solution**:
- Check `.env` file has correct keys
- No extra spaces or quotes
- Keys are active and have credits

### Agent Not Responding

**Check**:
1. Agent is running (port 8000)
2. WebSocket connected (check logs)
3. Anthropic API key is valid
4. Claude has credits available

## Dependencies

Core dependencies (all installed):

- **cartesia-line**: Voice agent framework
- **supabase**: Database client
- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **websockets**: WebSocket support
- **python-dotenv**: Environment variables

Plus their dependencies (all auto-installed).

## More Info

- **Parent README**: `../CARTESIA_LINE_SETUP.md`
- **Quick Start**: `../QUICK_START.md`
- **Cartesia Docs**: https://docs.cartesia.ai/line

---

**Ready to make AI-assisted fertility consultations!** 🎉

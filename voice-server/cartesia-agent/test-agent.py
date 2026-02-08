#!/usr/local/opt/python@3.11/bin/python3.11
"""Simple test agent"""

import os
from dotenv import load_dotenv
from line.llm_agent import LlmAgent, LlmConfig, end_call
from line.voice_agent_app import VoiceAgentApp

load_dotenv()

async def get_agent(env, call_request):
    print(f"📞 Creating agent for call request")
    return LlmAgent(
        model="anthropic/claude-sonnet-4-5-20250929",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        tools=[end_call],
        config=LlmConfig(
            system_prompt="You are a helpful assistant.",
            introduction="Hello! How can I help you today?",
        ),
    )

app = VoiceAgentApp(get_agent=get_agent)

if __name__ == "__main__":
    print("🚀 Starting test agent on port 8000...")
    app.run(port=8000)

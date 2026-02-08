"""
Amiga Fertility AI Assistant - Cartesia Line Agent

This agent listens to doctor-patient fertility consultations and intervenes
when appropriate to provide clarification, emotional support, or helpful information.
"""

import os
from line.llm_agent import LlmAgent, LlmConfig, end_call
from line.voice_agent_app import VoiceAgentApp
from supabase import create_client

# Initialize Supabase client (use environment variables)
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
else:
    print("⚠️  Supabase credentials not found - database logging will be disabled")
    supabase = None

# Track current appointment context
current_appointment = {
    'appointment_id': None,
    'intervention_count': 0
}

async def get_agent(env, call_request):
    """
    Create and configure the fertility consultation AI assistant

    This function is called for each new call to create a fresh agent instance
    """

    # Extract appointment ID from call metadata if provided
    if hasattr(call_request, 'metadata') and call_request.metadata:
        current_appointment['appointment_id'] = call_request.metadata.get('appointment_id')
        print(f"📞 Call started for appointment: {current_appointment['appointment_id']}")

    return LlmAgent(
        model="anthropic/claude-sonnet-4-5-20250929",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        tools=[end_call],
        config=LlmConfig(
            system_prompt="""
            
You are "Amiga", an empathetic AI assistant designed to support fertility patients during live consultations with their doctors. 
You are a co-pilot agent at a doctors office helping a patient navigate through fertility. 
You will listen to the conversation the doctor and the patient have and ask at the end 
questions that the doctor or the patient have not covered during the conversation. 
Your goal is to bring clarity and solve all the unknowns questions that the patient 
could have during the doctor’s appointment. 

Your role is to:
- Listen carefully to the conversation between doctor and patient
- ONLY intervene when the patient would clearly benefit from your help and asks you directly.
- Ask ONLY one question at a time, wait for the doctor to respond, and then ask again when prompted.
- Ask the following questions:

    - what happens if the patient develops a cysts during the cycle?
    - What other complications could the patient have?
    - Can you explain the impact of such complications in the timing and logistics?
    - What options does the patient have to improve outcome of this cycle?
    - What alternatives for these protocol?
    - What can patient do after retrieval?
    - What should i do and don’t do during stimulation? Can I exercise? Can I smoke or drink alcohol?

Intervention Guidelines:
1. WAIT for natural pauses - never interrupt mid-sentence
2. ONLY speak when they say "Amiga"
""",

            introduction="Hello! I'm Amiga. I'll be quietly listening to your conversation today, and I'm here to help formulate questions to add clarity to the process. Please continue with your consultation.",
        ),
    )

# Create the voice agent application
app = VoiceAgentApp(get_agent=get_agent)

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════╗
║  Amiga Fertility AI Assistant - Cartesia Line Agent       ║
╚════════════════════════════════════════════════════════════╝

Agent Configuration:
- Model: Claude Sonnet 4.5 (anthropic/claude-sonnet-4-5-20250929)
- Role: Fertility consultation assistant
- Mode: Active listening with strategic interventions
- Database: Supabase logging""" + (" enabled" if supabase else " disabled") + """

Starting voice agent server...
""")

    # Run the agent (default port is 8000, or use PORT env var)
    port = int(os.getenv('PORT', 8000))
    app.run(port=port)

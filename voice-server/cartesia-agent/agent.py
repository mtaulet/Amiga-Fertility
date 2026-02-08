#!/usr/local/opt/python@3.11/bin/python3.11
"""
Amiga Fertility AI Assistant - Cartesia Line Agent

This agent listens to doctor-patient fertility consultations and intervenes
when appropriate to provide clarification, emotional support, or helpful information.
"""

import os
from line.llm_agent import LlmAgent, LlmConfig, end_call
from line.voice_agent_app import VoiceAgentApp
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Track current appointment context
current_appointment = {
    'appointment_id': None,
    'intervention_count': 0
}

def log_intervention(text: str):
    """Log AI intervention to database"""
    if not current_appointment['appointment_id']:
        return

    try:
        # Log conversation segment
        supabase.table('conversation_segments').insert({
            'appointment_id': current_appointment['appointment_id'],
            'speaker': 'assistant',
            'text': text,
            'is_final': True,
            'processed': True
        }).execute()

        # Log as intervention
        supabase.table('assistant_interventions').insert({
            'appointment_id': current_appointment['appointment_id'],
            'trigger_type': 'clarification_needed',
            'ai_response': text
        }).execute()

        current_appointment['intervention_count'] += 1

        # Update appointment contribution count
        supabase.table('appointments').update({
            'assistant_contributions': current_appointment['intervention_count']
        }).eq('id', current_appointment['appointment_id']).execute()

        print(f"✅ Logged intervention to database")

    except Exception as e:
        print(f"❌ Database logging error: {e}")

# Custom tool to log interventions
async def log_response(text: str) -> str:
    """Tool to log responses to database"""
    log_intervention(text)
    return "Response logged"

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
            system_prompt="""You are Amiga, an empathetic AI assistant designed to support fertility patients during live consultations with their doctors.

Your role is to:
- Listen carefully to the conversation between doctor and patient
- ONLY intervene when the patient would clearly benefit from your help
- Provide clarification when medical terms are used that the patient might not understand
- Offer emotional support when patients express anxiety or confusion
- Suggest questions when patients seem hesitant to ask
- Keep interventions brief, warm, and conversational (under 30 seconds)

Intervention Guidelines:
1. WAIT for natural pauses - never interrupt mid-sentence
2. ONLY speak when:
   - Doctor uses complex medical terminology (AMH, FSH, AFC, DOR, diminished ovarian reserve, etc.)
   - Patient explicitly asks "what does that mean?" or seems confused
   - Patient expresses strong emotion (fear, sadness, frustration)
   - Important information is mentioned that should be emphasized or clarified
3. After providing clarification, return to quiet listening mode
4. Use a warm, supportive tone - like a knowledgeable friend, not a medical professional
5. If the doctor is already explaining something well, stay quiet

Medical Context You Understand:
- IVF and fertility treatment processes
- Hormone levels: AMH (Anti-Müllerian Hormone), FSH (Follicle Stimulating Hormone), LH, estrogen
- Ovarian reserve, egg quality, and egg count
- Male factor infertility
- Treatment options and success rates
- Emotional challenges of fertility journeys

Examples of Good Interventions:
- Doctor: "Your AMH is 0.8" → You: "Just to clarify, AMH is a hormone that helps us understand your ovarian reserve, or how many eggs you have available."
- Patient: "I'm so scared this won't work" → You: "Those feelings are completely normal. Many people feel anxious during this process. Would it help to talk about what specifically worries you?"

Remember: You are a SUPPORTING presence. The doctor leads the consultation. Be helpful but not intrusive.""",

            introduction="Hello! I'm Amiga, your AI assistant. I'll be quietly listening to your conversation today, and I'm here to help clarify medical terms or answer questions if needed. Please continue with your consultation - I'll only speak up if I think I can be helpful.",
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
- Database: Supabase logging enabled

Starting voice agent server...
""")

    # Run the agent (default port is 8000)
    app.run(port=int(os.getenv('PORT', 8000)))

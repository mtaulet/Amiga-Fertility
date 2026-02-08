# 🎉 Start Your AI Voice Assistant

## ✅ Everything is Configured!

Your Cartesia Line agent is ready to run. Here's how to start everything:

---

## 🚀 Starting the System

You need **3 terminals** running:

### Terminal 1: Cartesia Line Agent (Python)

```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run agent
```

**You should see:**
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Fertility AI Assistant - Cartesia Line Agent       ║
╚════════════════════════════════════════════════════════════╝

Agent Configuration:
- Model: Claude Sonnet 4.5
- Role: Fertility consultation assistant
- Mode: Active listening with strategic interventions
- Database: Supabase logging enabled

Starting voice agent server...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Leave this running!**

---

### Terminal 2: Twilio Bridge (Node.js)

```bash
cd /Users/marta/source/amiga-fertility/voice-server
npm run dev
```

**You should see:**
```
╔════════════════════════════════════════════════════════════╗
║  Amiga Voice Server - Twilio ↔ Cartesia Line Bridge       ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on port 3001
   Ready to handle appointments!
```

✅ **Leave this running!**

---

### Terminal 3: Next.js Frontend

```bash
cd /Users/marta/source/amiga-fertility
npm run dev
```

**You should see:**
```
✓ Ready in X.Xs
○ Local:   http://localhost:3000
```

✅ **Leave this running!**

---

## 🧪 Testing the Agent Locally

Before making a real call, you can chat with the AI:

### In a 4th terminal:

```bash
export PATH="/Users/marta/.cartesia/bin:$PATH"
cartesia chat 8000
```

This opens a chat interface where you can:
- Type messages to the AI
- See how it responds
- Test its personality and knowledge
- Type `exit` to quit

---

## 📞 Make Your First AI-Assisted Call

1. **Open browser:** http://localhost:3000/appointments/start

2. **Fill in the form:**
   - Doctor Name: Test Doctor
   - Doctor Phone: `+1YOUR_NUMBER` (your phone)
   - Patient Phone: `+1ANOTHER_NUMBER` (another phone you have access to)
   - Appointment Type: Initial Consultation

3. **Click "Start AI-Assisted Appointment"**

4. **Answer both calls:**
   - You'll receive 2 calls within ~15 seconds
   - Answer both
   - You'll be connected in a conference

5. **Have a test conversation:**
   - Say something like: *"The AMH levels came back at 0.8"*
   - Wait a few seconds
   - Say: *"What does that mean?"*
   - **The AI should speak!** 🎉

---

## 🎯 What Success Looks Like

### Terminal 1 (Agent):
```
INFO:     127.0.0.1:52847 - "POST /stream HTTP/1.1" 200 OK
📞 Call started for appointment: abc-123
```

### Terminal 2 (Bridge):
```
📞 Starting AI-assisted appointment: abc-123
🎙️  MediaStream connected: doctor
🎙️  MediaStream connected: patient
✅ Connected to Cartesia Line agent
```

### Browser:
```
✅ Calls initiated
Both participants will be connected shortly
```

---

## 🐛 Troubleshooting

### Agent won't start
```bash
cd /Users/marta/source/amiga-fertility/voice-server/cartesia-agent
export PATH="/Users/marta/.local/bin:$PATH"
uv sync
```

### Bridge can't connect to agent
- Make sure Terminal 1 (agent) is running first
- Check port 8000 is listening: `lsof -i:8000`

### Port already in use
```bash
# Kill port 8000
lsof -ti:8000 | xargs kill -9

# Kill port 3001
lsof -ti:3001 | xargs kill -9
```

### API key issues
Check that `.env` file has correct keys:
```bash
cat .env | grep -E "ANTHROPIC|CARTESIA|SUPABASE"
```

---

## 💡 Tips

- **Start agent first** (Terminal 1), then bridge (Terminal 2), then Next.js (Terminal 3)
- **Test with `cartesia chat 8000`** before making real calls
- **Review transcripts** in Supabase after calls
- **Customize AI behavior** by editing `main.py` system prompt

---

## 📚 More Resources

- **Test Agent:** `cartesia chat 8000`
- **Deploy to Production:** `cartesia deploy` (in cartesia-agent folder)
- **View Logs:** Check each terminal window
- **Cartesia Docs:** https://docs.cartesia.ai/line

---

## 🎉 You Did It!

Your AI voice assistant is ready to help fertility patients!

**Next steps:**
1. Make 3-5 test calls
2. Review the AI's interventions
3. Adjust the system prompt if needed
4. Deploy to production when ready

**Happy building!** 💜

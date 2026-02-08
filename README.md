# Amiga Fertility - AI Copilot for Patient-Doctor Consultations

A secure, HIPAA-compliant web platform that guides women patients through fertility clinics with an AI assistant that listens live during patient-doctor calls to provide clarification, emotional support, and helpful information.

## 🚀 Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Authentication**: Auth0 (HIPAA-eligible)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Voice AI**: Cartesia Line + Twilio for AI-assisted consultations
- **Hosting**: Vercel (frontend), Supabase (database)

## 🔐 Security & Compliance

This platform is designed with healthcare data protection in mind:

- **Auth0 Multi-Factor Authentication** - Enterprise-grade authentication
- **Row Level Security** - Database-level access control
- **Encryption at rest and in transit** - All data is encrypted
- **HIPAA-compliant infrastructure** - Available on Auth0 and Supabase paid plans
- **Audit logging** - Track all access to patient data

## 📋 Prerequisites

- Node.js 20+ and npm
- Auth0 account
- Supabase account
- Twilio account (for voice calls)
- Cartesia account (for AI agent)

## 🛠️ Getting Started

### 1. Clone and Install Dependencies

```bash
cd amiga-fertility
npm install
```

### 2. Set Up Auth0

1. Create an account at [auth0.com](https://auth0.com)
2. Create a new application (Regular Web Application)
3. Configure settings:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
4. Enable Multi-Factor Authentication:
   - Go to Security → Multi-factor Auth
   - Enable at least one MFA method (SMS, Email, or Authenticator App)

### 3. Set Up Supabase

Follow the detailed instructions in [`supabase/README.md`](./supabase/README.md) to:
1. Create a Supabase project
2. Run database migrations
3. Configure environment variables

### 4. Set Up Voice Server

See [`voice-server/SETUP_CARTESIA_CALLS_API.md`](./voice-server/SETUP_CARTESIA_CALLS_API.md) for:
1. Twilio configuration
2. Cartesia agent deployment
3. Voice server setup

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Auth0 Configuration
AUTH0_SECRET='use [openssl rand -hex 32] to generate'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL='your_supabase_url'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your_anon_key'
SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'

# Voice Server
NEXT_PUBLIC_VOICE_SERVER_URL='http://localhost:3001'

# Environment
NODE_ENV='development'
```

Generate AUTH0_SECRET:
```bash
openssl rand -hex 32
```

### 6. Run Development Server

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Voice server
cd voice-server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
amiga-fertility/
├── src/
│   ├── app/                    # Next.js app directory (routes)
│   │   ├── api/
│   │   │   ├── auth/[auth0]/  # Auth0 authentication endpoints
│   │   │   └── appointments/  # Appointment creation API
│   │   ├── appointments/       # AI-assisted appointments
│   │   ├── clinics/           # Clinic directory
│   │   ├── dashboard/         # Patient dashboard
│   │   ├── intake/            # Patient intake form
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   └── Navigation.tsx     # Navigation component
│   └── lib/
│       └── supabase/          # Supabase client and types
├── supabase/
│   ├── migrations/            # Database migrations
│   └── README.md              # Supabase setup instructions
├── voice-server/              # Twilio + Cartesia integration
│   ├── cartesia-agent/        # Cartesia Line agent code
│   ├── twilio-cartesia-phone-bridge.js  # Voice bridge
│   └── SETUP_CARTESIA_CALLS_API.md
├── .env.example               # Example environment variables
└── package.json
```

## 🎯 Features

### Current Features
- ✅ Secure authentication with Auth0
- ✅ Patient dashboard
- ✅ User profile management
- ✅ Patient intake form with fertility-specific questions
- ✅ Clinic directory with search and filtering
- ✅ AI-assisted appointments with live AI support during calls
- ✅ Voice integration with Twilio + Cartesia
- ✅ Protected routes with middleware
- ✅ Responsive design with Tailwind CSS
- ✅ Database schema for patients, appointments, clinics, documents, messages

### Planned Features
- [ ] Document upload and management
- [ ] Secure messaging with clinics
- [ ] Medical history tracking
- [ ] Email notifications
- [ ] Mobile app (React Native)

## 🎙️ AI Assistant Features

The AI assistant (Amiga) joins doctor-patient calls to:
- **Clarify medical terminology** in real-time (AMH, FSH, IVF terms)
- **Provide emotional support** when patients express anxiety
- **Suggest questions** patients might want to ask
- **Take automated notes** of the conversation
- **Create full transcripts** for later review

The AI only speaks when helpful and respects the doctor-led consultation.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Production Checklist

Before launching to production:

- [ ] **Auth0 Setup**
  - [ ] Upgrade to paid plan with HIPAA support
  - [ ] Sign Business Associate Agreement (BAA)
  - [ ] Enable MFA enforcement for all users
  - [ ] Configure branding and email templates
  - [ ] Set up production callback URLs

- [ ] **Supabase Setup**
  - [ ] Upgrade to Pro plan with HIPAA support
  - [ ] Sign Business Associate Agreement (BAA)
  - [ ] Enable automated backups
  - [ ] Configure audit logging
  - [ ] Review and test all RLS policies
  - [ ] Set up staging environment

- [ ] **Twilio Setup**
  - [ ] Upgrade to paid account
  - [ ] Configure production phone numbers
  - [ ] Set up call recording (with patient consent)
  - [ ] Configure webhooks for production

- [ ] **Cartesia Setup**
  - [ ] Configure production agent
  - [ ] Test AI responses
  - [ ] Monitor usage and costs

- [ ] **General**
  - [ ] Set up monitoring and error tracking (e.g., Sentry)
  - [ ] Configure custom domain
  - [ ] Set up SSL/TLS certificates
  - [ ] Create privacy policy and terms of service
  - [ ] Conduct security audit
  - [ ] Set up incident response plan
  - [ ] Train staff on HIPAA compliance

## 🧪 Testing

```bash
npm run test    # Run tests (when configured)
npm run lint    # Run ESLint
npm run build   # Test production build
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 HIPAA Compliance Notes

### What This Platform Provides:
- Encrypted data storage and transmission
- Secure authentication with MFA
- Access controls and audit logging
- Database-level security with RLS
- Secure voice communications

### What You Need to Do:
1. **Sign BAAs** with Auth0, Supabase, Twilio, and Cartesia
2. **Staff Training** on HIPAA compliance
3. **Security Policies** - Document your security procedures
4. **Incident Response Plan** - How to handle data breaches
5. **Regular Audits** - Review access logs and security
6. **Data Retention** - Define and implement data retention policies
7. **Patient Consent** - Get consent for AI assistance and call recording

### Important:
⚠️ **This is not legal advice**. Consult with a healthcare compliance attorney before handling Protected Health Information (PHI). HIPAA compliance requires more than just technical measures.

## 🆘 Support

For issues or questions:
- Check the documentation in each directory
- Review Auth0, Supabase, Twilio, and Cartesia documentation
- Contact support@amiga-fertility.com (when available)

## 📄 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. For internal development team only.

---

Built with ❤️ for women's health and empowered by AI 🤖

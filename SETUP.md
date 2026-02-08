# Quick Setup Guide

## 🚀 Get Started in 3 Steps

### Step 1: Set Up Auth0

1. Go to [auth0.com](https://auth0.com) and create a free account
2. Create a new **Regular Web Application**
3. Configure settings:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
4. Copy these values from the **Settings** tab:
   - Domain
   - Client ID
   - Client Secret

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)
4. Go to **SQL Editor** and run the migration:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy all contents
   - Paste and **Run** in SQL Editor

### Step 3: Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Auth0 Configuration
AUTH0_SECRET='<run: openssl rand -hex 32>'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-domain.auth0.com'
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL='your_supabase_url'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your_anon_key'
SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'

# Environment
NODE_ENV='development'
```

Generate AUTH0_SECRET:
```bash
openssl rand -hex 32
```

### Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Test the auth flow:
1. Click "Patient Login"
2. Sign up or log in
3. You'll be redirected to the dashboard

## 🔐 For Production

Before going live with real patient data:

**Auth0:**
- [ ] Upgrade to paid plan with HIPAA support
- [ ] Sign Business Associate Agreement (BAA)
- [ ] Enable MFA enforcement
- [ ] Configure production URLs

**Supabase:**
- [ ] Upgrade to Pro plan with HIPAA support
- [ ] Sign Business Associate Agreement (BAA)
- [ ] Enable automated backups
- [ ] Configure audit logging

**Legal & Compliance:**
- [ ] Consult healthcare compliance attorney
- [ ] Create privacy policy and terms of service
- [ ] Set up incident response plan
- [ ] Train staff on HIPAA compliance

## 📞 Need Help?

- Auth0 Docs: https://auth0.com/docs/quickstart/webapp/nextjs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

## 🎉 What's Included

✅ Secure authentication with Auth0
✅ Database with Row Level Security
✅ Patient dashboard
✅ User profile management
✅ Protected routes
✅ Responsive design
✅ Database schema for appointments, documents, messages

## 🔮 Next Steps

Add features like:
- Appointment scheduling
- Document uploads
- Secure messaging
- Medical history forms
- Email notifications

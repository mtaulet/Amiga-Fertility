# Supabase Setup Instructions

This directory contains the database schema and migrations for the Amiga Fertility platform.

## Initial Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new account or sign in
2. Create a new project
3. Choose a region close to your users
4. Wait for the project to be provisioned

### 2. Get Your Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/001_initial_schema.sql`
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- **patients** table - Core patient information
- **patient_profiles** table - Medical history and health information
- **appointments** table - Clinic appointments
- **documents** table - Patient documents and files
- **messages** table - Communication between patients and clinics
- Row Level Security (RLS) policies to protect patient data
- Indexes for optimized queries

## Database Schema

### Tables

#### patients
Core patient information linked to Auth0 authentication.

#### patient_profiles
Detailed medical information (medical history, medications, allergies).

#### appointments
Scheduled appointments with clinics.

#### documents
Patient documents and uploaded files.

#### messages
Messages between patients, clinics, and administrators.

## Security

### Row Level Security (RLS)

All tables have RLS enabled to ensure patients can only access their own data. The policies use Auth0 user IDs to verify access.

### HIPAA Compliance

For HIPAA compliance, you must:

1. **Enable Supabase's HIPAA-compliant infrastructure**:
   - Contact Supabase support to enable HIPAA features
   - Sign a Business Associate Agreement (BAA)
   - Upgrade to at least the Pro plan

2. **Enable additional security features**:
   - Enable audit logging
   - Configure IP allowlisting if needed
   - Set up database backups
   - Enable SSL/TLS enforcement

3. **Configure encryption**:
   - Database encryption at rest (enabled by default)
   - Transit encryption via HTTPS (enabled by default)

## Development

### Adding New Migrations

Create new migration files following the naming convention:
- `002_feature_name.sql`
- `003_another_feature.sql`

Always increment the number prefix to maintain order.

### Testing Queries

Use the Supabase SQL Editor or Table Editor to test queries and view data during development.

## Production Checklist

Before going to production:

- [ ] Enable HIPAA compliance with Supabase
- [ ] Sign BAA with Supabase
- [ ] Configure automated database backups
- [ ] Set up monitoring and alerts
- [ ] Enable audit logging
- [ ] Review and test all RLS policies
- [ ] Set up staging environment
- [ ] Document data retention policies
- [ ] Configure IP allowlisting if needed

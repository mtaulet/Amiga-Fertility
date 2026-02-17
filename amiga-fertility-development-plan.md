# Amiga Fertility Web Application - MVP Development Plan

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Component Library**: Chakra UI
- **Authentication**: Auth0 (already configured)
- **Backend**: Node.js REST API
- **Database**: Supabase PostgreSQL (already configured)
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (frontend) + your Node.js hosting

## Architecture

```
┌─────────────────┐
│   Next.js App   │  (Frontend - Vercel)
│   + Chakra UI   │
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼────────┐
│  Node.js API    │  (Backend - Express/Fastify)
│                 │
├─────────────────┤
│    Auth0        │  (Validates JWT tokens)
├─────────────────┤
│   Supabase      │  (PostgreSQL + Storage)
└─────────────────┘
```

## MVP Scope (3-4 weeks)

Build the core patient portal with:
1. Patient profile management (Auth0 user already exists)
2. Clinic browsing and selection
3. Appointment tracking
4. File uploads

**Out of scope for MVP:**
- AI transcription/summarization (manual text entry only)
- Clinic admin portal
- Treatment calendar generation
- Email/SMS notifications
- Real-time messaging

---

## Core Features

### 1. Patient Portal

#### A. Patient Profile
**Pages:**
- `/dashboard` - Overview/home
- `/profile` - Personal information (plus medical history, treatment preferences)

**Fields:**
- **Personal**: Name, partner name, DOB, address, phone, email, timezone, profile photo
- **Medical**: Free text medical history, file uploads, last period date, cycle info, birth control status
- **Preferences**: Treatment type (Egg Freezing, IVF, etc.), ideal date, budget/care/throughput ranking

#### B. Clinic Selection
**Pages:**
- `/clinics` - Browse all clinics, Clinic detail page, My selected clinics

**Features:**
- View clinic cards (name, location, photo, specialties)
- Click to see full clinic details
- Save clinics to "My Selection"
- Mark one clinic a s "Final Choice"

#### C. Appointments
**Pages:**
- `/appointments` - List all appointments
- `/appointments/[id]` - Single appointment detail

**Features:**
- Create appointment (date, clinic, doctor name)
- Upload files/notes (manual for MVP)
- Add text notes
- View appointment history

#### D. File Management
- Upload medical records (PDF, images)
- View uploaded files
- Delete files
- Stored in Supabase Storage

---

## Database Schema (Supabase)

### Tables

```sql
-- Patients (links to Auth0 users via auth0_id)
create table patients (
  id uuid primary key default uuid_generate_v4(),
  auth0_id text unique not null, -- This is the Auth0 user ID (sub claim)
  first_name text,
  last_name text,
  partner_first_name text,
  partner_last_name text,
  date_of_birth date,
  sex text,
  address text,
  city text,
  zip_code text,
  country text,
  phone_primary text,
  phone_secondary text,
  email_preferred text,
  timezone text,
  profile_photo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Medical Data
create table medical_data (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  medical_history text,
  last_period_date date,
  cycle_duration_days int,
  cycle_regular boolean,
  on_birth_control boolean,
  updated_at timestamp with time zone default now(),
  unique(patient_id) -- one medical data record per patient
);

-- Treatment Preferences
create table treatment_preferences (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  treatment_type text,
  ideal_date date,
  preference_budget int check (preference_budget between 1 and 3),
  preference_patient_care int check (preference_patient_care between 1 and 3),
  preference_throughput int check (preference_throughput between 1 and 3),
  updated_at timestamp with time zone default now(),
  unique(patient_id) -- one preference record per patient
);

-- Clinics
create table clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  country text,
  address text,
  description text,
  specialties text[], -- array of specialties
  photo_url text,
  created_at timestamp with time zone default now()
);

-- Patient-Clinic Selections
create table patient_clinics (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  status text check (status in ('interested', 'selected', 'final_choice')),
  notes text,
  created_at timestamp with time zone default now(),
  unique(patient_id, clinic_id)
);

-- Appointments
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  appointment_date timestamp with time zone,
  doctor_name text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Medical Files
create table medical_files (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  file_name text not null,
  file_path text not null, -- path in Supabase Storage
  file_type text,
  file_size bigint,
  uploaded_at timestamp with time zone default now()
);

-- Create indexes for faster queries
create index idx_patients_auth0_id on patients(auth0_id);
create index idx_medical_data_patient_id on medical_data(patient_id);
create index idx_treatment_preferences_patient_id on treatment_preferences(patient_id);
create index idx_patient_clinics_patient_id on patient_clinics(patient_id);
create index idx_appointments_patient_id on appointments(patient_id);
create index idx_medical_files_patient_id on medical_files(patient_id);

-- Enable Row Level Security (RLS) - But we'll handle auth via Auth0 tokens
-- You can disable RLS and handle security at the API level
-- OR set up policies that check a custom claim from Auth0

-- For now, disable RLS and handle auth in your Next.js API routes
alter table patients disable row level security;
alter table medical_data disable row level security;
alter table treatment_preferences disable row level security;
alter table patient_clinics disable row level security;
alter table appointments disable row level security;
alter table medical_files disable row level security;

-- Clinics table is public (read-only for now)
alter table clinics disable row level security;
```

### Storage Buckets

```sql
-- Create storage bucket for medical files
insert into storage.buckets (id, name, public)
values ('medical-files', 'medical-files', false);

-- Create storage bucket for profile photos
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true);

-- Note: Storage policies will need to be handled at API level with Auth0
-- Or set up custom policies that validate Auth0 JWT tokens
```

### Initial Clinic Seed Data (Optional)

```sql
-- Add some example clinics
insert into clinics (name, city, country, description, specialties, photo_url)
values
  ('Calatrava Fertility Center', 'Madrid', 'Spain', 
   'Leading fertility center with over 35 years of experience in egg freezing and IVF.',
   array['Egg Freezing', 'IVF', 'Genetic Testing'],
   'https://example.com/clinics/calatrava.jpg'),
  ('ReproLife Clinic', 'Barcelona', 'Spain',
   'Modern fertility clinic specializing in international patients.',
   array['Egg Freezing', 'IVF', 'Egg Donation'],
   'https://example.com/clinics/reprolife.jpg');
```

---

## Project Structure

### Frontend (Next.js)
```
amiga-frontend/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── clinics/
│   │   ├── page.tsx
│   ├── appointments/
│   │   ├── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   ├── profile/
│   │   ├── PersonalInfoForm.tsx
│   │   ├── MedicalDataForm.tsx
│   │   └── PreferencesForm.tsx
│   ├── clinics/
│   │   ├── ClinicCard.tsx
│   │   ├── ClinicDetail.tsx
│   │   └── ClinicList.tsx
│   ├── appointments/
│   │   ├── AppointmentCard.tsx
│   │   └── AppointmentForm.tsx
│   └── common/
│       ├── FileUpload.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api/
│   │   └── client.ts (API client to call Node backend)
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── usePatient.ts
│   │   └── useClinics.ts
│   └── types/
│       └── index.ts
├── public/
├── theme.ts (Chakra UI theme)
└── package.json
```

### Backend (Node.js)
```
amiga-backend/
├── src/
│   ├── routes/
│   │   ├── patients.js
│   │   ├── clinics.js
│   │   ├── appointments.js
│   │   └── files.js
│   ├── middleware/
│   │   ├── auth.js (Auth0 JWT validation)
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── patientController.js
│   │   ├── clinicController.js
│   │   └── appointmentController.js
│   ├── services/
│   │   └── supabase.js (Supabase client)
│   ├── utils/
│   │   └── validation.js
│   └── index.js (Express/Fastify app)
├── .env
└── package.json
```

---

## Design System (Chakra UI)

### Chakra Theme Configuration
```typescript
// theme.ts
import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#FFF5F2',
      100: '#FFE8E0',
      200: '#FFD1C1',
      300: '#FFBA9F',
      400: '#F89A6F',
      500: '#E67449', // Primary brand orange
      600: '#D55A35',
      700: '#B94524',
      800: '#8F3318',
      900: '#6B240F',
    },
    purple: {
      500: '#6B4D78', // Deep purple accent
    },
    background: {
      cream: '#F4EDE3', // Warm background
    }
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        borderRadius: 'lg',
        fontWeight: 'semibold',
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'sm',
        }
      }
    }
  },
  styles: {
    global: {
      body: {
        bg: 'background.cream',
      }
    }
  }
})

export default theme
```

### Key Design Elements
- **Orange sidebar** with white text for navigation
- **Cream background** (#F4EDE3) for main content areas
- **White cards** with rounded corners and subtle shadows
- **Profile photos** in circles (use Chakra's `Avatar` component)
- **Generous spacing** (Chakra's spacing scale)
- **Brand colors** for buttons and accents

### Common Component Examples
```typescript
// Sidebar navigation
<Box bg="brand.500" color="white" h="100vh" w="250px">
  <VStack spacing={4} align="stretch">
    <Link href="/dashboard">Dashboard</Link>
    <Link href="/profile">Profile</Link>
    <Link href="/clinics">Clinics</Link>
  </VStack>
</Box>

// Clinic card
<Card>
  <CardBody>
    <Image src={clinic.photo_url} borderRadius="lg" />
    <Heading size="md" mt={4}>{clinic.name}</Heading>
    <Text color="gray.600">{clinic.city}, {clinic.country}</Text>
    <Button mt={4} colorScheme="brand">Select Clinic</Button>
  </CardBody>
</Card>

// Form input
<FormControl>
  <FormLabel>First Name</FormLabel>
  <Input placeholder="Enter first name" />
</FormControl>
```

---

## MVP User Flow

1. **Login with Auth0** → User already authenticated
2. **First-time Setup** → Create patient profile in database (links to Auth0 ID)
3. **Complete Profile** → Personal info → Medical data → Preferences
4. **Browse Clinics** → View details → Save to "My Clinics"
5. **Select Final Clinic** → Mark as final choice
6. **Create Appointment** → Add notes → Upload files
7. **View Dashboard** → See profile completion, upcoming appointments

Keep it simple. Get the basic patient journey working. You can always add complexity later!
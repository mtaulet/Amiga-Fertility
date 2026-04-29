'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminSidebarLayout from '@/components/layouts/AdminSidebarLayout'
import {
  Box, Button, Container, DialogBackdrop, DialogBody, DialogCloseTrigger,
  DialogContent, DialogHeader, DialogPositioner, DialogRoot, DialogTitle,
  Flex, Grid, Heading, Input, NativeSelect, Separator, Text, Textarea, VStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Patient, Appointment, Clinic } from '@/lib/supabase/types'
import { FiArrowLeft } from 'react-icons/fi'

type FullPatient = Patient & {
  appointments: Appointment[]
  selected_clinic_id: string | null
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const today = new Date(), d = new Date(dob)
  let age = today.getFullYear() - d.getFullYear()
  if (today.getMonth() - d.getMonth() < 0 || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--
  return age
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}
function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}
function yesNo(v: boolean | null | undefined) {
  return v === null || v === undefined ? '—' : v ? 'Yes' : 'No'
}

// ── Reusable sub-components ───────────────────────────────────────────────────
function FieldView({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">
        {label}
      </Text>
      <Text fontSize="sm" color="gray.900">{value || '—'}</Text>
    </Box>
  )
}

function FieldEdit({ label, name, value, onChange, type = 'text', options }: {
  label: string; name: string; value: string
  onChange: (name: string, val: string) => void
  type?: string
  options?: { value: string; label: string }[]
}) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">
        {label}
      </Text>
      {options ? (
        <NativeSelect.Root size="sm">
          <NativeSelect.Field value={value} onChange={e => onChange(name, e.target.value)} bg="white" fontSize="sm">
            <option value="">— select —</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      ) : (
        <Input size="sm" type={type} value={value} onChange={e => onChange(name, e.target.value)} bg="white" fontSize="sm" />
      )}
    </Box>
  )
}

function SectionCard({
  title, editing, saving, saved, onEdit, onSave, onCancel, children,
}: {
  title: string; editing: boolean; saving: boolean; saved: boolean
  onEdit: () => void; onSave: () => void; onCancel: () => void
  children: React.ReactNode
}) {
  return (
    <Card.Root bg="white" borderWidth="1px" borderColor="gray.200" mb="4">
      <Card.Body>
        <Flex justify="space-between" align="flex-start" mb="4">
          <Box>
            <Heading size="sm" color="gray.900" mb="1">{title}</Heading>
            <Separator borderColor="gray.200" />
          </Box>
          <Flex align="center" gap="2">
            {saved && <Text fontSize="xs" color="green.500">✓ Saved</Text>}
            {!editing ? (
              <Button size="xs" variant="ghost" color="brand.500" onClick={onEdit}>Edit</Button>
            ) : (
              <>
                <Button size="xs" variant="ghost" color="gray.400" onClick={onCancel}>Cancel</Button>
                <Button size="xs" colorPalette="orange" onClick={onSave} loading={saving}>Save</Button>
              </>
            )}
          </Flex>
        </Flex>
        {children}
      </Card.Body>
    </Card.Root>
  )
}

// ── Create Appointment Modal ──────────────────────────────────────────────────
function CreateAppointmentModal({
  patient, clinics, onClose, onCreated,
}: {
  patient: FullPatient; clinics: Clinic[]
  onClose: () => void; onCreated: (a: Appointment) => void
}) {
  const preClinic = clinics.find(c => c.id === patient.selected_clinic_id)
  const [form, setForm] = useState({
    appointment_date: '',
    appointment_type: 'First Appointment',
    clinic_id: patient.selected_clinic_id ?? '',
    clinic_name: preClinic?.name ?? '',
    doctor_name: '',
    status: 'scheduled',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(name: string, val: string) {
    setForm(prev => {
      const next = { ...prev, [name]: val }
      if (name === 'clinic_id') {
        const c = clinics.find(c => c.id === val)
        next.clinic_name = c?.name ?? ''
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, patient_id: patient.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      onCreated(data.appointment)
      onClose()
    } catch { setError('Failed to create appointment') }
    finally { setSaving(false) }
  }

  const typeOpts = ['First Appointment', 'Follow-up', 'Consultation', 'Lab Work', 'Ultrasound', 'Procedure'].map(v => ({ value: v, label: v }))
  const statusOpts = [{ value: 'scheduled', label: 'Scheduled' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' }]

  return (
    <DialogRoot open onOpenChange={({ open }) => !open && onClose()} size="md">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <DialogBody pb="6">
            <VStack gap="4" align="stretch">
              <Grid templateColumns="repeat(2,1fr)" gap="3">
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Type</Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field value={form.appointment_type} onChange={e => set('appointment_type', e.target.value)} bg="white" fontSize="sm">
                      {typeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Status</Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field value={form.status} onChange={e => set('status', e.target.value)} bg="white" fontSize="sm">
                      {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Date *</Text>
                  <Input size="sm" type="datetime-local" value={form.appointment_date} onChange={e => set('appointment_date', e.target.value)} bg="white" fontSize="sm" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Clinic</Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field value={form.clinic_id} onChange={e => set('clinic_id', e.target.value)} bg="white" fontSize="sm">
                      <option value="">— select —</option>
                      {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
                <Box style={{ gridColumn: '1/-1' }}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Doctor</Text>
                  <Input size="sm" value={form.doctor_name} onChange={e => set('doctor_name', e.target.value)} bg="white" fontSize="sm" />
                </Box>
              </Grid>
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Notes</Text>
                <Textarea size="sm" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} bg="white" fontSize="sm" resize="vertical" />
              </Box>
              {error && <Text color="red.500" fontSize="sm">{error}</Text>}
              <Flex justify="flex-end" gap="3">
                <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
                <Button size="sm" colorPalette="orange" onClick={handleSave} loading={saving} disabled={!form.appointment_date}>
                  Create Appointment
                </Button>
              </Flex>
            </VStack>
          </DialogBody>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [patient, setPatient] = useState<FullPatient | null>(null)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'profile' | 'appointments' | 'documents'>('profile')
  const [editSection, setEditSection] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<FullPatient>>({})
  const [saving, setSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [showCreateAppt, setShowCreateAppt] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/admin/patients/${id}`).then(r => r.json()),
      fetch('/api/admin/clinics').then(r => r.json()),
    ]).then(([pd, cd]) => {
      setPatient(pd.patient ?? null)
      setClinics(cd.clinics ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  function startEdit(section: string) {
    setEditSection(section)
    setDraft({ ...(patient as FullPatient) })
  }
  function cancelEdit() { setEditSection(null); setDraft({}) }
  function handleChange(name: string, val: string) { setDraft(prev => ({ ...prev, [name]: val })) }

  async function saveSection() {
    if (!patient) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) return
      setPatient({ ...patient, ...data.patient })
      setSavedSection(editSection)
      setTimeout(() => setSavedSection(null), 2500)
      setEditSection(null)
      setDraft({})
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <AdminSidebarLayout>
        <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="gray.400">Loading…</Text>
        </Container>
      </AdminSidebarLayout>
    )
  }

  if (!patient) {
    return (
      <AdminSidebarLayout>
        <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="red.400">Patient not found.</Text>
        </Container>
      </AdminSidebarLayout>
    )
  }

  const isEd = (s: string) => editSection === s
  const p = editSection ? (draft as FullPatient) : patient
  const age = calcAge(patient.date_of_birth)
  const clinic = clinics.find(c => c.id === patient.selected_clinic_id)

  const headerParts = [
    patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : null,
    age ? `${age} y/o` : null,
    cap(patient.sex),
    patient.fertility_goals?.[0] ?? null,
    patient.treatment_timeline,
  ].filter(Boolean).join(', ')

  const sexOpts = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'non-binary', label: 'Non-binary' }]
  const boolOpts = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
  const goalOpts = ['IVF', 'IUI', 'Egg Freezing', 'Embryo Freezing', 'Fertility Assessment'].map(v => ({ value: v, label: v }))
  const clinicOpts = clinics.map(c => ({ value: c.id, label: c.name }))

  return (
    <AdminSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>

        {/* Back */}
        <Flex
          align="center" gap="2" mb="4" color="gray.500" fontSize="sm" fontWeight="medium"
          cursor="pointer" _hover={{ color: 'brand.600' }} width="fit-content"
          onClick={() => router.push('/admin/patients')}
        >
          <FiArrowLeft size={14} /> Back to patients
        </Flex>

        {/* Header */}
        <Card.Root bg="white" borderWidth="1px" borderColor="gray.200" mb="6">
          <Card.Body>
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Heading size="xl" color="brand.600" fontWeight="bold">{headerParts}</Heading>
                <Flex align="center" gap="3" mt="2" flexWrap="wrap">
                  <Text fontSize="sm" color="gray.500">{clinic?.name ?? 'No clinic assigned'}</Text>
                  <Box w="1px" h="14px" bg="gray.200" />
                  <Box
                    display="inline-flex" px="2" py="0.5" borderRadius="full"
                    fontSize="xs" fontWeight="semibold"
                    bg={patient.intake_completed ? 'green.100' : 'orange.100'}
                    color={patient.intake_completed ? 'green.700' : 'orange.700'}
                  >
                    {patient.intake_completed ? 'Intake complete' : 'Intake pending'}
                  </Box>
                  <Box w="1px" h="14px" bg="gray.200" />
                  <Text fontSize="xs" color="gray.400">Created {fmtDate(patient.created_at)}</Text>
                </Flex>
              </Box>
              <Button size="sm" colorPalette="orange" onClick={() => setShowCreateAppt(true)}>
                + New Appointment
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Tabs */}
        <Flex borderBottom="1px" borderColor="gray.200" mb="6" gap="0">
          {(['profile', 'appointments', 'documents'] as const).map(t => (
            <Box
              key={t} px="4" py="2" fontSize="sm" fontWeight={tab === t ? 'semibold' : 'medium'}
              color={tab === t ? 'brand.600' : 'gray.500'}
              borderBottom={tab === t ? '2px solid' : '2px solid transparent'}
              borderColor={tab === t ? 'brand.500' : 'transparent'}
              cursor="pointer" mb="-1px" transition="all 0.15s"
              _hover={{ color: 'gray.700' }}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'appointments' && (patient.appointments?.length ?? 0) > 0 && (
                <Box as="span" ml="1.5" bg="brand.500" color="white" borderRadius="full" fontSize="10px" fontWeight="bold" px="1.5" py="0.5">
                  {patient.appointments.length}
                </Box>
              )}
            </Box>
          ))}
        </Flex>

        {/* Profile tab */}
        {tab === 'profile' && (
          <>
            {/* Personal Data */}
            <SectionCard title="Personal Data" editing={isEd('personal')} saving={saving} saved={savedSection === 'personal'}
              onEdit={() => startEdit('personal')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="3" mb="4">
                {isEd('personal') ? (
                  <>
                    <FieldEdit label="First Name" name="first_name" value={draft.first_name ?? ''} onChange={handleChange} />
                    <FieldEdit label="Last Name" name="last_name" value={draft.last_name ?? ''} onChange={handleChange} />
                    <FieldEdit label="Sex" name="sex" value={draft.sex ?? ''} onChange={handleChange} options={sexOpts} />
                    <FieldEdit label="Date of Birth" name="date_of_birth" type="date" value={draft.date_of_birth ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <FieldView label="First Name" value={p.first_name} />
                    <FieldView label="Last Name" value={p.last_name} />
                    <FieldView label="Sex" value={cap(p.sex)} />
                    <FieldView label="Date of Birth" value={fmtDate(p.date_of_birth)} />
                  </>
                )}
              </Grid>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="3" mb="4">
                {isEd('personal') ? (
                  <>
                    <FieldEdit label="Partner" name="partner_name" value={draft.partner_name ?? ''} onChange={handleChange} />
                    <FieldEdit label="Partner Last Name" name="partner_last_name" value={draft.partner_last_name ?? ''} onChange={handleChange} />
                    <FieldEdit label="Partner Sex" name="partner_sex" value={draft.partner_sex ?? ''} onChange={handleChange} options={sexOpts} />
                    <FieldEdit label="Partner DOB" name="partner_dob" type="date" value={draft.partner_dob ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <FieldView label="Partner" value={p.partner_name} />
                    <FieldView label="Partner Last Name" value={p.partner_last_name} />
                    <FieldView label="Partner Sex" value={cap(p.partner_sex)} />
                    <FieldView label="Partner DOB" value={fmtDate(p.partner_dob)} />
                  </>
                )}
              </Grid>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="3">
                {isEd('personal') ? (
                  <>
                    <FieldEdit label="Address" name="address_line1" value={draft.address_line1 ?? ''} onChange={handleChange} />
                    <FieldEdit label="City" name="city" value={draft.city ?? ''} onChange={handleChange} />
                    <FieldEdit label="ZIP" name="postal_code" value={draft.postal_code ?? ''} onChange={handleChange} />
                    <FieldEdit label="Country" name="country" value={draft.country ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <FieldView label="Address" value={p.address_line1} />
                    <FieldView label="City" value={p.city} />
                    <FieldView label="ZIP" value={p.postal_code} />
                    <FieldView label="Country" value={p.country} />
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Contact */}
            <SectionCard title="Contact" editing={isEd('contact')} saving={saving} saved={savedSection === 'contact'}
              onEdit={() => startEdit('contact')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }} gap="3">
                {isEd('contact') ? (
                  <>
                    <FieldEdit label="Email" name="email" type="email" value={draft.email ?? ''} onChange={handleChange} />
                    <FieldEdit label="Phone" name="phone_number" value={draft.phone_number ?? ''} onChange={handleChange} />
                    <FieldEdit label="Timezone" name="timezone" value={draft.timezone ?? ''} onChange={handleChange} />
                    <FieldEdit label="Partner Email" name="partner_email" type="email" value={draft.partner_email ?? ''} onChange={handleChange} />
                    <FieldEdit label="Partner Phone" name="partner_phone" value={draft.partner_phone ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <FieldView label="Email" value={p.email} />
                    <FieldView label="Phone" value={p.phone_number} />
                    <FieldView label="Timezone" value={p.timezone} />
                    <FieldView label="Partner Email" value={p.partner_email} />
                    <FieldView label="Partner Phone" value={p.partner_phone} />
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Medical Data */}
            <SectionCard title="Medical Data" editing={isEd('medical')} saving={saving} saved={savedSection === 'medical'}
              onEdit={() => startEdit('medical')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="3" mb="4">
                {isEd('medical') ? (
                  <>
                    <FieldEdit label="Last Period Date" name="last_period_date" type="date" value={draft.last_period_date ?? ''} onChange={handleChange} />
                    <FieldEdit label="Cycle Duration (days)" name="cycle_duration_days" type="number" value={draft.cycle_duration_days?.toString() ?? ''} onChange={handleChange} />
                    <FieldEdit label="Regular Cycles" name="regular_cycles" value={draft.regular_cycles?.toString() ?? ''} onChange={handleChange} options={boolOpts} />
                    <FieldEdit label="Birth Control" name="on_birth_control" value={draft.on_birth_control?.toString() ?? ''} onChange={handleChange} options={boolOpts} />
                  </>
                ) : (
                  <>
                    <FieldView label="Last Period Date" value={fmtDate(p.last_period_date)} />
                    <FieldView label="Cycle Duration" value={p.cycle_duration_days ? `${p.cycle_duration_days} days` : null} />
                    <FieldView label="Regular Cycles" value={yesNo(p.regular_cycles)} />
                    <FieldView label="Birth Control" value={yesNo(p.on_birth_control)} />
                  </>
                )}
              </Grid>
              {isEd('medical') ? (
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Notes</Text>
                  <Textarea size="sm" value={draft.past_experience ?? ''} onChange={e => handleChange('past_experience', e.target.value)} rows={3} resize="vertical" bg="white" fontSize="sm" />
                </Box>
              ) : p.past_experience ? (
                <Box mt="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">Notes</Text>
                  <Text fontSize="sm" color="gray.900">{p.past_experience}</Text>
                </Box>
              ) : null}
            </SectionCard>

            {/* Treatment & Clinic */}
            <SectionCard title="Treatment & Clinic" editing={isEd('treatment')} saving={saving} saved={savedSection === 'treatment'}
              onEdit={() => startEdit('treatment')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="3">
                {isEd('treatment') ? (
                  <>
                    <FieldEdit label="Treatment Goal" name="fertility_goals_0" value={draft.fertility_goals?.[0] ?? ''} onChange={(n, v) => setDraft(prev => ({ ...prev, fertility_goals: [v] }))} options={goalOpts} />
                    <FieldEdit label="Timeline" name="treatment_timeline" value={draft.treatment_timeline ?? ''} onChange={handleChange} />
                    <FieldEdit label="Assigned Clinic" name="selected_clinic_id" value={(draft as any).selected_clinic_id ?? ''} onChange={handleChange} options={clinicOpts} />
                  </>
                ) : (
                  <>
                    <FieldView label="Treatment Goal" value={p.fertility_goals?.join(', ') || null} />
                    <FieldView label="Timeline" value={p.treatment_timeline} />
                    <FieldView label="Assigned Clinic" value={clinic?.name ?? null} />
                  </>
                )}
              </Grid>
            </SectionCard>
          </>
        )}

        {/* Appointments tab */}
        {tab === 'appointments' && (
          <Box>
            <Flex justify="flex-end" mb="4">
              <Button size="sm" colorPalette="orange" onClick={() => setShowCreateAppt(true)}>+ New Appointment</Button>
            </Flex>
            {(patient.appointments ?? []).length === 0 ? (
              <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
                <Card.Body>
                  <Text color="gray.400" fontSize="sm" textAlign="center" py="8">No appointments yet.</Text>
                </Card.Body>
              </Card.Root>
            ) : (patient.appointments ?? []).map(a => (
              <Card.Root key={a.id} bg="white" borderWidth="1px" borderColor="gray.200" mb="3">
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.900">{a.appointment_type ?? 'Appointment'}</Text>
                      <Text fontSize="xs" color="gray.500" mt="1">{a.clinic_name ?? '—'}{a.doctor_name ? ` · Dr. ${a.doctor_name}` : ''}</Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontSize="sm" fontWeight="semibold" color="brand.500">{fmtDate(a.appointment_date)}</Text>
                      <Box
                        display="inline-flex" mt="1" px="2" py="0.5" borderRadius="full"
                        fontSize="xs" fontWeight="semibold"
                        bg={a.status === 'confirmed' ? 'green.100' : a.status === 'scheduled' ? 'blue.100' : 'gray.100'}
                        color={a.status === 'confirmed' ? 'green.700' : a.status === 'scheduled' ? 'blue.700' : 'gray.500'}
                      >
                        {a.status}
                      </Box>
                    </Box>
                  </Flex>
                  {a.notes && <Text fontSize="xs" color="gray.500" mt="2">{a.notes}</Text>}
                </Card.Body>
              </Card.Root>
            ))}
          </Box>
        )}

        {/* Documents tab */}
        {tab === 'documents' && (
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Flex justify="space-between" align="center" mb="4">
                <Heading size="sm" color="gray.900">Documents</Heading>
                <Button size="sm" variant="outline">↑ Upload</Button>
              </Flex>
              <Text color="gray.400" fontSize="sm" textAlign="center" py="8">No documents uploaded yet.</Text>
            </Card.Body>
          </Card.Root>
        )}

      </Container>

      {showCreateAppt && (
        <CreateAppointmentModal
          patient={patient}
          clinics={clinics}
          onClose={() => setShowCreateAppt(false)}
          onCreated={appt => {
            setPatient(prev => prev ? { ...prev, appointments: [...(prev.appointments ?? []), appt] } : prev)
            setShowCreateAppt(false)
          }}
        />
      )}
    </AdminSidebarLayout>
  )
}

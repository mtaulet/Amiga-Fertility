'use client'

import { useEffect, useState } from 'react'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import {
  Box, Button, Container, Flex, Grid, Heading, Input,
  NativeSelect, Separator, Text, Textarea,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Patient } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calculateAge(dob: string): number {
  const today = new Date(); const d = new Date(dob)
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}
function abbreviateTreatment(goal: string): string {
  const map: Record<string, string> = {
    'In Vitro Fertilization (IVF)': 'IVF', 'Intrauterine Insemination (IUI)': 'IUI',
    'Egg Freezing': 'EF', 'Embryo Freezing': 'EmF', 'Genetic Testing': 'GT',
    'Fertility Assessment': 'FA', 'Donor Services': 'DS', 'Surrogacy Services': 'SS',
  }
  return map[goal] || goal
}
function fmtDate(d: string | null): string {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}
function cap(s: string | null | undefined): string {
  if (!s) return 'N/A'
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}
function yesNo(v: boolean | null | undefined): string {
  return v === null || v === undefined ? 'N/A' : v ? 'Yes' : 'No'
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Box mb="4">
      <Heading size="md" color="gray.900" mb="1">{children}</Heading>
      <Separator borderColor="gray.300" />
    </Box>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">{label}</Text>
      <Text fontSize="sm" color="gray.900">{value || 'N/A'}</Text>
    </Box>
  )
}

function EditField({ label, name, value, onChange, type = 'text', placeholder }: {
  label: string; name: string; value: string; onChange: (name: string, val: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">{label}</Text>
      <Input size="sm" type={type} name={name} value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder || label}
        bg="white" fontSize="sm" />
    </Box>
  )
}

function EditSelect({ label, name, value, onChange, options }: {
  label: string; name: string; value: string; onChange: (name: string, val: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">{label}</Text>
      <NativeSelect.Root size="sm">
        <NativeSelect.Field value={value} onChange={e => onChange(name, e.target.value)} bg="white" fontSize="sm">
          <option value="">— select —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Box>
  )
}

// Section wrapper with Edit/Save/Cancel controls
function SectionCard({ title, editing, saving, onEdit, onSave, onCancel, children }: {
  title: string; editing: boolean; saving: boolean
  onEdit: () => void; onSave: () => void; onCancel: () => void
  children: React.ReactNode
}) {
  return (
    <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
      <Card.Body>
        <Flex justify="space-between" align="flex-start" mb="0">
          <SectionHeading>{title}</SectionHeading>
          {!editing ? (
            <Button size="xs" variant="ghost" color="brand.500" onClick={onEdit} mt="-1">Edit</Button>
          ) : (
            <Flex gap="2">
              <Button size="xs" variant="ghost" color="gray.400" onClick={onCancel}>Cancel</Button>
              <Button size="xs" colorPalette="orange" onClick={onSave} loading={saving}>Save</Button>
            </Flex>
          )}
        </Flex>
        {children}
      </Card.Body>
    </Card.Root>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Patient>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.patient) setPatient(d.patient)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function startEdit(section: string) {
    setEditingSection(section)
    setDraft({ ...patient })
    setSaveError(null)
  }

  function cancelEdit() {
    setEditingSection(null)
    setDraft({})
  }

  function handleChange(name: string, value: string) {
    setDraft(prev => ({ ...prev, [name]: value || null }))
  }

  async function saveSection() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/patients/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error ?? 'Save failed'); return }
      setPatient(data.patient)
      setEditingSection(null)
      setDraft({})
    } catch { setSaveError('Save failed. Please try again.') }
    finally { setSaving(false) }
  }

  const p = editingSection ? draft as Patient : patient

  if (loading) {
    return (
      <SidebarLayout>
        <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="gray.500">Loading…</Text>
        </Container>
      </SidebarLayout>
    )
  }

  const age = patient?.date_of_birth ? calculateAge(patient.date_of_birth) : null
  const primaryTreatment = patient?.fertility_goals?.[0] ? abbreviateTreatment(patient.fertility_goals[0]) : null
  const headerParts = [
    patient?.first_name && patient?.last_name ? `${patient.first_name} ${patient.last_name}` : null,
    age ? `${age} y/o` : null,
    patient?.sex ? cap(patient.sex) : null,
    primaryTreatment,
    patient?.treatment_timeline,
  ].filter(Boolean)

  const isEditing = (s: string) => editingSection === s
  const ed = (s: string) => isEditing(s)

  const sexOptions = [
    { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' },
    { value: 'non-binary', label: 'Non-binary' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]
  const boolOptions = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>

        {/* Header */}
        <Card.Root bg="white" mb="6" borderWidth="1px" borderColor="gray.200">
          <Card.Body>
            <Heading size="xl" color="brand.600" fontWeight="bold">
              {headerParts.join(', ') || 'Complete your profile'}
            </Heading>
          </Card.Body>
        </Card.Root>

        {saveError && (
          <Text fontSize="sm" color="red.500" mb="4">{saveError}</Text>
        )}

        {!patient?.intake_completed ? (
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Text color="gray.600">Your profile will appear here after completing the intake form.</Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Grid templateColumns="1fr" gap="6">

            {/* Personal Data */}
            <SectionCard title="Personal Data" editing={ed('personal')} saving={saving}
              onEdit={() => startEdit('personal')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3" mb="4">
                {ed('personal') ? (
                  <>
                    <EditField label="First name" name="first_name" value={draft.first_name ?? ''} onChange={handleChange} />
                    <EditField label="Last name" name="last_name" value={draft.last_name ?? ''} onChange={handleChange} />
                    <EditSelect label="Sex" name="sex" value={draft.sex ?? ''} onChange={handleChange} options={sexOptions} />
                    <EditField label="Date of birth" name="date_of_birth" type="date" value={draft.date_of_birth ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <Field label="First name" value={p?.first_name} />
                    <Field label="Last name" value={p?.last_name} />
                    <Field label="Sex" value={cap(p?.sex)} />
                    <Field label="Date of birth" value={fmtDate(p?.date_of_birth ?? null)} />
                  </>
                )}
              </Grid>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3" mb="4">
                {ed('personal') ? (
                  <>
                    <EditField label="Partner first name" name="partner_name" value={draft.partner_name ?? ''} onChange={handleChange} />
                    <EditField label="Partner last name" name="partner_last_name" value={draft.partner_last_name ?? ''} onChange={handleChange} />
                    <EditSelect label="Partner sex" name="partner_sex" value={draft.partner_sex ?? ''} onChange={handleChange} options={sexOptions} />
                    <EditField label="Partner date of birth" name="partner_dob" type="date" value={draft.partner_dob ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <Field label="Partner" value={p?.partner_name} />
                    <Field label="Partner last name" value={p?.partner_last_name} />
                    <Field label="Partner sex" value={cap(p?.partner_sex)} />
                    <Field label="Partner date of birth" value={fmtDate(p?.partner_dob ?? null)} />
                  </>
                )}
              </Grid>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3">
                {ed('personal') ? (
                  <>
                    <EditField label="Address" name="address_line1" value={draft.address_line1 ?? ''} onChange={handleChange} />
                    <EditField label="City" name="city" value={draft.city ?? ''} onChange={handleChange} />
                    <EditField label="Zip" name="postal_code" value={draft.postal_code ?? ''} onChange={handleChange} />
                    <EditField label="Country" name="country" value={draft.country ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <Field label="Address" value={p?.address_line1} />
                    <Field label="City" value={p?.city} />
                    <Field label="Zip" value={p?.postal_code} />
                    <Field label="Country" value={p?.country} />
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Contact */}
            <SectionCard title="Contact" editing={ed('contact')} saving={saving}
              onEdit={() => startEdit('contact')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap="3">
                {ed('contact') ? (
                  <>
                    <EditField label="Email" name="email" type="email" value={draft.email ?? ''} onChange={handleChange} />
                    <EditField label="Phone" name="phone_number" type="tel" value={draft.phone_number ?? ''} onChange={handleChange} />
                    <EditField label="Timezone" name="timezone" value={draft.timezone ?? ''} onChange={handleChange} />
                    <EditField label="Partner email" name="partner_email" type="email" value={draft.partner_email ?? ''} onChange={handleChange} />
                    <EditField label="Partner phone" name="partner_phone" type="tel" value={draft.partner_phone ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <Field label="Email" value={p?.email} />
                    <Field label="Phone" value={p?.phone_number} />
                    <Field label="Timezone" value={p?.timezone} />
                    <Field label="Partner email" value={p?.partner_email} />
                    <Field label="Partner phone" value={p?.partner_phone} />
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Medical Data */}
            <SectionCard title="Medical data" editing={ed('medical')} saving={saving}
              onEdit={() => startEdit('medical')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3" mb="4">
                {ed('medical') ? (
                  <>
                    <EditField label="Last period date" name="last_period_date" type="date" value={draft.last_period_date ?? ''} onChange={handleChange} />
                    <EditField label="Cycle duration (days)" name="cycle_duration_days" type="number" value={draft.cycle_duration_days?.toString() ?? ''} onChange={handleChange} />
                    <EditSelect label="Regular cycles" name="regular_cycles" value={draft.regular_cycles?.toString() ?? ''} onChange={handleChange} options={boolOptions} />
                    <EditSelect label="On birth control" name="on_birth_control" value={draft.on_birth_control?.toString() ?? ''} onChange={handleChange} options={boolOptions} />
                  </>
                ) : (
                  <>
                    <Field label="Last period date" value={fmtDate(p?.last_period_date ?? null)} />
                    <Field label="Cycle duration" value={p?.cycle_duration_days ? `${p.cycle_duration_days} days` : null} />
                    <Field label="Regular cycles" value={yesNo(p?.regular_cycles)} />
                    <Field label="Birth control" value={yesNo(p?.on_birth_control)} />
                  </>
                )}
              </Grid>
              {ed('medical') ? (
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Notes</Text>
                  <Textarea size="sm" name="past_experience" value={draft.past_experience ?? ''}
                    onChange={e => handleChange('past_experience', e.target.value)}
                    rows={3} resize="vertical" bg="white" fontSize="sm" />
                </Box>
              ) : (
                p?.past_experience && (
                  <Box mt="3">
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">Notes</Text>
                    <Text fontSize="sm" color="gray.900">{p.past_experience}</Text>
                  </Box>
                )
              )}
            </SectionCard>

            {/* Desired Treatment */}
            <SectionCard title="Desired treatment" editing={ed('treatment')} saving={saving}
              onEdit={() => startEdit('treatment')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="3">
                {ed('treatment') ? (
                  <>
                    <EditField label="Storage duration" name="storage_duration" value={draft.storage_duration ?? ''} onChange={handleChange} />
                    <EditSelect label="Treatment type" name="treatment_type" value={draft.treatment_type ?? ''}
                      onChange={handleChange}
                      options={[
                        { value: 'self', label: 'Self' }, { value: 'donor', label: 'Donor' },
                        { value: 'surrogate', label: 'Surrogate' },
                      ]} />
                    <EditField label="Doctor preference" name="doctor_preference" value={draft.doctor_preference ?? ''} onChange={handleChange} />
                  </>
                ) : (
                  <>
                    <Field label="Treatment goals" value={p?.fertility_goals?.join(', ') || null} />
                    <Field label="Storage duration" value={p?.storage_duration} />
                    <Field label="Treatment type" value={cap(p?.treatment_type)} />
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Timeline */}
            <SectionCard title="Timeline" editing={ed('timeline')} saving={saving}
              onEdit={() => startEdit('timeline')} onSave={saveSection} onCancel={cancelEdit}>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="3">
                {ed('timeline') ? (
                  <>
                    <EditField label="Ideal timeline" name="treatment_timeline" value={draft.treatment_timeline ?? ''} onChange={handleChange} />
                    <EditField label="Constraints" name="treatment_constraints" value={draft.treatment_constraints ?? ''} onChange={handleChange} />
                    <EditSelect label="Urgent" name="treatment_urgency" value={draft.treatment_urgency?.toString() ?? ''}
                      onChange={handleChange} options={boolOptions} />
                  </>
                ) : (
                  <>
                    <Field label="Ideal timeline" value={p?.treatment_timeline} />
                    <Field label="Constraints" value={p?.treatment_constraints} />
                    <Field label="Urgency" value={yesNo(p?.treatment_urgency)} />
                  </>
                )}
              </Grid>
            </SectionCard>

          </Grid>
        )}
      </Container>
    </SidebarLayout>
  )
}

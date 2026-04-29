'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminSidebarLayout from '@/components/layouts/AdminSidebarLayout'
import {
  Box, Button, Container, DialogBackdrop, DialogBody, DialogCloseTrigger,
  DialogContent, DialogHeader, DialogPositioner, DialogRoot, DialogTitle,
  Flex, Grid, Heading, Input, NativeSelect, Separator, Text, Textarea, VStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Patient, Clinic } from '@/lib/supabase/types'
import Link from 'next/link'

type PatientRow = Patient & {
  appointments: { id: string; appointment_date: string; status: string }[]
  selected_clinic_id: string | null
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const today = new Date(), d = new Date(dob)
  let age = today.getFullYear() - d.getFullYear()
  if (today.getMonth() - d.getMonth() < 0 || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--
  return age
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

// ── Create Patient Modal ────────────────────────────────────────────────────
const BLANK = {
  first_name: '', last_name: '', email: '', phone_number: '',
  date_of_birth: '', sex: 'female',
  partner_name: '', partner_last_name: '', partner_email: '', partner_sex: '', partner_dob: '',
  address_line1: '', city: '', postal_code: '', country: 'Spain', timezone: 'Europe/Madrid',
  fertility_goals: [] as string[], treatment_timeline: '',
  last_period_date: '', cycle_duration_days: '', regular_cycles: '', on_birth_control: '',
  past_experience: '', selected_clinic_id: '',
}

function CreatePatientModal({
  clinics,
  onClose,
  onCreate,
}: {
  clinics: Clinic[]
  onClose: () => void
  onCreate: (p: PatientRow) => void
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(name: string, val: string) { setForm(prev => ({ ...prev, [name]: val })) }

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cycle_duration_days: form.cycle_duration_days ? Number(form.cycle_duration_days) : null,
          regular_cycles: form.regular_cycles === 'true' ? true : form.regular_cycles === 'false' ? false : null,
          on_birth_control: form.on_birth_control === 'true' ? true : form.on_birth_control === 'false' ? false : null,
          fertility_goals: form.fertility_goals,
          clinic_id: form.selected_clinic_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create patient'); return }
      onCreate(data.patient)
      onClose()
    } catch { setError('Failed to create patient') }
    finally { setSaving(false) }
  }

  const sexOpts = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'non-binary', label: 'Non-binary' }]
  const boolOpts = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
  const goalOpts = ['IVF', 'IUI', 'Egg Freezing', 'Embryo Freezing', 'Fertility Assessment']
  const timelineOpts = ['Starting ASAP', 'Starting in 1-3 months', 'Starting in 3-6 months', 'Starting in 6-12 months']
  const canContinue = !!form.first_name && !!form.email

  function LabeledInput({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
    return (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">
          {label}{required && ' *'}
        </Text>
        <Input size="sm" type={type} value={(form as any)[name]} onChange={e => set(name, e.target.value)} bg="white" fontSize="sm" />
      </Box>
    )
  }

  function LabeledSelect({ label, name, options, required = false }: { label: string; name: string; options: { value: string; label: string }[]; required?: boolean }) {
    return (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">
          {label}{required && ' *'}
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field value={(form as any)[name]} onChange={e => set(name, e.target.value)} bg="white" fontSize="sm">
            <option value="">— select —</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>
    )
  }

  const stepLabels = ['Personal', 'Medical', 'Treatment']

  return (
    <DialogRoot open onOpenChange={({ open }) => !open && onClose()} size="lg">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
          </DialogHeader>
          <DialogBody pb="6">
            {/* Stepper */}
            <Flex align="center" gap="2" mb="6">
              {stepLabels.map((label, i) => (
                <Flex key={label} align="center" gap="2" flex={i < stepLabels.length - 1 ? undefined : undefined}>
                  <Flex
                    w="7" h="7" borderRadius="full" align="center" justify="center"
                    bg={i + 1 <= step ? 'brand.500' : 'gray.200'}
                    color={i + 1 <= step ? 'white' : 'gray.500'}
                    fontSize="xs" fontWeight="bold" flexShrink={0}
                  >
                    {i + 1}
                  </Flex>
                  <Text fontSize="xs" fontWeight={i + 1 === step ? 'semibold' : 'medium'} color={i + 1 === step ? 'brand.600' : 'gray.500'}>
                    {label}
                  </Text>
                  {i < stepLabels.length - 1 && <Box flex="1" h="1px" bg="gray.200" mx="2" />}
                </Flex>
              ))}
            </Flex>

            {step === 1 && (
              <VStack gap="4" align="stretch">
                <Grid templateColumns="repeat(2,1fr)" gap="3">
                  <LabeledInput label="First Name" name="first_name" required />
                  <LabeledInput label="Last Name" name="last_name" />
                  <LabeledInput label="Email" name="email" type="email" required />
                  <LabeledInput label="Phone" name="phone_number" />
                  <LabeledInput label="Date of Birth" name="date_of_birth" type="date" />
                  <LabeledSelect label="Sex" name="sex" options={sexOpts} />
                </Grid>
                <Separator />
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">Partner (optional)</Text>
                <Grid templateColumns="repeat(2,1fr)" gap="3">
                  <LabeledInput label="Partner First Name" name="partner_name" />
                  <LabeledInput label="Partner Last Name" name="partner_last_name" />
                  <LabeledInput label="Partner Email" name="partner_email" type="email" />
                  <LabeledSelect label="Partner Sex" name="partner_sex" options={sexOpts} />
                </Grid>
              </VStack>
            )}

            {step === 2 && (
              <VStack gap="4" align="stretch">
                <Grid templateColumns="repeat(2,1fr)" gap="3">
                  <LabeledInput label="Last Period Date" name="last_period_date" type="date" />
                  <LabeledInput label="Cycle Duration (days)" name="cycle_duration_days" type="number" />
                  <LabeledSelect label="Regular Cycles" name="regular_cycles" options={boolOpts} />
                  <LabeledSelect label="On Birth Control" name="on_birth_control" options={boolOpts} />
                </Grid>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Clinical Notes</Text>
                  <Textarea size="sm" value={form.past_experience} onChange={e => set('past_experience', e.target.value)} rows={3} bg="white" fontSize="sm" resize="vertical" />
                </Box>
              </VStack>
            )}

            {step === 3 && (
              <VStack gap="4" align="stretch">
                <Grid templateColumns="repeat(2,1fr)" gap="3">
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Treatment Goal</Text>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        value={form.fertility_goals[0] ?? ''}
                        onChange={e => setForm(prev => ({ ...prev, fertility_goals: e.target.value ? [e.target.value] : [] }))}
                        bg="white" fontSize="sm"
                      >
                        <option value="">— select —</option>
                        {goalOpts.map(o => <option key={o} value={o}>{o}</option>)}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Box>
                  <LabeledSelect label="Timeline" name="treatment_timeline" options={timelineOpts.map(v => ({ value: v, label: v }))} />
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Assign Clinic</Text>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field value={form.selected_clinic_id} onChange={e => set('selected_clinic_id', e.target.value)} bg="white" fontSize="sm">
                        <option value="">— no clinic yet —</option>
                        {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Box>
                  <Grid templateColumns="repeat(2,1fr)" gap="3" style={{ gridColumn: '1/-1' }}>
                    <LabeledInput label="City" name="city" />
                    <LabeledInput label="Country" name="country" />
                  </Grid>
                </Grid>
              </VStack>
            )}

            {error && <Text color="red.500" fontSize="sm" mt="3">{error}</Text>}

            <Flex justify="flex-end" gap="3" mt="6">
              {step > 1 && <Button size="sm" variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
              <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
              {step < 3 ? (
                <Button size="sm" colorPalette="orange" onClick={() => setStep(s => s + 1)} disabled={!canContinue}>Continue</Button>
              ) : (
                <Button size="sm" colorPalette="orange" onClick={handleCreate} loading={saving} disabled={!canContinue}>Create Patient</Button>
              )}
            </Flex>
          </DialogBody>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/admin/patients').then(r => r.json()),
      fetch('/api/admin/clinics').then(r => r.json()),
    ]).then(([pd, cd]) => {
      setPatients(pd.patients ?? [])
      setClinics(cd.clinics ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = patients.filter(p => {
    const name = `${p.first_name ?? ''} ${p.last_name ?? ''} ${p.email}`.toLowerCase()
    if (!name.includes(search.toLowerCase())) return false
    if (statusFilter !== 'all') {
      const hasIntake = p.intake_completed
      if (statusFilter === 'complete' && !hasIntake) return false
      if (statusFilter === 'incomplete' && hasIntake) return false
    }
    return true
  })

  return (
    <AdminSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Flex justify="space-between" align="flex-start" mb="2">
          <Box>
            <Heading size="2xl" color="brand.600">Patients</Heading>
            <Text fontSize="sm" color="gray.500">{patients.length} patients total</Text>
          </Box>
          <Button colorPalette="orange" size="sm" mt="1" onClick={() => setShowCreate(true)}>
            + New Patient
          </Button>
        </Flex>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
          <Card.Body>
            {/* Filters */}
            <Flex gap="3" mb="4" flexWrap="wrap">
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                maxW="320px" size="sm" bg="white"
              />
              <NativeSelect.Root size="sm" maxW="180px">
                <NativeSelect.Field value={statusFilter} onChange={e => setStatusFilter(e.target.value)} bg="white">
                  <option value="all">All patients</option>
                  <option value="complete">Intake complete</option>
                  <option value="incomplete">Intake incomplete</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Flex>

            {/* Table */}
            {loading ? (
              <Text color="gray.400" fontSize="sm" py="4">Loading…</Text>
            ) : (
              <Box overflowX="auto">
                <Box as="table" width="100%" style={{ borderCollapse: 'collapse' }}>
                  <Box as="thead">
                    <Box as="tr">
                      {['Patient', 'Age', 'Goal', 'Clinic', 'Intake', 'Next Appt', 'Created', ''].map(h => (
                        <Box key={h} as="th" textAlign="left" fontSize="xs" fontWeight="semibold"
                          color="gray.500" textTransform="uppercase" letterSpacing="wide"
                          pb="2" px="3" borderBottom="1px" borderColor="gray.200">
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '14px' }}>
                          No patients found
                        </td>
                      </tr>
                    ) : filtered.map(p => {
                      const nextAppt = (p.appointments ?? []).find(a => a.status !== 'cancelled')
                      return (
                        <Box as="tr" key={p.id} _hover={{ bg: 'gray.50' }} borderTop="1px" borderColor="gray.100" cursor="pointer">
                          <Box as="td" px="3" py="3">
                            <Link href={`/admin/patients/${p.id}`}>
                              <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                                {p.first_name} {p.last_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">{p.email}</Text>
                            </Link>
                          </Box>
                          <Box as="td" px="3" py="3" fontSize="sm" color="gray.600">
                            {calcAge(p.date_of_birth) ?? '—'}
                          </Box>
                          <Box as="td" px="3" py="3" fontSize="sm" color="gray.600">
                            {p.fertility_goals?.[0] ?? '—'}
                          </Box>
                          <Box as="td" px="3" py="3" fontSize="sm" color="gray.600">
                            {p.selected_clinic_id ? (clinics.find(c => c.id === p.selected_clinic_id)?.name ?? '—') : '—'}
                          </Box>
                          <Box as="td" px="3" py="3">
                            <Box
                              display="inline-flex" px="2" py="0.5" borderRadius="full"
                              fontSize="xs" fontWeight="semibold"
                              bg={p.intake_completed ? 'green.100' : 'orange.100'}
                              color={p.intake_completed ? 'green.700' : 'orange.700'}
                            >
                              {p.intake_completed ? 'Complete' : 'Pending'}
                            </Box>
                          </Box>
                          <Box as="td" px="3" py="3" fontSize="xs" color="gray.500">
                            {nextAppt ? fmtDate(nextAppt.appointment_date) : '—'}
                          </Box>
                          <Box as="td" px="3" py="3" fontSize="xs" color="gray.400">
                            {fmtDate(p.created_at)}
                          </Box>
                          <Box as="td" px="3" py="3" fontSize="xs" color="gray.300">›</Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
            )}
          </Card.Body>
        </Card.Root>
      </Container>

      {showCreate && (
        <CreatePatientModal
          clinics={clinics}
          onClose={() => setShowCreate(false)}
          onCreate={p => { setPatients(prev => [p as any, ...prev]); setShowCreate(false) }}
        />
      )}
    </AdminSidebarLayout>
  )
}

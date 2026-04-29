'use client'

import { useEffect, useState } from 'react'
import AdminSidebarLayout from '@/components/layouts/AdminSidebarLayout'
import {
  Box, Button, Container, DialogBackdrop, DialogBody, DialogCloseTrigger,
  DialogContent, DialogHeader, DialogPositioner, DialogRoot, DialogTitle,
  Flex, Grid, Heading, Input, NativeSelect, Separator, Text, Textarea, VStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Patient, Appointment, Clinic } from '@/lib/supabase/types'

type AppointmentWithPatient = Appointment & {
  patient: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'email'>
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function CreateAppointmentModal({
  patients, clinics, onClose, onCreated,
}: {
  patients: Patient[]; clinics: Clinic[]
  onClose: () => void; onCreated: (a: AppointmentWithPatient) => void
}) {
  const [form, setForm] = useState({
    patient_id: '', appointment_date: '', appointment_type: 'First Appointment',
    clinic_id: '', clinic_name: '', doctor_name: '', status: 'scheduled', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(name: string, val: string) {
    setForm(prev => {
      const next = { ...prev, [name]: val }
      if (name === 'clinic_id') next.clinic_name = clinics.find(c => c.id === val)?.name ?? ''
      return next
    })
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      const pat = patients.find(p => p.id === form.patient_id)
      onCreated({ ...data.appointment, patient: { id: pat?.id, first_name: pat?.first_name, last_name: pat?.last_name, email: pat?.email } })
      onClose()
    } catch { setError('Failed to create appointment') }
    finally { setSaving(false) }
  }

  const typeOpts = ['First Appointment', 'Follow-up', 'Consultation', 'Lab Work', 'Ultrasound', 'Procedure'].map(v => ({ value: v, label: v }))
  const statusOpts = [{ value: 'scheduled', label: 'Scheduled' }, { value: 'confirmed', label: 'Confirmed' }]

  function LabeledSelect({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
    return (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">{label}</Text>
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

  return (
    <DialogRoot open onOpenChange={({ open }) => !open && onClose()} size="md">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <DialogBody pb="6">
            <VStack gap="4" align="stretch">
              <LabeledSelect label="Patient *" name="patient_id" options={patients.map(p => ({ value: p.id, label: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email }))} />
              <Grid templateColumns="repeat(2,1fr)" gap="3">
                <LabeledSelect label="Type" name="appointment_type" options={typeOpts} />
                <LabeledSelect label="Status" name="status" options={statusOpts} />
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Date *</Text>
                  <Input size="sm" type="datetime-local" value={form.appointment_date} onChange={e => set('appointment_date', e.target.value)} bg="white" fontSize="sm" />
                </Box>
                <LabeledSelect label="Clinic" name="clinic_id" options={clinics.map(c => ({ value: c.id, label: c.name }))} />
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
                <Button size="sm" colorPalette="orange" onClick={handleSave} loading={saving}
                  disabled={!form.patient_id || !form.appointment_date}>
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

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/appointments').then(r => r.json()),
      fetch('/api/admin/patients').then(r => r.json()),
      fetch('/api/admin/clinics').then(r => r.json()),
    ]).then(([ad, pd, cd]) => {
      setAppointments(ad.appointments ?? [])
      setPatients(pd.patients ?? [])
      setClinics(cd.clinics ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <AdminSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Flex justify="space-between" align="flex-start" mb="2">
          <Box>
            <Heading size="2xl" color="brand.600">Appointments</Heading>
            <Text fontSize="sm" color="gray.500">{appointments.length} appointments total</Text>
          </Box>
          <Button colorPalette="orange" size="sm" mt="1" onClick={() => setShowCreate(true)}>
            + New Appointment
          </Button>
        </Flex>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
          {loading ? (
            <Box p="8"><Text color="gray.400" fontSize="sm">Loading…</Text></Box>
          ) : appointments.length === 0 ? (
            <Box p="8" textAlign="center"><Text color="gray.400" fontSize="sm">No appointments yet.</Text></Box>
          ) : (
            <Box overflowX="auto">
              <Box as="table" width="100%" style={{ borderCollapse: 'collapse' }}>
                <Box as="thead">
                  <Box as="tr">
                    {['Patient', 'Type', 'Date', 'Clinic', 'Doctor', 'Status'].map(h => (
                      <Box key={h} as="th" textAlign="left" fontSize="xs" fontWeight="semibold"
                        color="gray.500" textTransform="uppercase" letterSpacing="wide"
                        pb="2" px="4" pt="4" borderBottom="1px" borderColor="gray.200">
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {appointments.map(a => (
                    <Box as="tr" key={a.id} _hover={{ bg: 'gray.50' }} borderTop="1px" borderColor="gray.100">
                      <Box as="td" px="4" py="3">
                        <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                          {a.patient?.first_name} {a.patient?.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.400">{a.patient?.email}</Text>
                      </Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.700">{a.appointment_type ?? '—'}</Box>
                      <Box as="td" px="4" py="3" fontSize="sm" fontWeight="semibold" color="brand.500">{fmtDate(a.appointment_date)}</Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.700">{a.clinic_name ?? '—'}</Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.700">{a.doctor_name ?? '—'}</Box>
                      <Box as="td" px="4" py="3">
                        <Box
                          display="inline-flex" px="2" py="0.5" borderRadius="full"
                          fontSize="xs" fontWeight="semibold"
                          bg={a.status === 'confirmed' ? 'green.100' : a.status === 'scheduled' ? 'blue.100' : 'gray.100'}
                          color={a.status === 'confirmed' ? 'green.700' : a.status === 'scheduled' ? 'blue.700' : 'gray.500'}
                        >
                          {a.status}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Card.Root>
      </Container>

      {showCreate && (
        <CreateAppointmentModal
          patients={patients}
          clinics={clinics}
          onClose={() => setShowCreate(false)}
          onCreated={a => { setAppointments(prev => [a, ...prev]); setShowCreate(false) }}
        />
      )}
    </AdminSidebarLayout>
  )
}

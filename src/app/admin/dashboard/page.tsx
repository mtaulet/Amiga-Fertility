'use client'

import { useEffect, useState } from 'react'
import AdminSidebarLayout from '@/components/layouts/AdminSidebarLayout'
import {
  Box, Container, Flex, Grid, Heading, Separator, Text,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Patient, Appointment } from '@/lib/supabase/types'

type PatientWithAppointments = Patient & {
  appointments: Appointment[]
  selected_clinic_id: string | null
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const today = new Date(), d = new Date(dob)
  let age = today.getFullYear() - d.getFullYear()
  if (today.getMonth() - d.getMonth() < 0 || (today.getMonth() - d.getMonth() === 0 && today.getDate() < d.getDate())) age--
  return age
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'green', confirmed: 'green', scheduled: 'blue',
    pending: 'orange', onboarding: 'purple', cancelled: 'gray',
  }
  return (
    <Box
      display="inline-flex" alignItems="center"
      px="2" py="0.5" borderRadius="full" fontSize="xs" fontWeight="semibold"
      bg={`${colorMap[status] ?? 'gray'}.100`} color={`${colorMap[status] ?? 'gray'}.700`}
    >
      {status}
    </Box>
  )
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<PatientWithAppointments[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/patients')
      .then(r => r.json())
      .then(d => { setPatients(d.patients ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const total = patients.length
  const withClinic = patients.filter(p => p.selected_clinic_id).length
  const upcomingAppts = patients.flatMap(p =>
    (p.appointments ?? []).filter(a => a.status !== 'cancelled')
  )
  const recent = [...patients].slice(0, 5)

  const stats = [
    { label: 'Total Patients', value: total,          color: 'brand.500' },
    { label: 'Clinic Assigned', value: withClinic,    color: 'green.500' },
    { label: 'Upcoming Appts', value: upcomingAppts.length, color: 'purple.500' },
    { label: 'Intake Complete', value: patients.filter(p => p.intake_completed).length, color: 'orange.400' },
  ]

  return (
    <AdminSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Heading size="2xl" color="brand.600" mb="2">Dashboard</Heading>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        {/* Stat cards */}
        <Grid templateColumns={{ base: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="4" mb="8">
          {stats.map(s => (
            <Card.Root key={s.label} bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">
                  {s.label}
                </Text>
                <Text fontSize="3xl" fontWeight="bold" color={s.color} lineHeight="1">
                  {loading ? '—' : s.value}
                </Text>
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="6">
          {/* Recent patients */}
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Heading size="sm" color="brand.600" mb="4">Recent Patients</Heading>
              {loading ? (
                <Text color="gray.400" fontSize="sm">Loading…</Text>
              ) : recent.length === 0 ? (
                <Text color="gray.400" fontSize="sm">No patients yet.</Text>
              ) : (
                <Box as="table" width="100%">
                  <Box as="thead">
                    <Box as="tr">
                      {['Name', 'Age', 'Goal', 'Created'].map(h => (
                        <Box key={h} as="th" textAlign="left" fontSize="xs" fontWeight="semibold"
                          color="gray.500" textTransform="uppercase" letterSpacing="wide" pb="2">
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {recent.map(p => (
                      <Box as="tr" key={p.id} borderTop="1px" borderColor="gray.100">
                        <Box as="td" py="2" fontSize="sm" fontWeight="medium" color="gray.900">
                          {p.first_name} {p.last_name}
                        </Box>
                        <Box as="td" py="2" fontSize="sm" color="gray.600">
                          {calcAge(p.date_of_birth) ?? '—'}
                        </Box>
                        <Box as="td" py="2" fontSize="sm" color="gray.600">
                          {p.fertility_goals?.[0] ?? '—'}
                        </Box>
                        <Box as="td" py="2" fontSize="xs" color="gray.400">
                          {fmtDate(p.created_at)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Card.Body>
          </Card.Root>

          {/* Upcoming appointments */}
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Heading size="sm" color="brand.600" mb="4">Upcoming Appointments</Heading>
              {loading ? (
                <Text color="gray.400" fontSize="sm">Loading…</Text>
              ) : upcomingAppts.length === 0 ? (
                <Text color="gray.400" fontSize="sm">No upcoming appointments.</Text>
              ) : upcomingAppts.slice(0, 6).map(a => (
                <Flex key={a.id} justify="space-between" align="center"
                  borderBottom="1px" borderColor="gray.100" py="2">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.900">
                      {a.appointment_type ?? 'Appointment'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">{a.clinic_name ?? '—'}</Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="sm" fontWeight="semibold" color="brand.500">
                      {fmtDate(a.appointment_date)}
                    </Text>
                    <StatusBadge status={a.status} />
                  </Box>
                </Flex>
              ))}
            </Card.Body>
          </Card.Root>
        </Grid>
      </Container>
    </AdminSidebarLayout>
  )
}

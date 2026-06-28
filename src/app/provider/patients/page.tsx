'use client'

import { useEffect, useState } from 'react'
import ProviderSidebarLayout from '@/components/layouts/ProviderSidebarLayout'
import { Box, Container, Heading, Separator, Text } from '@chakra-ui/react'
import { Card } from '@/components/ui/card'

type Patient = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone_number: string | null
  date_of_birth: string | null
  intake_completed: boolean | null
  created_at: string
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export default function ProviderPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/provider/patients')
      .then(r => r.json())
      .then(data => { setPatients(data.patients ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <ProviderSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Heading size="2xl" color="brand.600" mb="2">Patients</Heading>
        <Text fontSize="sm" color="gray.500" mb="2">{patients.length} patients at your clinic</Text>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
          {loading ? (
            <Box p="8"><Text color="gray.400" fontSize="sm">Loading…</Text></Box>
          ) : patients.length === 0 ? (
            <Box p="8" textAlign="center">
              <Text color="gray.400" fontSize="sm">No patients yet. Patients will appear here once they have an appointment at your clinic.</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Box as="table" width="100%" style={{ borderCollapse: 'collapse' }}>
                <Box as="thead">
                  <Box as="tr">
                    {['Name', 'Email', 'Phone', 'Date of Birth', 'Intake', 'Joined'].map(h => (
                      <Box key={h} as="th" textAlign="left" fontSize="xs" fontWeight="semibold"
                        color="gray.500" textTransform="uppercase" letterSpacing="wide"
                        pb="2" px="4" pt="4" borderBottom="1px" borderColor="gray.200">
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {patients.map(p => (
                    <Box as="tr" key={p.id} _hover={{ bg: 'gray.50' }} borderTop="1px" borderColor="gray.100">
                      <Box as="td" px="4" py="3">
                        <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                          {p.first_name} {p.last_name}
                        </Text>
                      </Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.600">{p.email}</Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.600">{p.phone_number ?? '—'}</Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.600">{fmtDate(p.date_of_birth)}</Box>
                      <Box as="td" px="4" py="3">
                        <Box display="inline-flex" px="2" py="0.5" borderRadius="full" fontSize="xs" fontWeight="semibold"
                          bg={p.intake_completed ? 'green.100' : 'gray.100'}
                          color={p.intake_completed ? 'green.700' : 'gray.500'}>
                          {p.intake_completed ? 'Complete' : 'Pending'}
                        </Box>
                      </Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.500">{fmtDate(p.created_at)}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Card.Root>
      </Container>
    </ProviderSidebarLayout>
  )
}

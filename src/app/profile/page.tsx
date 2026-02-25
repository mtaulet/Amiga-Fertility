import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import { Box, Container, Heading, Text, Grid, Flex, Separator } from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Patient } from '@/lib/supabase/types'

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function abbreviateTreatment(goal: string): string {
  const abbrevs: Record<string, string> = {
    'In Vitro Fertilization (IVF)': 'IVF',
    'Intrauterine Insemination (IUI)': 'IUI',
    'Egg Freezing': 'EF',
    'Embryo Freezing': 'EmF',
    'Genetic Testing': 'GT',
    'Fertility Assessment': 'FA',
    'Donor Services': 'DS',
    'Surrogacy Services': 'SS',
  }
  return abbrevs[goal] || goal
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function capitalize(str: string | null): string {
  if (!str) return 'N/A'
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

function yesNo(val: boolean | null): string {
  if (val === null || val === undefined) return 'N/A'
  return val ? 'Yes' : 'No'
}

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box>
      <Text as="span" fontWeight="bold" fontSize="sm" color="gray.700">{label}: </Text>
      <Text as="span" fontSize="sm" color="gray.900">{value || 'N/A'}</Text>
    </Box>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Box mb="4">
      <Heading size="md" color="gray.900" mb="1">{children}</Heading>
      <Separator borderColor="gray.300" />
    </Box>
  )
}

export default async function ProfilePage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('auth0_id', session.user.sub)
    .single() as { data: Patient | null }

  const age = patient?.date_of_birth ? calculateAge(patient.date_of_birth) : null
  const primaryTreatment = patient?.fertility_goals?.[0]
    ? abbreviateTreatment(patient.fertility_goals[0])
    : null

  const headerParts = [
    patient?.first_name && patient?.last_name
      ? `${patient.first_name} ${patient.last_name}`
      : null,
    age ? `${age} y/o` : null,
    patient?.sex ? capitalize(patient.sex) : null,
    primaryTreatment,
    patient?.treatment_timeline,
  ].filter(Boolean)

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>

        {/* Hero Header */}
        <Card.Root bg="white" mb="6" borderWidth="1px" borderColor="gray.200">
          <Card.Body>
            <Heading size="xl" color="purple.700" fontWeight="bold">
              {headerParts.join(', ') || 'Complete your profile'}
            </Heading>
          </Card.Body>
        </Card.Root>

        {!patient?.intake_completed ? (
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Text color="gray.600">
                Your profile information will appear here after you complete the intake form.
              </Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Grid templateColumns={{ base: '1fr', lg: '1fr' }} gap="6">

            {/* Personal Data */}
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <SectionHeading>Personal Data</SectionHeading>
                <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3" mb="3">
                  <DataField label="Name" value={patient?.first_name} />
                  <DataField label="Last name" value={patient?.last_name} />
                  <DataField label="Sex" value={capitalize(patient?.sex)} />
                  <DataField label="BD" value={formatDate(patient?.date_of_birth ?? null)} />
                </Grid>
                <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3" mb="3">
                  <DataField label="Partner" value={patient?.partner_name} />
                  <DataField label="Last name" value={patient?.partner_last_name} />
                  <DataField label="Sex" value={capitalize(patient?.partner_sex)} />
                  <DataField label="BD" value={formatDate(patient?.partner_dob ?? null)} />
                </Grid>
                <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3">
                  <DataField label="Address" value={patient?.address_line1} />
                  <DataField label="City" value={patient?.city} />
                  <DataField label="Zip" value={patient?.postal_code} />
                  <DataField label="Country" value={patient?.country} />
                </Grid>
              </Card.Body>
            </Card.Root>

            {/* Medical Data */}
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <SectionHeading>Medical data</SectionHeading>
                <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap="3">
                  <DataField label="Last period date" value={formatDate(patient?.last_period_date ?? null)} />
                  <DataField
                    label="Cycle duration"
                    value={patient?.cycle_duration_days ? `${patient.cycle_duration_days} days` : null}
                  />
                  <DataField label="Regular" value={yesNo(patient?.regular_cycles ?? null)} />
                  <DataField label="BC" value={yesNo(patient?.on_birth_control ?? null)} />
                </Grid>
                {patient?.health_concerns && patient.health_concerns.length > 0 && (
                  <Box mt="3">
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">Health concerns: </Text>
                    <Text fontSize="sm" color="gray.900">{patient.health_concerns.join(', ')}</Text>
                  </Box>
                )}
                {patient?.past_experience && (
                  <Box mt="3">
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">Notes: </Text>
                    <Text fontSize="sm" color="gray.900">{patient.past_experience}</Text>
                  </Box>
                )}
              </Card.Body>
            </Card.Root>

            {/* Desired Treatment */}
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <SectionHeading>Desired treatment</SectionHeading>
                <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="3">
                  <DataField
                    label="Treatment"
                    value={patient?.fertility_goals?.join(', ') || null}
                  />
                  <DataField label="Storage duration" value={patient?.storage_duration} />
                  <DataField label="Type" value={capitalize(patient?.treatment_type)} />
                </Grid>
              </Card.Body>
            </Card.Root>

            {/* Preferences */}
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <SectionHeading>Preferences</SectionHeading>
                <Flex gap="6" flexWrap="wrap">
                  <DataField label="Doctor" value={capitalize(patient?.doctor_preference)} />
                  {patient?.preference_rank && patient.preference_rank.length > 0 && (
                    <Box>
                      <Text as="span" fontWeight="bold" fontSize="sm" color="gray.700">Preference rank: </Text>
                      {patient.preference_rank.map((pref, i) => (
                        <Text as="span" key={i} fontSize="sm" color="gray.900">
                          {i > 0 ? '  ' : ''}<Text as="span" fontWeight="bold">{i + 1}:</Text> {pref}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Flex>
              </Card.Body>
            </Card.Root>

            {/* Timeline */}
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <SectionHeading>Timeline</SectionHeading>
                <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="3">
                  <DataField label="Ideal" value={patient?.treatment_timeline} />
                  <DataField label="Constraints" value={patient?.treatment_constraints} />
                  <DataField label="Urgency" value={yesNo(patient?.treatment_urgency ?? null)} />
                </Grid>
              </Card.Body>
            </Card.Root>

          </Grid>
        )}
      </Container>
    </SidebarLayout>
  )
}

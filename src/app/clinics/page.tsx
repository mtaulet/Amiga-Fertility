import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Clinic } from '@/lib/supabase/types'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Flex,
  Separator,
  Badge,
  HStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

export default async function ClinicsPage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch all clinics
  const { data: clinics, error } = await supabaseAdmin
    .from('clinics')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching clinics:', error)
  }

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
        {/* Header */}
        <Box mb="10">
          <Heading size="3xl" color="brand.600" mb="3">
            Fertility Clinics
          </Heading>
          <Text fontSize="lg" color="gray.700">
            Explore fertility clinics that match your needs
          </Text>
          <Separator width="24" borderColor="purple.500" borderWidth="2px" mt="4" />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert.Root status="error" mb="6">
            <Alert.Title>Error loading clinics. Please try again later.</Alert.Title>
          </Alert.Root>
        )}

        {/* Clinics List */}
        {!clinics || clinics.length === 0 ? (
          <Card.Root bg="white">
            <Card.Body textAlign="center" py="12">
              <Text color="gray.600" fontSize="lg">
                No clinics found. Please run the database migrations.
              </Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
            gap="6"
          >
            {clinics.map((clinic: Clinic) => (
              <Card.Root
                key={clinic.id}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                _hover={{ shadow: 'lg' }}
                transition="all 0.2s"
              >
                <Card.Body>
                  {/* Clinic Name */}
                  <Heading size="xl" color="brand.600" mb="3">
                    {clinic.name}
                  </Heading>

                  {/* Locations */}
                  <Box mb="4">
                    <Text fontSize="sm" fontWeight="bold" color="gray.700" mb="2">
                      Locations
                    </Text>
                    <Flex flexWrap="wrap" gap="2">
                      {clinic.locations.map((location) => (
                        <Badge
                          key={location}
                          colorScheme="gray"
                          variant="subtle"
                          px="3"
                          py="1"
                        >
                          📍 {location}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>

                  {/* Experience & Size */}
                  <Grid templateColumns="repeat(2, 1fr)" gap="4" mb="4">
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb="1">
                        Experience
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="gray.900">
                        {clinic.years_experience} years
                      </Text>
                    </Box>
                    {clinic.size && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb="1">
                          Size
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="gray.900">
                          {clinic.size} staff
                        </Text>
                      </Box>
                    )}
                  </Grid>

                  {/* Expertise */}
                  <Box mb="4">
                    <Text fontSize="sm" fontWeight="bold" color="gray.700" mb="2">
                      Expertise
                    </Text>
                    <Flex flexWrap="wrap" gap="2">
                      {clinic.expertise.map((exp) => (
                        <Badge
                          key={exp}
                          colorScheme="purple"
                          variant="subtle"
                          px="3"
                          py="1"
                        >
                          {exp}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>

                  {/* Description */}
                  {clinic.description && (
                    <Box mb="4">
                      <Text fontSize="sm" color="gray.700" fontStyle="italic">
                        {clinic.description}
                      </Text>
                    </Box>
                  )}

                  {/* Price Range */}
                  {clinic.price_range && (
                    <Flex
                      align="center"
                      justify="space-between"
                      pt="4"
                      borderTopWidth="1px"
                      borderColor="gray.200"
                    >
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Price Range
                      </Text>
                      <Badge
                        colorScheme="orange"
                        variant="subtle"
                        px="3"
                        py="1"
                        fontWeight="bold"
                        textTransform="uppercase"
                      >
                        {clinic.price_range}
                      </Badge>
                    </Flex>
                  )}
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        )}
      </Container>
    </SidebarLayout>
  )
}

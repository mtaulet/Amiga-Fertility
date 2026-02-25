import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { supabaseAdmin } from '@/lib/supabase/server'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import { Box, Container, Heading, Text, Grid, Flex, Separator, Link } from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import { FiCalendar, FiMail, FiFileText, FiChevronRight } from 'react-icons/fi'

export default async function DashboardPage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if patient has completed intake
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('intake_completed, first_name')
    .eq('auth0_id', session.user.sub)
    .single()

  // Redirect to intake if not completed
  if (!patient || !patient.intake_completed) {
    redirect('/intake')
  }

  const user = session.user

  const statsCards = [
    {
      title: 'Upcoming Appointments',
      value: '0',
      icon: FiCalendar,
      link: '#',
      linkText: 'Schedule appointment',
    },
    {
      title: 'New Messages',
      value: '0',
      icon: FiMail,
      link: '#',
      linkText: 'View messages',
    },
    {
      title: 'Documents',
      value: '0',
      icon: FiFileText,
      link: '#',
      linkText: 'View documents',
    },
  ]

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
        {/* Header */}
        <Box mb="10">
          <Heading size="3xl" color="brand.600" mb="3">
            Welcome back, {patient?.first_name || user.name || 'Patient'}
          </Heading>
          <Text fontSize="lg" color="gray.700">
            Your personalized fertility journey dashboard
          </Text>
          <Separator width="24" borderColor="purple.500" borderWidth="2px" mt="4" />
        </Box>

        {/* Stats Cards */}
        <Grid
          templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap="6"
        >
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card.Root
                key={index}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                _hover={{ shadow: 'lg' }}
                transition="all 0.2s"
              >
                <Card.Body>
                  <Flex align="center">
                    <Box flexShrink="0">
                      <Icon size={32} color="#E67449" />
                    </Box>
                    <Box ml="5" flex="1">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb="1">
                        {stat.title}
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                        {stat.value}
                      </Text>
                    </Box>
                  </Flex>
                </Card.Body>
                <Card.Footer bg="cream.50" borderTopWidth="1px" borderColor="gray.200">
                  <Link
                    href={stat.link}
                    fontSize="sm"
                    fontWeight="bold"
                    color="brand.600"
                    _hover={{ color: 'brand.700' }}
                    textDecoration="none"
                  >
                    {stat.linkText} →
                  </Link>
                </Card.Footer>
              </Card.Root>
            )
          })}
        </Grid>

        {/* Quick Actions */}
        <Box mt="12">
          <Heading size="xl" color="brand.600" mb="6">
            Quick Actions
          </Heading>
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Link
              href="#"
              display="block"
              px={{ base: '6', sm: '8' }}
              py="5"
              _hover={{ bg: 'cream.50' }}
              textDecoration="none"
            >
              <Flex align="center">
                <Box flex="1">
                  <Text fontSize="base" fontWeight="bold" color="brand.600" mb="2">
                    Complete your medical history
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    Help us provide better care by completing your profile
                  </Text>
                </Box>
                <Box ml="5" flexShrink="0">
                  <FiChevronRight size={24} color="#9CA3AF" />
                </Box>
              </Flex>
            </Link>
          </Card.Root>
        </Box>
      </Container>
    </SidebarLayout>
  )
}

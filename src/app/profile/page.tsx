import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Badge,
  Button,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

export default async function ProfilePage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/login')
  }

  const user = session.user

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        {/* Header */}
        <Box mb="8">
          <Heading size="2xl" color="gray.900" mb="2">
            Your Profile
          </Heading>
          <Text color="gray.600">
            Manage your account information and preferences
          </Text>
        </Box>

        {/* Account Information Card */}
        <Card.Root bg="white">
          <Card.Header>
            <Flex align="center" gap="4">
              <Avatar
                size="lg"
                name={user.name || user.email || "User"}
                src={user.picture || undefined}
              />
              <Box>
                <Heading size="md" color="gray.900" mb="1">
                  Account Information
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Personal details and authentication settings
                </Text>
              </Box>
            </Flex>
          </Card.Header>
          <Card.Body borderTopWidth="1px" borderColor="gray.200" p="0">
            <Box>
              {/* Full Name */}
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }}
                gap="4"
                bg="gray.50"
                px={{ base: '4', sm: '6' }}
                py="5"
              >
                <GridItem>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Full name
                  </Text>
                </GridItem>
                <GridItem colSpan={{ base: 1, sm: 2 }}>
                  <Text fontSize="sm" color="gray.900">
                    {user.name || 'Not provided'}
                  </Text>
                </GridItem>
              </Grid>

              {/* Email */}
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }}
                gap="4"
                bg="white"
                px={{ base: '4', sm: '6' }}
                py="5"
              >
                <GridItem>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Email address
                  </Text>
                </GridItem>
                <GridItem colSpan={{ base: 1, sm: 2 }}>
                  <Text fontSize="sm" color="gray.900">
                    {user.email}
                  </Text>
                </GridItem>
              </Grid>

              {/* Account ID */}
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }}
                gap="4"
                bg="gray.50"
                px={{ base: '4', sm: '6' }}
                py="5"
              >
                <GridItem>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Account ID
                  </Text>
                </GridItem>
                <GridItem colSpan={{ base: 1, sm: 2 }}>
                  <Text fontSize="sm" color="gray.900" fontFamily="mono">
                    {user.sub}
                  </Text>
                </GridItem>
              </Grid>

              {/* Email Verified */}
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }}
                gap="4"
                bg="white"
                px={{ base: '4', sm: '6' }}
                py="5"
              >
                <GridItem>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Email verified
                  </Text>
                </GridItem>
                <GridItem colSpan={{ base: 1, sm: 2 }}>
                  {user.email_verified ? (
                    <Badge colorScheme="green" variant="subtle">
                      Verified
                    </Badge>
                  ) : (
                    <Badge colorScheme="yellow" variant="subtle">
                      Not verified
                    </Badge>
                  )}
                </GridItem>
              </Grid>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* Security Settings Card */}
        <Card.Root bg="white" mt="8">
          <Card.Header>
            <Heading size="md" color="gray.900" mb="1">
              Security Settings
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Manage your authentication and security preferences
            </Text>
          </Card.Header>
          <Card.Body borderTopWidth="1px" borderColor="gray.200">
            <Flex align="center" justify="space-between" gap="4" flexWrap="wrap">
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.900" mb="1">
                  Multi-Factor Authentication
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Add an extra layer of security to your account
                </Text>
              </Box>
              <Button
                size="sm"
                variant="outline"
                colorScheme="gray"
              >
                Configure
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Container>
    </SidebarLayout>
  )
}

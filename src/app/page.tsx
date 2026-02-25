import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import PublicLayout from '@/components/layouts/PublicLayout'
import { Center, VStack, Heading, Text, Button, Separator, HStack, Link as ChakraLink } from '@chakra-ui/react'

export default async function Home() {
  // If user is logged in, redirect to dashboard
  const session = await auth0.getSession()
  if (session) {
    redirect('/dashboard')
  }

  return (
    <PublicLayout>
      <Center minH="100vh" py={{ base: '8', sm: '24' }} px="8">
        <VStack maxW="4xl" w="full" align="center" justify="center" gap="6">
          {/* Logo */}
          <VStack gap="4" mb="6">
            <Heading
              size="6xl"
              color="brand.500"
              textAlign="center"
              lineHeight="tight"
            >
              amiga
              <br />
              fertility
            </Heading>
            <Separator width="24" borderColor="purple.500" borderWidth="2px" />
          </VStack>

          {/* Tagline */}
          <Text
            textAlign="center"
            fontSize={{ base: 'xl', sm: '2xl' }}
            color="gray.800"
            fontWeight="medium"
          >
            Your trusted companion in the fertility journey
          </Text>
          <Text
            textAlign="center"
            fontSize={{ base: 'base', sm: 'lg' }}
            color="gray.700"
            maxW="2xl"
            mb="6"
          >
            Guiding you with empathy, respect, and personalized support to find the best fertility clinics for your unique path.
          </Text>

          {/* CTA Buttons */}
          <HStack
            gap="4"
            mt="8"
            flexDirection={{ base: 'column', sm: 'row' }}
            w={{ base: 'full', sm: 'auto' }}
          >
            <ChakraLink href="/auth/login" textDecoration="none" w={{ base: 'full', sm: 'auto' }}>
              <Button
                size="lg"
                colorScheme="brand"
                px="8"
                py="6"
                fontSize="lg"
                fontWeight="bold"
                w="full"
              >
                Patient Login
              </Button>
            </ChakraLink>
            <ChakraLink href="/auth/login?screen_hint=signup" textDecoration="none" w={{ base: 'full', sm: 'auto' }}>
              <Button
                size="lg"
                variant="outline"
                colorScheme="brand"
                px="8"
                py="6"
                fontSize="lg"
                fontWeight="bold"
                w="full"
              >
                New Patient Registration
              </Button>
            </ChakraLink>
          </HStack>
        </VStack>
      </Center>
    </PublicLayout>
  )
}

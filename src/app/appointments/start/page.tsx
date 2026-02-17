'use client'

import { useState } from 'react'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Input,
  Separator,
  Flex,
  Center,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Field } from '@/components/ui/field'
import { NativeSelectField, NativeSelectRoot } from '@/components/ui/native-select'
import { FiCheckCircle } from 'react-icons/fi'

export default function StartAppointmentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [callStarted, setCallStarted] = useState(false)
  const [formData, setFormData] = useState({
    doctorPhone: '',
    patientPhone: '',
    doctorName: '',
    appointmentType: 'consultation'
  })

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create appointment first
      const createResponse = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: formData.doctorName,
          appointment_type: formData.appointmentType,
          appointment_date: new Date().toISOString()
        })
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create appointment')
      }

      const { appointmentId } = await createResponse.json()

      console.log('process.env.NEXT_PUBLIC_VOICE_SERVER_URL', process.env.NEXT_PUBLIC_VOICE_SERVER_URL)
      // Start the conference call
      const callResponse = await fetch(
        `${process.env.NEXT_PUBLIC_VOICE_SERVER_URL}/api/appointments/${appointmentId}/start-call`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorPhone: formData.doctorPhone,
            patientPhone: formData.patientPhone
          })
        }
      )

      if (!callResponse.ok) {
        throw new Error('Failed to start call')
      }

      setCallStarted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarLayout>
      <Container maxW="3xl" py="12" px={{ base: '4', sm: '6', lg: '8' }}>
        {/* Header */}
        <Box mb="10">
          <Heading size="3xl" color="brand.600" mb="3">
            Start AI-Assisted Appointment
          </Heading>
          <Text fontSize="lg" color="gray.700">
            Connect a doctor and patient with Amiga's AI assistant listening and helping in real-time.
          </Text>
          <Separator width="24" borderColor="purple.500" borderWidth="2px" mt="4" />
        </Box>

        {callStarted ? (
          <Card.Root bg="white">
            <Card.Body textAlign="center" py="8">
              <Center mb="6">
                <Flex
                  align="center"
                  justify="center"
                  w="20"
                  h="20"
                  bg="green.100"
                  borderRadius="full"
                  mb="4"
                >
                  <FiCheckCircle size={40} color="#16A34A" />
                </Flex>
              </Center>
              <Heading size="2xl" color="brand.600" mb="2">
                Calls Connecting!
              </Heading>
              <Text color="gray.700" fontSize="lg" mb="4">
                Both doctor and patient are being called now.
              </Text>
              <Text color="gray.600">
                The AI assistant Amiga will join the conference and listen to help during the conversation.
              </Text>

              <Box bg="cream.50" borderRadius="lg" p="6" borderWidth="1px" borderColor="gray.200" mt="6">
                <Heading size="sm" color="gray.900" mb="3">
                  What happens next:
                </Heading>
                <VStack align="start" gap="2" color="gray.700">
                  <Flex align="start">
                    <Text color="brand.500" fontWeight="bold" mr="2">1.</Text>
                    <Text>Doctor receives a call and joins the conference</Text>
                  </Flex>
                  <Flex align="start">
                    <Text color="brand.500" fontWeight="bold" mr="2">2.</Text>
                    <Text>Patient receives a call and joins the conference</Text>
                  </Flex>
                  <Flex align="start">
                    <Text color="brand.500" fontWeight="bold" mr="2">3.</Text>
                    <Text>AI assistant listens and can speak to clarify or help</Text>
                  </Flex>
                  <Flex align="start">
                    <Text color="brand.500" fontWeight="bold" mr="2">4.</Text>
                    <Text>Full transcript available after the call</Text>
                  </Flex>
                </VStack>
              </Box>

              <Button
                mt="6"
                variant="outline"
                colorScheme="gray"
                onClick={() => {
                  setCallStarted(false)
                  setFormData({
                    doctorPhone: '',
                    patientPhone: '',
                    doctorName: '',
                    appointmentType: 'consultation'
                  })
                }}
              >
                Start Another Appointment
              </Button>
            </Card.Body>
          </Card.Root>
        ) : (
          <Card.Root bg="white">
            <Card.Body p="8">
              {error && (
                <Alert.Root status="error" mb="6">
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              )}

              <form onSubmit={handleStartCall}>
                <VStack gap="6" align="stretch">
                  <Field label="Doctor's Name" required>
                    <Input
                      id="doctorName"
                      required
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      placeholder="Dr. Smith"
                    />
                  </Field>

                  <Field label="Doctor's Phone Number" required helperText="Include country code (e.g., +1 for US)">
                    <Input
                      type="tel"
                      id="doctorPhone"
                      required
                      value={formData.doctorPhone}
                      onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </Field>

                  <Field label="Patient's Phone Number" required>
                    <Input
                      type="tel"
                      id="patientPhone"
                      required
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </Field>

                  <Field label="Appointment Type" required>
                    <NativeSelectRoot>
                      <NativeSelectField
                        id="appointmentType"
                        required
                        value={formData.appointmentType}
                        onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                      >
                        <option value="consultation">Initial Consultation</option>
                        <option value="follow-up">Follow-up Visit</option>
                        <option value="treatment-planning">Treatment Planning</option>
                        <option value="results-review">Results Review</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field>

                  <Box bg="purple.50" borderRadius="lg" p="6" borderWidth="1px" borderColor="purple.200">
                    <Heading size="sm" color="purple.900" mb="2">
                      AI Assistant Features
                    </Heading>
                    <VStack align="start" fontSize="sm" color="purple.800" gap="1">
                      <Text>• Clarifies complex medical terms in real-time</Text>
                      <Text>• Suggests questions the patient might want to ask</Text>
                      <Text>• Provides emotional support when needed</Text>
                      <Text>• Takes automated notes</Text>
                      <Text>• Creates full transcript for later review</Text>
                    </VStack>
                  </Box>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    w="full"
                    disabled={loading}
                    py="6"
                    fontSize="lg"
                    fontWeight="bold"
                  >
                    {loading ? 'Starting Call...' : 'Start AI-Assisted Appointment'}
                  </Button>
                </VStack>
              </form>
            </Card.Body>
          </Card.Root>
        )}
      </Container>
    </SidebarLayout>
  )
}

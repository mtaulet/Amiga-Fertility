'use client'

import { useState, useEffect, useRef } from 'react'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Flex,
  Button,
  Textarea,
  Separator,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Appointment } from '@/lib/supabase/types'

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export default function AppointmentsPage() {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  const [commText, setCommText] = useState('')
  const [commSummary, setCommSummary] = useState('')
  const [generatedSummary, setGeneratedSummary] = useState('')

  const [savingComm, setSavingComm] = useState(false)
  const [savingCommSummary, setSavingCommSummary] = useState(false)
  const [savingGenSummary, setSavingGenSummary] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [editingCommSummary, setEditingCommSummary] = useState(false)
  const [editingGenSummary, setEditingGenSummary] = useState(false)

  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/appointments/latest')
      .then((r) => r.json())
      .then((data) => {
        if (data.appointment) {
          setAppointment(data.appointment)
          setCommText(data.appointment.communications_text ?? '')
          setCommSummary(data.appointment.communications_summary ?? '')
          setGeneratedSummary(data.appointment.generated_summary ?? '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function patchField(fields: Record<string, string | null>) {
    if (!appointment) return
    await fetch(`/api/appointments/${appointment.id}/communications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
  }

  async function handleSaveComm() {
    setSavingComm(true)
    await patchField({ communications_text: commText })
    setAppointment((prev) =>
      prev
        ? { ...prev, communications_text: commText, communications_updated_at: new Date().toISOString() }
        : prev
    )
    setSavingComm(false)
  }

  async function handleSaveCommSummary() {
    setSavingCommSummary(true)
    await patchField({ communications_summary: commSummary })
    setAppointment((prev) =>
      prev
        ? {
            ...prev,
            communications_summary: commSummary,
            communications_summary_reviewed_at: new Date().toISOString(),
          }
        : prev
    )
    setEditingCommSummary(false)
    setSavingCommSummary(false)
  }

  async function handleGenerateSummary() {
    if (!appointment) return
    setGenerating(true)
    try {
      const res = await fetch('/api/appointments/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communicationsText: commText,
          transcriptText: appointment.transcript_text,
        }),
      })
      const data = await res.json()
      if (data.summary) {
        setGeneratedSummary(data.summary)
        await patchField({ generated_summary: data.summary })
        setAppointment((prev) =>
          prev ? { ...prev, generated_summary: data.summary } : prev
        )
      }
    } catch {
      // silent
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveGenSummary() {
    setSavingGenSummary(true)
    await patchField({ generated_summary: generatedSummary })
    setAppointment((prev) =>
      prev
        ? {
            ...prev,
            generated_summary: generatedSummary,
            generated_summary_reviewed_at: new Date().toISOString(),
          }
        : prev
    )
    setEditingGenSummary(false)
    setSavingGenSummary(false)
  }

  if (loading) {
    return (
      <SidebarLayout>
        <Container maxW="4xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="gray.500">Loading...</Text>
        </Container>
      </SidebarLayout>
    )
  }

  if (!appointment) {
    return (
      <SidebarLayout>
        <Container maxW="4xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
          <Heading size="2xl" color="brand.600" mb="2">
            Appointments
          </Heading>
          <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Text color="gray.500">
                No appointments found. Your appointment information will appear here once scheduled.
              </Text>
            </Card.Body>
          </Card.Root>
        </Container>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <Container maxW="4xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
        <Heading size="2xl" color="brand.600" mb="2">
          Appointments
        </Heading>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        <VStack gap="8" align="stretch">
          {/* First Appointment */}
          <Box id="first-appointment">
            <Heading size="lg" color="brand.600" mb="3">
              First Appointment
            </Heading>
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <VStack gap="5" align="stretch">
                  {/* Metadata row */}
                  <Flex gap="8" flexWrap="wrap">
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">
                        Date
                      </Text>
                      <Text fontSize="sm" color="gray.900">
                        {formatDate(appointment.appointment_date)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">
                        Dr
                      </Text>
                      <Text fontSize="sm" color="gray.900">
                        {appointment.doctor_name ?? '—'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">
                        Clinic
                      </Text>
                      <Text fontSize="sm" color="gray.900">
                        {appointment.clinic_name ?? '—'}
                      </Text>
                    </Box>
                  </Flex>

                  <Separator />

                  {/* Audio upload row */}
                  <Flex align="center" gap="4" flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="120px">
                      Upload audio
                    </Text>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      style={{ display: 'none' }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      Choose file
                    </Button>
                    {appointment.audio_uploaded_at && (
                      <Text fontSize="xs" color="gray.400">
                        Uploaded: {formatDateTime(appointment.audio_uploaded_at)}
                      </Text>
                    )}
                  </Flex>

                  <Separator />

                  {/* Transcript row */}
                  <Flex align="center" gap="4" flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="120px">
                      Transcript
                    </Text>
                    <Button size="sm" variant="outline" disabled={!appointment.transcript_text}>
                      View
                    </Button>
                    {appointment.transcript_generated_at && (
                      <Text fontSize="xs" color="gray.400">
                        Generated: {formatDateTime(appointment.transcript_generated_at)}
                      </Text>
                    )}
                    {appointment.transcript_reviewed_at && (
                      <Text fontSize="xs" color="gray.400">
                        Reviewed: {formatDateTime(appointment.transcript_reviewed_at)}
                      </Text>
                    )}
                  </Flex>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>

          {/* Communications */}
          <Box id="communications">
            <Heading size="lg" color="brand.600" mb="3">
              Communications
            </Heading>
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <VStack gap="6" align="stretch">
                  {/* Free-text communications */}
                  <Box>
                    <Flex justify="space-between" align="center" mb="2">
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        Notes
                      </Text>
                      {appointment.communications_updated_at && (
                        <Text fontSize="xs" color="gray.400">
                          Last updated: {formatDateTime(appointment.communications_updated_at)}
                        </Text>
                      )}
                    </Flex>
                    <Textarea
                      value={commText}
                      onChange={(e) => setCommText(e.target.value)}
                      placeholder="Type description..."
                      rows={4}
                      bg="cream.50"
                      borderColor="gray.200"
                      fontSize="sm"
                      resize="vertical"
                    />
                    <Flex justify="flex-end" mt="2">
                      <Button
                        size="sm"
                        colorScheme="brand"
                        onClick={handleSaveComm}
                        disabled={savingComm}
                      >
                        {savingComm ? 'Saving...' : 'Save'}
                      </Button>
                    </Flex>
                  </Box>

                  <Separator />

                  {/* Communications summary */}
                  <Box>
                    <Flex justify="space-between" align="center" mb="2">
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        Summary
                      </Text>
                      {appointment.communications_summary_reviewed_at && (
                        <Text fontSize="xs" color="gray.400">
                          Reviewed: {formatDateTime(appointment.communications_summary_reviewed_at)}
                        </Text>
                      )}
                    </Flex>
                    <Textarea
                      value={commSummary}
                      onChange={(e) => setCommSummary(e.target.value)}
                      placeholder="Communications summary..."
                      rows={3}
                      bg="cream.50"
                      borderColor="gray.200"
                      fontSize="sm"
                      resize="vertical"
                      readOnly={!editingCommSummary}
                    />
                    <Flex justify="flex-end" mt="2">
                      {editingCommSummary ? (
                        <Button
                          size="sm"
                          colorScheme="brand"
                          onClick={handleSaveCommSummary}
                          disabled={savingCommSummary}
                        >
                          {savingCommSummary ? 'Saving...' : 'Save'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCommSummary(true)}
                        >
                          Edit
                        </Button>
                      )}
                    </Flex>
                  </Box>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>

          {/* Generated Summary */}
          <Box id="summary">
            <Heading size="lg" color="brand.600" mb="3">
              Generated Summary
            </Heading>
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <VStack gap="3" align="stretch">
                  <Textarea
                    value={generatedSummary}
                    onChange={(e) => setGeneratedSummary(e.target.value)}
                    placeholder="AI-generated summary will appear here after clicking Generate Summary..."
                    rows={6}
                    bg="cream.50"
                    borderColor="gray.200"
                    fontSize="sm"
                    resize="vertical"
                    readOnly={!editingGenSummary}
                  />
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap="2">
                    <Button
                      size="sm"
                      colorScheme="brand"
                      onClick={handleGenerateSummary}
                      disabled={generating}
                    >
                      {generating ? 'Generating...' : 'Generate Summary'}
                    </Button>
                    <Flex align="center" gap="2">
                      {appointment.generated_summary_reviewed_at && (
                        <Text fontSize="xs" color="gray.400">
                          Saved: {formatDateTime(appointment.generated_summary_reviewed_at)}
                        </Text>
                      )}
                      {editingGenSummary ? (
                        <Button
                          size="sm"
                          colorScheme="brand"
                          onClick={handleSaveGenSummary}
                          disabled={savingGenSummary}
                        >
                          {savingGenSummary ? 'Saving...' : 'Save'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingGenSummary(true)}
                        >
                          Edit
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>
        </VStack>
      </Container>
    </SidebarLayout>
  )
}

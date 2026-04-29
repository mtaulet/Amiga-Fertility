'use client'

import { useState, useEffect, useRef } from 'react'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import {
  Badge,
  Box,
  Button,
  Container,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Heading,
  Separator,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Appointment } from '@/lib/supabase/types'

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Pending view
// ---------------------------------------------------------------------------
function PendingAppointmentView({ appointment }: { appointment: Appointment }) {
  let availData: { slots: { date: string; start_time: string; end_time: string }[]; note: string | null; timezone: string | null } | null = null
  try {
    const parsed = JSON.parse(appointment.notes ?? '')
    if (parsed.type === 'availability') availData = parsed
  } catch {}

  return (
    <SidebarLayout>
      <Container maxW="4xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
        <Heading size="2xl" color="brand.600" mb="2">Appointments</Heading>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        <Heading size="lg" color="brand.600" mb="3">First Appointment</Heading>
        <Card.Root bg="white" borderWidth="1px" borderColor="orange.200">
          <Card.Body>
            <VStack gap="5" align="stretch">
              <Flex align="center" gap="3">
                <Badge colorPalette="orange" variant="subtle" px="3" py="1" borderRadius="full" fontSize="xs" fontWeight="semibold">
                  Awaiting confirmation
                </Badge>
                {appointment.clinic_name && (
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">{appointment.clinic_name}</Text>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500">
                Your availability has been sent to the clinic. They will confirm one of your proposed time slots.
              </Text>
              {availData && availData.slots.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="3">
                    Your offered slots
                  </Text>
                  <VStack align="stretch" gap="2">
                    {availData.slots.map((s, i) => {
                      const d = new Date(s.date + 'T00:00:00')
                      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                      return (
                        <Flex key={i} align="center" gap="3"
                          bg="orange.50" borderRadius="lg" px="4" py="3"
                          borderWidth="1px" borderColor="orange.100"
                        >
                          <Text fontSize="sm" color="orange.600" fontWeight="bold" flexShrink={0}>{i + 1}</Text>
                          <Text fontSize="sm" color="gray.700" fontWeight="medium">{dateStr} · {s.start_time} – {s.end_time}</Text>
                        </Flex>
                      )
                    })}
                  </VStack>
                  {availData.timezone && (
                    <Text fontSize="xs" color="gray.400" mt="2">Timezone: {availData.timezone}</Text>
                  )}
                </Box>
              )}
              {availData?.note && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">Your message</Text>
                  <Text fontSize="sm" color="gray.600" fontStyle="italic">"{availData.note}"</Text>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </Container>
    </SidebarLayout>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AppointmentsPage() {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [commText, setCommText] = useState('')
  const [commSummary, setCommSummary] = useState('')
  const [generatedSummary, setGeneratedSummary] = useState('')

  const [savingComm, setSavingComm] = useState(false)
  const [savingCommSummary, setSavingCommSummary] = useState(false)
  const [savingGenSummary, setSavingGenSummary] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [editingCommSummary, setEditingCommSummary] = useState(false)
  const [editingGenSummary, setEditingGenSummary] = useState(false)
  const [audioStatus, setAudioStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'done'>('idle')
  const [audioError, setAudioError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/appointments/latest')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setFetchError(data.error)
        } else if (data.appointment) {
          setAppointment(data.appointment)
          setCommText(data.appointment.communications_text ?? '')
          setCommSummary(data.appointment.communications_summary ?? '')
          setGeneratedSummary(data.appointment.generated_summary ?? '')
        }
        setLoading(false)
      })
      .catch(e => { setFetchError(String(e)); setLoading(false) })
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
    setAppointment(prev => prev ? { ...prev, communications_text: commText, communications_updated_at: new Date().toISOString() } : prev)
    setSavingComm(false)
  }

  async function handleSaveCommSummary() {
    setSavingCommSummary(true)
    await patchField({ communications_summary: commSummary })
    setAppointment(prev => prev ? { ...prev, communications_summary: commSummary, communications_summary_reviewed_at: new Date().toISOString() } : prev)
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
        body: JSON.stringify({ communicationsText: commText, transcriptText: appointment.transcript_text }),
      })
      const data = await res.json()
      if (data.summary) {
        setGeneratedSummary(data.summary)
        await patchField({ generated_summary: data.summary })
        setAppointment(prev => prev ? { ...prev, generated_summary: data.summary } : prev)
      }
    } catch { /* silent */ }
    finally { setGenerating(false) }
  }

  async function handleAudioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !appointment) return
    setAudioError(null)
    setAudioStatus('uploading')
    try {
      const body = new FormData()
      body.append('audio', file)
      setAudioStatus('transcribing')
      const res = await fetch(`/api/appointments/${appointment.id}/audio`, { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) { setAudioError(data.error ?? 'Upload failed'); setAudioStatus('idle'); return }
      setAppointment(prev => prev ? {
        ...prev,
        audio_file_url: data.storagePath,
        audio_uploaded_at: data.uploadedAt,
        transcript_text: data.transcriptText,
        transcript_generated_at: data.transcriptGeneratedAt,
      } : prev)
      setAudioStatus('done')
    } catch {
      setAudioError('Upload failed. Please try again.')
      setAudioStatus('idle')
    } finally {
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  async function handleAudioPlay() {
    if (!appointment) return
    const res = await fetch(`/api/appointments/${appointment.id}/audio`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  async function handleSaveGenSummary() {
    setSavingGenSummary(true)
    await patchField({ generated_summary: generatedSummary })
    setAppointment(prev => prev ? { ...prev, generated_summary: generatedSummary, generated_summary_reviewed_at: new Date().toISOString() } : prev)
    setEditingGenSummary(false)
    setSavingGenSummary(false)
  }

  if (!loading && appointment?.status === 'pending') {
    return <PendingAppointmentView appointment={appointment} />
  }

  if (loading) {
    return (
      <SidebarLayout>
        <Container maxW="4xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="gray.500">Loading…</Text>
        </Container>
      </SidebarLayout>
    )
  }

  if (!appointment) {
    return (
      <SidebarLayout>
        <Container maxW="4xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
          <Heading size="2xl" color="brand.600" mb="2">Appointments</Heading>
          <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />
          <Card.Root bg="white" borderWidth="1px" borderColor={fetchError ? 'red.200' : 'gray.200'}>
            <Card.Body>
              <Text color={fetchError ? 'red.500' : 'gray.500'} fontSize="sm">
                {fetchError
                  ? `Error loading appointments: ${fetchError}`
                  : 'No appointments yet. Your appointment will appear here once scheduled.'}
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
        <Heading size="2xl" color="brand.600" mb="2">Appointments</Heading>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        <VStack gap="8" align="stretch">

          {/* First Appointment */}
          <Box id="first-appointment">
            <Heading size="lg" color="brand.600" mb="3">First Appointment</Heading>
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <VStack gap="5" align="stretch">
                  <Flex gap="8" flexWrap="wrap">
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">Date</Text>
                      <Text fontSize="sm" color="gray.900">{fmtDate(appointment.appointment_date)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">Dr</Text>
                      <Text fontSize="sm" color="gray.900">{appointment.doctor_name ?? '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb="1">Clinic</Text>
                      <Text fontSize="sm" color="gray.900">{appointment.clinic_name ?? '—'}</Text>
                    </Box>
                  </Flex>

                  <Separator />

                  <Flex align="center" gap="4" flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="120px">Upload audio</Text>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      style={{ display: 'none' }}
                      onChange={handleAudioSelect}
                    />
                    {appointment.audio_file_url ? (
                      <Flex gap="2" align="center">
                        <Button size="sm" variant="outline" onClick={handleAudioPlay}>
                          Audio 1
                        </Button>
                        <Button size="sm" variant="ghost" color="gray.400"
                          onClick={() => audioInputRef.current?.click()}
                          loading={audioStatus === 'uploading' || audioStatus === 'transcribing'}
                          disabled={audioStatus === 'uploading' || audioStatus === 'transcribing'}
                        >
                          {audioStatus === 'uploading' ? 'Uploading…'
                            : audioStatus === 'transcribing' ? 'Transcribing…'
                            : 'Replace'}
                        </Button>
                      </Flex>
                    ) : (
                      <Button size="sm" variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                        loading={audioStatus === 'uploading' || audioStatus === 'transcribing'}
                        disabled={audioStatus === 'uploading' || audioStatus === 'transcribing'}
                      >
                        {audioStatus === 'uploading' ? 'Uploading…'
                          : audioStatus === 'transcribing' ? 'Transcribing…'
                          : 'Choose file'}
                      </Button>
                    )}
                    {appointment.audio_uploaded_at && (
                      <Text fontSize="xs" color="gray.400">Uploaded: {fmtDate(appointment.audio_uploaded_at)}</Text>
                    )}
                    {audioError && (
                      <Text fontSize="xs" color="red.500">{audioError}</Text>
                    )}
                  </Flex>

                  <Separator />

                  <Flex align="center" gap="4" flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="120px">Transcript</Text>
                    <Button size="sm" variant="outline"
                      disabled={!appointment.transcript_text}
                      onClick={() => setShowTranscript(true)}
                    >
                      View
                    </Button>
                    {appointment.transcript_generated_at && (
                      <Text fontSize="xs" color="gray.400">Generated: {fmtDateTime(appointment.transcript_generated_at)}</Text>
                    )}
                    {appointment.transcript_reviewed_at && (
                      <Text fontSize="xs" color="gray.400">Reviewed: {fmtDateTime(appointment.transcript_reviewed_at)}</Text>
                    )}
                  </Flex>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>

          {/* Communications */}
          <Box id="communications">
            <Heading size="lg" color="brand.600" mb="3">Communications</Heading>
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <VStack gap="6" align="stretch">
                  <Box>
                    <Flex justify="space-between" align="center" mb="2">
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">Notes</Text>
                      {appointment.communications_updated_at && (
                        <Text fontSize="xs" color="gray.400">Last updated: {fmtDateTime(appointment.communications_updated_at)}</Text>
                      )}
                    </Flex>
                    <Textarea
                      value={commText}
                      onChange={e => setCommText(e.target.value)}
                      placeholder="Type description…"
                      rows={4}
                      bg="cream.50"
                      borderColor="gray.200"
                      fontSize="sm"
                      resize="vertical"
                    />
                    <Flex justify="flex-end" mt="2">
                      <Button size="sm" colorScheme="brand" onClick={handleSaveComm} loading={savingComm}>
                        Save
                      </Button>
                    </Flex>
                  </Box>

                  <Separator />

                  <Box>
                    <Flex justify="space-between" align="center" mb="2">
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">Summary</Text>
                      {appointment.communications_summary_reviewed_at && (
                        <Text fontSize="xs" color="gray.400">Reviewed: {fmtDateTime(appointment.communications_summary_reviewed_at)}</Text>
                      )}
                    </Flex>
                    <Textarea
                      value={commSummary}
                      onChange={e => setCommSummary(e.target.value)}
                      placeholder="Communications summary…"
                      rows={3}
                      bg="cream.50"
                      borderColor="gray.200"
                      fontSize="sm"
                      resize="vertical"
                      readOnly={!editingCommSummary}
                    />
                    <Flex justify="flex-end" mt="2">
                      {editingCommSummary ? (
                        <Button size="sm" colorScheme="brand" onClick={handleSaveCommSummary} loading={savingCommSummary}>Save</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingCommSummary(true)}>Edit</Button>
                      )}
                    </Flex>
                  </Box>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>

          {/* Generated Summary */}
          <Box id="summary">
            <Heading size="lg" color="brand.600" mb="3">Generated Summary</Heading>
            <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <VStack gap="3" align="stretch">
                  <Textarea
                    value={generatedSummary}
                    onChange={e => setGeneratedSummary(e.target.value)}
                    placeholder="AI-generated summary will appear here after clicking Generate Summary…"
                    rows={6}
                    bg="cream.50"
                    borderColor="gray.200"
                    fontSize="sm"
                    resize="vertical"
                    readOnly={!editingGenSummary}
                  />
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap="2">
                    <Button size="sm" colorScheme="brand" onClick={handleGenerateSummary} loading={generating}>
                      Generate Summary
                    </Button>
                    <Flex align="center" gap="2">
                      {appointment.generated_summary_reviewed_at && (
                        <Text fontSize="xs" color="gray.400">Saved: {fmtDateTime(appointment.generated_summary_reviewed_at)}</Text>
                      )}
                      {editingGenSummary ? (
                        <Button size="sm" colorScheme="brand" onClick={handleSaveGenSummary} loading={savingGenSummary}>Save</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingGenSummary(true)}>Edit</Button>
                      )}
                    </Flex>
                  </Flex>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>

        </VStack>
      </Container>

      {/* Transcript dialog */}
      <DialogRoot open={showTranscript} onOpenChange={({ open }) => setShowTranscript(open)} size="lg">
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transcript</DialogTitle>
              {appointment.transcript_generated_at && (
                <Text fontSize="xs" color="gray.400" mt="1">
                  Generated: {fmtDateTime(appointment.transcript_generated_at)}
                </Text>
              )}
            </DialogHeader>
            <DialogBody pb="6" maxH="60vh" overflowY="auto">
              <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="tall">
                {appointment.transcript_text}
              </Text>
            </DialogBody>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

    </SidebarLayout>
  )
}

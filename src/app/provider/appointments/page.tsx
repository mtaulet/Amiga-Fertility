'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ProviderSidebarLayout from '@/components/layouts/ProviderSidebarLayout'
import {
  Box, Button, Container, Flex, Heading, Separator, Text, VStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'

const VideoCall = dynamic(() => import('@/components/VideoCall'), { ssr: false })

type Appointment = {
  id: string
  appointment_date: string
  appointment_type: string | null
  status: string
  clinic_name: string | null
  doctor_name: string | null
  video_room_url: string | null
  transcript_text: string | null
  transcript_generated_at: string | null
  audio_uploaded_at: string | null
  patient: { id: string; first_name: string | null; last_name: string | null; email: string } | null
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ProviderAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCall, setActiveCall] = useState<{ appointmentId: string; url: string; token: string } | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [viewingTranscript, setViewingTranscript] = useState<{ patient: string; text: string } | null>(null)
  const [postCallBanner, setPostCallBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/provider/appointments')
      .then(r => r.json())
      .then(data => { setAppointments(data.appointments ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleJoinCall(appointmentId: string) {
    setJoiningId(appointmentId)
    try {
      const res = await fetch('/api/video/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      })
      const data = await res.json()
      if (res.ok) setActiveCall({ appointmentId, url: data.url, token: data.token })
    } finally {
      setJoiningId(null)
    }
  }

  function handleTranscriptReady(data: { transcriptText: string; transcriptGeneratedAt: string; storagePath: string }) {
    setAppointments(prev => prev.map(a =>
      a.id === activeCall?.appointmentId
        ? { ...a, transcript_text: data.transcriptText, transcript_generated_at: data.transcriptGeneratedAt }
        : a
    ))
    setPostCallBanner({ type: 'success', message: 'Call ended — transcript saved successfully.' })
  }

  function handleTranscriptError(message: string) {
    setPostCallBanner({ type: 'error', message: `Call ended — transcription failed: ${message}` })
  }

  return (
    <ProviderSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Heading size="2xl" color="brand.600" mb="2">Appointments</Heading>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        {postCallBanner && (
          <Flex
            mb="4" px="4" py="3" borderRadius="lg" align="center" justify="space-between"
            bg={postCallBanner.type === 'success' ? 'green.50' : 'red.50'}
            borderWidth="1px"
            borderColor={postCallBanner.type === 'success' ? 'green.200' : 'red.200'}
          >
            <Text fontSize="sm" color={postCallBanner.type === 'success' ? 'green.700' : 'red.700'}>
              {postCallBanner.type === 'success' ? '✓ ' : '✕ '}{postCallBanner.message}
            </Text>
            <Button size="xs" variant="ghost" onClick={() => setPostCallBanner(null)}>✕</Button>
          </Flex>
        )}

        {activeCall && (
          <Box mb="8">
            <VideoCall
              roomUrl={activeCall.url}
              token={activeCall.token}
              appointmentId={activeCall.appointmentId}
              onLeave={() => setActiveCall(null)}
              onTranscriptReady={handleTranscriptReady}
              onTranscriptError={handleTranscriptError}
            />
          </Box>
        )}

        <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
          {loading ? (
            <Box p="8"><Text color="gray.400" fontSize="sm">Loading…</Text></Box>
          ) : appointments.length === 0 ? (
            <Box p="8" textAlign="center"><Text color="gray.400" fontSize="sm">No appointments yet.</Text></Box>
          ) : (
            <Box overflowX="auto">
              <Box as="table" width="100%" style={{ borderCollapse: 'collapse' }}>
                <Box as="thead">
                  <Box as="tr">
                    {['Patient', 'Date', 'Clinic', 'Status', 'Transcript', ''].map(h => (
                      <Box key={h} as="th" textAlign="left" fontSize="xs" fontWeight="semibold"
                        color="gray.500" textTransform="uppercase" letterSpacing="wide"
                        pb="2" px="4" pt="4" borderBottom="1px" borderColor="gray.200">
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {appointments.map(a => (
                    <Box as="tr" key={a.id} _hover={{ bg: 'gray.50' }} borderTop="1px" borderColor="gray.100">
                      <Box as="td" px="4" py="3">
                        <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                          {a.patient?.first_name} {a.patient?.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.400">{a.patient?.email}</Text>
                      </Box>
                      <Box as="td" px="4" py="3" fontSize="sm" fontWeight="semibold" color="brand.500">
                        {fmtDate(a.appointment_date)}
                      </Box>
                      <Box as="td" px="4" py="3" fontSize="sm" color="gray.700">{a.clinic_name ?? '—'}</Box>
                      <Box as="td" px="4" py="3">
                        <Box display="inline-flex" px="2" py="0.5" borderRadius="full" fontSize="xs" fontWeight="semibold"
                          bg={a.status === 'confirmed' ? 'green.100' : 'blue.100'}
                          color={a.status === 'confirmed' ? 'green.700' : 'blue.700'}>
                          {a.status}
                        </Box>
                      </Box>
                      <Box as="td" px="4" py="3" fontSize="xs" color="gray.500">
                        {a.transcript_generated_at && a.transcript_text ? (
                          <VStack align="start" gap="1">
                            <Text>{`Generated ${fmtDateTime(a.transcript_generated_at)}`}</Text>
                            <Button
                              size="xs" variant="ghost" colorPalette="blue" px="0"
                              onClick={() => setViewingTranscript({
                                patient: `${a.patient?.first_name ?? ''} ${a.patient?.last_name ?? ''}`.trim(),
                                text: a.transcript_text!,
                              })}
                            >
                              View transcript →
                            </Button>
                          </VStack>
                        ) : '—'}
                      </Box>
                      <Box as="td" px="4" py="3">
                        <Button
                          size="xs"
                          colorPalette="orange"
                          variant="outline"
                          onClick={() => handleJoinCall(a.id)}
                          loading={joiningId === a.id}
                          disabled={!!activeCall && activeCall.appointmentId !== a.id}
                        >
                          Join Call
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Card.Root>
      </Container>

      {viewingTranscript && (
        <Box position="fixed" inset={0} zIndex={50} display="flex" alignItems="center" justifyContent="center"
          bg="blackAlpha.600" onClick={() => setViewingTranscript(null)}>
          <Box bg="white" borderRadius="xl" p="6" maxW="600px" w="90vw" maxH="80vh" overflow="auto"
            onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" mb="4">
              <Heading size="md" color="gray.800">Transcript — {viewingTranscript.patient}</Heading>
              <Button size="xs" variant="ghost" onClick={() => setViewingTranscript(null)}>✕</Button>
            </Flex>
            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="1.7">
              {viewingTranscript.text}
            </Text>
          </Box>
        </Box>
      )}
    </ProviderSidebarLayout>
  )
}

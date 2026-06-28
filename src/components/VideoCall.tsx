'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, Button, Flex, Text } from '@chakra-ui/react'

interface TranscriptResult {
  transcriptText: string
  transcriptGeneratedAt: string
  storagePath: string
}

interface Props {
  roomUrl: string
  token: string
  appointmentId: string
  onLeave: () => void
  onTranscriptReady: (result: TranscriptResult) => void
  onTranscriptError?: (message: string) => void
}

export default function VideoCall({ roomUrl, token, appointmentId, onLeave, onTranscriptReady, onTranscriptError }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const callRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)

  const [status, setStatus] = useState<'connecting' | 'connected' | 'left'>('connecting')
  const [callError, setCallError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  function addTrack(track: MediaStreamTrack) {
    if (!audioContextRef.current || !destinationRef.current) return
    try {
      const source = audioContextRef.current.createMediaStreamSource(new MediaStream([track]))
      source.connect(destinationRef.current)
    } catch {}
  }

  useEffect(() => {
    let call: any
    let mounted = true

    async function init() {
      const DailyIframe = (await import('@daily-co/daily-js')).default

      try {
        const existing = DailyIframe.getCallInstance()
        if (existing) await existing.destroy()
      } catch {}

      if (!mounted || !iframeRef.current) return

      call = DailyIframe.wrap(iframeRef.current, {
        showLeaveButton: false,
        showFullscreenButton: true,
      })
      callRef.current = call

      call.on('joined-meeting', () => {
        setStatus('connected')
        const ctx = new AudioContext()
        const dest = ctx.createMediaStreamDestination()
        audioContextRef.current = ctx
        destinationRef.current = dest

        // Connect any tracks already present
        Object.values(call.participants() as Record<string, any>).forEach((p: any) => {
          if (p.audioTrack) addTrack(p.audioTrack)
        })
      })

      call.on('track-started', ({ track }: any) => {
        if (track.kind === 'audio') addTrack(track)
      })

      call.on('left-meeting', () => {
        setStatus('left')
        handleStopAndUpload()
      })

      call.on('error', (e: any) => {
        console.error('Daily error:', e)
        setCallError(e?.errorMsg ?? e?.error ?? 'Call error — please try again')
      })

      await call.join({ url: roomUrl, token })
    }

    init()

    return () => {
      mounted = false
      audioContextRef.current?.close()
      call?.destroy()
    }
  }, [roomUrl, token])

  function startRecording() {
    if (!destinationRef.current) return
    audioChunksRef.current = []
    const stream = destinationRef.current.stream

    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    let recorder: MediaRecorder | null = null
    for (const mimeType of candidates) {
      try {
        recorder = new MediaRecorder(stream, { mimeType })
        break
      } catch {}
    }
    if (!recorder) {
      try { recorder = new MediaRecorder(stream) } catch { return }
    }

    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
    recorder.start(1000)
    mediaRecorderRef.current = recorder
    setRecording(true)
  }

  async function processUpload(recorder: MediaRecorder) {
    if (audioChunksRef.current.length === 0) {
      console.log('[VideoCall] No audio chunks to upload, skipping')
      onLeave()
      return
    }
    setUploading(true)
    try {
      const mimeType = recorder.mimeType || 'audio/webm'
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const blob = new Blob(audioChunksRef.current, { type: mimeType })
      const file = new File([blob], `call-recording.${ext}`, { type: mimeType })
      console.log(`[VideoCall] Uploading recording: ${file.name}, size=${file.size}B, mimeType=${mimeType}, chunks=${audioChunksRef.current.length}`)

      const urlRes = await fetch(`/api/appointments/${appointmentId}/audio/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      })
      const urlData = await urlRes.json()
      console.log(`[VideoCall] upload-url response: ${urlRes.status}`, urlRes.ok ? urlData.storagePath : urlData.error)
      if (!urlRes.ok) throw new Error(urlData.error ?? `upload-url failed (${urlRes.status})`)

      const { supabase } = await import('@/lib/supabase/client')
      const { error: uploadError } = await supabase.storage
        .from('appointment-audios')
        .uploadToSignedUrl(urlData.storagePath, urlData.token, file, { contentType: mimeType })
      if (uploadError) {
        console.error('[VideoCall] Supabase storage upload error:', uploadError)
        throw uploadError
      }
      console.log('[VideoCall] Storage upload done, requesting transcription')

      const transcribeRes = await fetch(`/api/appointments/${appointmentId}/audio/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: urlData.storagePath, mimeType, filename: file.name }),
      })
      const transcribeData = await transcribeRes.json()
      console.log(`[VideoCall] transcribe response: ${transcribeRes.status}`, transcribeRes.ok ? 'ok' : transcribeData.error)
      if (!transcribeRes.ok) throw new Error(transcribeData.error ?? `transcription failed (${transcribeRes.status})`)
      onTranscriptReady(transcribeData)
    } catch (e: any) {
      console.error('[VideoCall] processUpload error:', e)
      onTranscriptError?.(e?.message ?? 'Recording upload or transcription failed')
    } finally {
      setUploading(false)
      onLeave()
    }
  }

  function handleStopAndUpload() {
    const recorder = mediaRecorderRef.current
    if (!recorder || audioChunksRef.current.length === 0) {
      console.log('[VideoCall] handleStopAndUpload: no recorder or no chunks, leaving')
      onLeave()
      return
    }
    console.log(`[VideoCall] handleStopAndUpload: recorder.state=${recorder.state}, chunks=${audioChunksRef.current.length}`)

    if (recorder.state === 'inactive') {
      // Already stopped manually — process the chunks we have
      processUpload(recorder)
    } else {
      recorder.onstop = () => processUpload(recorder)
      recorder.stop()
      setRecording(false)
    }
  }

  function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
    } else {
      startRecording()
    }
  }

  async function leaveCall() {
    await callRef.current?.leave()
  }

  return (
    <Box position="relative" w="full" h="600px" bg="gray.900" borderRadius="lg" overflow="hidden">
      <iframe
        ref={iframeRef}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />

      {recording && (
        <Flex position="absolute" top="3" left="3" align="center" gap="2" zIndex={10}
          bg="blackAlpha.700" px="3" py="1.5" borderRadius="full">
          <Box
            w="8px" h="8px" borderRadius="full" bg="red.500"
            style={{ animation: 'pulse 1.2s ease-in-out infinite' }}
          />
          <Text color="white" fontSize="xs" fontWeight="semibold">REC</Text>
        </Flex>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>

      <Flex
        position="absolute"
        bottom="4"
        left="50%"
        transform="translateX(-50%)"
        gap="3"
        zIndex={10}
      >
        {status === 'connected' && (
          <Button
            size="sm"
            bg={recording ? 'red.500' : 'whiteAlpha.800'}
            color={recording ? 'white' : 'gray.800'}
            _hover={{ opacity: 0.9 }}
            onClick={toggleRecording}
          >
            {recording ? '⏹ Stop Recording' : '⏺ Record'}
          </Button>
        )}
        <Button size="sm" bg="red.600" color="white" _hover={{ bg: 'red.700' }} onClick={leaveCall}>
          Leave
        </Button>
      </Flex>

      {uploading && (
        <Flex position="absolute" inset={0} align="center" justify="center" bg="blackAlpha.700" zIndex={5}>
          <Text color="white" fontSize="sm">Uploading & transcribing recording…</Text>
        </Flex>
      )}

      {callError && (
        <Flex position="absolute" inset={0} align="center" justify="center" bg="blackAlpha.800" zIndex={6} flexDirection="column" gap="3">
          <Text color="red.300" fontSize="sm" fontWeight="semibold">Failed to join call</Text>
          <Text color="whiteAlpha.800" fontSize="xs">{callError}</Text>
          <Button size="sm" bg="whiteAlpha.200" color="white" onClick={onLeave}>Close</Button>
        </Flex>
      )}
    </Box>
  )
}

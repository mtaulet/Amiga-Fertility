'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import type { Clinic } from '@/lib/supabase/types'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  NativeSelect,
  Separator,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Slot = { id: string; date: string; start_time: string; end_time: string }

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
]

let _counter = 0
function makeSlot(): Slot {
  return { id: String(_counter++), date: '', start_time: '', end_time: '' }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ScheduleAvailabilityPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [slots, setSlots] = useState<Slot[]>([makeSlot()])
  const [note, setNote] = useState('')
  const [timezone, setTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'America/New_York' }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingClinic, setLoadingClinic] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  // Load confirmed clinic
  useEffect(() => {
    async function load() {
      const [selectionsRes, clinicsRes] = await Promise.all([
        fetch('/api/clinics/selections'),
        fetch('/api/clinics'),
      ])
      if (!selectionsRes.ok || !clinicsRes.ok) { setLoadingClinic(false); return }
      const { selections, confirmed_at } = await selectionsRes.json()
      const allClinics: Clinic[] = await clinicsRes.json()
      if (confirmed_at) {
        const chosen = selections.find((s: any) => s.selection_type === 'downselection' && s.slot_position === 1)
        if (chosen) setClinic(allClinics.find(c => c.id === chosen.clinic_id) ?? null)
      }
      setLoadingClinic(false)
    }
    load()
  }, [])

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  function updateSlot(id: string, field: keyof Omit<Slot, 'id'>, value: string) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    setErrors(prev => { const next = { ...prev }; delete next[`${id}_${field}`]; delete next[`${id}_time`]; return next })
  }

  function addSlot() {
    setSlots(prev => [...prev, makeSlot()])
  }

  function removeSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    slots.forEach(slot => {
      if (!slot.date) newErrors[`${slot.id}_date`] = 'Date is required'
      if (!slot.start_time) newErrors[`${slot.id}_start_time`] = 'Start time is required'
      if (!slot.end_time) newErrors[`${slot.id}_end_time`] = 'End time is required'
      if (slot.start_time && slot.end_time && slot.start_time >= slot.end_time) {
        newErrors[`${slot.id}_time`] = 'End time must be after start time'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: slots.map(({ date, start_time, end_time }) => ({ date, start_time, end_time })),
          note: note.trim() || null,
          timezone,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrors({ _form: data.error || 'Failed to submit. Please try again.' })
        return
      }
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <SidebarLayout>
        <Container maxW="2xl" py="16" px={{ base: '4', sm: '6' }}>
          <Box textAlign="center">
            <Box
              w="16" h="16" borderRadius="full" bg="green.100"
              display="flex" alignItems="center" justifyContent="center"
              mx="auto" mb="6" fontSize="2xl"
            >
              ✓
            </Box>
            <Heading size="2xl" color="brand.600" mb="3">Availability sent!</Heading>
            <Text color="gray.600" mb="2">
              {clinic
                ? <>{clinic.name} will be in touch to confirm your appointment.</>
                : <>Your availability has been sent to the clinic.</>}
            </Text>
            <Text fontSize="sm" color="gray.400" mb="8">
              You shared {slots.length} time slot{slots.length !== 1 ? 's' : ''} in {timezone}.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Button colorPalette="orange" onClick={() => router.push('/dashboard')}>
                Go to dashboard
              </Button>
              <Button variant="ghost" color="gray.500" onClick={() => {
                setSubmitted(false)
                setSlots([makeSlot()])
                setNote('')
              }}>
                Submit new availability
              </Button>
            </Flex>
          </Box>
        </Container>
      </SidebarLayout>
    )
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  return (
    <SidebarLayout>
      <Container maxW="2xl" py="8" px={{ base: '4', sm: '6' }}>

        {/* Header */}
        <Box mb="6">
          <Heading size="3xl" color="brand.600" mb="1">Schedule an appointment</Heading>
          <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="3" />
          {loadingClinic ? (
            <Text fontSize="sm" color="gray.400">Loading…</Text>
          ) : clinic ? (
            <Text fontSize="md" color="gray.500">
              Share your availability with <Text as="span" fontWeight="semibold" color="gray.700">{clinic.name}</Text>
            </Text>
          ) : (
            <Text fontSize="md" color="gray.500">Share your availability with your clinic</Text>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack gap="6" align="stretch">

            {/* Timezone */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="1.5">Your timezone</Text>
              <NativeSelect.Root maxW="xs">
                <NativeSelect.Field
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  fontSize="sm"
                  bg="white"
                >
                  {TIMEZONES.includes(timezone)
                    ? null
                    : <option value={timezone}>{timezone}</option>}
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            {/* Slots */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="3">
                When are you available?{' '}
                <Text as="span" fontWeight="normal" color="gray.400">Add as many slots as you like.</Text>
              </Text>

              <VStack gap="3" align="stretch">
                {slots.map((slot, i) => (
                  <SlotRow
                    key={slot.id}
                    slot={slot}
                    index={i}
                    today={today}
                    canRemove={slots.length > 1}
                    errors={errors}
                    onChange={updateSlot}
                    onRemove={removeSlot}
                  />
                ))}
              </VStack>

              <Button
                variant="ghost"
                size="sm"
                color="brand.500"
                mt="3"
                onClick={addSlot}
                type="button"
              >
                + Add another time slot
              </Button>
            </Box>

            {/* Note */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="1.5">
                Message to clinic{' '}
                <Text as="span" fontWeight="normal" color="gray.400">(optional)</Text>
              </Text>
              <Textarea
                placeholder="Any preferences, questions, or context you'd like to share…"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                resize="none"
                fontSize="sm"
                bg="white"
              />
            </Box>

            {errors._form && (
              <Text color="red.500" fontSize="sm">{errors._form}</Text>
            )}

            <Flex gap="3" justify="flex-end">
              <Button
                variant="ghost" color="gray.400" type="button"
                onClick={() => router.push('/clinics/select')}
              >
                ← Back
              </Button>
              <Button colorPalette="orange" size="lg" type="submit" loading={loading} minW="40">
                Send availability
              </Button>
            </Flex>

          </VStack>
        </form>
      </Container>
    </SidebarLayout>
  )
}

// ---------------------------------------------------------------------------
// SlotRow
// ---------------------------------------------------------------------------
interface SlotRowProps {
  slot: Slot
  index: number
  today: string
  canRemove: boolean
  errors: Record<string, string>
  onChange: (id: string, field: keyof Omit<Slot, 'id'>, value: string) => void
  onRemove: (id: string) => void
}

function SlotRow({ slot, index, today, canRemove, errors, onChange, onRemove }: SlotRowProps) {
  const dateErr = errors[`${slot.id}_date`]
  const startErr = errors[`${slot.id}_start_time`]
  const endErr = errors[`${slot.id}_end_time`]
  const timeErr = errors[`${slot.id}_time`]

  return (
    <Box
      bg="white" borderRadius="xl" borderWidth="1px"
      borderColor={dateErr || startErr || endErr || timeErr ? 'red.300' : 'gray.200'}
      p="4"
    >
      <Flex align="center" gap="2" mb={timeErr ? '1' : '0'} wrap="wrap">
        <Text fontSize="xs" color="gray.400" fontWeight="medium" flexShrink={0} minW="14">
          Slot {index + 1}
        </Text>

        {/* Date */}
        <Box flex="1" minW="140px">
          <Input
            type="date"
            size="sm"
            value={slot.date}
            min={today}
            onChange={e => onChange(slot.id, 'date', e.target.value)}
            borderColor={dateErr ? 'red.400' : undefined}
            fontSize="sm"
          />
        </Box>

        <Text fontSize="xs" color="gray.400" flexShrink={0}>from</Text>

        {/* Start time */}
        <Box minW="110px">
          <Input
            type="time"
            size="sm"
            value={slot.start_time}
            onChange={e => onChange(slot.id, 'start_time', e.target.value)}
            borderColor={startErr || timeErr ? 'red.400' : undefined}
            fontSize="sm"
          />
        </Box>

        <Text fontSize="xs" color="gray.400" flexShrink={0}>to</Text>

        {/* End time */}
        <Box minW="110px">
          <Input
            type="time"
            size="sm"
            value={slot.end_time}
            onChange={e => onChange(slot.id, 'end_time', e.target.value)}
            borderColor={endErr || timeErr ? 'red.400' : undefined}
            fontSize="sm"
          />
        </Box>

        {/* Remove */}
        {canRemove && (
          <Box
            as="button"
            onClick={() => onRemove(slot.id)}
            color="gray.300"
            _hover={{ color: 'red.400' }}
            fontSize="lg"
            lineHeight="1"
            flexShrink={0}
            ml="1"
          >
            ×
          </Box>
        )}
      </Flex>

      {timeErr && <Text fontSize="xs" color="red.500" mt="1">{timeErr}</Text>}
      {!timeErr && (dateErr || startErr || endErr) && (
        <Text fontSize="xs" color="red.500" mt="1">Please fill in all fields for this slot</Text>
      )}
    </Box>
  )
}

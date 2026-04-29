'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import type { Clinic } from '@/lib/supabase/types'
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Grid,
  Button,
  Badge,
  NativeSelect,
  Textarea,
} from '@chakra-ui/react'

type SlotPair = [Clinic | null, Clinic | null]
type NotePair = [string, string]

// ---------------------------------------------------------------------------
// ProgressSteps
// ---------------------------------------------------------------------------
function ProgressSteps({ step, onNavigate }: { step: 1 | 2 | 3; onNavigate: (s: 1 | 2 | 3) => void }) {
  const steps = [
    { n: 1, label: "Amiga's Picks" },
    { n: 2, label: 'Compare' },
    { n: 3, label: 'Your Choice' },
  ]
  return (
    <Flex align="center">
      {steps.map((s, i) => {
        const isCompleted = step > s.n
        const isCurrent = step === s.n
        const isClickable = isCompleted
        return (
          <Flex key={s.n} align="center" flex={i < 2 ? '1' : undefined}>
            <Flex
              align="center" gap="2" flexShrink={0}
              cursor={isClickable ? 'pointer' : 'default'}
              onClick={isClickable ? () => onNavigate(s.n as 1 | 2 | 3) : undefined}
              _hover={isClickable ? { opacity: 0.75 } : undefined}
              role={isClickable ? 'button' : undefined}
            >
              <Box
                w="8" h="8" borderRadius="full"
                bg={step >= s.n ? 'brand.500' : 'gray.200'}
                color={step >= s.n ? 'white' : 'gray.400'}
                display="flex" alignItems="center" justifyContent="center"
                fontSize="sm" fontWeight="bold"
              >
                {isCompleted ? '✓' : String(s.n)}
              </Box>
              <Text
                fontSize="sm"
                fontWeight={isCurrent ? 'semibold' : 'normal'}
                color={step >= s.n ? 'brand.600' : 'gray.400'}
                whiteSpace="nowrap"
                textDecoration={isClickable ? 'underline' : undefined}
                textDecorationColor="brand.300"
              >
                {s.label}
              </Text>
            </Flex>
            {i < 2 && (
              <Box flex="1" h="2px" bg={step > s.n ? 'brand.500' : 'gray.200'} mx="4" minW="8" />
            )}
          </Flex>
        )
      })}
    </Flex>
  )
}

// ---------------------------------------------------------------------------
// ClinicCard
// ---------------------------------------------------------------------------
interface ClinicCardProps {
  clinic: Clinic
  note?: string
  isActive?: boolean
  badge?: string
  badgeColor?: string
  onSelect: () => void
  onRemove?: () => void
}

function ClinicCard({ clinic, note, isActive, badge, badgeColor = 'orange', onSelect, onRemove }: ClinicCardProps) {
  return (
    <Box
      position="relative"
      borderWidth="2px"
      borderColor={isActive ? 'brand.500' : 'gray.200'}
      borderRadius="xl"
      bg="white"
      p="4"
      cursor="pointer"
      _hover={{ shadow: 'md', borderColor: isActive ? 'brand.500' : 'purple.200' }}
      transition="all 0.15s"
      onClick={onSelect}
    >
      {badge && (
        <Badge colorPalette={badgeColor} fontSize="2xs" mb="2" display="inline-block">
          {badge}
        </Badge>
      )}
      {onRemove && (
        <Box
          position="absolute" top="2" right="2"
          as="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove() }}
          color="gray.400" _hover={{ color: 'red.500' }}
          fontSize="lg" lineHeight="1"
        >
          ×
        </Box>
      )}
      <Text fontWeight="semibold" color="brand.600" fontSize="sm" pr={onRemove ? '6' : '0'}>
        {clinic.name}
      </Text>
      {clinic.locations.length > 0 && (
        <Text fontSize="xs" color="gray.500" mt="0.5">📍 {clinic.locations[0]}</Text>
      )}
      {note && (
        <Text fontSize="xs" color="gray.600" mt="2" lineClamp={2} fontStyle="italic">{note}</Text>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// ClinicSlot — dropdown + optional note for patient-added clinics
// ---------------------------------------------------------------------------
interface ClinicSlotProps {
  allClinics: Clinic[]
  excludeIds: Set<string>
  amigaRecIds: Set<string>
  selectedClinic: Clinic | null
  savedNote: string
  onSelect: (clinic: Clinic) => void
  onRemove: () => void
  onNoteSave: (note: string) => void
}

function ClinicSlot({ allClinics, excludeIds, amigaRecIds, selectedClinic, savedNote, onSelect, onRemove, onNoteSave }: ClinicSlotProps) {
  const [note, setNote] = useState(savedNote)
  const prevClinicId = useRef(selectedClinic?.id)

  // Sync note when parent reloads saved state
  useEffect(() => { setNote(savedNote) }, [savedNote])

  // Reset note when a different clinic is picked
  useEffect(() => {
    if (selectedClinic?.id !== prevClinicId.current) {
      prevClinicId.current = selectedClinic?.id
      setNote(savedNote)
    }
  }, [selectedClinic?.id, savedNote])

  const available = allClinics.filter(c => !excludeIds.has(c.id) || c.id === selectedClinic?.id)

  return (
    <Box>
      <NativeSelect.Root>
        <NativeSelect.Field
          value={selectedClinic?.id ?? ''}
          onChange={(e) => {
            if (!e.target.value) {
              onRemove()
            } else {
              const clinic = allClinics.find(c => c.id === e.target.value)
              if (clinic) onSelect(clinic)
            }
          }}
          bg="white"
          fontSize="sm"
        >
          <option value="">Choose a clinic…</option>
          {available.map(c => (
            <option key={c.id} value={c.id} disabled={amigaRecIds.has(c.id)}>
              {c.name}{c.locations.length > 0 ? ` — ${c.locations[0]}` : ''}{amigaRecIds.has(c.id) ? ' (Amiga\'s pick)' : ''}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      {selectedClinic && (
        <Textarea
          size="sm"
          placeholder="Why this clinic? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onNoteSave(note)}
          mt="2"
          rows={2}
          resize="none"
          fontSize="xs"
        />
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// ClinicDetailPanel
// ---------------------------------------------------------------------------
interface ClinicDetailPanelProps {
  clinic: Clinic | null
  emptyMessage?: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}

function ClinicDetailPanel({ clinic, emptyMessage, action, secondaryAction }: ClinicDetailPanelProps) {
  if (!clinic) {
    return (
      <Box
        bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200"
        minH="360px" display="flex" alignItems="center" justifyContent="center" p="8"
      >
        <Text color="gray.400" textAlign="center" fontSize="sm">
          {emptyMessage ?? 'Click a clinic to see details'}
        </Text>
      </Box>
    )
  }

  return (
    <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200" overflow="hidden" shadow="sm">
      {clinic.photo_url ? (
        <img src={clinic.photo_url} alt={clinic.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
      ) : (
        <Box bg="orange.50" h="160px" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="3xl">🏥</Text>
        </Box>
      )}
      <Box p="5">
        <Heading size="lg" color="brand.600" mb="1">{clinic.name}</Heading>
        {clinic.locations.length > 0 && (
          <Text fontSize="sm" color="gray.500" mb="3">📍 {clinic.locations.join(' · ')}</Text>
        )}
        {clinic.description && (
          <Text fontSize="sm" color="gray.700" mb="4" lineHeight="tall">{clinic.description}</Text>
        )}
        <Flex wrap="wrap" gap="2" mb="4">
          {clinic.expertise.map(exp => (
            <Badge key={exp} colorPalette="purple" variant="subtle" px="2" py="0.5" fontSize="xs">{exp}</Badge>
          ))}
        </Flex>
        <Flex gap="5" mb="5">
          <Box>
            <Text fontSize="xs" color="gray.500">Experience</Text>
            <Text fontSize="sm" fontWeight="semibold">{clinic.years_experience} yrs</Text>
          </Box>
          {clinic.size && (
            <Box>
              <Text fontSize="xs" color="gray.500">Size</Text>
              <Text fontSize="sm" fontWeight="semibold">{clinic.size} staff</Text>
            </Box>
          )}
          {clinic.price_range && (
            <Box>
              <Text fontSize="xs" color="gray.500">Price</Text>
              <Badge colorPalette="orange" variant="subtle" fontSize="xs" textTransform="uppercase">
                {clinic.price_range}
              </Badge>
            </Box>
          )}
        </Flex>
        {action && (
          <Button colorPalette="orange" w="full" mb="2" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" size="sm" w="full" color="gray.400" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ClinicsSelectPage() {
  const router = useRouter()
  const [allClinics, setAllClinics] = useState<Clinic[]>([])
  const [patientSlots, setPatientSlots] = useState<SlotPair>([null, null])
  const [patientNotes, setPatientNotes] = useState<NotePair>(['', ''])
  const [amigaRecs, setAmigaRecs] = useState<SlotPair>([null, null])
  const [chosenClinic, setChosenClinic] = useState<Clinic | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(true)

  const deriveAmigaRecs = useCallback((clinics: Clinic[], slots: SlotPair): SlotPair => {
    const usedIds = new Set(slots.filter(Boolean).map(c => c!.id))
    const available = clinics.filter(c => !usedIds.has(c.id))
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return [shuffled[0] ?? null, shuffled[1] ?? null]
  }, [])

  useEffect(() => {
    async function load() {
      const [clinicsRes, selectionsRes] = await Promise.all([
        fetch('/api/clinics'),
        fetch('/api/clinics/selections'),
      ])

      const clinics: Clinic[] = clinicsRes.ok ? await clinicsRes.json() : []
      setAllClinics(clinics)

      if (selectionsRes.ok) {
        const { selections, confirmed_at } = await selectionsRes.json()
        const newPatientSlots: SlotPair = [null, null]
        const newNotes: NotePair = ['', '']
        let newChosenClinic: Clinic | null = null

        for (const sel of selections) {
          const clinic = clinics.find(c => c.id === sel.clinic_id) ?? null
          if (sel.selection_type === 'patient') {
            newPatientSlots[sel.slot_position - 1] = clinic
            newNotes[sel.slot_position - 1] = sel.note ?? ''
          } else if (sel.selection_type === 'downselection' && sel.slot_position === 1) {
            newChosenClinic = clinic
          }
        }

        setPatientSlots(newPatientSlots)
        setPatientNotes(newNotes)
        setChosenClinic(newChosenClinic)
        setAmigaRecs(deriveAmigaRecs(clinics, newPatientSlots))
        setConfirmed(!!confirmed_at)

        if (newChosenClinic) setStep(3)
      } else {
        setAmigaRecs(deriveAmigaRecs(clinics, [null, null]))
      }

      setLoading(false)
    }
    load()
  }, [deriveAmigaRecs])

  async function handlePatientSave(slotIndex: 0 | 1, clinic: Clinic, note: string) {
    const newSlots: SlotPair = [...patientSlots] as SlotPair
    const newNotes: NotePair = [...patientNotes] as NotePair
    newSlots[slotIndex] = clinic
    newNotes[slotIndex] = note

    await fetch('/api/clinics/selections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinic_id: clinic.id, selection_type: 'patient', slot_position: slotIndex + 1, note }),
    })

    setPatientSlots(newSlots)
    setPatientNotes(newNotes)

    if (amigaRecs.some(r => r?.id === clinic.id)) {
      setAmigaRecs(deriveAmigaRecs(allClinics, newSlots))
    }
  }

  async function handlePatientRemove(slotIndex: 0 | 1) {
    const newSlots: SlotPair = [...patientSlots] as SlotPair
    const newNotes: NotePair = [...patientNotes] as NotePair
    newSlots[slotIndex] = null
    newNotes[slotIndex] = ''

    await fetch('/api/clinics/selections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection_type: 'patient', slot_position: slotIndex + 1 }),
    })

    setPatientSlots(newSlots)
    setPatientNotes(newNotes)
    setAmigaRecs(deriveAmigaRecs(allClinics, newSlots))
  }

  async function handleNoteSave(slotIndex: 0 | 1, note: string) {
    const clinic = patientSlots[slotIndex]
    if (!clinic) return
    const newNotes: NotePair = [...patientNotes] as NotePair
    newNotes[slotIndex] = note
    setPatientNotes(newNotes)
    await fetch('/api/clinics/selections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinic_id: clinic.id, selection_type: 'patient', slot_position: slotIndex + 1, note }),
    })
  }

  async function handleChooseClinic(clinic: Clinic) {
    await fetch('/api/clinics/selections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinic_id: clinic.id, selection_type: 'downselection', slot_position: 1 }),
    })
    setChosenClinic(clinic)
    setStep(3)
  }

  async function handleConfirm() {
    await fetch('/api/clinics/confirm', { method: 'POST' })
    setConfirmed(true)
  }

  async function handleChangeChoice() {
    await Promise.all([
      fetch('/api/clinics/confirm', { method: 'DELETE' }),
      fetch('/api/clinics/selections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection_type: 'downselection', slot_position: 1 }),
      }),
    ])
    setConfirmed(false)
    setChosenClinic(null)
    setActiveClinic(null)
    setStep(2)
  }

  // Each slot excludes the clinic selected in the *other* slot
  const excludeForSlot = (slotIndex: 0 | 1): Set<string> =>
    new Set(patientSlots.filter((c, i) => c !== null && i !== slotIndex).map(c => c!.id))
  const allCandidates = [
    ...amigaRecs.filter((c): c is Clinic => c !== null).map(c => ({ clinic: c, source: 'amiga' as const })),
    ...patientSlots.filter((c): c is Clinic => c !== null).map((c, i) => ({ clinic: c, source: 'patient' as const, note: patientNotes[i] })),
  ]

  if (loading) {
    return (
      <SidebarLayout>
        <Container maxW="7xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="gray.500">Loading clinics…</Text>
        </Container>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>

        {/* Header */}
        <Box mb="2">
          <Heading size="3xl" color="brand.600" mb="1">Clinic Selection</Heading>
          <Text fontSize="md" color="gray.500">Find the right clinic for your fertility journey</Text>
        </Box>

        {/* Progress tracker */}
        <Box maxW="460px" my="6">
          <ProgressSteps step={step} onNavigate={(s) => { setActiveClinic(null); setStep(s) }} />
        </Box>

        {/* ── Step 1: Amiga's Picks ── */}
        {step === 1 && (
          <Box>
            <Heading size="lg" color="gray.800" mb="1">Amiga's recommendations</Heading>
            <Text fontSize="sm" color="gray.500" mb="6">
              Based on your top priorities, here are the two clinics Amiga suggests for you.
            </Text>

            {/* Amiga rec cards */}
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="5" mb="8">
              {amigaRecs.map((clinic, i) =>
                clinic ? (
                  <Box
                    key={clinic.id}
                    borderWidth="2px" borderColor="brand.200" borderRadius="xl"
                    bg="white" overflow="hidden" shadow="sm"
                  >
                    {clinic.photo_url ? (
                      <img src={clinic.photo_url} alt={clinic.name}
                        style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    ) : (
                      <Box bg="orange.50" h="100px" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="3xl">🏥</Text>
                      </Box>
                    )}
                    <Box p="4">
                      <Badge colorPalette="orange" fontSize="2xs" mb="2">Amiga's Pick</Badge>
                      <Text fontWeight="bold" color="brand.600" fontSize="md">{clinic.name}</Text>
                      {clinic.locations.length > 0 && (
                        <Text fontSize="xs" color="gray.500" mb="2">📍 {clinic.locations[0]}</Text>
                      )}
                      {clinic.price_range && (
                        <Badge colorPalette="orange" variant="subtle" fontSize="2xs" mr="1">
                          {clinic.price_range}
                        </Badge>
                      )}
                      {clinic.years_experience > 0 && (
                        <Badge colorPalette="gray" variant="subtle" fontSize="2xs">
                          {clinic.years_experience} yrs exp
                        </Badge>
                      )}
                      {clinic.description && (
                        <Text fontSize="xs" color="gray.600" mt="3" lineClamp={3} lineHeight="tall">
                          {clinic.description}
                        </Text>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box key={i} bg="gray.50" borderRadius="xl" h="220px"
                    borderWidth="1px" borderColor="gray.200" />
                )
              )}
            </Grid>

            {/* Patient's own additions */}
            <Box bg="gray.50" borderRadius="xl" p="5" borderWidth="1px" borderColor="gray.200" mb="8">
              <Text fontWeight="semibold" color="gray.700" mb="0.5">
                Have a clinic in mind?{' '}
                <Text as="span" fontWeight="normal" color="gray.400" fontSize="sm">(optional)</Text>
              </Text>
              <Text fontSize="sm" color="gray.500" mb="4">
                Add up to 2 clinics you'd like to include in the comparison.
              </Text>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                {([0, 1] as (0 | 1)[]).map((slotIndex) => (
                  <Box key={slotIndex}>
                    <Text fontSize="xs" color="gray.500" mb="1.5" fontWeight="medium">
                      Clinic {slotIndex + 1}
                    </Text>
                    <ClinicSlot
                      allClinics={allClinics}
                      excludeIds={excludeForSlot(slotIndex)}
                      amigaRecIds={new Set(amigaRecs.filter(Boolean).map(c => c!.id))}
                      selectedClinic={patientSlots[slotIndex]}
                      savedNote={patientNotes[slotIndex]}
                      onSelect={(clinic) => handlePatientSave(slotIndex, clinic, patientNotes[slotIndex])}
                      onRemove={() => handlePatientRemove(slotIndex)}
                      onNoteSave={(note) => handleNoteSave(slotIndex, note)}
                    />
                  </Box>
                ))}
              </Grid>
            </Box>

            <Button colorPalette="orange" size="lg" onClick={() => { setActiveClinic(null); setStep(2) }}>
              Review all options →
            </Button>
          </Box>
        )}

        {/* ── Step 2: Compare & Choose ── */}
        {step === 2 && (
          <Box>
            <Heading size="lg" color="gray.800" mb="1">Compare your options</Heading>
            <Text fontSize="sm" color="gray.500" mb="6">
              Click a clinic to see full details, then choose the one you want to move forward with.
            </Text>

            <Flex gap="8" align="flex-start">
              {/* Candidate grid */}
              <Box w={{ base: 'full', lg: '280px' }} flexShrink={0}>
                <Grid templateColumns="repeat(2, 1fr)" gap="3" mb="5">
                  {allCandidates.map(({ clinic, source }) => (
                    <ClinicCard
                      key={clinic.id}
                      clinic={clinic}
                      badge={source === 'amiga' ? "Amiga's pick" : 'Your pick'}
                      badgeColor={source === 'amiga' ? 'orange' : 'blue'}
                      isActive={activeClinic?.id === clinic.id}
                      onSelect={() => setActiveClinic(clinic)}
                    />
                  ))}
                  {allCandidates.length === 0 && (
                    <Box gridColumn="span 2" py="8" textAlign="center">
                      <Text color="gray.400" fontSize="sm">No clinics available.</Text>
                    </Box>
                  )}
                </Grid>
                <Button variant="ghost" size="sm" color="gray.400" onClick={() => { setActiveClinic(null); setStep(1) }}>
                  ← Back
                </Button>
              </Box>

              {/* Detail panel */}
              <Box flex="1" minW="0" position="sticky" top="8">
                <ClinicDetailPanel
                  clinic={activeClinic}
                  emptyMessage="Select a clinic on the left to see full details and choose it"
                  action={activeClinic ? {
                    label: `Choose ${activeClinic.name} →`,
                    onClick: () => handleChooseClinic(activeClinic),
                  } : undefined}
                />
              </Box>
            </Flex>
          </Box>
        )}

        {/* ── Step 3: Your Choice ── */}
        {step === 3 && (
          <Box>
            <Heading size="lg" color="gray.800" mb="1">Your choice</Heading>
            <Text fontSize="sm" color="gray.500" mb="6">
              {confirmed
                ? 'Your clinic is confirmed — time to schedule your first appointment.'
                : 'Review your selection and confirm when you\'re ready.'}
            </Text>

            {!confirmed && (
              <Button variant="ghost" size="sm" color="gray.400" mb="4"
                onClick={() => { setActiveClinic(null); setStep(2) }}
              >
                ← Back to compare
              </Button>
            )}

            <Flex gap="8" align="flex-start">
              {/* Detail panel */}
              <Box flex="1" maxW="520px">
                <ClinicDetailPanel
                  clinic={chosenClinic}
                  emptyMessage="No clinic selected yet"
                  action={chosenClinic ? (confirmed ? {
                    label: 'Schedule Appointments',
                    onClick: () => router.push('/appointments/schedule'),
                  } : {
                    label: 'Confirm my choice',
                    onClick: handleConfirm,
                  }) : undefined}
                  secondaryAction={chosenClinic && !confirmed ? {
                    label: '← Change my choice',
                    onClick: handleChangeChoice,
                  } : undefined}
                />
              </Box>

              {/* Summary sidebar */}
              {chosenClinic && (
                <Box
                  bg="orange.50" borderRadius="xl" p="5"
                  w={{ base: 'full', lg: '200px' }} flexShrink={0}
                  borderWidth="1px" borderColor="orange.200"
                >
                  <Text fontSize="xs" color="gray.500" mb="3" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                    Your selection
                  </Text>
                  <Text fontWeight="bold" color="brand.600" mb="0.5">{chosenClinic.name}</Text>
                  {chosenClinic.locations.length > 0 && (
                    <Text fontSize="xs" color="gray.500">📍 {chosenClinic.locations[0]}</Text>
                  )}
                  {chosenClinic.price_range && (
                    <Badge colorPalette="orange" variant="subtle" fontSize="2xs" mt="2" display="block">
                      {chosenClinic.price_range}
                    </Badge>
                  )}

                  <Box mt="5" pt="4" borderTopWidth="1px" borderColor="orange.200">
                    {confirmed ? (
                      <Flex align="center" gap="2">
                        <Text fontSize="xs" color="green.600" fontWeight="semibold">✓ Confirmed</Text>
                      </Flex>
                    ) : (
                      <Text fontSize="xs" color="gray.400">Pending confirmation</Text>
                    )}
                  </Box>

                  {confirmed && (
                    <Button
                      size="xs" variant="ghost" color="gray.400" mt="3" w="full"
                      onClick={handleChangeChoice}
                    >
                      Change
                    </Button>
                  )}
                </Box>
              )}
            </Flex>
          </Box>
        )}
      </Container>
    </SidebarLayout>
  )
}

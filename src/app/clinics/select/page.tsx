'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import type { Clinic } from '@/lib/supabase/types'
import { supabase } from '@/lib/supabase/client'
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Grid,
  Separator,
  Textarea,
  Button,
  Badge,
  Input,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SlotPair = [Clinic | null, Clinic | null]
type NotePair = [string, string]

// ---------------------------------------------------------------------------
// ClinicCard
// ---------------------------------------------------------------------------
interface ClinicCardProps {
  clinic: Clinic
  note?: string
  isActive: boolean
  isDraggable?: boolean
  onSelect: () => void
  onRemove?: () => void
}

function ClinicCard({ clinic, note, isActive, isDraggable = false, onSelect, onRemove }: ClinicCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `clinic-${clinic.id}`,
    disabled: !isDraggable,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined

  return (
    <Box
      ref={setNodeRef}
      style={style}
      position="relative"
      borderWidth="2px"
      borderColor={isActive ? 'purple.400' : 'gray.200'}
      borderRadius="lg"
      bg="white"
      p="3"
      cursor={isDraggable ? 'grab' : 'pointer'}
      opacity={isDragging ? 0.5 : 1}
      _hover={{ shadow: 'md', borderColor: isActive ? 'purple.400' : 'purple.200' }}
      transition="all 0.15s"
      onClick={onSelect}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
    >
      {onRemove && (
        <Box
          position="absolute"
          top="2"
          right="2"
          as="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove() }}
          color="gray.400"
          _hover={{ color: 'red.500' }}
          fontSize="lg"
          lineHeight="1"
          zIndex={1}
        >
          ×
        </Box>
      )}
      <Text fontWeight="semibold" fontSize="sm" color="brand.600" pr={onRemove ? '6' : '0'}>
        {clinic.name}
      </Text>
      {clinic.locations.length > 0 && (
        <Text fontSize="xs" color="gray.500" mt="0.5">
          📍 {clinic.locations[0]}
        </Text>
      )}
      {note && (
        <Text
          fontSize="xs"
          color="gray.600"
          mt="1"
          lineClamp={2}
          fontStyle="italic"
        >
          {note}
        </Text>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// EmptySlot
// ---------------------------------------------------------------------------
interface EmptySlotProps {
  onClick: () => void
}

function EmptySlot({ onClick }: EmptySlotProps) {
  return (
    <Box
      borderWidth="2px"
      borderStyle="dashed"
      borderColor="gray.300"
      borderRadius="lg"
      p="6"
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      _hover={{ borderColor: 'purple.400', bg: 'purple.50' }}
      transition="all 0.15s"
      onClick={onClick}
      minH="80px"
    >
      <Text fontSize="2xl" color="gray.400">+</Text>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// DropSlot
// ---------------------------------------------------------------------------
interface DropSlotProps {
  id: string
  clinic: Clinic | null
  isActive: boolean
  onRemove: () => void
  onSelect: () => void
}

function DropSlot({ id, clinic, isActive, onRemove, onSelect }: DropSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  if (clinic) {
    return (
      <Box
        ref={setNodeRef}
        borderWidth="2px"
        borderColor={isActive ? 'purple.400' : 'purple.200'}
        borderRadius="lg"
        bg={isOver ? 'purple.50' : 'white'}
        p="3"
        position="relative"
        cursor="pointer"
        _hover={{ shadow: 'sm' }}
        transition="all 0.15s"
        onClick={onSelect}
      >
        <Box
          position="absolute"
          top="2"
          right="2"
          as="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemove() }}
          color="gray.400"
          _hover={{ color: 'red.500' }}
          fontSize="lg"
          lineHeight="1"
        >
          ×
        </Box>
        <Text fontWeight="semibold" fontSize="sm" color="brand.600" pr="6">
          {clinic.name}
        </Text>
        {clinic.locations.length > 0 && (
          <Text fontSize="xs" color="gray.500" mt="0.5">
            📍 {clinic.locations[0]}
          </Text>
        )}
      </Box>
    )
  }

  return (
    <Box
      ref={setNodeRef}
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={isOver ? 'purple.400' : 'gray.300'}
      borderRadius="lg"
      p="6"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={isOver ? 'purple.50' : 'transparent'}
      transition="all 0.15s"
      minH="70px"
    >
      <Text fontSize="sm" color="gray.400">Drop a clinic here</Text>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// ClinicPicker (inline)
// ---------------------------------------------------------------------------
interface ClinicPickerProps {
  allClinics: Clinic[]
  excludeIds: Set<string>
  onSave: (clinic: Clinic, note: string) => void
  onCancel: () => void
}

function ClinicPicker({ allClinics, excludeIds, onSave, onCancel }: ClinicPickerProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Clinic | null>(null)
  const [note, setNote] = useState('')

  const filtered = allClinics.filter(
    c => !excludeIds.has(c.id) && c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Box
      borderWidth="2px"
      borderColor="purple.300"
      borderRadius="lg"
      bg="white"
      p="3"
      shadow="md"
    >
      <Input
        size="sm"
        placeholder="Search clinics…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb="2"
      />
      <Box maxH="180px" overflowY="auto" mb="3">
        {filtered.length === 0 ? (
          <Text fontSize="xs" color="gray.500" textAlign="center" py="4">No clinics available</Text>
        ) : (
          filtered.map(c => (
            <Box
              key={c.id}
              px="3"
              py="2"
              cursor="pointer"
              borderRadius="md"
              bg={selected?.id === c.id ? 'purple.100' : 'transparent'}
              _hover={{ bg: selected?.id === c.id ? 'purple.100' : 'gray.50' }}
              onClick={() => setSelected(c)}
            >
              <Text fontSize="sm" fontWeight={selected?.id === c.id ? 'semibold' : 'normal'}>
                {c.name}
              </Text>
              {c.locations.length > 0 && (
                <Text fontSize="xs" color="gray.500">📍 {c.locations[0]}</Text>
              )}
            </Box>
          ))
        )}
      </Box>
      <Textarea
        size="sm"
        rows={2}
        placeholder="Why this clinic? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        mb="3"
        resize="none"
      />
      <Flex gap="2" justify="flex-end">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          colorPalette="purple"
          disabled={!selected}
          onClick={() => selected && onSave(selected, note)}
        >
          Save
        </Button>
      </Flex>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// ClinicDetailPanel
// ---------------------------------------------------------------------------
interface ClinicDetailPanelProps {
  clinic: Clinic | null
  confirmed: boolean
}

function ClinicDetailPanel({ clinic, confirmed }: ClinicDetailPanelProps) {
  const router = useRouter()

  if (!clinic) {
    return (
      <Box
        bg="gray.100"
        borderRadius="xl"
        minH="400px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p="8"
      >
        <Text color="gray.500" textAlign="center">
          Click a clinic card to see details
        </Text>
      </Box>
    )
  }

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
      shadow="sm"
    >
      {/* Photo */}
      {clinic.photo_url ? (
        <img
          src={clinic.photo_url}
          alt={clinic.name}
          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
        />
      ) : (
        <Box bg="gray.100" h="200px" display="flex" alignItems="center" justifyContent="center">
          <Text color="gray.400" fontSize="sm">No photo available</Text>
        </Box>
      )}

      <Box p="5">
        <Heading size="lg" color="brand.600" mb="1">
          {clinic.name}
        </Heading>
        {clinic.locations.length > 0 && (
          <Text fontSize="sm" color="gray.500" mb="4">
            📍 {clinic.locations.join(' · ')}
          </Text>
        )}

        {clinic.description && (
          <Text fontSize="sm" color="gray.700" mb="4" lineHeight="tall">
            {clinic.description}
          </Text>
        )}

        <Flex wrap="wrap" gap="2" mb="4">
          {clinic.expertise.map(exp => (
            <Badge key={exp} colorPalette="purple" variant="subtle" px="2" py="0.5" fontSize="xs">
              {exp}
            </Badge>
          ))}
        </Flex>

        <Flex gap="4" mb="4">
          <Box>
            <Text fontSize="xs" color="gray.500">Experience</Text>
            <Text fontSize="sm" fontWeight="semibold">{clinic.years_experience} years</Text>
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

        {confirmed && (
          <Button
            colorPalette="orange"
            w="full"
            onClick={() => router.push('/appointments/start')}
          >
            Appointments
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
  const [allClinics, setAllClinics] = useState<Clinic[]>([])
  const [patientSlots, setPatientSlots] = useState<SlotPair>([null, null])
  const [patientNotes, setPatientNotes] = useState<NotePair>(['', ''])
  const [amigaRecs, setAmigaRecs] = useState<SlotPair>([null, null])
  const [downselection, setDownselection] = useState<SlotPair>([null, null])
  const [confirmed, setConfirmed] = useState(false)
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null)
  const [addingSlot, setAddingSlot] = useState<1 | 2 | null>(null)
  const [loading, setLoading] = useState(true)

  // Derive Amiga recs: 2 random clinics not in patient slots
  const deriveAmigaRecs = useCallback((clinics: Clinic[], slots: SlotPair): SlotPair => {
    const usedIds = new Set(slots.filter(Boolean).map(c => c!.id))
    const available = clinics.filter(c => !usedIds.has(c.id))
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return [shuffled[0] ?? null, shuffled[1] ?? null]
  }, [])

  // Load data on mount
  useEffect(() => {
    async function load() {
      const [clinicsRes, selectionsRes] = await Promise.all([
        supabase.from('clinics').select('*').order('name'),
        fetch('/api/clinics/selections'),
      ])

      const clinics: Clinic[] = clinicsRes.data ?? []
      setAllClinics(clinics)

      if (selectionsRes.ok) {
        const { selections, confirmed_at } = await selectionsRes.json()
        setConfirmed(!!confirmed_at)

        const newPatientSlots: SlotPair = [null, null]
        const newNotes: NotePair = ['', '']
        const newDownselection: SlotPair = [null, null]

        for (const sel of selections) {
          const clinic = clinics.find(c => c.id === sel.clinic_id) ?? null
          if (sel.selection_type === 'patient') {
            newPatientSlots[sel.slot_position - 1] = clinic
            newNotes[sel.slot_position - 1] = sel.note ?? ''
          } else if (sel.selection_type === 'downselection') {
            newDownselection[sel.slot_position - 1] = clinic
          }
        }

        setPatientSlots(newPatientSlots)
        setPatientNotes(newNotes)
        setDownselection(newDownselection)
        setAmigaRecs(deriveAmigaRecs(clinics, newPatientSlots))
      } else {
        setAmigaRecs(deriveAmigaRecs(clinics, [null, null]))
      }

      setLoading(false)
    }
    load()
  }, [deriveAmigaRecs])

  // Handlers
  async function handlePatientSave(slotIndex: 0 | 1, clinic: Clinic, note: string) {
    const newSlots: SlotPair = [...patientSlots] as SlotPair
    const newNotes: NotePair = [...patientNotes] as NotePair
    newSlots[slotIndex] = clinic
    newNotes[slotIndex] = note

    await fetch('/api/clinics/selections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinic.id,
        selection_type: 'patient',
        slot_position: slotIndex + 1,
        note,
      }),
    })

    setPatientSlots(newSlots)
    setPatientNotes(newNotes)
    setAddingSlot(null)

    // Re-derive recs if new clinic was an Amiga rec
    const wasRec = amigaRecs.some(r => r?.id === clinic.id)
    if (wasRec) {
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

  async function handleDownselectionRemove(slotIndex: 0 | 1) {
    const newDown: SlotPair = [...downselection] as SlotPair
    newDown[slotIndex] = null

    await fetch('/api/clinics/selections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection_type: 'downselection', slot_position: slotIndex + 1 }),
    })

    setDownselection(newDown)
    if (confirmed) {
      await fetch('/api/clinics/confirm', { method: 'DELETE' })
      setConfirmed(false)
    }
  }

  async function handleConfirm() {
    await fetch('/api/clinics/confirm', { method: 'POST' })
    setConfirmed(true)
  }

  async function handleUnconfirm() {
    await fetch('/api/clinics/confirm', { method: 'DELETE' })
    setConfirmed(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const clinicId = String(active.id).replace('clinic-', '')
    const slotIndex = over.id === 'downslot-1' ? 0 : 1
    const clinic = allClinics.find(c => c.id === clinicId) ?? null
    if (!clinic) return

    const newDown: SlotPair = [...downselection] as SlotPair
    newDown[slotIndex] = clinic
    setDownselection(newDown)

    if (confirmed) {
      fetch('/api/clinics/confirm', { method: 'DELETE' })
      setConfirmed(false)
    }

    fetch('/api/clinics/selections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinic.id,
        selection_type: 'downselection',
        slot_position: slotIndex + 1,
      }),
    })
  }

  const patientExcludeIds = new Set(patientSlots.filter(Boolean).map(c => c!.id))
  const bothSlotsForPicker = new Set([
    ...patientSlots.filter(Boolean).map(c => c!.id),
  ])
  const downBothFilled = downselection[0] !== null && downselection[1] !== null

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
        <Box mb="8">
          <Heading size="3xl" color="brand.600" mb="2">
            Choose Your Clinics
          </Heading>
          <Text fontSize="md" color="gray.600">
            Select up to 2 preferred clinics, review our recommendations, and confirm your top 2.
          </Text>
          <Separator width="24" borderColor="purple.500" borderWidth="2px" mt="4" />
        </Box>

        <DndContext onDragEnd={handleDragEnd}>
          <Flex gap="8" align="flex-start">
            {/* Left column */}
            <Box flexShrink={0} w={{ base: 'full', lg: '420px' }}>

              {/* Section 1: Patient clinics */}
              <Box mb="8">
                <Heading size="md" color="gray.700" mb="3">
                  Your clinics <Text as="span" fontSize="sm" fontWeight="normal" color="gray.500">(optional)</Text>
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap="3">
                  {([0, 1] as (0 | 1)[]).map((slotIndex) => {
                    const clinic = patientSlots[slotIndex]
                    const note = patientNotes[slotIndex]
                    const slotNum = (slotIndex + 1) as 1 | 2

                    if (addingSlot === slotNum) {
                      return (
                        <ClinicPicker
                          key={slotIndex}
                          allClinics={allClinics}
                          excludeIds={bothSlotsForPicker}
                          onSave={(c, n) => handlePatientSave(slotIndex, c, n)}
                          onCancel={() => setAddingSlot(null)}
                        />
                      )
                    }

                    if (clinic) {
                      return (
                        <ClinicCard
                          key={clinic.id}
                          clinic={clinic}
                          note={note}
                          isActive={activeClinic?.id === clinic.id}
                          isDraggable
                          onSelect={() => setActiveClinic(clinic)}
                          onRemove={() => handlePatientRemove(slotIndex)}
                        />
                      )
                    }

                    return (
                      <EmptySlot key={slotIndex} onClick={() => setAddingSlot(slotNum)} />
                    )
                  })}
                </Grid>
              </Box>

              {/* Section 2: Amiga recs */}
              <Box mb="8">
                <Heading size="md" color="gray.700" mb="3">
                  Amiga clinic recommendations
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap="3">
                  {amigaRecs.map((clinic, i) =>
                    clinic ? (
                      <ClinicCard
                        key={clinic.id}
                        clinic={clinic}
                        note={clinic.description?.slice(0, 80) ?? ''}
                        isActive={activeClinic?.id === clinic.id}
                        isDraggable
                        onSelect={() => setActiveClinic(clinic)}
                      />
                    ) : (
                      <Box
                        key={i}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p="3"
                        bg="gray.50"
                        minH="70px"
                      />
                    )
                  )}
                </Grid>
              </Box>

              {/* Section 3: Downselection */}
              <Box>
                <Heading size="md" color="gray.700" mb="3">
                  Your downselection
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap="3" mb="4">
                  {([0, 1] as (0 | 1)[]).map((slotIndex) => (
                    <DropSlot
                      key={slotIndex}
                      id={`downslot-${slotIndex + 1}`}
                      clinic={downselection[slotIndex]}
                      isActive={activeClinic?.id === downselection[slotIndex]?.id}
                      onRemove={() => handleDownselectionRemove(slotIndex)}
                      onSelect={() => {
                        const c = downselection[slotIndex]
                        if (c) setActiveClinic(c)
                      }}
                    />
                  ))}
                </Grid>

                {downBothFilled && !confirmed && (
                  <Button
                    colorPalette="purple"
                    w="full"
                    onClick={handleConfirm}
                  >
                    Confirm selection
                  </Button>
                )}

                {confirmed && (
                  <Flex align="center" gap="3">
                    <Badge colorPalette="green" px="3" py="1.5" fontSize="sm" borderRadius="md">
                      Confirmed ✓
                    </Badge>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="gray"
                      onClick={handleUnconfirm}
                    >
                      Change
                    </Button>
                  </Flex>
                )}
              </Box>
            </Box>

            {/* Right column: detail panel */}
            <Box flex="1" minW="0" position="sticky" top="8">
              <ClinicDetailPanel clinic={activeClinic} confirmed={confirmed} />
            </Box>
          </Flex>
        </DndContext>
      </Container>
    </SidebarLayout>
  )
}

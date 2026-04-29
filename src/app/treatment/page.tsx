'use client'

import { useEffect, useMemo, useState } from 'react'
import SidebarLayout from '@/components/layouts/SidebarLayout'
import { Card } from '@/components/ui/card'
import {
  Box, Button, Container, Flex, Grid, Heading, Separator, Text, VStack,
} from '@chakra-ui/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TreatmentEvent = {
  id: string
  date: string
  task: string
  goal: string | null
  detail: string | null
  event_type: 'medication' | 'injection' | 'clinic' | 'trigger' | 'retrieval' | 'other'
  sort_order: number
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------
function getMondayOf(date: Date): Date {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}
function getSundayOf(date: Date): Date {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day))
  return d
}
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function generateWeeks(start: Date, end: Date): Date[][] {
  const weeks: Date[][] = []
  const cur = new Date(start)
  while (cur <= end) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    weeks.push(week)
  }
  return weeks
}
function fmtMonthDay(ds: string): string {
  return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Event icons
// ---------------------------------------------------------------------------
const EVENT_ICONS: Record<string, string> = {
  medication: '○', injection: '∖', clinic: '+',
  trigger: '∖', retrieval: '★', other: '·',
}
function getIcons(events: TreatmentEvent[]): string[] {
  const seen = new Set<string>()
  return events.sort((a, b) => a.sort_order - b.sort_order).reduce<string[]>((acc, e) => {
    if (!seen.has(e.event_type)) { seen.add(e.event_type); acc.push(EVENT_ICONS[e.event_type] ?? '·') }
    return acc
  }, [])
}

// ---------------------------------------------------------------------------
// DayCell
// ---------------------------------------------------------------------------
function DayCell({ date, events, isSelected, onSelect }: {
  date: Date; events: TreatmentEvent[]; isSelected: boolean; onSelect: (d: string) => void
}) {
  const ds = toDateStr(date)
  const icons = getIcons(events)
  const hasEvents = events.length > 0
  return (
    <Box
      position="relative" minH="52px" p="1"
      bg="white"
      borderWidth={isSelected ? '2px' : '1px'}
      borderColor={isSelected ? 'purple.500' : 'gray.200'}
      cursor={hasEvents ? 'pointer' : 'default'}
      onClick={() => hasEvents && onSelect(ds)}
      transition="border-color 0.1s"
      _hover={hasEvents && !isSelected ? { borderColor: 'brand.300' } : {}}
    >
      <Text fontSize="10px" color="gray.500" lineHeight="1" textAlign="right" pr="1">
        {date.getDate()}
      </Text>
      {icons.length > 0 && (
        <Flex position="absolute" bottom="3px" left="3px" gap="2px">
          {icons.map((icon, i) => (
            <Text key={i} fontSize="9px" lineHeight="1" color="brand.500" fontWeight="bold">{icon}</Text>
          ))}
        </Flex>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// CalendarGrid — one month at a time with prev/next navigation
// ---------------------------------------------------------------------------
function CalendarGrid({ events, selectedDate, onSelect }: {
  events: TreatmentEvent[]; selectedDate: string | null; onSelect: (d: string) => void
}) {
  const eventMap = useMemo(() => {
    const m: Record<string, TreatmentEvent[]> = {}
    events.forEach(e => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e) })
    return m
  }, [events])

  // Derive available months from events
  const months = useMemo(() => {
    const keys = [...new Set(events.map(e => e.date.slice(0, 7)))].sort()
    return keys // ['2026-03', '2026-04', ...]
  }, [events])

  const [monthIdx, setMonthIdx] = useState(0)

  // When events load, jump to the month of the selected date
  useEffect(() => {
    if (selectedDate) {
      const key = selectedDate.slice(0, 7)
      const idx = months.indexOf(key)
      if (idx >= 0) setMonthIdx(idx)
    }
  }, [months.join(',')])

  if (months.length === 0) return null

  const currentKey = months[monthIdx] // e.g. '2026-04'
  const [year, month] = currentKey.split('-').map(Number)
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  // Weeks for this month only
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const weeks = generateWeeks(getMondayOf(firstDay), getSundayOf(lastDay))

  return (
    <Box>
      {/* Month navigation */}
      <Flex align="center" justify="space-between" mb="3">
        <Button size="sm" variant="ghost" color="gray.500"
          disabled={monthIdx === 0}
          onClick={() => setMonthIdx(i => i - 1)}
        >
          ← Prev
        </Button>
        <Text fontWeight="semibold" color="brand.600">{monthName}</Text>
        <Button size="sm" variant="ghost" color="gray.500"
          disabled={monthIdx === months.length - 1}
          onClick={() => setMonthIdx(i => i + 1)}
        >
          Next →
        </Button>
      </Flex>

      <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        {/* Day headers */}
        <Grid templateColumns="repeat(7, 1fr)" bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
          {['M', 'T', 'W', 'R', 'F', 'S', 'D'].map(h => (
            <Box key={h} textAlign="center" py="2">
              <Text fontSize="xs" color="gray.500" fontWeight="semibold">{h}</Text>
            </Box>
          ))}
        </Grid>

        {/* Week rows */}
        <Flex flexDirection="column">
          {weeks.map((week, wi) => {
            const cells: React.ReactNode[] = []
            week.forEach((day, i) => {
              const ds = toDateStr(day)
              const inMonth = day.getMonth() + 1 === month && day.getFullYear() === year
              cells.push(
                <Box key={ds} position="relative" minH="52px" p="1"
                  bg={inMonth ? 'white' : 'gray.50'}
                  borderWidth={selectedDate === ds ? '2px' : '1px'}
                  borderColor={selectedDate === ds ? 'purple.500' : 'gray.200'}
                  cursor={inMonth && (eventMap[ds]?.length > 0) ? 'pointer' : 'default'}
                  onClick={() => inMonth && eventMap[ds]?.length > 0 && onSelect(ds)}
                  _hover={inMonth && eventMap[ds]?.length > 0 && selectedDate !== ds ? { borderColor: 'brand.300' } : {}}
                >
                  <Text fontSize="10px" color={inMonth ? 'gray.500' : 'gray.300'} lineHeight="1" textAlign="right" pr="1">
                    {day.getDate()}
                  </Text>
                  {inMonth && (eventMap[ds]?.length > 0) && (
                    <Flex position="absolute" bottom="3px" left="3px" gap="2px">
                      {getIcons(eventMap[ds]).map((icon, k) => (
                        <Text key={k} fontSize="9px" lineHeight="1" color="brand.500" fontWeight="bold">{icon}</Text>
                      ))}
                    </Flex>
                  )}
                </Box>
              )
            })
            return (
              <Grid key={wi} templateColumns="repeat(7, 1fr)"
                borderTopWidth={wi > 0 ? '1px' : '0'} borderColor="gray.200">
                {cells}
              </Grid>
            )
          })}
        </Flex>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// TaskPanel
// ---------------------------------------------------------------------------
function TaskPanel({ date, events }: { date: string; events: TreatmentEvent[] }) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb="2">{fmtMonthDay(date)}</Text>
      <Card.Root bg="white" borderWidth="1px" borderColor="purple.200" overflow="hidden">
        {/* Header */}
        <Grid templateColumns="2fr 2fr 2fr" bg="brand.600">
          {['Task', 'Goal', 'Detail'].map(h => (
            <Box key={h} px="3" py="2" borderRightWidth="1px" borderColor="whiteAlpha.300"
              _last={{ borderRight: 'none' }}>
              <Text fontSize="xs" fontWeight="bold" color="white">{h}</Text>
            </Box>
          ))}
        </Grid>
        {/* Rows */}
        {events.map((e, i) => (
          <Grid key={e.id} templateColumns="2fr 2fr 2fr"
            bg={i % 2 === 0 ? 'white' : 'gray.50'}
            borderTopWidth="1px" borderColor="gray.200"
          >
            <Box px="3" py="2" borderRightWidth="1px" borderColor="gray.200">
              <Flex align="flex-start" gap="1">
                <Text fontSize="xs" color="brand.500" fontWeight="bold">{EVENT_ICONS[e.event_type] ?? '·'}</Text>
                <Text fontSize="xs" color="gray.800" fontWeight="semibold" lineHeight="tall">{e.task}</Text>
              </Flex>
            </Box>
            <Box px="3" py="2" borderRightWidth="1px" borderColor="gray.200">
              <Text fontSize="xs" color="gray.600" lineHeight="tall">{e.goal ?? '—'}</Text>
            </Box>
            <Box px="3" py="2">
              <Text fontSize="xs" color="gray.600" lineHeight="tall">{e.detail ?? '—'}</Text>
            </Box>
          </Grid>
        ))}
        {events.length === 0 && (
          <Box px="4" py="4">
            <Text fontSize="xs" color="gray.400">No tasks for this day</Text>
          </Box>
        )}
      </Card.Root>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function TreatmentPage() {
  const [events, setEvents] = useState<TreatmentEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/treatment/events').then(r => r.json()).then(data => {
      if (data.events?.length > 0) {
        setEvents(data.events)
        setGeneratedAt(data.generatedAt)
        setSelectedDate(data.events[0].date)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/treatment/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setEvents(data.events)
      setGeneratedAt(data.generatedAt)
      if (data.events.length > 0) setSelectedDate(data.events[0].date)
    } catch { setError('Generation failed. Please try again.') }
    finally { setGenerating(false) }
  }

  const selectedEvents = useMemo(
    () => selectedDate ? events.filter(e => e.date === selectedDate).sort((a, b) => a.sort_order - b.sort_order) : [],
    [events, selectedDate]
  )

  if (loading) {
    return (
      <SidebarLayout>
        <Container maxW="7xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>
          <Text color="gray.500">Loading…</Text>
        </Container>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <Container maxW="7xl" py="8" px={{ base: '4', sm: '6', lg: '8' }}>

        {/* Header */}
        <Box mb="8">
          <Heading size="3xl" color="brand.600" mb="1">Treatment</Heading>
          <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="3" />
          <Flex align="center" gap="3" wrap="wrap">
            {generatedAt && (
              <Text fontSize="sm" color="gray.500">
                <Text as="span" fontWeight="semibold">Generated</Text> · Updated {fmtDate(generatedAt)}
              </Text>
            )}
            <Button size="sm" colorPalette="orange" variant="outline"
              onClick={handleGenerate} loading={generating}>
              {events.length > 0 ? 'Regenerate' : 'Generate treatment plan'}
            </Button>
            {error && <Text fontSize="xs" color="red.500">{error}</Text>}
          </Flex>
        </Box>

        {events.length === 0 ? (
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Text color="gray.500" fontSize="sm">
                No treatment plan yet. Click "Generate treatment plan" to extract events from your appointment transcript.
              </Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Flex gap="8" align="flex-start" wrap="wrap">
            {/* Calendar */}
            <Box flex="1" minW="360px" maxW="520px">
              <CalendarGrid events={events} selectedDate={selectedDate} onSelect={setSelectedDate} />
            </Box>

            {/* Task panel */}
            {selectedDate && (
              <Box flex="1" minW="300px">
                <TaskPanel date={selectedDate} events={selectedEvents} />
              </Box>
            )}
          </Flex>
        )}

      </Container>
    </SidebarLayout>
  )
}

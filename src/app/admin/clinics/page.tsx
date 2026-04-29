'use client'

import { useEffect, useState } from 'react'
import AdminSidebarLayout from '@/components/layouts/AdminSidebarLayout'
import {
  Box, Button, Container, DialogBackdrop, DialogBody, DialogCloseTrigger,
  DialogContent, DialogHeader, DialogPositioner, DialogRoot, DialogTitle,
  Flex, Grid, Heading, Input, NativeSelect, Separator, Text, Textarea, VStack,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import type { Clinic } from '@/lib/supabase/types'

const SPECIALTY_OPTIONS = [
  'IVF', 'IUI', 'Egg Freezing', 'Embryo Freezing', 'ICSI',
  'Genetic Testing (PGT)', 'Egg Donation', 'Sperm Donation',
  'Embryo Donation', 'Surrogacy', 'Fertility Assessment',
  'Diminished Ovarian Reserve (DOR)', 'Low AMH', 'Fertility Preservation',
]

const BLANK_CLINIC = {
  name: '', website: '', phone: '', email: '',
  city: '', country: 'Spain', address: '',
  years_experience: '', size: '', price_range: 'med' as Clinic['price_range'],
  expertise: [] as string[],
  description: '',
  contact_name: '', contact_email: '', contact_phone: '',
  internal_notes: '',
  status: 'active',
}

function OnboardClinicModal({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: (c: Clinic) => void
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...BLANK_CLINIC })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(name: string, val: string) { setForm(prev => ({ ...prev, [name]: val })) }
  function toggleSpecialty(s: string) {
    setForm(prev => ({
      ...prev,
      expertise: prev.expertise.includes(s)
        ? prev.expertise.filter(x => x !== s)
        : [...prev.expertise, s],
    }))
  }

  async function handleSubmit() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          locations: form.city ? [form.city] : [],
          years_experience: Number(form.years_experience) || 0,
          size: form.size ? Number(form.size) : null,
          expertise: form.expertise,
          description: form.description || null,
          price_range: form.price_range || null,
          website: form.website || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          internal_notes: form.internal_notes || null,
          status: form.status,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create clinic'); return }
      onAdded(data.clinic)
      onClose()
    } catch { setError('Failed to create clinic') }
    finally { setSaving(false) }
  }

  const priceOpts = [
    { value: 'low', label: 'Low' }, { value: 'med', label: 'Medium' },
    { value: 'med-high', label: 'Medium-High' }, { value: 'high', label: 'High' },
  ]
  const statusOpts = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending review' },
    { value: 'inactive', label: 'Inactive' },
  ]
  const stepLabels = ['Clinic Info', 'Specialties', 'Contact']
  const canContinue = !!form.name && !!form.city

  function LabeledInput({ label, name, type = 'text' }: { label: string; name: string; type?: string }) {
    return (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">{label}</Text>
        <Input size="sm" type={type} value={(form as any)[name]} onChange={e => set(name, e.target.value)} bg="white" fontSize="sm" />
      </Box>
    )
  }
  function LabeledSelect({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
    return (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">{label}</Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field value={(form as any)[name]} onChange={e => set(name, e.target.value)} bg="white" fontSize="sm">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>
    )
  }

  return (
    <DialogRoot open onOpenChange={({ open }) => !open && onClose()} size="lg">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader><DialogTitle>Onboard New Clinic</DialogTitle></DialogHeader>
          <DialogBody pb="6">

            {/* Stepper */}
            <Flex align="center" mb="6">
              {stepLabels.map((label, i) => (
                <Flex key={label} align="center" flex={i < stepLabels.length - 1 ? 1 : undefined}>
                  <Flex
                    w="7" h="7" borderRadius="full" align="center" justify="center" flexShrink={0}
                    bg={i + 1 <= step ? 'brand.500' : 'gray.200'}
                    color={i + 1 <= step ? 'white' : 'gray.500'}
                    fontSize="xs" fontWeight="bold"
                  >
                    {i + 1}
                  </Flex>
                  <Text ml="2" fontSize="xs" fontWeight={i + 1 === step ? 'semibold' : 'medium'}
                    color={i + 1 === step ? 'brand.600' : 'gray.500'} flexShrink={0}>
                    {label}
                  </Text>
                  {i < stepLabels.length - 1 && <Box flex="1" h="1px" bg="gray.200" mx="3" />}
                </Flex>
              ))}
            </Flex>

            {/* Step 1 — Clinic Info */}
            {step === 1 && (
              <VStack gap="4" align="stretch">
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">Basic Information</Text>
                <LabeledInput label="Clinic Name *" name="name" />
                <Grid templateColumns="repeat(2,1fr)" gap="3">
                  <LabeledInput label="City *" name="city" />
                  <LabeledInput label="Country" name="country" />
                  <LabeledInput label="Website" name="website" />
                  <LabeledInput label="Phone" name="phone" />
                </Grid>
                <Separator />
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">Details</Text>
                <Grid templateColumns="repeat(3,1fr)" gap="3">
                  <LabeledInput label="Years of Experience" name="years_experience" type="number" />
                  <LabeledInput label="Staff Size" name="size" type="number" />
                  <LabeledSelect label="Price Level" name="price_range" options={priceOpts} />
                </Grid>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Description</Text>
                  <Textarea size="sm" value={form.description} onChange={e => set('description', e.target.value)}
                    rows={3} bg="white" fontSize="sm" resize="vertical"
                    placeholder="Briefly describe this clinic's strengths, approach, and patient experience…" />
                </Box>
              </VStack>
            )}

            {/* Step 2 — Specialties */}
            {step === 2 && (
              <VStack gap="4" align="stretch">
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Select Specialties *</Text>
                  <Text fontSize="sm" color="gray.500" mb="4">Select all treatments and specialties this clinic offers.</Text>
                  <Flex flexWrap="wrap" gap="2">
                    {SPECIALTY_OPTIONS.map(s => {
                      const selected = form.expertise.includes(s)
                      return (
                        <Box
                          key={s}
                          as="button"
                          px="3" py="1.5" borderRadius="full" fontSize="sm" fontWeight="medium"
                          bg={selected ? 'brand.500' : 'white'} color={selected ? 'white' : 'gray.600'}
                          border="1px solid" borderColor={selected ? 'brand.500' : 'gray.300'}
                          cursor="pointer" transition="all 0.15s"
                          _hover={{ borderColor: 'brand.400' }}
                          onClick={() => toggleSpecialty(s)}
                        >
                          {s}
                        </Box>
                      )
                    })}
                  </Flex>
                </Box>
                {form.expertise.length > 0 && (
                  <Box bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.200" p="4">
                    <Text fontSize="xs" fontWeight="semibold" color="brand.600" textTransform="uppercase" letterSpacing="wide" mb="2">
                      Selected ({form.expertise.length})
                    </Text>
                    <Flex flexWrap="wrap" gap="2">
                      {form.expertise.map(s => (
                        <Box key={s} px="2" py="0.5" bg="white" borderRadius="md" fontSize="xs" fontWeight="medium" color="gray.600" border="1px solid" borderColor="gray.200">
                          {s}
                        </Box>
                      ))}
                    </Flex>
                  </Box>
                )}
              </VStack>
            )}

            {/* Step 3 — Contact & Review */}
            {step === 3 && (
              <VStack gap="4" align="stretch">
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">Primary Contact</Text>
                <Grid templateColumns="repeat(2,1fr)" gap="3">
                  <Box style={{ gridColumn: '1/-1' }}>
                    <LabeledInput label="Contact Name" name="contact_name" />
                  </Box>
                  <LabeledInput label="Contact Email" name="contact_email" type="email" />
                  <LabeledInput label="Contact Phone" name="contact_phone" />
                </Grid>
                <Separator />
                <LabeledSelect label="Status" name="status" options={statusOpts} />
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="1">Internal Notes</Text>
                  <Textarea size="sm" value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)}
                    rows={3} bg="white" fontSize="sm" resize="vertical"
                    placeholder="Any partnership details, contract notes, or onboarding context…" />
                </Box>
                {/* Review summary */}
                <Box bg="cream.100" borderRadius="lg" border="1px solid" borderColor="cream.300" p="4">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="3">Review</Text>
                  <Grid templateColumns="repeat(2,1fr)" gap="2" fontSize="sm">
                    <Box><Text as="span" color="gray.500">Name </Text><Text as="strong">{form.name || '—'}</Text></Box>
                    <Box><Text as="span" color="gray.500">City </Text><Text as="strong">{form.city || '—'}</Text></Box>
                    <Box><Text as="span" color="gray.500">Experience </Text><Text as="strong">{form.years_experience ? `${form.years_experience} yrs` : '—'}</Text></Box>
                    <Box><Text as="span" color="gray.500">Price </Text><Text as="strong" textTransform="capitalize">{form.price_range}</Text></Box>
                    <Box style={{ gridColumn: '1/-1' }}>
                      <Text as="span" color="gray.500">Specialties </Text>
                      <Text as="strong">{form.expertise.length > 0 ? form.expertise.join(', ') : '—'}</Text>
                    </Box>
                  </Grid>
                </Box>
              </VStack>
            )}

            {error && <Text color="red.500" fontSize="sm" mt="3">{error}</Text>}

            <Flex justify="flex-end" gap="3" mt="6">
              {step > 1 && <Button size="sm" variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
              <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
              {step < 3 ? (
                <Button size="sm" colorPalette="orange" onClick={() => setStep(s => s + 1)} disabled={!canContinue}>Continue</Button>
              ) : (
                <Button size="sm" colorPalette="orange" onClick={handleSubmit} loading={saving}>Add Clinic</Button>
              )}
            </Flex>
          </DialogBody>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboard, setShowOnboard] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/clinics')
      .then(r => r.json())
      .then(d => { setClinics(d.clinics ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <AdminSidebarLayout>
      <Container maxW="7xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Flex justify="space-between" align="flex-start" mb="2">
          <Box>
            <Heading size="2xl" color="brand.600">Clinics</Heading>
            <Text fontSize="sm" color="gray.500">{clinics.length} partner clinics</Text>
          </Box>
          <Button colorPalette="orange" size="sm" mt="1" onClick={() => setShowOnboard(true)}>
            + Onboard Clinic
          </Button>
        </Flex>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        {loading ? (
          <Text color="gray.400" fontSize="sm">Loading…</Text>
        ) : clinics.length === 0 ? (
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Box p="8" textAlign="center">
              <Text color="gray.400" fontSize="sm">No clinics yet. Click "Onboard Clinic" to add one.</Text>
            </Box>
          </Card.Root>
        ) : (
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2,1fr)' }} gap="4">
            {clinics.map(c => {
              const expanded = expandedId === c.id
              const statusColor = (c as any).status === 'active' ? 'green' : (c as any).status === 'pending' ? 'orange' : 'gray'
              return (
                <Card.Root key={c.id} bg="white" borderWidth="1px" borderColor="gray.200">
                  <Card.Body>
                    <Flex gap="4" align="flex-start">
                      {/* Icon */}
                      <Flex w="11" h="11" borderRadius="xl" bg="cream.200" align="center" justify="center" flexShrink={0} fontSize="xl">
                        🏥
                      </Flex>
                      <Box flex="1">
                        <Flex align="center" gap="2" mb="1">
                          <Text fontWeight="bold" fontSize="md" color="gray.900">{c.name}</Text>
                          <Box
                            display="inline-flex" px="2" py="0.5" borderRadius="full"
                            fontSize="10px" fontWeight="bold" textTransform="uppercase"
                            bg={`${statusColor}.100`} color={`${statusColor}.700`}
                          >
                            {(c as any).status ?? 'active'}
                          </Box>
                        </Flex>
                        <Text fontSize="xs" color="gray.500" mb="3">
                          📍 {c.locations?.join(' · ') || '—'}
                        </Text>

                        {/* Specialties */}
                        <Flex flexWrap="wrap" gap="1.5" mb="4">
                          {(c.expertise ?? []).slice(0, 4).map(s => (
                            <Box key={s} px="2" py="0.5" bg="cream.200" borderRadius="md" fontSize="xs" fontWeight="medium" color="gray.600">{s}</Box>
                          ))}
                          {(c.expertise ?? []).length > 4 && (
                            <Box px="2" py="0.5" fontSize="xs" fontWeight="medium" color="brand.500">
                              +{c.expertise!.length - 4} more
                            </Box>
                          )}
                        </Flex>

                        {/* Stats */}
                        <Flex gap="5" fontSize="xs" mb="3">
                          {c.years_experience > 0 && (
                            <Box><Text as="span" color="gray.500">Experience </Text><Text as="strong">{c.years_experience} yrs</Text></Box>
                          )}
                          {c.size && (
                            <Box><Text as="span" color="gray.500">Size </Text><Text as="strong">{c.size} staff</Text></Box>
                          )}
                          {c.price_range && (
                            <Box>
                              <Text as="span" color="gray.500">Price </Text>
                              <Box as="span" display="inline-flex" px="2" py="0.5" borderRadius="full" fontSize="xs" fontWeight="semibold"
                                bg={c.price_range === 'low' ? 'green.100' : 'orange.100'}
                                color={c.price_range === 'low' ? 'green.700' : 'orange.700'}
                              >
                                {c.price_range.toUpperCase()}
                              </Box>
                            </Box>
                          )}
                        </Flex>

                        {c.description && (
                          <Text fontSize="xs" color="gray.500" fontStyle="italic" mb="3">"{c.description}"</Text>
                        )}

                        {/* Expand toggle */}
                        <Button
                          size="xs" variant="ghost" color="gray.400"
                          onClick={() => setExpandedId(expanded ? null : c.id)}
                        >
                          {expanded ? '▲ Less' : '▼ More details'}
                        </Button>

                        {expanded && (
                          <Box mt="3" pt="3" borderTop="1px" borderColor="gray.100">
                            <Grid templateColumns="repeat(2,1fr)" gap="3" fontSize="sm">
                              {(c as any).contact_name && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">Contact</Text>
                                  <Text>{(c as any).contact_name}</Text>
                                  {(c as any).contact_email && <Text fontSize="xs" color="gray.500">{(c as any).contact_email}</Text>}
                                  {(c as any).contact_phone && <Text fontSize="xs" color="gray.500">{(c as any).contact_phone}</Text>}
                                </Box>
                              )}
                              {(c as any).website && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">Website</Text>
                                  <Text color="brand.500" fontSize="sm">{(c as any).website}</Text>
                                </Box>
                              )}
                              {(c as any).internal_notes && (
                                <Box style={{ gridColumn: '1/-1' }}>
                                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb="0.5">Internal Notes</Text>
                                  <Text fontSize="sm" color="gray.600">{(c as any).internal_notes}</Text>
                                </Box>
                              )}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    </Flex>
                  </Card.Body>
                </Card.Root>
              )
            })}
          </Grid>
        )}
      </Container>

      {showOnboard && (
        <OnboardClinicModal
          onClose={() => setShowOnboard(false)}
          onAdded={c => { setClinics(prev => [c, ...prev]); setShowOnboard(false) }}
        />
      )}
    </AdminSidebarLayout>
  )
}

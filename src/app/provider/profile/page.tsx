'use client'

import { useEffect, useState } from 'react'
import ProviderSidebarLayout from '@/components/layouts/ProviderSidebarLayout'
import {
  Box, Button, Container, Flex, Heading, Input, NativeSelect,
  Separator, Text, Textarea, VStack, Grid,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Alert } from '@/components/ui/alert'

type Clinic = {
  id: string
  name: string
  description: string | null
  locations: string[]
  expertise: string[]
  price_range: string | null
  years_experience: number
  size: number | null
}

export default function ProviderProfilePage() {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    locations: '',
    expertise: '',
    price_range: '',
    years_experience: '',
    size: '',
  })

  useEffect(() => {
    fetch('/api/provider/clinic')
      .then(r => r.json())
      .then(data => {
        if (data.clinic) {
          const c = data.clinic
          setClinic(c)
          setForm({
            name: c.name ?? '',
            description: c.description ?? '',
            locations: (c.locations ?? []).join(', '),
            expertise: (c.expertise ?? []).join(', '),
            price_range: c.price_range ?? '',
            years_experience: String(c.years_experience ?? ''),
            size: String(c.size ?? ''),
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false); setError(null)
    try {
      const res = await fetch('/api/provider/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          locations: form.locations.split(',').map(s => s.trim()).filter(Boolean),
          expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
          price_range: form.price_range || null,
          years_experience: parseInt(form.years_experience) || 0,
          size: form.size ? parseInt(form.size) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setClinic(data.clinic)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <ProviderSidebarLayout>
      <Container maxW="3xl" py="6" px={{ base: '4', sm: '6', lg: '8' }}>
        <Heading size="2xl" color="brand.600" mb="2">Clinic Profile</Heading>
        <Separator borderColor="purple.500" borderWidth="2px" width="24" mb="8" />

        {loading ? (
          <Text color="gray.400" fontSize="sm">Loading…</Text>
        ) : !clinic ? (
          <Card.Root bg="orange.50" borderWidth="1px" borderColor="orange.200">
            <Card.Body>
              <Text fontWeight="semibold" color="orange.700" mb="1">No clinic linked</Text>
              <Text fontSize="sm" color="orange.600">
                Your provider account is not yet linked to a clinic. Contact your administrator to link your account to a clinic record.
              </Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Card.Root bg="white" borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <VStack gap="6" align="stretch">
                {saved && (
                  <Alert.Root status="success">
                    <Alert.Title>Clinic profile saved.</Alert.Title>
                  </Alert.Root>
                )}
                {error && (
                  <Alert.Root status="error">
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Root>
                )}

                <Field label="Clinic Name" required>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={4} resize="vertical"
                    placeholder="Describe your clinic, specialties, and approach to care…"
                  />
                </Field>

                <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                  <Field label="Locations" helperText="Comma-separated cities">
                    <Input
                      value={form.locations}
                      onChange={e => setForm(p => ({ ...p, locations: e.target.value }))}
                      placeholder="e.g. Barcelona, Madrid"
                    />
                  </Field>

                  <Field label="Years of Experience">
                    <Input
                      type="number" min={0}
                      value={form.years_experience}
                      onChange={e => setForm(p => ({ ...p, years_experience: e.target.value }))}
                    />
                  </Field>

                  <Field label="Staff Size">
                    <Input
                      type="number" min={1}
                      value={form.size}
                      onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
                      placeholder="Number of staff"
                    />
                  </Field>

                  <Field label="Price Range">
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={form.price_range}
                        onChange={e => setForm(p => ({ ...p, price_range: e.target.value }))}
                      >
                        <option value="">Select…</option>
                        <option value="low">Low</option>
                        <option value="med">Medium</option>
                        <option value="med-high">Medium-High</option>
                        <option value="high">High</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field>
                </Grid>

                <Field label="Areas of Expertise" helperText="Comma-separated specialties">
                  <Input
                    value={form.expertise}
                    onChange={e => setForm(p => ({ ...p, expertise: e.target.value }))}
                    placeholder="e.g. IVF, Egg Freezing, Donor Services"
                  />
                </Field>

                <Flex justify="flex-end">
                  <Button colorPalette="orange" onClick={handleSave} loading={saving}>
                    Save Changes
                  </Button>
                </Flex>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </Container>
    </ProviderSidebarLayout>
  )
}

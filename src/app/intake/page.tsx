'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PublicLayout from '@/components/layouts/PublicLayout'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  Input,
  Button,
  Textarea,
  Link as ChakraLink,
  NativeSelect,
} from '@chakra-ui/react'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Field } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'

interface FormData {
  first_name: string
  last_name: string
  preferred_name: string
  date_of_birth: string
  sex: string
  phone_number: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  timezone: string
  partner_name: string
  partner_last_name: string
  partner_email: string
  partner_phone: string
  partner_sex: string
  partner_dob: string
  last_period_date: string
  cycle_duration_days: string
  regular_cycles: string
  on_birth_control: string
  fertility_goals: string[]
  health_concerns: string[]
  storage_duration: string
  treatment_type: string
  treatment_timeline: string
  treatment_constraints: string
  treatment_urgency: string
  doctor_preference: string
  preference_rank: string[]
  past_experience: string
  referral_source: string
  terms_accepted: boolean
}

export default function IntakePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    sex: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    partner_name: '',
    partner_last_name: '',
    partner_email: '',
    partner_phone: '',
    partner_sex: '',
    partner_dob: '',
    last_period_date: '',
    cycle_duration_days: '',
    regular_cycles: '',
    on_birth_control: '',
    fertility_goals: [],
    health_concerns: [],
    storage_duration: '',
    treatment_type: '',
    treatment_timeline: '',
    treatment_constraints: '',
    treatment_urgency: '',
    doctor_preference: '',
    preference_rank: ['', '', ''],
    past_experience: '',
    referral_source: '',
    terms_accepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox' && 'checked' in e.target) {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCheckboxArrayChange = (field: 'fertility_goals' | 'health_concerns', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      return { ...prev, [field]: newArray }
    })
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePreferenceRankChange = (index: number, value: string) => {
    setFormData(prev => {
      const newRank = [...prev.preference_rank]
      newRank[index] = value
      return { ...prev, preference_rank: newRank }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Build payload, converting types as needed
      const payload = {
        ...formData,
        cycle_duration_days: formData.cycle_duration_days === '' ? undefined : formData.cycle_duration_days,
        regular_cycles: formData.regular_cycles === '' ? undefined : formData.regular_cycles,
        on_birth_control: formData.on_birth_control === '' ? undefined : formData.on_birth_control,
        treatment_urgency: formData.treatment_urgency === '' ? undefined : formData.treatment_urgency,
        treatment_type: formData.treatment_type === '' ? undefined : formData.treatment_type,
        preference_rank: formData.preference_rank.filter(r => r !== ''),
        partner_dob: formData.partner_dob === '' ? undefined : formData.partner_dob,
        last_period_date: formData.last_period_date === '' ? undefined : formData.last_period_date,
      }

      const response = await fetch('/api/intake/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        if (data.details) {
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            fieldErrors[err.path[0]] = err.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ _form: data.error || 'An error occurred. Please try again.' })
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ _form: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fertilityGoalsOptions = [
    'In Vitro Fertilization (IVF)',
    'Intrauterine Insemination (IUI)',
    'Egg Freezing',
    'Embryo Freezing',
    'Genetic Testing',
    'Fertility Assessment',
    'Donor Services',
    'Surrogacy Services',
  ]

  const healthConcernsOptions = [
    'Polycystic Ovary Syndrome (PCOS)',
    'Endometriosis',
    'Low Ovarian Reserve',
    'Male Factor Infertility',
    'Recurrent Pregnancy Loss',
    'Advanced Maternal Age',
    'Unexplained Infertility',
  ]

  const preferenceOptions = [
    'Budget',
    'Patient care',
    'High throughput',
    'Location',
    'Success rates',
    'Technology',
    'Reputation',
  ]

  const showStorageDuration = formData.fertility_goals.some(g =>
    g.includes('Freezing')
  )

  return (
    <PublicLayout>
      <Container maxW="3xl" py="12" px={{ base: '4', sm: '6', lg: '8' }}>
        <VStack mb="8">
          <Heading size="5xl" color="brand.500" textAlign="center" lineHeight="tight">
            amiga
            <br />
            fertility
          </Heading>
        </VStack>

        <Card.Root bg="white">
          <Card.Body px={{ base: '6', sm: '10' }} py={{ base: '8', sm: '10' }}>
            <Heading size="2xl" color="gray.900" mb="2">
              Welcome to Amiga Fertility
            </Heading>
            <Text color="gray.700" mb="8" fontSize="lg">
              Let's start by collecting some basic information to personalize your experience.
            </Text>

            {errors._form && (
              <Alert.Root status="error" mb="6">
                <Alert.Title>{errors._form}</Alert.Title>
              </Alert.Root>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap="8" align="stretch">

                {/* Personal Information */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="6">Personal Information</Heading>
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                    <Field label="First Name" required invalid={!!errors.first_name} errorText={errors.first_name}>
                      <Input name="first_name" value={formData.first_name} onChange={handleChange} />
                    </Field>

                    <Field label="Last Name" required invalid={!!errors.last_name} errorText={errors.last_name}>
                      <Input name="last_name" value={formData.last_name} onChange={handleChange} />
                    </Field>

                    <Field label="Preferred Name (Optional)">
                      <Input name="preferred_name" value={formData.preferred_name} onChange={handleChange} />
                    </Field>

                    <Field label="Date of Birth" required invalid={!!errors.date_of_birth} errorText={errors.date_of_birth}>
                      <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                    </Field>

                    <Field label="Sex">
                      <NativeSelect.Root>
                        <NativeSelect.Field name="sex" value={formData.sex} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field>
                  </Grid>
                </Box>

                {/* Contact Information */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="6">Contact Information</Heading>
                  <VStack gap="4" align="stretch">
                    <Field
                      label="Phone Number"
                      required
                      invalid={!!errors.phone_number}
                      errorText={errors.phone_number}
                      helperText="Include country code, e.g., +1"
                    >
                      <Input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+1234567890" />
                    </Field>

                    <Field label="Address Line 1" required invalid={!!errors.address_line1} errorText={errors.address_line1}>
                      <Input name="address_line1" value={formData.address_line1} onChange={handleChange} />
                    </Field>

                    <Field label="Address Line 2 (Optional)">
                      <Input name="address_line2" value={formData.address_line2} onChange={handleChange} />
                    </Field>

                    <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="4">
                      <Field label="City" required invalid={!!errors.city} errorText={errors.city}>
                        <Input name="city" value={formData.city} onChange={handleChange} />
                      </Field>
                      <Field label="State/Province" required invalid={!!errors.state} errorText={errors.state}>
                        <Input name="state" value={formData.state} onChange={handleChange} />
                      </Field>
                      <Field label="Postal Code" required invalid={!!errors.postal_code} errorText={errors.postal_code}>
                        <Input name="postal_code" value={formData.postal_code} onChange={handleChange} />
                      </Field>
                    </Grid>

                    <Field label="Country" required invalid={!!errors.country} errorText={errors.country}>
                      <Input name="country" value={formData.country} onChange={handleChange} />
                    </Field>
                  </VStack>
                </Box>

                {/* Partner Information */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="3">Partner Information (Optional)</Heading>
                  <Text fontSize="base" color="gray.700" mb="6">
                    If you have a partner involved in your fertility journey, please share their information.
                  </Text>
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                    <Field label="Partner's First Name">
                      <Input name="partner_name" value={formData.partner_name} onChange={handleChange} />
                    </Field>

                    <Field label="Partner's Last Name">
                      <Input name="partner_last_name" value={formData.partner_last_name} onChange={handleChange} />
                    </Field>

                    <Field label="Partner's Email" invalid={!!errors.partner_email} errorText={errors.partner_email}>
                      <Input type="email" name="partner_email" value={formData.partner_email} onChange={handleChange} />
                    </Field>

                    <Field label="Partner's Phone" invalid={!!errors.partner_phone} errorText={errors.partner_phone}>
                      <Input type="tel" name="partner_phone" value={formData.partner_phone} onChange={handleChange} placeholder="+1234567890" />
                    </Field>

                    <Field label="Partner's Sex">
                      <NativeSelect.Root>
                        <NativeSelect.Field name="partner_sex" value={formData.partner_sex} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field>

                    <Field label="Partner's Date of Birth">
                      <Input type="date" name="partner_dob" value={formData.partner_dob} onChange={handleChange} />
                    </Field>
                  </Grid>
                </Box>

                {/* Medical Information */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="6">Medical Information</Heading>
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                    <Field label="Date of Last Period">
                      <Input type="date" name="last_period_date" value={formData.last_period_date} onChange={handleChange} />
                    </Field>

                    <Field label="Average Cycle Duration (days)" invalid={!!errors.cycle_duration_days} errorText={errors.cycle_duration_days}>
                      <Input
                        type="number"
                        name="cycle_duration_days"
                        value={formData.cycle_duration_days}
                        onChange={handleChange}
                        placeholder="e.g. 28"
                        min={1}
                        max={60}
                      />
                    </Field>

                    <Field label="Are your cycles regular?">
                      <NativeSelect.Root>
                        <NativeSelect.Field name="regular_cycles" value={formData.regular_cycles} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field>

                    <Field label="Currently on birth control?">
                      <NativeSelect.Root>
                        <NativeSelect.Field name="on_birth_control" value={formData.on_birth_control} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field>
                  </Grid>
                </Box>

                {/* Fertility Journey */}
                <Box borderTopWidth="2px" borderColor="purple.300" pt="8">
                  <Heading size="xl" color="purple.600" mb="6">Your Fertility Journey</Heading>

                  <Box mb="6">
                    <Text fontSize="sm" fontWeight="medium" mb="2">What are you looking for?</Text>
                    <VStack align="start" gap="2">
                      {fertilityGoalsOptions.map((option, i) => (
                        <Checkbox
                          key={option}
                          id={`fertility_goal_${i}`}
                          checked={formData.fertility_goals.includes(option)}
                          onCheckedChange={() => handleCheckboxArrayChange('fertility_goals', option)}
                        >
                          {option}
                        </Checkbox>
                      ))}
                    </VStack>
                    {errors.fertility_goals && (
                      <Text color="red.500" fontSize="sm" mt="1">{errors.fertility_goals}</Text>
                    )}
                  </Box>

                  {showStorageDuration && (
                    <Box mb="6">
                      <Field label="Desired storage duration">
                        <NativeSelect.Root>
                          <NativeSelect.Field name="storage_duration" value={formData.storage_duration} onChange={handleChange}>
                            <option value="">Select...</option>
                            <option value="1-2 years">1–2 years</option>
                            <option value="3-5 years">3–5 years</option>
                            <option value="5-10 years">5–10 years</option>
                            <option value="10+ years">10+ years</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field>
                    </Box>
                  )}

                  <Box mb="6">
                    <Field label="Preferred treatment setting">
                      <NativeSelect.Root>
                        <NativeSelect.Field name="treatment_type" value={formData.treatment_type} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="onsite">Onsite</option>
                          <option value="remote">Remote</option>
                          <option value="hybrid">Hybrid</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field>
                  </Box>

                  <Box mb="6">
                    <Text fontSize="sm" fontWeight="medium" mb="2">Are you concerned about...? (Optional)</Text>
                    <VStack align="start" gap="2">
                      {healthConcernsOptions.map((option, i) => (
                        <Checkbox
                          key={option}
                          id={`health_concern_${i}`}
                          checked={formData.health_concerns.includes(option)}
                          onCheckedChange={() => handleCheckboxArrayChange('health_concerns', option)}
                        >
                          {option}
                        </Checkbox>
                      ))}
                    </VStack>
                    {errors.health_concerns && (
                      <Text color="red.500" fontSize="sm" mt="1">{errors.health_concerns}</Text>
                    )}
                  </Box>

                  <Box mb="6">
                    <Field label="Ideal start date / timeline" required invalid={!!errors.treatment_timeline} errorText={errors.treatment_timeline}>
                      <Input
                        name="treatment_timeline"
                        value={formData.treatment_timeline}
                        onChange={handleChange}
                        placeholder="e.g., Fall 2026, Within 3 months, As soon as possible"
                      />
                    </Field>
                  </Box>

                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4" mb="6">
                    <Field label="Any constraints on timing?">
                      <Input
                        name="treatment_constraints"
                        value={formData.treatment_constraints}
                        onChange={handleChange}
                        placeholder="e.g., Travel, work schedule, partner availability"
                      />
                    </Field>

                    <Field label="Is timing urgent?">
                      <NativeSelect.Root>
                        <NativeSelect.Field name="treatment_urgency" value={formData.treatment_urgency} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field>
                  </Grid>

                  {/* Clinic Preferences */}
                  <Box mb="6">
                    <Heading size="lg" color="purple.600" mb="4">Clinic Preferences</Heading>
                    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                      <Field label="Preferred doctor">
                        <NativeSelect.Root>
                          <NativeSelect.Field name="doctor_preference" value={formData.doctor_preference} onChange={handleChange}>
                            <option value="">No preference</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="any">Any</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field>
                    </Grid>

                    <Text fontSize="sm" color="gray.600" mt="4" mb="3">
                      Rank your top 3 priorities when choosing a clinic:
                    </Text>
                    <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="4">
                      {['1st priority', '2nd priority', '3rd priority'].map((label, index) => (
                        <Field key={index} label={label}>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={formData.preference_rank[index]}
                              onChange={(e) => handlePreferenceRankChange(index, e.target.value)}
                            >
                              <option value="">Select...</option>
                              {preferenceOptions.map(opt => (
                                <option
                                  key={opt}
                                  value={opt}
                                  disabled={formData.preference_rank.includes(opt) && formData.preference_rank[index] !== opt}
                                >
                                  {opt}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Field>
                      ))}
                    </Grid>
                  </Box>

                  {/* Past Experience */}
                  <Box mb="6">
                    <Field
                      label="Tell us a bit more: What have you tried in the past? What has been the biggest challenge? How could we assist you best?"
                      required
                      invalid={!!errors.past_experience}
                      errorText={errors.past_experience}
                    >
                      <Textarea
                        name="past_experience"
                        value={formData.past_experience}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Please share your fertility journey so far..."
                      />
                    </Field>
                  </Box>

                  {/* Referral Source */}
                  <Box mb="6">
                    <Field label="How did you hear about Amiga Fertility?" required invalid={!!errors.referral_source} errorText={errors.referral_source}>
                      <Input
                        name="referral_source"
                        value={formData.referral_source}
                        onChange={handleChange}
                        placeholder="e.g., Google search, Friend referral, Social media, Doctor recommendation"
                      />
                    </Field>
                  </Box>

                  {/* Terms */}
                  <Field invalid={!!errors.terms_accepted} errorText={errors.terms_accepted}>
                    <Checkbox
                      name="terms_accepted"
                      checked={formData.terms_accepted}
                      onCheckedChange={(e) => {
                        const checked = e.checked === true
                        setFormData(prev => ({ ...prev, terms_accepted: checked }))
                        if (errors.terms_accepted) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.terms_accepted
                            return newErrors
                          })
                        }
                      }}
                    >
                      <Text fontSize="sm" color="gray.700">
                        I accept the{' '}
                        <ChakraLink
                          href="/terms"
                          target="_blank"
                          color="brand.600"
                          _hover={{ color: 'brand.500' }}
                          textDecoration="underline"
                        >
                          Terms and Conditions
                        </ChakraLink>{' '}
                        and understand that my information will be used to provide personalized fertility care services. *
                      </Text>
                    </Checkbox>
                  </Field>
                </Box>

                {/* Submit */}
                <Box pt="8" borderTopWidth="1px" borderColor="gray.200">
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    disabled={isSubmitting}
                    px="8"
                    py="6"
                    fontSize="base"
                    fontWeight="bold"
                    alignSelf="flex-end"
                  >
                    {isSubmitting ? 'Saving...' : 'Complete Setup'}
                  </Button>
                </Box>
              </VStack>
            </form>
          </Card.Body>
        </Card.Root>
      </Container>
    </PublicLayout>
  )
}

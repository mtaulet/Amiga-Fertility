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
  GridItem,
  Input,
  Button,
  Textarea,
  Separator,
  Link as ChakraLink,
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
  phone_number: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  timezone: string
  partner_name: string
  partner_email: string
  partner_phone: string
  fertility_goals: string[]
  health_concerns: string[]
  treatment_timeline: string
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
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    partner_name: '',
    partner_email: '',
    partner_phone: '',
    fertility_goals: [],
    health_concerns: [],
    treatment_timeline: '',
    past_experience: '',
    referral_source: '',
    terms_accepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox' && 'checked' in e.target) {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    // Clear error for this field
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
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/intake/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.details) {
          // Zod validation errors
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            fieldErrors[err.path[0]] = err.message
          })
          setErrors(fieldErrors)
        } else {
          throw new Error(data.error || 'Failed to submit form')
        }
        return
      }

      // Success - redirect to dashboard
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
    'Surrogacy Services'
  ]

  const healthConcernsOptions = [
    'Polycystic Ovary Syndrome (PCOS)',
    'Endometriosis',
    'Low Ovarian Reserve',
    'Male Factor Infertility',
    'Recurrent Pregnancy Loss',
    'Advanced Maternal Age',
    'Unexplained Infertility'
  ]

  return (
    <PublicLayout>
      <Container maxW="3xl" py="12" px={{ base: '4', sm: '6', lg: '8' }}>
        {/* Amiga Logo */}
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
                {/* Personal Information Section */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="6">
                    Personal Information
                  </Heading>
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                    <Field label="First Name" required invalid={!!errors.first_name} errorText={errors.first_name}>
                      <Input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Last Name" required invalid={!!errors.last_name} errorText={errors.last_name}>
                      <Input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Preferred Name (Optional)">
                      <Input
                        name="preferred_name"
                        value={formData.preferred_name}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Date of Birth" required invalid={!!errors.date_of_birth} errorText={errors.date_of_birth}>
                      <Input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                      />
                    </Field>
                  </Grid>
                </Box>

                {/* Contact Information Section */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="6">
                    Contact Information
                  </Heading>
                  <VStack gap="4" align="stretch">
                    <Field
                      label="Phone Number"
                      required
                      invalid={!!errors.phone_number}
                      errorText={errors.phone_number}
                      helperText="Include country code, e.g., +1"
                    >
                      <Input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+1234567890"
                      />
                    </Field>

                    <Field label="Address Line 1" required invalid={!!errors.address_line1} errorText={errors.address_line1}>
                      <Input
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Address Line 2 (Optional)">
                      <Input
                        name="address_line2"
                        value={formData.address_line2}
                        onChange={handleChange}
                      />
                    </Field>

                    <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap="4">
                      <Field label="City" required invalid={!!errors.city} errorText={errors.city}>
                        <Input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </Field>

                      <Field label="State/Province" required invalid={!!errors.state} errorText={errors.state}>
                        <Input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                        />
                      </Field>

                      <Field label="Postal Code" required invalid={!!errors.postal_code} errorText={errors.postal_code}>
                        <Input
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                        />
                      </Field>
                    </Grid>

                    <Field label="Country" required invalid={!!errors.country} errorText={errors.country}>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </Field>
                  </VStack>
                </Box>

                {/* Partner Information Section */}
                <Box borderTopWidth="1px" borderColor="gray.200" pt="8">
                  <Heading size="xl" color="brand.600" mb="3">
                    Partner Information (Optional)
                  </Heading>
                  <Text fontSize="base" color="gray.700" mb="6">
                    If you have a partner involved in your fertility journey, please share their information.
                  </Text>
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap="4">
                    <Field label="Partner's Name">
                      <Input
                        name="partner_name"
                        value={formData.partner_name}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Partner's Email" invalid={!!errors.partner_email} errorText={errors.partner_email}>
                      <Input
                        type="email"
                        name="partner_email"
                        value={formData.partner_email}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Partner's Phone" invalid={!!errors.partner_phone} errorText={errors.partner_phone}>
                      <Input
                        type="tel"
                        name="partner_phone"
                        value={formData.partner_phone}
                        onChange={handleChange}
                        placeholder="+1234567890"
                      />
                    </Field>
                  </Grid>
                </Box>

                {/* Fertility-Specific Questions Section */}
                <Box borderTopWidth="2px" borderColor="purple.300" pt="8">
                  <Heading size="xl" color="purple.600" mb="6">
                    Your Fertility Journey
                  </Heading>

                  {/* What are you looking for? */}
                  <Box mb="6">
                    <Field label="What are you looking for?" required invalid={!!errors.fertility_goals} errorText={errors.fertility_goals}>
                      <VStack align="start" gap="2">
                        {fertilityGoalsOptions.map((option) => (
                          <Checkbox
                            key={option}
                            checked={formData.fertility_goals.includes(option)}
                            onCheckedChange={() => handleCheckboxArrayChange('fertility_goals', option)}
                          >
                            {option}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Field>
                  </Box>

                  {/* Are you concerned about? */}
                  <Box mb="6">
                    <Field label="Are you concerned about...? (Optional)" invalid={!!errors.health_concerns} errorText={errors.health_concerns}>
                      <VStack align="start" gap="2">
                        {healthConcernsOptions.map((option) => (
                          <Checkbox
                            key={option}
                            checked={formData.health_concerns.includes(option)}
                            onCheckedChange={() => handleCheckboxArrayChange('health_concerns', option)}
                          >
                            {option}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Field>
                  </Box>

                  {/* Treatment Timeline */}
                  <Box mb="6">
                    <Field label="What is your desired time frame for the treatment?" required invalid={!!errors.treatment_timeline} errorText={errors.treatment_timeline}>
                      <Input
                        name="treatment_timeline"
                        value={formData.treatment_timeline}
                        onChange={handleChange}
                        placeholder="e.g., Within 3 months, 6-12 months, Just exploring options"
                      />
                    </Field>
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

                  {/* Terms and Conditions */}
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

                {/* Submit Button */}
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

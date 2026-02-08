#!/usr/bin/env node

// Quick Twilio setup script
import twilio from 'twilio'

const ACCOUNT_SID = 'TWILIO_ACCOUNT_SID_HERE'
const AUTH_TOKEN = 'TWILIO_AUTH_TOKEN_HERE'

const client = twilio(ACCOUNT_SID, AUTH_TOKEN)

console.log('🔍 Searching for available phone numbers...\n')

client.availablePhoneNumbers('US')
  .local
  .list({
    voiceEnabled: true,
    limit: 5
  })
  .then(numbers => {
    console.log('📞 Found available numbers:\n')
    numbers.forEach((number, i) => {
      console.log(`${i + 1}. ${number.phoneNumber} (${number.locality}, ${number.region})`)
    })

    console.log('\n💡 To buy the first number, run:')
    console.log(`   node buy-twilio-number.js "${numbers[0].phoneNumber}"\n`)
  })
  .catch(err => {
    console.error('❌ Error:', err.message)

    if (err.code === 20003) {
      console.error('\n⚠️  Authentication failed!')
      console.error('   Check your Account SID and Auth Token')
    }
  })

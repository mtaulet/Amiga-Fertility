#!/usr/bin/env node

// Buy a Twilio phone number
import twilio from 'twilio'

const ACCOUNT_SID = 'TWILIO_ACCOUNT_SID_HERE'
const AUTH_TOKEN = 'TWILIO_AUTH_TOKEN_HERE'

const phoneNumber = process.argv[2]

if (!phoneNumber) {
  console.error('❌ Please provide a phone number to buy')
  console.error('   Usage: node buy-twilio-number.js "+1234567890"')
  process.exit(1)
}

const client = twilio(ACCOUNT_SID, AUTH_TOKEN)

console.log(`📞 Buying phone number: ${phoneNumber}...\n`)

client.incomingPhoneNumbers
  .create({
    phoneNumber: phoneNumber,
    voiceUrl: 'http://demo.twilio.com/docs/voice.xml' // Temporary, we'll update later
  })
  .then(number => {
    console.log('✅ Success! Phone number purchased!\n')
    console.log('   Number:', number.phoneNumber)
    console.log('   SID:', number.sid)
    console.log('   Cost: $1.15/month\n')
    console.log('📝 Add this to your .env file:')
    console.log(`   TWILIO_PHONE_NUMBER=${number.phoneNumber}\n`)
  })
  .catch(err => {
    console.error('❌ Error buying number:', err.message)

    if (err.code === 21452) {
      console.error('\n   Number not available. Try a different one.')
    } else if (err.code === 21609) {
      console.error('\n   Insufficient funds. Add money to your Twilio account.')
    }
  })

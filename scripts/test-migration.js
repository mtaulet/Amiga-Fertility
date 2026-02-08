#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMigration() {
  console.log('🔍 Testing migration...\n')

  // Test if new columns exist by trying to select them
  const { data, error } = await supabase
    .from('patients')
    .select('id, intake_completed, address_line1, city, state, country, partner_name')
    .limit(1)

  if (error) {
    console.error('❌ Migration test failed:', error.message)
    process.exit(1)
  }

  console.log('✅ All new columns exist!')
  console.log('✅ Migration successful!\n')
  
  if (data && data.length > 0) {
    console.log('Sample record structure:', Object.keys(data[0]))
  } else {
    console.log('No patient records yet (expected for fresh database)')
  }
}

testMigration()

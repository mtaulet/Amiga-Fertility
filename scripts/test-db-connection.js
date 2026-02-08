#!/usr/bin/env node

// Test Supabase database connection
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if tables exist...')
    const { data: tables, error: tablesError } = await supabase
      .from('patients')
      .select('*')
      .limit(0)

    if (tablesError && tablesError.code !== 'PGRST116') {
      throw tablesError
    }
    console.log('   ✅ patients table exists')

    const { error: profilesError } = await supabase
      .from('patient_profiles')
      .select('*')
      .limit(0)
    if (profilesError && profilesError.code !== 'PGRST116') {
      throw profilesError
    }
    console.log('   ✅ patient_profiles table exists')

    const { error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(0)
    if (appointmentsError && appointmentsError.code !== 'PGRST116') {
      throw appointmentsError
    }
    console.log('   ✅ appointments table exists')

    const { error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .limit(0)
    if (documentsError && documentsError.code !== 'PGRST116') {
      throw documentsError
    }
    console.log('   ✅ documents table exists')

    const { error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(0)
    if (messagesError && messagesError.code !== 'PGRST116') {
      throw messagesError
    }
    console.log('   ✅ messages table exists')

    // Test 2: Create a test patient
    console.log('\n2. Testing database write...')
    const testPatient = {
      auth0_id: 'test_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      first_name: 'Test',
      last_name: 'Patient'
    }

    const { data: newPatient, error: insertError } = await supabase
      .from('patients')
      .insert(testPatient)
      .select()
      .single()

    if (insertError) throw insertError
    console.log('   ✅ Successfully created test patient')

    // Test 3: Read the patient back
    console.log('\n3. Testing database read...')
    const { data: readPatient, error: readError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', newPatient.id)
      .single()

    if (readError) throw readError
    console.log('   ✅ Successfully read test patient')

    // Test 4: Delete test patient
    console.log('\n4. Cleaning up...')
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', newPatient.id)

    if (deleteError) throw deleteError
    console.log('   ✅ Test data cleaned up')

    console.log('\n🎉 All tests passed! Database is ready to use.\n')

  } catch (error) {
    console.error('\n❌ Database test failed:')
    console.error(error.message)
    console.error('\nMake sure you:')
    console.error('1. Ran the migration SQL in Supabase SQL Editor')
    console.error('2. Checked that .env.local has correct Supabase credentials')
    process.exit(1)
  }
}

testConnection()

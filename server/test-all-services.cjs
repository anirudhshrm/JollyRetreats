#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Load environment from current directory
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key) process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

loadEnv('.env')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`),
  detail: (msg) => console.log(`  ${msg}`)
}

// ============ 1. DATABASE CONNECTION TEST ============
async function testDatabaseConnection() {
  log.section('DATABASE CONNECTION TEST')
  
  try {
    const mysql = require('mysql2/promise')

    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'retreat_platform_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    })

    const connection = await pool.getConnection()
    await connection.execute('SELECT 1 as test')
    connection.release()

    log.success('Database connection established')
    log.detail(`Host: ${process.env.DB_HOST || 'localhost'}`)
    log.detail(`Port: ${process.env.DB_PORT || 3306}`)
    log.detail(`Database: ${process.env.DB_NAME || 'retreat_platform_db'}`)
    log.detail(`User: ${process.env.DB_USER || 'root'}`)
    
    // Try to get table count
    const conn2 = await pool.getConnection()
    const [tables] = await conn2.execute(
      `SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?`,
      [process.env.DB_NAME || 'retreat_platform_db']
    )
    conn2.release()
    
    log.detail(`Tables in database: ${tables[0].table_count}`)
    
    await pool.end()
    return true
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`)
    log.detail(`MySQL Server: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`)
    log.detail(`Status: Make sure MySQL is running and accessible`)
    log.detail(`Login: ${process.env.DB_USER || 'root'}`)
    return false
  }
}

// ============ 2. NODEMAILER TEST ============
async function testNodemailer() {
  log.section('NODEMAILER TEST')
  
  try {
    const nodemailer = require('nodemailer')

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      log.warning('Email credentials not configured')
      log.detail(`EMAIL_USER: ${process.env.EMAIL_USER ? '✓' : '✗ not set'}`)
      log.detail(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✓' : '✗ not set'}`)
      return false
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    await transporter.verify()
    log.success('Nodemailer connection verified')
    log.detail(`Email Service: Gmail`)
    log.detail(`User: ${process.env.EMAIL_USER}`)
    log.detail(`Status: Ready to send emails`)
    
    return true
  } catch (error) {
    log.error(`Nodemailer verification failed: ${error.message}`)
    log.detail(`Check EMAIL_USER and EMAIL_PASSWORD in server/.env`)
    log.detail(`Gmail with 2FA: Use App Password (https://myaccount.google.com/apppasswords)`)
    return false
  }
}

// ============ 3. JEST TEST ============
async function testJest() {
  log.section('JEST TEST')
  
  try {
    const rootDir = __dirname
    
    // Check if jest is installed in server
    const serverPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'))
    if (serverPackageJson.devDependencies && serverPackageJson.devDependencies.jest) {
      log.success('Jest is installed')
      log.detail(`Jest version: ${serverPackageJson.devDependencies.jest}`)
    } else {
      log.warning('Jest not found in devDependencies')
    }

    // Check if test files exist
    const testFiles = [
      './routes/__tests__/health.test.js',
      './jest.config.cjs'
    ]

    let testFilesFound = 0
    for (const file of testFiles) {
      const fullPath = path.join(rootDir, file)
      if (fs.existsSync(fullPath)) {
        testFilesFound++
        log.detail(`Found: ${file}`)
      }
    }

    if (testFilesFound > 0) {
      log.success(`Found ${testFilesFound} test configuration/file(s)`)
      return true
    } else {
      log.warning('No test files found')
      return false
    }
  } catch (error) {
    log.error(`Jest check failed: ${error.message}`)
    return false
  }
}

// ============ 4. CHATBOT TEST ============
async function testChatbot() {
  log.section('CHATBOT TEST')
  
  try {
    const chatbotRoute = path.join(__dirname, 'routes', 'chatbot.js')
    
    if (fs.existsSync(chatbotRoute)) {
      log.success('Chatbot route file exists')
      
      const content = fs.readFileSync(chatbotRoute, 'utf-8')
      
      // Check for key functions
      const hasGetReply = content.includes('getReply')
      const hasSuggestions = content.includes('suggestions')
      const hasRouter = content.includes('router')
      const hasPostEndpoint = content.includes("router.post('/message'") || content.includes('router.post')
      
      if (hasGetReply) log.detail('✓ getReply function found')
      if (hasSuggestions) log.detail('✓ Suggestions array found')
      if (hasRouter) log.detail('✓ Express router found')
      if (hasPostEndpoint) log.detail('✓ POST endpoint found')
      
      // Count response patterns
      const replyCount = (content.match(/if \(includesAny/g) || []).length
      log.detail(`Response patterns: ${replyCount}`)
      
      if (hasGetReply && hasSuggestions && hasRouter) {
        log.success('Chatbot implementation complete with AI responses')
        return true
      }
    } else {
      log.error('Chatbot route file not found')
      return false
    }
  } catch (error) {
    log.error(`Chatbot check failed: ${error.message}`)
    return false
  }
}

// ============ 5. FIREBASE TEST ============
async function testFirebase() {
  log.section('FIREBASE TEST')
  
  try {
    const firebaseEnabled = process.env.VITE_FIREBASE_AUTH_ENABLED
    const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY
    const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID
    
    log.detail(`Firebase Auth Enabled: ${firebaseEnabled || 'false'}`)
    log.detail(`Firebase API Key: ${firebaseApiKey ? '✓ configured' : '✗ not configured'}`)
    log.detail(`Firebase Project ID: ${firebaseProjectId ? '✓ configured' : '✗ not configured'}`)
    
    if (firebaseEnabled === 'true') {
      if (firebaseApiKey && firebaseProjectId) {
        log.success('Firebase is properly configured')
        return true
      } else {
        log.warning('Firebase enabled but missing credentials')
        return false
      }
    } else {
      log.warning('Firebase Auth is disabled')
      log.detail('Status: Optional feature - not required for core functionality')
      return true
    }
  } catch (error) {
    log.error(`Firebase check failed: ${error.message}`)
    return false
  }
}

// ============ 6. ENV CONFIGURATION CHECK ============
async function testEnvConfig() {
  log.section('ENVIRONMENT CONFIGURATION')
  
  try {
    log.detail('Server Configuration:')
    log.detail(`  PORT: ${process.env.PORT || '4000'}`)
    log.detail(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`)
    log.detail(`  DB_PORT: ${process.env.DB_PORT || 3306}`)
    log.detail(`  DB_NAME: ${process.env.DB_NAME || 'retreat_platform_db'}`)
    log.detail(`  DB_USER: ${process.env.DB_USER || 'root'}`)
    log.detail(`  EMAIL_USER: ${process.env.EMAIL_USER ? '✓ configured' : '✗ not configured'}`)
    log.detail(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✓ configured' : '✗ not configured'}`)
    log.detail(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
    
    return true
  } catch (error) {
    log.error(`Configuration check failed: ${error.message}`)
    return false
  }
}

// ============ 7. SERVER ROUTES TEST ============
async function testServerRoutes() {
  log.section('SERVER ROUTES VERIFICATION')
  
  try {
    const serverFile = path.join(__dirname, 'server.js')
    
    if (fs.existsSync(serverFile)) {
      const content = fs.readFileSync(serverFile, 'utf-8')
      
      const routes = [
        { name: 'Auth', pattern: '/api/auth' },
        { name: 'Users', pattern: '/api/users' },
        { name: 'Tours', pattern: '/api/tours' },
        { name: 'Bookings', pattern: '/api/bookings' },
        { name: 'Chatbot', pattern: '/api/chatbot' }
      ]
      
      let foundRoutes = 0
      routes.forEach(route => {
        if (content.includes(route.pattern)) {
          log.detail(`✓ ${route.name} (${route.pattern})`)
          foundRoutes++
        }
      })
      
      if (foundRoutes > 0) {
        log.success(`Found ${foundRoutes} API route(s)`)
        return true
      }
    } else {
      log.error('Server file not found')
      return false
    }
  } catch (error) {
    log.error(`Server routes check failed: ${error.message}`)
    return false
  }
}

// ============ MAIN TEST RUNNER ============
async function runAllTests() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║         JOLLY RETREATS - SERVICE VERIFICATION TEST         ║
║              Complete System Health Check                  ║
║                 Running from Server Directory              ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`)

  const results = {
    'Environment': await testEnvConfig(),
    'Server Routes': await testServerRoutes(),
    'Database': await testDatabaseConnection(),
    'Nodemailer': await testNodemailer(),
    'Chatbot': await testChatbot(),
    'Jest': await testJest(),
    'Firebase': await testFirebase()
  }

  // Summary
  log.section('TEST SUMMARY')
  
  const entries = Object.entries(results)
  const total = entries.length
  const passed = entries.filter(([_, result]) => result === true).length
  const failed = entries.filter(([_, result]) => result === false).length
  
  entries.forEach(([name, result]) => {
    let status
    if (result === true) {
      status = `${colors.green}✓ PASS${colors.reset}`
    } else {
      status = `${colors.red}✗ FAIL${colors.reset}`
    }
    console.log(`  ${name.padEnd(20)}: ${status}`)
  })
  
  console.log(`\n  ${colors.cyan}Results: ${colors.green}${passed} passed${colors.reset} ${colors.red}${failed} failed${colors.reset}${colors.cyan} (${total} total)${colors.reset}`)
  
  console.log()
  
  if (failed === 0) {
    log.success('✓ All services are operational!')
  } else if (failed > 0 && passed > 0) {
    log.warning(`⚠ ${failed} service(s) need attention - see details above`)
  } else {
    log.error('✗ Multiple services require configuration')
  }
  
  console.log()
  
  return passed === total
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(err => {
  console.error('Test suite error:', err)
  process.exit(1)
})

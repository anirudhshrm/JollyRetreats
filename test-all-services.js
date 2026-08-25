import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: './server/.env' })

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
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'retreat_platform_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    })

    const connection = await pool.getConnection()
    const result = await connection.execute('SELECT 1 as test')
    connection.release()

    log.success('Database connection established')
    log.detail(`Host: ${process.env.DB_HOST || 'localhost'}`)
    log.detail(`Port: ${process.env.DB_PORT || 3306}`)
    log.detail(`Database: ${process.env.DB_NAME || 'retreat_platform_db'}`)
    log.detail(`User: ${process.env.DB_USER || 'root'}`)
    
    // Try to get table count
    const [tables] = await connection.execute(`SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?`, [process.env.DB_NAME || 'retreat_platform_db'])
    connection.release()
    
    log.detail(`Tables in database: ${tables[0].table_count}`)
    
    await pool.end()
    return true
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`)
    log.detail(`Make sure MySQL is running on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`)
    return false
  }
}

// ============ 2. NODEMAILER TEST ============
async function testNodemailer() {
  log.section('NODEMAILER TEST')
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    // Test connection
    await transporter.verify()
    log.success('Nodemailer connection verified')
    log.detail(`Email Service: Gmail`)
    log.detail(`User: ${process.env.EMAIL_USER}`)
    
    // Note: Uncomment to send a test email
    // const info = await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: process.env.EMAIL_USER,
    //   subject: 'Nodemailer Test',
    //   html: '<h1>Test Email</h1><p>This is a test email from Nodemailer</p>'
    // })
    // log.detail(`Test email sent: ${info.messageId}`)
    
    return true
  } catch (error) {
    log.error(`Nodemailer verification failed: ${error.message}`)
    log.detail(`Check your EMAIL_USER and EMAIL_PASSWORD in .env file`)
    log.detail(`For Gmail with 2FA, use App Password: https://myaccount.google.com/apppasswords`)
    return false
  }
}

// ============ 3. JEST TEST ============
async function testJest() {
  log.section('JEST TEST')
  
  try {
    // Check if jest is installed
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
    if (packageJson.devDependencies.jest) {
      log.success('Jest is installed')
      log.detail(`Jest version: ${packageJson.devDependencies.jest}`)
    } else {
      log.warning('Jest not found in devDependencies')
      return false
    }

    // Check server jest
    const serverPackageJson = JSON.parse(fs.readFileSync('./server/package.json', 'utf-8'))
    if (serverPackageJson.devDependencies.jest) {
      log.success('Jest is installed in server')
      log.detail(`Server Jest version: ${serverPackageJson.devDependencies.jest}`)
    }

    // Check if test files exist
    const testFiles = [
      './server/routes/__tests__/health.test.js',
      './server/jest.config.cjs',
      './jest.config.cjs'
    ]

    let testFilesFound = 0
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
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
    const chatbotRoute = './server/routes/chatbot.js'
    
    if (fs.existsSync(chatbotRoute)) {
      log.success('Chatbot route file exists')
      
      const content = fs.readFileSync(chatbotRoute, 'utf-8')
      
      // Check for key functions
      const hasGetReply = content.includes('getReply')
      const hasSuggestions = content.includes('suggestions')
      const hasRouter = content.includes('router')
      
      if (hasGetReply) log.detail('✓ getReply function found')
      if (hasSuggestions) log.detail('✓ Suggestions array found')
      if (hasRouter) log.detail('✓ Express router found')
      
      // Count response patterns
      const replyCount = (content.match(/if \(includesAny/g) || []).length
      log.detail(`Response patterns: ${replyCount}`)
      
      if (hasGetReply && hasSuggestions && hasRouter) {
        log.success('Chatbot implementation looks complete')
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
    const envFile = './.env'
    const envContent = fs.readFileSync(envFile, 'utf-8')
    
    const firebaseEnabled = process.env.VITE_FIREBASE_AUTH_ENABLED
    const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY
    
    log.detail(`Firebase Auth Enabled: ${firebaseEnabled || 'false'}`)
    
    if (firebaseEnabled === 'false' || !firebaseEnabled) {
      log.warning('Firebase Auth is disabled in .env')
      log.detail('To enable Firebase:')
      log.detail('1. Create a Firebase project at https://console.firebase.google.com')
      log.detail('2. Copy credentials to .env file')
      log.detail('3. Set VITE_FIREBASE_AUTH_ENABLED=true')
      return false
    }
    
    if (!firebaseApiKey) {
      log.error('Firebase API Key is not configured')
      return false
    }
    
    log.success('Firebase is configured')
    return true
  } catch (error) {
    log.error(`Firebase check failed: ${error.message}`)
    return false
  }
}

// ============ 6. ENV CONFIGURATION CHECK ============
async function testEnvConfig() {
  log.section('ENVIRONMENT CONFIGURATION')
  
  try {
    const serverEnv = './.server/.env'
    const clientEnv = './.env'
    
    log.detail('Server Environment (.env):')
    log.detail(`  PORT: ${process.env.PORT || '4000'}`)
    log.detail(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`)
    log.detail(`  DB_NAME: ${process.env.DB_NAME || 'retreat_platform_db'}`)
    log.detail(`  EMAIL_USER: ${process.env.EMAIL_USER ? '✓ configured' : '✗ not configured'}`)
    log.detail(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✓ configured' : '✗ not configured'}`)
    
    log.detail('\nClient Environment (.env):')
    log.detail(`  VITE_API_BASE_URL: ${process.env.VITE_API_BASE_URL || 'localhost'}`)
    log.detail(`  VITE_API_PORT: ${process.env.VITE_API_PORT || '4000'}`)
    
    return true
  } catch (error) {
    log.error(`Configuration check failed: ${error.message}`)
    return false
  }
}

// ============ MAIN TEST RUNNER ============
async function runAllTests() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║         JOLLY RETREATS - SERVICE VERIFICATION TEST         ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`)

  const results = {
    database: await testDatabaseConnection(),
    nodemailer: await testNodemailer(),
    jest: await testJest(),
    chatbot: await testChatbot(),
    firebase: await testFirebase(),
    environment: await testEnvConfig()
  }

  // Summary
  log.section('TEST SUMMARY')
  
  const total = Object.keys(results).length
  const passed = Object.values(results).filter(r => r).length
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`
    console.log(`  ${name.padEnd(15)}: ${status}`)
  })
  
  console.log(`\n  ${colors.cyan}Total: ${passed}/${total} services working${colors.reset}`)
  
  if (passed === total) {
    log.success('All services are operational!')
  } else {
    log.warning(`${total - passed} service(s) need attention`)
  }
  
  console.log()
}

// Run tests
runAllTests().catch(err => {
  console.error('Test suite error:', err)
  process.exit(1)
})

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('═══════════════════════════════════════════════════════');
console.log('          NODEMAILER FUNCTIONALITY TEST');
console.log('═══════════════════════════════════════════════════════\n');

// Step 1: Check configuration
console.log('📋 Step 1: Checking Configuration');
console.log('─────────────────────────────────────');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

console.log(`✓ EMAIL_USER: ${EMAIL_USER ? EMAIL_USER : '❌ NOT SET'}`);
console.log(`✓ EMAIL_PASSWORD: ${EMAIL_PASSWORD ? '✓ SET (' + EMAIL_PASSWORD.length + ' chars)' : '❌ NOT SET'}`);

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.log('\n❌ CONFIGURATION MISSING - Cannot proceed');
  process.exit(1);
}

// Step 2: Create transporter
console.log('\n📋 Step 2: Creating Email Transporter');
console.log('─────────────────────────────────────');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  }
});

console.log('✓ Transporter created');

// Step 3: Verify connection
console.log('\n📋 Step 3: Verifying SMTP Connection');
console.log('─────────────────────────────────────');

try {
  await transporter.verify();
  console.log('✅ SMTP Connection Successful!');
  console.log(`   Server: Gmail SMTP`);
  console.log(`   Port: 587 (TLS)`);
  console.log(`   User: ${EMAIL_USER}`);
} catch (error) {
  console.log('❌ SMTP Connection Failed!');
  console.log(`   Error: ${error.message}`);
  console.log(`   Code: ${error.code}`);
  process.exit(1);
}

// Step 4: Test email sending
console.log('\n📋 Step 4: Testing Email Sending');
console.log('─────────────────────────────────────');

const testEmail = {
  from: EMAIL_USER,
  to: EMAIL_USER,
  subject: '🧪 Nodemailer Test - Jolly Retreats',
  html: `
    <div style="font-family: Arial; color: #333;">
      <h2>🧪 Nodemailer Test</h2>
      <p>This is a test email from Jolly Retreats system.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p style="background: #e8f5e9; padding: 10px; border-radius: 5px;">
        ✅ If you received this, Nodemailer is working correctly!
      </p>
    </div>
  `
};

try {
  const result = await transporter.sendMail(testEmail);
  console.log('✅ Test Email Sent Successfully!');
  console.log(`   Message ID: ${result.messageId}`);
  console.log(`   Response: ${result.response}`);
} catch (error) {
  console.log('❌ Failed to Send Test Email!');
  console.log(`   Error: ${error.message}`);
  console.log(`   Code: ${error.code}`);
  process.exit(1);
}

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('                    ✅ ALL TESTS PASSED');
console.log('═══════════════════════════════════════════════════════');
console.log('\n📧 Email System Status:');
console.log('   ✅ Configuration: Valid');
console.log('   ✅ SMTP Connection: Working');
console.log('   ✅ Email Sending: Functional');
console.log('\n🎯 Ready to send booking confirmations!');
console.log('═══════════════════════════════════════════════════════\n');

process.exit(0);

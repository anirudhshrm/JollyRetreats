import nodemailer from 'nodemailer'

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (booking, invoicePdf) => {
  try {
    const transporter = createTransporter()

    // Format the email content
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #667eea; border-radius: 4px; }
            .section-title { font-weight: bold; color: #667eea; margin-bottom: 10px; font-size: 14px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .total-row { font-size: 18px; font-weight: bold; color: #667eea; padding-top: 10px; }
            .booking-id { background: #667eea; color: white; padding: 10px; border-radius: 4px; text-align: center; font-size: 14px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            .traveler { background: white; padding: 12px; margin: 10px 0; border-radius: 4px; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Booking Confirmed!</h1>
              <p>Your tour booking has been successfully confirmed.</p>
            </div>

            <div class="booking-id">
              Booking ID: ${booking.booking_id}
            </div>

            <div class="section">
              <div class="section-title">TOUR DETAILS</div>
              <div class="detail-row">
                <span class="label">Tour Name:</span>
                <span class="value">${booking.tour_title}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${booking.tour_description ? booking.tour_description.substring(0, 50) + '...' : 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Start Date:</span>
                <span class="value">${new Date(booking.start_date).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">End Date:</span>
                <span class="value">${new Date(booking.end_date).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Travelers:</span>
                <span class="value">${booking.total_people}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">PRIMARY CONTACT INFORMATION</div>
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${booking.primary_contact_person}</span>
              </div>
              <div class="detail-row">
                <span class="label">Phone:</span>
                <span class="value">${booking.primary_contact_phone}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${booking.customer_email}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">PRICING SUMMARY</div>
              <div class="detail-row">
                <span class="label">Price per Person:</span>
                <span class="value">$${booking.price_per_person.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Subtotal (${booking.total_people} travelers):</span>
                <span class="value">$${(booking.price_per_person * booking.total_people).toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Taxes (12%):</span>
                <span class="value">$${booking.tax_amount.toFixed(2)}</span>
              </div>
              <div class="detail-row total-row">
                <span>Total Amount:</span>
                <span>$${booking.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">TOUR DESCRIPTION</div>
              <p>${booking.tour_description}</p>
            </div>

            <div class="section">
              <div class="section-title">WHAT'S NEXT?</div>
              <p>
                ✓ Your invoice PDF is attached to this email<br>
                ✓ A reminder will be sent 7 days before your trip<br>
                ✓ Contact us at support@jollyretreats.com for any queries
              </p>
            </div>

            <div class="footer">
              <p>Thank you for choosing Jolly Retreats!</p>
              <p>© 2026 Jolly Retreats. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.customer_email,
      subject: `Booking Confirmed - ${booking.tour_title} (ID: ${booking.booking_id})`,
      html: emailContent,
      attachments: []
    }

    // Attach PDF invoice if available
    if (invoicePdf) {
      mailOptions.attachments.push({
        filename: `invoice-${booking.booking_id}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf'
      })
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)
    console.log('✓ Confirmation email sent:', info.response)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('✗ Error sending confirmation email:', error.message)
    // Don't throw error - booking is already created, just log the issue
    return { success: false, error: error.message }
  }
}

// Send welcome email to new travelers
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter()

    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Jolly Retreats!</h1>
            </div>
            <p>Hi ${name},</p>
            <p>Welcome to Jolly Retreats! We're thrilled to have you join our community of adventure seekers.</p>
            <p>You can now browse tours, make bookings, and manage your reservations from your dashboard.</p>
            <p>Happy travels!</p>
            <div class="footer">
              <p>© 2026 Jolly Retreats. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Jolly Retreats!',
      html: emailContent
    })

    console.log('✓ Welcome email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('✗ Error sending welcome email:', error.message)
    return { success: false, error: error.message }
  }
}

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('✓ Email configuration is valid and ready')
    return { success: true, message: 'Email service is configured correctly' }
  } catch (error) {
    console.error('✗ Email configuration error:', error.message)
    return { success: false, error: error.message }
  }
}

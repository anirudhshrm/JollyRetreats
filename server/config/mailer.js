import nodemailer from 'nodemailer'

// Configure your email service here
// For Gmail: enable "Less secure app access" or use App Password with 2FA
// For other services: adjust the SMTP settings accordingly

const createTransporter = () => {
  // Using Gmail as example - you can change to your preferred email service
  // Gmail requires an App Password if 2FA is enabled
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  })

  return transporter
}

export const mailer = createTransporter()

export const sendCustomEmailToTraveler = async (email, travelerName, subject, message, attachments = []) => {
  try {
    if (!email || !email.trim()) {
      throw new Error('Email address is required')
    }

    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .message { white-space: pre-wrap; word-wrap: break-word; }
            .attachment-note { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Message from Jolly Retreats</h1>
            </div>

            <div class="content">
              <p>Dear <strong>${travelerName || 'Traveler'}</strong>,</p>
              <div class="message">${message}</div>
              ${attachments && attachments.length > 0 ? `
              <div class="attachment-note">
                <strong>📎 Attachments:</strong> This email includes important document(s). Please find ${attachments.length === 1 ? 'the attachment' : 'the attachments'} attached below.
              </div>
              ` : ''}
              <p style="margin-top: 20px;">Best regards,<br><strong>Jolly Retreats Team</strong></p>
            </div>

            <div class="footer">
              <p>© 2026 Jolly Retreats. All rights reserved.</p>
              <p>This is an automated email. For urgent queries, please contact us through our website.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@jollyretreats.com',
      to: email.trim(),
      subject: subject || 'Message from Jolly Retreats',
      html: emailContent,
      attachments: attachments && attachments.length > 0 ? attachments : []
    }

    const result = await mailer.sendMail(mailOptions)
    console.log(`✅ Email sent to ${email} (Message ID: ${result.messageId})`)
    return { success: true, messageId: result.messageId, email }
  } catch (error) {
    console.error('❌ Error sending email:', error.message)
    return { success: false, error: error.message }
  }
}

export const sendBookingConfirmationEmail = async (booking, tourDetails, invoiceBuffer) => {
  try {
    console.log('🔍 DEBUG - Booking travelers:', booking.travelers)
    console.log('🔍 DEBUG - Primary traveler:', booking.travelers?.[0])
    console.log('🔍 DEBUG - Primary traveler email:', booking.travelers?.[0]?.email)
    console.log('🔍 DEBUG - Customer email (booked by):', booking.customer_email)
    
    // ALWAYS use primary traveler's email (NOT the customer/logged-in user email)
    let emailRecipient = null
    
    if (booking.travelers && Array.isArray(booking.travelers) && booking.travelers.length > 0) {
      const travelerEmail = booking.travelers[0].email
      if (travelerEmail && String(travelerEmail).trim()) {
        emailRecipient = String(travelerEmail).trim()
      }
    }
    
    // Only use customer email if we don't have a traveler email
    if (!emailRecipient && booking.customer_email) {
      emailRecipient = booking.customer_email
    }
    
    console.log('🔍 DEBUG - Final email recipient:', emailRecipient)
    // Use primary traveler's name (not logged-in customer name)
    const primaryTravelerName = booking.travelers && booking.travelers[0]?.name
    const customerName = primaryTravelerName || booking.customer_name || 'Guest'
    const primaryContact = booking.primary_contact_person
    const primaryPhone = booking.primary_contact_phone

    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
            .section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
            .section:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #2d5016; }
            .booking-details { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .traveler-info { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #2d5016; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmation</h1>
              <p>Your tour booking has been confirmed!</p>
            </div>

            <div class="content">
              <div class="section">
                <p>Dear <strong>${customerName}</strong>,</p>
                <p>Thank you for booking with Jolly Retreats! Your tour has been confirmed. Please find all the details below.</p>
              </div>

              <div class="section">
                <h2 style="color: #2d5016; border-bottom: 2px solid #2d5016; padding-bottom: 10px;">Tour Details</h2>
                <div class="booking-details">
                  <table>
                    <tr>
                      <td><span class="label">Booking ID:</span></td>
                      <td>${booking.booking_id}</td>
                    </tr>
                    <tr>
                      <td><span class="label">Tour Name:</span></td>
                      <td>${booking.tour_title}</td>
                    </tr>
                    <tr>
                      <td><span class="label">Travel Dates:</span></td>
                      <td>${new Date(booking.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${new Date(booking.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td><span class="label">Number of Travelers:</span></td>
                      <td>${booking.total_people}</td>
                    </tr>
                    <tr>
                      <td><span class="label">Price Per Person:</span></td>
                      <td>$${parseFloat(booking.price_per_person).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td><span class="label">Taxes:</span></td>
                      <td>$${parseFloat(booking.tax_amount).toFixed(2)}</td>
                    </tr>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                      <td><span class="label">Total Amount:</span></td>
                      <td style="color: #2d5016; font-size: 18px;">$${parseFloat(booking.total_amount).toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <div class="section">
                <h2 style="color: #2d5016; border-bottom: 2px solid #2d5016; padding-bottom: 10px;">Tour Description</h2>
                <p>${booking.tour_description || 'No description available'}</p>
              </div>

              <div class="section">
                <h2 style="color: #2d5016; border-bottom: 2px solid #2d5016; padding-bottom: 10px;">Primary Contact Information</h2>
                <div class="traveler-info">
                  <p><strong>${primaryContact}</strong></p>
                  <p>📞 ${primaryPhone}</p>
                </div>
              </div>

              <div class="section">
                <h2 style="color: #2d5016; border-bottom: 2px solid #2d5016; padding-bottom: 10px;">Traveler Details</h2>
                ${booking.travelers && booking.travelers.length > 0 ? booking.travelers.map((traveler, index) => `
                  <div class="traveler-info">
                    <p><strong>Traveler ${index + 1}: ${traveler.name}</strong></p>
                    <p>Age: ${traveler.age} | Gender: ${traveler.gender}</p>
                    <p>📞 ${traveler.contact_number}</p>
                  </div>
                `).join('') : '<p>No traveler details available</p>'}
              </div>

              <div class="section">
                <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px;">
                  <strong>⚠️ Important:</strong> The invoice PDF is attached to this email. Please keep it safe for your records.
                </p>
              </div>

              <div class="section" style="text-align: center; background-color: #e8f5e9; padding: 20px; border-radius: 5px;">
                <h3 style="color: #2d5016; margin-top: 0;">Next Steps</h3>
                <p>1. Review your booking details above</p>
                <p>2. Download and save the attached invoice PDF</p>
                <p>3. Check your email for further updates closer to your travel date</p>
                <p>4. Contact us if you have any questions</p>
              </div>
            </div>

            <div class="footer">
              <p>© 2026 Jolly Retreats. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
              <p>For support, please contact us through our website.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@jollyretreats.com',
      to: emailRecipient,
      subject: `Booking Confirmation - ${booking.booking_id} | ${booking.tour_title}`,
      html: emailContent,
      attachments: invoiceBuffer ? [
        {
          filename: `invoice-${booking.booking_id}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    }

    const result = await mailer.sendMail(mailOptions)
    console.log(`✅ Confirmation email sent to ${emailRecipient} (Message ID: ${result.messageId})`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.message)
    return { success: false, error: error.message }
  }
}

export const createInvoiceAttachment = (invoiceBuffer, bookingId = 'booking') => {
  if (!invoiceBuffer) return []
  return [
    {
      filename: `invoice-${bookingId}.pdf`,
      content: invoiceBuffer,
      contentType: 'application/pdf'
    }
  ]
}

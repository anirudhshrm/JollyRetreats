import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireUser } from '../middleware/auth.js'
import { bookingsModel } from '../models/bookingsModel.js'
import { fallbackBookingsModel } from '../models/fallbackModels.js'
import { isDbConnected } from '../config/runtime.js'
import {
  isValidPhoneNumber,
  isPositiveInteger,
  normalizePhoneNumber,
  validBookingStatuses,
  validServiceTypes
} from '../utils/validators.js'
import { sendCustomEmailToTraveler, createInvoiceAttachment } from '../config/mailer.js'
import { buildTourInvoicePdf } from '../utils/pdfInvoice.js'


const router = express.Router()
const getBookingsStore = () => (isDbConnected() ? bookingsModel : fallbackBookingsModel)

const canAccessBooking = (requestUser, bookingUserId) => {
  return requestUser.role === 'admin' || Number(requestUser.id) === Number(bookingUserId)
}

const validateBookingTraveler = (traveler, index, label = 'Traveler') => {
  const age = Number(traveler?.age)
  if (!Number.isInteger(age) || age < 1 || age > 100) {
    return `${label} ${index + 1}: age must be a whole number between 1 and 100`
  }

  const contact = normalizePhoneNumber(traveler?.contact || traveler?.contactNumber || traveler?.contact_number || '')
  if (!isValidPhoneNumber(contact)) {
    return `${label} ${index + 1}: contact number must include a country code and exactly 10 local digits`
  }

  return null
}

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const bookingsStore = getBookingsStore()
  const data = req.user.role === 'admin'
    ? await bookingsStore.getAll()
    : await bookingsStore.getByUserId(req.user.id)

  res.json({ success: true, data })
}))

router.get('/service/:serviceId', requireAuth, asyncHandler(async (req, res) => {
  const serviceId = Number(req.params.serviceId)
  if (!isPositiveInteger(serviceId)) {
    return res.status(400).json({ success: false, message: 'serviceId must be a positive integer' })
  }
  const serviceType = req.query.serviceType ? String(req.query.serviceType) : null
  if (serviceType && !validServiceTypes.has(serviceType)) {
    return res.status(400).json({ success: false, message: 'Invalid serviceType' })
  }

  const data = await getBookingsStore().getByServiceId(serviceId, serviceType)
  return res.json({ success: true, data })
}))

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const bookingsStore = getBookingsStore()
  const booking = await bookingsStore.getById(req.params.id)
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' })
  }

  if (!canAccessBooking(req.user, booking.user_id)) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  return res.json({ success: true, data: booking })
}))

router.post('/', requireAuth, requireUser, asyncHandler(async (req, res) => {
  const {
    serviceType,
    serviceId,
    bookingCount = 1,
    bookingDate,
    dropoffDate,
    status,
    serviceName,
    serviceDescription,
    serviceLocation,
    servicePrice,
    travelers,
    guestDetails
  } = req.body

  if (!serviceType || serviceId === undefined || !bookingDate) {
    return res.status(400).json({
      success: false,
      message: 'serviceType, serviceId and bookingDate are required'
    })
  }
  if (!validServiceTypes.has(serviceType)) {
    return res.status(400).json({ success: false, message: 'Invalid serviceType' })
  }
  if (!isPositiveInteger(serviceId)) {
    return res.status(400).json({ success: false, message: 'serviceId must be a positive integer' })
  }
  if (!isPositiveInteger(bookingCount)) {
    return res.status(400).json({ success: false, message: 'bookingCount must be a positive integer' })
  }
  if (status !== undefined && !validBookingStatuses.has(status)) {
    return res.status(400).json({ success: false, message: 'Invalid booking status' })
  }

  const submittedTravelers = Array.isArray(travelers) && travelers.length > 0 ? travelers : guestDetails
  if (Array.isArray(submittedTravelers)) {
    for (let index = 0; index < submittedTravelers.length; index += 1) {
      const error = validateBookingTraveler(
        submittedTravelers[index],
        index,
        submittedTravelers === guestDetails ? 'Guest' : 'Traveler'
      )
      if (error) {
        return res.status(400).json({ success: false, message: error })
      }
    }
  }
  
  // Validate dropoff date for car rentals - max 3 days difference
  if (dropoffDate && serviceType === 'car') {
    const pickupDate = new Date(bookingDate)
    const dropoff = new Date(dropoffDate)
    const daysDifference = Math.floor((dropoff - pickupDate) / (1000 * 60 * 60 * 24))
    
    if (daysDifference < 0) {
      return res.status(400).json({ success: false, message: 'Dropoff date must be after or equal to pickup date' })
    }
    if (daysDifference > 3) {
      return res.status(400).json({ success: false, message: 'Maximum rental duration is 3 days' })
    }
  }

  try {
    const booking = await getBookingsStore().create({
      userId: Number(req.user.id),
      serviceType,
      serviceId: Number(serviceId),
      bookingCount: Number(bookingCount),
      bookingDate,
      dropoffDate: dropoffDate || null,
      status: status || 'pending',
      serviceName: serviceName ? String(serviceName) : undefined,
      serviceDescription: serviceDescription ? String(serviceDescription) : undefined,
      serviceLocation: serviceLocation ? String(serviceLocation) : undefined,
      servicePrice: servicePrice !== undefined && servicePrice !== null ? Number(servicePrice) : undefined
    })

    // Send confirmation email if travelers or guestDetails data is provided
    let emailTravelers = travelers && Array.isArray(travelers) && travelers.length > 0 ? travelers : guestDetails
    
    console.log('🔍 DEBUG - Email sending triggered')
    console.log('🔍 DEBUG - emailTravelers:', emailTravelers)
    console.log('🔍 DEBUG - req.user.email:', req.user.email)
    
    if (booking && emailTravelers && Array.isArray(emailTravelers) && emailTravelers.length > 0) {
      const primaryTraveler = emailTravelers[0]
      // Get email from request user (for property bookings via guestDetails)
      const primaryEmail = primaryTraveler?.email || req.user.email || ''
      
      console.log('🔍 DEBUG - primaryEmail:', primaryEmail)
      console.log('🔍 DEBUG - primaryTraveler:', primaryTraveler)
      
      if (primaryEmail && primaryEmail.trim()) {
        try {
          const bookingConfirmationSubject = `🎉 Booking Confirmation - ${serviceName || 'Your Property Reservation'}`
          const bookingConfirmationMessage = `
Dear ${primaryTraveler.name || 'Guest'},

Thank you for booking with us! Your reservation has been confirmed successfully.

**Booking Details:**
- Property: ${serviceName || 'Property Reservation'}
- Check-in: ${bookingDate}
- Check-out: ${dropoffDate || 'N/A'}
- Number of Guests: ${bookingCount}
- Price per Night: $${servicePrice || 'N/A'}
- Total Price: $${(servicePrice * bookingCount) || 'N/A'}

**Location:** ${serviceLocation || 'N/A'}

${emailTravelers.length > 1 ? `
**Guest Information:**
${emailTravelers.map((g, i) => `${i + 1}. ${g.name || 'N/A'} (Age: ${g.age || 'N/A'}, Contact: ${g.contact || 'N/A'})`).join('\n')}
` : `
**Guest Information:**
${emailTravelers[0]?.name || 'Guest'} (Age: ${emailTravelers[0]?.age || 'N/A'}, Contact: ${emailTravelers[0]?.contact || 'N/A'})
`}

We look forward to hosting you!

Best regards,
**Jolly Retreats Team**

This is an automated confirmation email. Please do not reply to this email.
`
          
          // Generate invoice PDF for attachment
          let invoiceAttachments = []
          try {
            const mockBooking = {
              booking_id: booking.id || 'BK-' + Date.now(),
              customer_name: primaryTraveler.name || 'Guest',
              customer_email: primaryEmail,
              tour_title: serviceName || 'Property Reservation',
              tour_description: serviceDescription || '',
              start_date: bookingDate,
              end_date: dropoffDate || bookingDate,
              total_people: bookingCount,
              price_per_person: servicePrice || 0,
              total_amount: (servicePrice || 0) * bookingCount,
              tax_amount: ((servicePrice || 0) * bookingCount) * 0.1, // 10% tax
              primary_contact_person: primaryTraveler.name,
              primary_contact_phone: primaryTraveler.contact || primaryTraveler.phone || 'N/A',
              travelers: emailTravelers
            }
            
            const invoicePdf = buildTourInvoicePdf(mockBooking)
            invoiceAttachments = createInvoiceAttachment(invoicePdf, booking.id || 'booking')
            console.log('📄 Invoice PDF generated for email attachment')
          } catch (pdfError) {
            console.warn('⚠️ Warning: Could not generate invoice PDF:', pdfError.message)
            // Continue without attachment if PDF generation fails
          }
          
          await sendCustomEmailToTraveler(
            primaryEmail.trim(),
            primaryTraveler.name || 'Guest',
            bookingConfirmationSubject,
            bookingConfirmationMessage,
            invoiceAttachments
          )
          console.log(`✅ Booking confirmation email sent to ${primaryEmail}`)
        } catch (emailError) {
          console.warn('⚠️ Warning: Could not send confirmation email, but booking was created successfully:', emailError.message)
          // Don't fail the booking creation if email fails
        }
      }
    }

    res.status(201).json({ success: true, data: booking })
  } catch (error) {
    return res.status(409).json({ success: false, message: error.message || 'Service full' })
  }
}))

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const bookingsStore = getBookingsStore()
  const booking = await bookingsStore.getById(req.params.id)
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' })
  }
  if (!canAccessBooking(req.user, booking.user_id)) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  const { bookingDate, dropoffDate, status, bookingCount } = req.body
  if (status !== undefined && !validBookingStatuses.has(status)) {
    return res.status(400).json({ success: false, message: 'Invalid booking status' })
  }
  if (bookingCount !== undefined && !isPositiveInteger(bookingCount)) {
    return res.status(400).json({ success: false, message: 'bookingCount must be a positive integer' })
  }
  
  // Validate dropoff date for car rentals - max 3 days difference
  if (dropoffDate && booking.service_type === 'car') {
    const pickupDate = new Date(bookingDate || booking.booking_date)
    const dropoff = new Date(dropoffDate)
    const daysDifference = Math.floor((dropoff - pickupDate) / (1000 * 60 * 60 * 24))
    
    if (daysDifference < 0) {
      return res.status(400).json({ success: false, message: 'Dropoff date must be after or equal to pickup date' })
    }
    if (daysDifference > 3) {
      return res.status(400).json({ success: false, message: 'Maximum rental duration is 3 days' })
    }
  }

  try {
    const updated = await bookingsStore.updateById(req.params.id, {
      bookingDate,
      status,
      bookingCount
    })
    return res.json({ success: true, data: updated })
  } catch (error) {
    return res.status(409).json({ success: false, message: error.message || 'Unable to update booking' })
  }
}))

router.get('/:id/invoice', requireAuth, asyncHandler(async (req, res) => {
  const bookingsStore = getBookingsStore()
  const booking = await bookingsStore.getById(req.params.id)
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' })
  }
  if (!canAccessBooking(req.user, booking.user_id)) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  try {
    // Create invoice data object from booking
    const invoiceData = {
      booking_id: booking.id || 'BK-' + booking.user_id + '-' + Date.now(),
      customer_name: req.user.fullName || req.user.name || 'Guest',
      customer_email: req.user.email || 'N/A',
      tour_title: booking.serviceName || 'Experience',
      tour_description: booking.serviceDescription || '',
      start_date: booking.bookingDate || new Date().toISOString().split('T')[0],
      end_date: booking.bookingDate || new Date().toISOString().split('T')[0],
      total_people: booking.bookingCount || 1,
      price_per_person: booking.servicePrice || 0,
      total_amount: (booking.servicePrice || 0) * (booking.bookingCount || 1),
      tax_amount: ((booking.servicePrice || 0) * (booking.bookingCount || 1)) * 0.1, // 10% tax
      primary_contact_person: req.user.fullName || req.user.name || 'Guest',
      primary_contact_phone: req.user.phone || 'N/A',
      travelers: booking.travelers || []
    }

    const pdf = buildTourInvoicePdf(invoiceData)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking.id}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
  } catch (error) {
    console.error('Error generating invoice:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to generate invoice' })
  }
}))

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const bookingsStore = getBookingsStore()
  const booking = await bookingsStore.getById(req.params.id)
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' })
  }
  if (!canAccessBooking(req.user, booking.user_id)) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  await bookingsStore.deleteById(req.params.id)
  return res.json({ success: true, message: 'Booking deleted successfully' })
}))

export default router

import { query } from '../config/db.js'

const selectClause = `
  SELECT
    r.id,
    r.user_id,
    u.full_name AS user_name,
    r.service_type,
    r.service_id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at
  FROM reviews r
  LEFT JOIN users u ON u.id = r.user_id
`

const summaryFromRows = (rows) => {
  const count = rows.length
  const averageRating = count
    ? Math.round((rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / count) * 10) / 10
    : 0

  return { averageRating, count }
}

export const reviewsModel = {
  async listByService(serviceType, serviceId) {
    const reviews = await query(
      `${selectClause}
       WHERE r.service_type = ? AND r.service_id = ?
       ORDER BY r.created_at DESC`,
      [serviceType, serviceId]
    )
    return {
      reviews,
      summary: summaryFromRows(reviews)
    }
  },

  async getUserReview(userId, serviceType, serviceId) {
    const rows = await query(
      `${selectClause}
       WHERE r.user_id = ? AND r.service_type = ? AND r.service_id = ?
       LIMIT 1`,
      [userId, serviceType, serviceId]
    )
    return rows[0] || null
  },

  async hasEligibleBooking(userId, serviceType, serviceId) {
    if (serviceType === 'tour') {
      const rows = await query(
        `SELECT booking_id
         FROM tour_bookings
         WHERE user_id = ?
           AND tour_id = ?
           AND booking_status = 'confirmed'
         LIMIT 1`,
        [userId, serviceId]
      )
      return rows.length > 0
    }

    const rows = await query(
      `SELECT id
       FROM bookings
       WHERE user_id = ?
         AND service_type = ?
         AND service_id = ?
         AND status <> 'cancelled'
       LIMIT 1`,
      [userId, serviceType, serviceId]
    )
    return rows.length > 0
  },

  async upsert({ userId, serviceType, serviceId, rating, comment }) {
    await query(
      `INSERT INTO reviews (user_id, service_type, service_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         comment = VALUES(comment),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, serviceType, serviceId, rating, comment]
    )
    return this.getUserReview(userId, serviceType, serviceId)
  }
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  LogOut,
  CheckCircle2,
  Settings,
  AlertTriangle,
  Activity,
  House
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AuthService, { type AuthUser } from '@/services/authService'
import { adminApi, type AdminBooking, type AdminInvoice, type AdminOrder, type AdminServiceCapacity } from '@/services/adminApi'
import { ROUTES } from '@/config'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

type AnalyticsData = Awaited<ReturnType<typeof adminApi.analytics.overview>>

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

const toDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const daysBefore = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() - days)
  return next
}

const formatDelta = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? 'New activity this week' : 'No change this week'
  const delta = ((current - previous) / previous) * 100
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}% from last week`
}

const revenuePieColors = ['#0f766e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e']

const formatChartDay = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [orders, setOrders] = useState<AdminBooking[]>([])
  const [commerceOrders, setCommerceOrders] = useState<AdminOrder[]>([])
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [services, setServices] = useState<AdminServiceCapacity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [analyticsData, bookings, servicesData, orderRows, invoiceRows] = await Promise.all([
        adminApi.analytics.overview(),
        adminApi.bookings.list(),
        adminApi.services.list({ includeClosed: true }),
        adminApi.orders.list(),
        adminApi.invoices.list()
      ])
      setAnalytics(analyticsData)
      setOrders(bookings)
      setCommerceOrders(orderRows)
      setInvoices(invoiceRows)
      setServices(servicesData.slice(0, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setUser(AuthService.getCurrentUser())
    void load()
    const timer = window.setInterval(() => {
      void load()
    }, 15000)
    return () => window.clearInterval(timer)
  }, [])

  const pendingOrders = orders.filter((order) => order.status === 'pending')

  const orderMetrics = useMemo(() => {
    const today = startOfToday()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekStart = daysBefore(today, 7)
    const previousWeekStart = daysBefore(today, 14)

    const inRange = (value: string, start: Date, end: Date) => {
      const date = toDate(value)
      return Boolean(date && date >= start && date < end)
    }

    const todayOrders = commerceOrders.filter((order) => inRange(order.createdAt, today, tomorrow))
    const currentWeekOrders = commerceOrders.filter((order) => inRange(order.createdAt, weekStart, tomorrow))
    const previousWeekOrders = commerceOrders.filter((order) => inRange(order.createdAt, previousWeekStart, weekStart))
    const currentWeekRevenue = currentWeekOrders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0)
    const previousWeekRevenue = previousWeekOrders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0)

    return {
      todayOrderCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0),
      currentWeekOrderCount: currentWeekOrders.length,
      previousWeekOrderCount: previousWeekOrders.length,
      currentWeekRevenue,
      previousWeekRevenue
    }
  }, [commerceOrders])

  const latestUserGrowth = analytics?.charts.userGrowth.at(-1)?.users ?? 0
  const averageOccupancy = analytics?.summary.averageOccupancy ?? 0
  const revenuePieData = (analytics?.charts.salesOverTime || [])
    .filter((item) => Number(item.revenue) > 0)
    .map((item) => ({
      name: formatChartDay(item.day),
      value: Number(item.revenue)
    }))

  const heroSummary = [
    {
      label: "Today's Revenue",
      value: money.format(orderMetrics.todayRevenue),
      detail: formatDelta(orderMetrics.currentWeekRevenue, orderMetrics.previousWeekRevenue),
      icon: DollarSign,
      accent: 'bg-emerald-500/10 text-emerald-400'
    },
    {
      label: "Today's Orders",
      value: orderMetrics.todayOrderCount,
      detail: formatDelta(orderMetrics.currentWeekOrderCount, orderMetrics.previousWeekOrderCount),
      icon: ShoppingCart,
      accent: 'bg-sky-500/10 text-sky-400'
    },
    {
      label: 'Pending Requests',
      value: pendingOrders.length,
      detail: pendingOrders.length === 1 ? '1 booking needs review' : `${pendingOrders.length} bookings pending`,
      icon: AlertTriangle,
      accent: 'bg-amber-500/10 text-amber-400'
    },
    {
      label: 'Occupancy Change',
      value: `${averageOccupancy}%`,
      detail: averageOccupancy >= 70 ? 'High demand window' : averageOccupancy >= 35 ? 'Healthy booking pace' : 'Room to grow bookings',
      icon: Activity,
      accent: 'bg-teal-500/10 text-teal-400'
    }
  ]

  const summaryCards = useMemo(() => {
    const summary = analytics?.summary
    const dashboardOrderCount = commerceOrders.length || summary?.totalOrders || 0
    const dashboardRevenue = commerceOrders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0) || summary?.totalRevenue || 0
    return [
      {
        title: 'Total Users',
        value: summary?.totalUsers ?? 0,
        icon: Users,
        trend: `${latestUserGrowth} new users today`
      },
      {
        title: 'Total Orders',
        value: dashboardOrderCount,
        icon: ShoppingCart,
        trend: `${orderMetrics.todayOrderCount} orders today`
      },
      {
        title: 'Total Revenue',
        value: money.format(Number(dashboardRevenue || 0)),
        icon: DollarSign,
        trend: formatDelta(orderMetrics.currentWeekRevenue, orderMetrics.previousWeekRevenue)
      },
      {
        title: 'Total Products / Services',
        value: summary?.totalServices ?? 0,
        icon: Package,
        trend: `${services.length} monitored now`
      },
      {
        title: 'Fully Booked Services',
        value: summary?.fullyBookedServices ?? 0,
        icon: AlertTriangle,
        trend: `${services.filter((service) => service.status === 'limited').length} services limited`
      },
      {
        title: 'Avg Occupancy',
        value: `${summary?.averageOccupancy ?? 0}%`,
        icon: Activity,
        trend: averageOccupancy >= 50 ? 'Demand trending strong' : 'Capacity available'
      }
    ]
  }, [analytics, commerceOrders, latestUserGrowth, orderMetrics, services, averageOccupancy])

  const handleLogout = async () => {
    const result = await AuthService.logout()
    toast.success(result.message)
    navigate('/login', { replace: true })
  }

  const confirmPendingOrder = async (id: number) => {
    setUpdatingOrderId(id)
    setError('')
    try {
      await adminApi.bookings.update(id, { status: 'confirmed' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm order')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="mx-auto max-w-7xl px-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground">Admin Analytics Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Operational intelligence, order pipeline, and platform controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.HOME)}>
              <House className="mr-2 h-4 w-4" />
              Home Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-primary/25 bg-card/80">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Command Center</p>
              <p className="font-medium text-foreground">{user?.fullName || 'Admin'} is monitoring live platform activity</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">Admin Access</Badge>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {heroSummary.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-start gap-4 p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {item.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {error && (
          <Card className="p-4 border-red-300">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 font-serif text-2xl font-bold text-foreground">{card.value}</p>
                <p className="mt-3 text-xs font-medium text-primary">{card.trend}</p>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Revenue Growth</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value) => money.format(Number(value))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Pie
                    data={revenuePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={82}
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {revenuePieData.map((entry, index) => (
                      <Cell key={entry.name} fill={revenuePieColors[index % revenuePieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Orders Per Day</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.charts.ordersPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Management Shortcuts</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Open CRUD modules for users, services, and orders.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate('/admin/orders')}>Orders</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/users')}>Users</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/tours')}>Tours</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/treks')}>Treks</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/restaurants')}>Restaurants</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/cars')}>Cars</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/properties')}>Properties</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Pending Requests</h2>
            </div>
            <div className="space-y-3">
              {pendingOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        User {order.userId} | {order.serviceType} #{order.serviceId} | Qty {order.bookingCount || 1} | {order.bookingDate}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={updatingOrderId === order.id}
                      onClick={() => confirmPendingOrder(order.id)}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              ))}
              {!loading && !pendingOrders.length && (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Top Selling Services</h2>
            <div className="space-y-3">
              {(analytics?.topServices || []).map((item) => (
                <div key={`${item.serviceType}-${item.serviceId}`} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{item.serviceName}</p>
                    <Badge variant="outline" className="uppercase">{item.serviceType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Orders: {item.orderCount} | Revenue: ${item.revenue}
                  </p>
                </div>
              ))}
              {!loading && !(analytics?.topServices || []).length && (
                <p className="text-sm text-muted-foreground">No service sales data available.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {commerceOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{order.orderNumber}</p>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.customerName} | Items {order.items.length} | Total ${order.grandTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{String(order.createdAt).replace('T', ' ').slice(0, 19)}</p>
                </div>
              ))}
              {!loading && !commerceOrders.length && (
                <p className="text-sm text-muted-foreground">No orders found.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Recent Invoices</h2>
            <div className="space-y-3">
              {invoices.slice(0, 6).map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                    <Badge variant="outline">{invoice.emailStatus}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {invoice.customerName} | {invoice.orderNumber} | ${invoice.grandTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{String(invoice.createdAt).replace('T', ' ').slice(0, 19)}</p>
                </div>
              ))}
              {!loading && !invoices.length && (
                <p className="text-sm text-muted-foreground">No invoices generated yet.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Service Capacity Monitor</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={`${service.serviceType}-${service.id}`} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{service.serviceName}</p>
                  <Badge
                    className={
                      service.status === 'full'
                        ? 'bg-red-600 text-white'
                        : service.status === 'limited'
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                    }
                  >
                    {service.status === 'limited' ? 'Limited Slots' : service.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Capacity: {service.maxCapacity} | Booked: {service.currentBookings} | Remaining: {service.availableSlots}
                </p>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${
                      service.status === 'full'
                        ? 'bg-red-500'
                        : service.status === 'limited'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, service.occupancyRate))}%` }}
                  />
                </div>
              </div>
            ))}
            {!loading && !services.length && (
              <p className="text-sm text-muted-foreground">No service capacity data available.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-foreground">Privilege Flow Map</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Users create reservations. Admins monitor analytics, manage users/services/orders, and control system operations.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {['User Login', 'Browse Services', 'Create Order', 'Order Status Updates', 'Analytics & Controls'].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-muted px-3 py-1.5 font-medium text-foreground">
                  {step}
                </span>
                {index < 4 && <span className="text-muted-foreground">-&gt;</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

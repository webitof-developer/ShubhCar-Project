'use client'
import logger from '@/lib/logger'

import PageTitle from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { analyticsAPI } from '@/helpers/analyticsApi'
import { orderAPI } from '@/helpers/orderApi'
import { currency } from '@/context/constants'
import ReactApexChart from 'react-apexcharts'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Table, Button, Form, Alert } from 'react-bootstrap'

const toArray = (value) => (Array.isArray(value) ? value : [])
const parseLocalDateInput = (value) => {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
const toStartOfDay = (value) => {
  const d = value instanceof Date ? new Date(value) : parseLocalDateInput(value) || new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}
const toEndOfDay = (value) => {
  const d = value instanceof Date ? new Date(value) : parseLocalDateInput(value) || new Date(value)
  d.setHours(23, 59, 59, 999)
  return d
}

const ANALYTICS_STATUS_CARDS = [
  {
    key: 'paidOrders',
    title: 'Paid Orders',
    countFormatter: (revenue) => Number(revenue.paidOrders || 0).toLocaleString(),
    icon: 'solar:card-send-bold-duotone',
    iconVariant: 'success',
  },
  {
    key: 'pendingOrders',
    title: 'Pending Orders',
    countFormatter: (revenue) => Number(revenue.pendingOrders || 0).toLocaleString(),
    metaFormatter: (revenue) => `(${currency}${Number(revenue.pendingRevenue || 0).toLocaleString()})`,
    icon: 'solar:clock-circle-bold-duotone',
    iconVariant: 'warning',
  },
  {
    key: 'cancelRate',
    title: 'Cancel Rate',
    countFormatter: (revenue) => `${Number(revenue.cancelRate || 0).toFixed(2)}%`,
    icon: 'solar:close-circle-bold-duotone',
    iconVariant: 'danger',
  },
  {
    key: 'refundRate',
    title: 'Refund Rate',
    countFormatter: (revenue) => `${Number(revenue.refundRate || 0).toFixed(2)}%`,
    icon: 'solar:restart-circle-bold-duotone',
    iconVariant: 'info',
  },
]

const ANALYTICS_STATUS_SUMMARY = [
  {
    key: 'cancelledOrders',
    label: 'Cancelled',
    icon: 'solar:close-circle-broken',
    variant: 'danger',
  },
  {
    key: 'refundedOrders',
    label: 'Refunded',
    icon: 'solar:restart-circle-broken',
    variant: 'info',
  },
  {
    key: 'pendingOrders',
    label: 'Pending Payment',
    icon: 'solar:clock-circle-broken',
    variant: 'warning',
  },
]

const AnalyticsPage = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [revenue, setRevenue] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    paidOrders: 0,
    pendingOrders: 0,
    pendingRevenue: 0,
    cancelRate: 0,
    refundRate: 0,
    paymentSplit: [],
  })
  const [users, setUsers] = useState({ totalUsers: 0, wholesaleUsers: 0 })
  const [reviews, setReviews] = useState({ totalReviews: 0, averageRating: 0 })
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [chartData, setChartData] = useState({ labels: [], revenue: [], orders: [] })
  const [repeatSummary, setRepeatSummary] = useState({
    repeatRate: 0,
    averageLtv: 0,
    averageOrdersPerCustomer: 0,
  })
  const [fulfillment, setFulfillment] = useState({
    avgHoursToShip: 0,
    avgHoursToDeliver: 0,
    shipmentsCount: 0,
    deliveriesCount: 0,
  })
  const [funnel, setFunnel] = useState({
    placed: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  })
  const [salesByState, setSalesByState] = useState([])
  const [salesByCity, setSalesByCity] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [topBrands, setTopBrands] = useState([])
  const [inventoryTurnover, setInventoryTurnover] = useState({
    turnoverRate: 0,
    totalSoldQty: 0,
    totalStockQty: 0,
    deadStock: [],
  })
  const [todayValidation, setTodayValidation] = useState(null)
  const paymentSplit = Array.isArray(revenue?.paymentSplit) ? revenue.paymentSplit : []
  const deadStock = Array.isArray(inventoryTurnover?.deadStock) ? inventoryTurnover.deadStock : []

  const rangeParams = useMemo(() => {
    const now = new Date()
    if (range === 'custom') {
      if (!customFrom || !customTo) return null
      const fromDate = toStartOfDay(customFrom)
      const toDate = toEndOfDay(customTo)
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null
      const normalizedFrom = fromDate <= toDate ? fromDate : toStartOfDay(customTo)
      const normalizedTo = fromDate <= toDate ? toDate : toEndOfDay(customFrom)
      return { from: normalizedFrom.toISOString(), to: normalizedTo.toISOString() }
    }

    let start = new Date(now)
    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (range === 'week') {
      start.setDate(start.getDate() - 6)
    } else {
      start.setDate(start.getDate() - 29)
    }

    const fromDate = toStartOfDay(start)
    const toDate = now
    return { from: fromDate.toISOString(), to: toDate.toISOString() }
  }, [range, customFrom, customTo])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.accessToken) {
        setLoading(false)
        return
      }

      if (range === 'custom' && !rangeParams) {
        setLoading(false)
        return
      }

      setLoading(true)
      const queryParams = rangeParams || {}

      try {
        const [
          revenueResponse,
          usersResponse,
          reviewsResponse,
          topProductsResponse,
          inventoryResponse,
          chartResponse,
          repeatResponse,
          fulfillmentResponse,
          funnelResponse,
          salesStateResponse,
          salesCityResponse,
          topCategoriesResponse,
          topBrandsResponse,
          inventoryTurnoverResponse,
        ] = await Promise.all([
          analyticsAPI.revenueSummary(queryParams, session.accessToken),
          analyticsAPI.userSummary(session.accessToken),
          analyticsAPI.reviews(session.accessToken),
          analyticsAPI.topProducts({ limit: 8, ...queryParams }, session.accessToken),
          analyticsAPI.inventory({ threshold: 8 }, session.accessToken),
          analyticsAPI.revenueChart({ range: 'custom', ...queryParams }, session.accessToken),
          analyticsAPI.repeatCustomers(queryParams, session.accessToken),
          analyticsAPI.fulfillment(queryParams, session.accessToken),
          analyticsAPI.funnel(queryParams, session.accessToken),
          analyticsAPI.salesByState({ limit: 6, ...queryParams }, session.accessToken),
          analyticsAPI.salesByCity({ limit: 6, ...queryParams }, session.accessToken),
          analyticsAPI.topCategories({ limit: 6, ...queryParams }, session.accessToken),
          analyticsAPI.topBrands({ limit: 6, ...queryParams }, session.accessToken),
          analyticsAPI.inventoryTurnover({ limit: 6, ...queryParams }, session.accessToken),
        ])

        setRevenue(revenueResponse || {})
        setUsers(usersResponse || {})
        setReviews(reviewsResponse || {})
        setTopProducts(toArray(topProductsResponse))
        setLowStock(toArray(inventoryResponse))
        setChartData(chartResponse || { labels: [], revenue: [], orders: [] })
        setRepeatSummary(repeatResponse || {})
        setFulfillment(fulfillmentResponse || {})
        setFunnel(funnelResponse || {})
        setSalesByState(toArray(salesStateResponse))
        setSalesByCity(toArray(salesCityResponse))
        setTopCategories(toArray(topCategoriesResponse))
        setTopBrands(toArray(topBrandsResponse))
        setInventoryTurnover(inventoryTurnoverResponse || {})
      } catch (error) {
        logger.error('Failed to fetch analytics', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [session, range, rangeParams])

  useEffect(() => {
    const validateTodayAgainstOrders = async () => {
      if (!session?.accessToken || range !== 'today' || !rangeParams?.from || !rangeParams?.to) {
        setTodayValidation(null)
        return
      }

      try {
        const extractRows = (response) => {
          const payload = response?.data || response || {}
          const orders = payload?.items || payload?.orders || payload?.data?.items || payload?.data?.orders || []
          return {
            rows: Array.isArray(orders) ? orders : [],
            totalPages: Number(payload?.totalPages || payload?.pagination?.totalPages || 1) || 1,
          }
        }

        const allRows = []
        const firstResponse = await orderAPI.list(
          { from: rangeParams.from, to: rangeParams.to, limit: 250, page: 1, summary: true },
          session.accessToken,
        )
        const firstPage = extractRows(firstResponse)
        allRows.push(...firstPage.rows)

        const lastPage = Math.min(firstPage.totalPages, 40)
        for (let page = 2; page <= lastPage; page += 1) {
          const nextResponse = await orderAPI.list(
            { from: rangeParams.from, to: rangeParams.to, limit: 250, page, summary: true },
            session.accessToken,
          )
          const nextPage = extractRows(nextResponse)
          allRows.push(...nextPage.rows)
        }

        const rows = allRows
        const orderCount = rows.length
        const paidRevenueTotal = rows
          .filter((row) => String(row?.paymentStatus || '').toLowerCase() === 'paid')
          .reduce((sum, row) => sum + Number(row?.grandTotal || row?.totals?.grandTotal || 0), 0)

        const dashboardOrderCount = Number(revenue?.totalOrders || 0)
        const dashboardRevenue = Number(revenue?.totalRevenue || 0)
        const countMismatch = orderCount !== dashboardOrderCount
        const revenueMismatch = Math.abs(paidRevenueTotal - dashboardRevenue) > 1

        setTodayValidation({
          orderCount,
          paidRevenueTotal,
          dashboardOrderCount,
          dashboardRevenue,
          mismatch: countMismatch || revenueMismatch,
        })
      } catch (error) {
        logger.error('Failed to validate today analytics against orders list', error)
        setTodayValidation(null)
      }
    }

    validateTodayAgainstOrders()
  }, [session?.accessToken, range, rangeParams?.from, rangeParams?.to, revenue?.totalOrders, revenue?.totalRevenue])

  const chartOptions = useMemo(
    () => ({
      chart: {
        height: 320,
        type: 'line',
        offsetX: -10,
        toolbar: {
          show: false,
          tools: {
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
        zoom: { enabled: false },
        selection: { enabled: false },
      },
      stroke: { width: [2, 3], curve: 'smooth', dashArray: [0, 8] },
      colors: ['#1f5eff', '#1aa36f'],
      series: [
        { name: 'Orders', type: 'bar', data: chartData.orders || [] },
        { name: 'Revenue', type: 'line', data: chartData.revenue || [] },
      ],
      fill: {
        opacity: [0.85, 0.25, 1],
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: 'vertical',
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100],
        },
      },
      labels: chartData.labels || [],
      markers: { size: 0 },
      xaxis: { type: 'category', categories: chartData.labels || [] },
      yaxis: [{ title: { text: 'Orders' } }, { opposite: true, title: { text: 'Revenue' } }],
      tooltip: { shared: true, intersect: false },
      grid: {
        borderColor: '#f1f3fa',
        padding: {
          left: 0,
          right: 0,
        },
      },
      legend: { offsetY: 7 },
    }),
    [chartData],
  )

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    )

  return (
    <>
      <PageTitle title="ANALYTICS" />
      <Row className="g-3 align-items-center mb-3">
        <Col xl={8} className="d-flex flex-wrap gap-2">
          {['today', 'week', 'month', 'custom'].map((key) => (
            <Button key={key} variant={range === key ? 'primary' : 'outline-primary'} size="sm" onClick={() => setRange(key)}>
              {key === 'today' ? 'Today' : key === 'week' ? 'Week' : key === 'month' ? 'Month' : 'Custom'}
            </Button>
          ))}
        </Col>
        <Col xl={4} className="d-flex align-items-center gap-2 justify-content-xl-end flex-wrap flex-xl-nowrap">
          <div className="position-relative">
            <IconifyIcon
              icon="solar:calendar-mark-bold-duotone"
              className="position-absolute top-50 translate-middle-y text-muted"
              style={{ left: 12, pointerEvents: 'none', zIndex: 1 }}
            />
            <Form.Control
              type="date"
              size="sm"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              disabled={range !== 'custom'}
              className="w-auto"
              style={{ minWidth: 170, paddingLeft: 36 }}
            />
          </div>
          <div className="position-relative">
            <IconifyIcon
              icon="solar:calendar-mark-bold-duotone"
              className="position-absolute top-50 translate-middle-y text-muted"
              style={{ left: 12, pointerEvents: 'none', zIndex: 1 }}
            />
            <Form.Control
              type="date"
              size="sm"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              disabled={range !== 'custom'}
              className="w-auto"
              style={{ minWidth: 170, paddingLeft: 36 }}
            />
          </div>
        </Col>
      </Row>
      {range === 'today' && todayValidation?.mismatch && (
        <Alert variant="warning" className="mb-3">
          Today validation mismatch detected. Orders list shows {todayValidation.orderCount} total orders and paid revenue {currency}
          {todayValidation.paidRevenueTotal.toFixed(2)}, while analytics summary shows {todayValidation.dashboardOrderCount} orders and paid revenue{' '}
          {currency}
          {todayValidation.dashboardRevenue.toFixed(2)}.
        </Alert>
      )}

      <Row className="g-3">
        <Col xl={3} md={6}>
          <Card style={{ height: 'fit-content' }}>
            <CardBody className="py-2">
              <div className="d-flex align-items-center gap-3">
                <div className="avatar-md bg-soft-primary rounded flex-centered">
                  <IconifyIcon icon="solar:wallet-money-bold-duotone" className="fs-24 text-primary" />
                </div>
                <div>
                  <p className="text-muted mb-1">Total Revenue</p>
                  <h4 className="mb-0">
                    {currency}
                    {Number(revenue.totalRevenue || 0).toLocaleString()}
                  </h4>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card style={{ height: 'fit-content' }}>
            <CardBody className="py-2">
              <div className="d-flex align-items-center gap-3">
                <div className="avatar-md bg-soft-success rounded flex-centered">
                  <IconifyIcon icon="solar:cart-4-bold-duotone" className="fs-24 text-success" />
                </div>
                <div>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h4 className="mb-0">{Number(revenue.totalOrders || 0).toLocaleString()}</h4>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card style={{ height: 'fit-content' }}>
            <CardBody className="py-2">
              <div className="d-flex align-items-center gap-3">
                <div className="avatar-md bg-soft-info rounded flex-centered">
                  <IconifyIcon icon="solar:user-bold-duotone" className="fs-24 text-info" />
                </div>
                <div>
                  <p className="text-muted mb-1">Total Customers</p>
                  <h4 className="mb-0">{Number(users.totalUsers || 0).toLocaleString()}</h4>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card style={{ height: 'fit-content' }}>
            <CardBody className="py-2">
              <div className="d-flex align-items-center gap-3">
                <div className="avatar-md bg-soft-warning rounded flex-centered">
                  <IconifyIcon icon="solar:ticket-bold-duotone" className="fs-24 text-warning" />
                </div>
                <div>
                  <p className="text-muted mb-1">Avg Order Value</p>
                  <h4 className="mb-0">
                    {currency}
                    {Number(revenue.avgOrderValue || 0).toFixed(2)}
                  </h4>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className=" g-3">
        {ANALYTICS_STATUS_CARDS.map((item) => (
          <Col xl={3} md={6} key={item.key}>
            <Card style={{ height: 'fit-content' }}>
              <CardBody className="py-2">
                <div className="d-flex align-items-start gap-3">
                  <div className={`avatar-md bg-soft-${item.iconVariant} rounded flex-centered flex-shrink-0`}>
                    <IconifyIcon icon={item.icon} className={`fs-24 text-${item.iconVariant}`} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-muted mb-1">{item.title}</p>
                    <h4 className="mb-0">
                      {item.countFormatter(revenue)}
                      {item.metaFormatter && <span className="text-muted fs-6 fw-normal ms-2">{item.metaFormatter(revenue)}</span>}
                    </h4>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-2 g-3">
        <Col xl={8}>
          <Card className="h-100">
            <CardBody className=" pe-3 py-3">
              <CardTitle as="h4">Orders vs Revenue</CardTitle>
              <div dir="ltr">
                <ReactApexChart options={chartOptions} series={chartOptions.series} height={320} type="line" className="apex-charts" />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Payment Methods</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSplit.map((row, idx) => (
                      <tr key={`${row._id}-${idx}`}>
                        <td>{row._id || 'Unknown'}</td>
                        <td className="text-end">{Number(row.orders || 0).toLocaleString()}</td>
                        <td className="text-end">
                          {currency}
                          {Number(row.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {paymentSplit.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-3">
                          No payment data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col xl={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Repeat Customers</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Repeat Rate</span>
                <span className="fw-semibold">{Number(repeatSummary.repeatRate || 0).toFixed(2)}%</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Avg Orders / Customer</span>
                <span className="fw-semibold">{Number(repeatSummary.averageOrdersPerCustomer || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Average LTV</span>
                <span className="fw-semibold">
                  {currency}
                  {Number(repeatSummary.averageLtv || 0).toFixed(2)}
                </span>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Fulfillment Time</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Avg Hours to Ship</span>
                <span className="fw-semibold">{Number(fulfillment.avgHoursToShip || 0).toFixed(1)}h</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Avg Hours to Deliver</span>
                <span className="fw-semibold">{Number(fulfillment.avgHoursToDeliver || 0).toFixed(1)}h</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Shipments Count</span>
                <span className="fw-semibold">{Number(fulfillment.shipmentsCount || 0).toLocaleString()}</span>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Order Funnel</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Placed</span>
                <span className="fw-semibold">{Number(funnel.placed || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Paid</span>
                <span className="fw-semibold">{Number(funnel.paid || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Shipped</span>
                <span className="fw-semibold">{Number(funnel.shipped || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Delivered</span>
                <span className="fw-semibold">{Number(funnel.delivered || 0).toLocaleString()}</span>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Sales by State</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>State</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByState.map((item, idx) => (
                      <tr key={`${item.state}-${idx}`}>
                        <td>{item.state}</td>
                        <td className="text-end">{Number(item.orders || 0).toLocaleString()}</td>
                        <td className="text-end">
                          {currency}
                          {Number(item.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {salesByState.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-3">
                          No state data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Sales by City</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByCity.map((item, idx) => (
                      <tr key={`${item.city}-${idx}`}>
                        <td>{item.city}</td>
                        <td className="text-end">{Number(item.orders || 0).toLocaleString()}</td>
                        <td className="text-end">
                          {currency}
                          {Number(item.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {salesByCity.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-3">
                          No city data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Top Categories</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-end">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCategories.map((item, idx) => (
                      <tr key={`${item.categoryId}-${idx}`}>
                        <td>{item.name}</td>
                        <td className="text-end">{Number(item.quantitySold || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {topCategories.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-3">
                          No category data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Top Brands</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th className="text-end">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBrands.map((item, idx) => (
                      <tr key={`${item.name}-${idx}`}>
                        <td>{item.name}</td>
                        <td className="text-end">{Number(item.quantitySold || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {topBrands.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-3">
                          No brand data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Inventory Turnover</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Turnover Rate</span>
                <span className="fw-semibold">{Number(inventoryTurnover.turnoverRate || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total Sold Qty</span>
                <span className="fw-semibold">{Number(inventoryTurnover.totalSoldQty || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Total Stock Qty</span>
                <span className="fw-semibold">{Number(inventoryTurnover.totalStockQty || 0).toLocaleString()}</span>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Dead Stock</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-end">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadStock.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.sku || '-'}</td>
                        <td className="text-end">{Number(item.stockQty || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {deadStock.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-3">
                          No dead stock
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Top Products</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-end">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((item, idx) => (
                      <tr key={`${item.productId}-${idx}`}>
                        <td>{item.name}</td>
                        <td className="text-end">{Number(item.quantitySold || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-3">
                          No top products yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-end">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name || item.productName}</td>
                        <td>{item.sku || '-'}</td>
                        <td className="text-end">{Number(item.availableQty || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {lowStock.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-3">
                          No low stock items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col xl={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Customers & Reviews</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Total Customers</span>
                <span className="fw-semibold">{Number(users.totalUsers || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Wholesale Customers</span>
                <span className="fw-semibold">{Number(users.wholesaleUsers || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Total Reviews</span>
                <span className="fw-semibold">{Number(reviews.totalReviews || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Average Rating</span>
                <span className="fw-semibold">{Number(reviews.averageRating || 0).toFixed(2)}</span>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={8}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4">Order Status Summary</CardTitle>
            </CardHeader>
            <CardBody>
              <Row className="g-2">
                {ANALYTICS_STATUS_SUMMARY.map((item) => (
                  <Col md={4} key={item.key}>
                    <div className="d-flex align-items-center justify-content-between gap-3 rounded border px-3 py-2 h-100">
                      <div className="d-flex align-items-center gap-2">
                        <div className={`avatar-sm bg-soft-${item.variant} rounded flex-centered flex-shrink-0`}>
                          <IconifyIcon icon={item.icon} className={`fs-18 text-${item.variant}`} />
                        </div>
                        <span className="text-muted">{item.label}</span>
                      </div>
                      <span className="fw-semibold ms-3">{Number(revenue[item.key] || 0).toLocaleString()}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default AnalyticsPage

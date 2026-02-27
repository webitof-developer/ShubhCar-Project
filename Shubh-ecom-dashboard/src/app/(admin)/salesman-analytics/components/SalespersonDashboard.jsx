'use client'
import logger from '@/lib/logger'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { dashboardAPI } from '@/helpers/dashboardApi'
import { currency } from '@/context/constants'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Row, Table, Placeholder, Badge } from 'react-bootstrap'

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="placeholder-glow" style={{ height: 320 }}>
      <Placeholder className="w-100 h-100 rounded" />
    </div>
  ),
})

const SalespersonDashboard = ({ data, loading: reportLoading, salesmanId }) => {
  const { data: session } = useSession()
  const [chartLoading, setChartLoading] = useState(false)
  const [chartData, setChartData] = useState({ labels: [], revenue: [], orders: [] })
  const [chartRange, setChartRange] = useState('month')

  useEffect(() => {
    const token = session?.accessToken
    if (!token || !salesmanId) {
      setChartData({ labels: [], revenue: [], orders: [] })
      return
    }

    const fetchChart = async () => {
      setChartLoading(true)
      try {
        const chartResponse = await dashboardAPI.getRevenueChart(token, { range: chartRange, salesmanId })
        setChartData(chartResponse || { labels: [], revenue: [], orders: [] })
      } catch (error) {
        logger.error('Failed to load chart data', error)
      } finally {
        setChartLoading(false)
      }
    }

    fetchChart()
  }, [session, salesmanId, chartRange])

  const salesChartOptions = useMemo(
    () => ({
      chart: { height: 320, type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
      stroke: { width: [2, 2], curve: 'smooth', dashArray: [0, 4] },
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      colors: ['#0f766e', '#f97316'],
      series: [
        { name: 'Revenue', data: chartData.revenue || [] },
        { name: 'Orders', data: chartData.orders || [] },
      ],
      xaxis: {
        categories: chartData.labels || [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#64748b' } },
      },
      yaxis: [
        { labels: { formatter: (val) => `${currency}${val}`, style: { colors: '#64748b' } } },
        { opposite: true, labels: { formatter: (val) => `${val}`, style: { colors: '#64748b' } } },
      ],
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (val, { seriesIndex }) {
            return seriesIndex === 0 ? `${currency}${val}` : val
          },
        },
      },
      legend: { position: 'top', horizontalAlign: 'right' },
      dataLabels: { enabled: false },
    }),
    [chartData],
  )

  const SummaryCard = ({ title, value, icon, variant, subtext }) => (
    <Card className="border-0 shadow-sm h-fit">
      <CardBody className="px-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div className={`avatar-md rounded bg-soft-${variant} text-${variant} d-flex align-items-center justify-content-center`}>
            <IconifyIcon icon={icon} width={24} height={24} />
          </div>
          {subtext && (
            <Badge bg={`soft-${variant}`} text={variant} className="py-1 px-2">
              {subtext}
            </Badge>
          )}
        </div>
        <div className="text-end">
          <h3 className="mb-1 fw-bold">
            {reportLoading ? (
              <Placeholder as="span" animation="glow">
                <Placeholder xs={6} />
              </Placeholder>
            ) : (
              value
            )}
          </h3>
          <span className="text-muted text-uppercase fs-12 fw-semibold">{title}</span>
        </div>
      </CardBody>
    </Card>
  )

  return (
    <div className="dashboard-content">
      <Row className="g-3 mb-4">
        <Col md={3}>
          <SummaryCard
            title="Total Sales"
            value={`${currency}${Number(data?.summary?.totalSales || 0).toLocaleString()}`}
            icon="solar:wallet-money-bold-duotone"
            variant="primary"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            title="Total Orders"
            value={Number(data?.summary?.totalOrders || 0).toLocaleString()}
            icon="solar:cart-large-4-bold-duotone"
            variant="success"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            title="Commission"
            value={`${currency}${Number(data?.summary?.totalCommission || 0).toLocaleString()}`}
            icon="solar:hand-money-bold-duotone"
            variant="warning"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            title="Avg Order Value"
            value={`${currency}${Number(data?.summary?.averageOrderValue || 0).toFixed(2)}`}
            icon="solar:chart-square-bold-duotone"
            variant="info"
          />
        </Col>
      </Row>

      {salesmanId && (
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
                <CardTitle as="h5" className="mb-0 fw-bold">
                  Performance Trends
                </CardTitle>
                <div className="d-flex gap-2">
                  {['today', 'week', 'month'].map((range) => (
                    <Button
                      key={range}
                      size="sm"
                      variant={chartRange === range ? 'primary' : 'light'}
                      onClick={() => setChartRange(range)}
                      className="text-capitalize px-3">
                      {range}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardBody className="px-2 pb-2">
                {chartLoading ? (
                  <div className="placeholder-glow p-4" style={{ height: 320 }}>
                    <Placeholder className="w-100 h-100 rounded" />
                  </div>
                ) : (
                  <ReactApexChart options={salesChartOptions} series={salesChartOptions.series} height={320} type="area" className="apex-charts" />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4">
        <Col xl={5}>
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-transparent border-0 pt-4 px-4">
              <CardTitle as="h5" className="mb-0 fw-bold">
                Salesman Performance
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Salesman</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Sales</th>
                      <th className="text-end pe-4">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportLoading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          <div className="spinner-border spinner-border-sm text-primary"></div>
                        </td>
                      </tr>
                    ) : (
                      (data?.salesBySalesman || []).map((row, idx) => (
                        <tr key={row.salesmanId || idx}>
                          <td className="ps-4 fw-medium text-dark">{row.salesmanName || row.salesmanEmail || 'Unknown'}</td>
                          <td className="text-end text-muted">{Number(row.totalOrders || 0).toLocaleString()}</td>
                          <td className="text-end fw-semibold text-dark">
                            {currency}
                            {Number(row.totalSales || 0).toLocaleString()}
                          </td>
                          <td className="text-end pe-4 text-success">
                            {currency}
                            {Number(row.totalCommission || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                    {!reportLoading && (!data?.salesBySalesman || data.salesBySalesman.length === 0) && (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-transparent border-0 pt-4 px-4">
              <CardTitle as="h5" className="mb-0 fw-bold">
                Top Products Sold
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Product</th>
                      <th>SKU</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end pe-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="spinner-border spinner-border-sm text-primary"></div>
                        </td>
                      </tr>
                    ) : (
                      (data?.products || []).map((row, idx) => (
                        <tr key={row.productId || idx}>
                          <td className="ps-4">
                            <span className="fw-medium text-dark d-block text-truncate" style={{ maxWidth: '200px' }}>
                              {row.productName || 'Unknown Product'}
                            </span>
                          </td>
                          <td className="text-muted small">{row.sku || '-'}</td>
                          <td className="text-end text-muted">{Number(row.quantitySold || 0).toLocaleString()}</td>
                          <td className="text-end text-muted">{Number(row.totalOrders || 0).toLocaleString()}</td>
                          <td className="text-end pe-4 fw-semibold text-dark">
                            {currency}
                            {Number(row.revenue || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                    {!reportLoading && (!data?.products || data.products.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No products found
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
    </div>
  )
}

export default SalespersonDashboard

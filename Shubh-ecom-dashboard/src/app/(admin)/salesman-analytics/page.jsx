'use client'
import logger from '@/lib/logger'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Alert, Container } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { salesReportsAPI } from '@/helpers/salesReportsApi'
import SalespersonFilter from './components/SalespersonFilter'
import SalespersonDashboard from './components/SalespersonDashboard'

const SalesmanAnalyticsPage = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    salesmanId: '',
    page: 1,
    limit: 20,
  })
  const [data, setData] = useState({
    summary: {
      totalSales: 0,
      totalOrders: 0,
      totalCommission: 0,
      averageOrderValue: 0,
    },
    salesBySalesman: [],
    products: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  })
  const requestSeqRef = useRef(0)

  const token = session?.accessToken

  const queryParams = useMemo(() => {
    const params = {
      page: filters.page,
      limit: filters.limit,
    }
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    if (filters.salesmanId) params.salesmanId = filters.salesmanId
    return params
  }, [filters])

  const fetchReport = useCallback(async () => {
    if (!token) return
    const requestSeq = ++requestSeqRef.current
    setLoading(true)
    setError('')
    try {
      const response = await salesReportsAPI.salesmanPerformance(queryParams, token)
      if (requestSeq !== requestSeqRef.current) return
      setData(response?.data || response || {})
    } catch (err) {
      if (requestSeq !== requestSeqRef.current) return
      setError(err.message || 'Failed to load salesman analytics')
      logger.error(err)
    } finally {
      if (requestSeq !== requestSeqRef.current) return
      setLoading(false)
    }
  }, [token, queryParams])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return (
    <>
      <PageTitle title="Salesman Analytics" />

      <SalespersonFilter
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({ from: '', to: '', salesmanId: '', page: 1, limit: 20 })}
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <SalespersonDashboard data={data} loading={loading} salesmanId={filters.salesmanId} filters={filters} />
    </>
  )
}

export default SalesmanAnalyticsPage

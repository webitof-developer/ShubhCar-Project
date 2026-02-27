'use client'

import PageTitle from '@/components/PageTitle'
import SalespersonDashboard from '../components/SalespersonDashboard'
import SalespersonFilter from '../components/SalespersonFilter'
import { useState } from 'react'
import { Col, Row } from 'react-bootstrap'

const SalespersonAnalyticsPage = () => {
  const [selectedSalesmanId, setSelectedSalesmanId] = useState(null)

  return (
    <>
      <PageTitle title="Salesperson Analytics" />
      <Row>
        <Col xs={12}>
          <SalespersonFilter onSelect={setSelectedSalesmanId} selectedSalesmanId={selectedSalesmanId} />
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <SalespersonDashboard salesmanId={selectedSalesmanId} />
        </Col>
      </Row>
    </>
  )
}

export default SalespersonAnalyticsPage

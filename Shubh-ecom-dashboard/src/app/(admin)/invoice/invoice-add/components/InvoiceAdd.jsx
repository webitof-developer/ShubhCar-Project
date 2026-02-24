'use client'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Link from 'next/link'
import { Alert, Card, CardBody, Col, Row } from 'react-bootstrap'

const InvoiceAdd = () => {
  return (
    <Row className="justify-content-center">
      <Col xl={9}>
        <Card className="border-0 shadow-sm">
          <CardBody className="p-4">
            <div className="d-flex align-items-start gap-3 mb-3">
              <div className="avatar-sm bg-primary-subtle text-primary rounded d-flex align-items-center justify-content-center">
                <IconifyIcon icon="solar:bill-list-bold-duotone" className="fs-4" />
              </div>
              <div>
                <h4 className="mb-1">Invoice Template Source</h4>
                <p className="text-muted mb-0">
                  Invoices are generated from backend PDF renderer. The designer image template configured in settings is used for all invoice downloads.
                </p>
              </div>
            </div>

            <Alert variant="info" className="d-flex align-items-start gap-2 mb-3">
              <IconifyIcon icon="mdi:information-outline" className="fs-5 mt-1" />
              <div className="mb-0">
                Configure <strong>Designer Template Image URL (A4)</strong> in Invoice Settings. Then use order or invoice pages to view/download PDFs.
              </div>
            </Alert>

            <div className="d-flex flex-wrap gap-2">
              <Link href="/settings" className="btn btn-primary">
                Go to Invoice Settings
              </Link>
              <Link href="/invoice/invoice-list" className="btn btn-outline-secondary">
                Open Invoice List
              </Link>
              <Link href="/orders/orders-list" className="btn btn-outline-secondary">
                Open Orders
              </Link>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default InvoiceAdd

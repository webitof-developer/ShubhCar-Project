'use client'
import PageTitle from '@/components/PageTitle'
import InvoiceTemplate from '@/components/invoice/InvoiceTemplate'
import { InvoiceShell } from '@/components/invoice/InvoiceShell'
import { invoiceAPI } from '@/helpers/invoiceApi'
import { orderAPI } from '@/helpers/orderApi'
import { settingsAPI } from '@/helpers/settingsApi'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert, Col, Row, Spinner } from 'react-bootstrap'

const InvoiceDetails = () => {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const recordId = searchParams.get('id')
  const action = String(searchParams.get('action') || '').toLowerCase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [settings, setSettings] = useState({})
  const [printTriggered, setPrintTriggered] = useState(false)

  useEffect(() => {
    if (!recordId || !session?.accessToken) return
    const fetchInvoice = async () => {
      try {
        const [settingsResponse, invoiceResponse] = await Promise.all([
          settingsAPI.list(undefined, session.accessToken),
          (async () => {
            try {
              return await invoiceAPI.get(recordId, session.accessToken)
            } catch (byInvoiceError) {
              return await orderAPI.getInvoiceByOrder(recordId, session.accessToken)
            }
          })(),
        ])

        setInvoice(invoiceResponse?.data?.invoice || invoiceResponse?.invoice || null)
        setSettings(settingsResponse?.data || settingsResponse || {})
      } catch (err) {
        setError(err.message || 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [recordId, session])
  useEffect(() => {
    if (loading || !invoice || printTriggered) return
    if (action !== 'print' && action !== 'download') return
    const timer = setTimeout(() => {
      setPrintTriggered(true)
      window.print()
    }, 200)
    return () => clearTimeout(timer)
  }, [loading, invoice, action, printTriggered])

  if (loading) {
    return (
      <>
        <PageTitle title="INVOICE DETAILS" />
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      </>
    )
  }

  if (!invoice) {
    return (
      <>
        <PageTitle title="INVOICE DETAILS" />
        <div className="text-center py-5 text-muted">Invoice not found</div>
      </>
    )
  }

  const adaptedOrder = {
    _id: invoice._id,
    orderNumber: invoice.orderSnapshot?.orderNumber || invoice.invoiceNumber || invoice._id,
    placedAt: invoice.orderSnapshot?.placedAt || invoice.issuedAt || invoice.createdAt,
    createdAt: invoice.createdAt,
    paymentMethod: invoice.orderSnapshot?.paymentMethod || '-',
    paymentStatus: invoice.paymentStatus || '-',
    taxableAmount: Number(invoice.totals?.subtotal || 0),
    discountAmount: Number(invoice.totals?.discountTotal || 0),
    taxAmount: Number(invoice.totals?.taxTotal || 0),
    shippingFee: Number(invoice.totals?.shippingFee || 0),
    grandTotal: Number(invoice.totals?.grandTotal || 0),
    taxBreakdown: invoice.totals?.taxBreakdown || { cgst: 0, sgst: 0, igst: 0 },
  }

  const adaptedItems = (invoice.items || []).map((item, index) => ({
    _id: `${item.sku || 'item'}-${index}`,
    product: { name: item.name || 'Product' },
    quantity: Number(item.quantity || 0),
    price: Number(item.unitPrice || 0),
    taxAmount: Number(item.taxAmount || 0),
    taxPercent: Number(item.taxPercent || 0),
    total: Number(item.lineTotal || 0),
  }))

  const customerAddress = invoice.customerSnapshot?.address || {}
  const adaptedAddress = {
    fullName: invoice.customerSnapshot?.name || '-',
    line1: customerAddress.line1 || customerAddress.addressLine1 || '-',
    line2: customerAddress.line2 || customerAddress.addressLine2 || '',
    city: customerAddress.city || '-',
    state: customerAddress.state || '-',
    postalCode: customerAddress.postalCode || customerAddress.pincode || customerAddress.zip || '-',
    phone: invoice.customerSnapshot?.phone || '-',
  }

  return (
    <>
      <PageTitle title="INVOICE DETAILS" />
      <Row className="justify-content-center">
        <Col lg={12}>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="d-flex justify-content-end gap-2 mb-3 d-print-none">
            <button className="btn btn-outline-primary btn-sm" onClick={() => window.open(`/invoice/invoice-details?id=${recordId}`, '_blank')}>Open in new tab</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>Print</button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Download</button>
          </div>
          <InvoiceShell>
            <InvoiceTemplate
              order={adaptedOrder}
              items={adaptedItems}
              address={adaptedAddress}
              settings={settings}
            />
          </InvoiceShell>
        </Col>
      </Row>
    </>
  )
}

export default InvoiceDetails

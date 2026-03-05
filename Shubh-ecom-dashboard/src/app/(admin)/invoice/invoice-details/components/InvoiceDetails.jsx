'use client'
import PageTitle from '@/components/PageTitle'
import InvoiceTemplate from '@/components/invoice/InvoiceTemplate'
import { InvoiceShell } from '@/components/invoice/InvoiceShell'
import { invoiceAPI } from '@/helpers/invoiceApi'
import { settingsAPI } from '@/helpers/settingsApi'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert, Col, Row, Spinner } from 'react-bootstrap'

const InvoiceDetails = () => {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    if (!invoiceId || !session?.accessToken) return
    const fetchInvoice = async () => {
      try {
        const [invoiceResponse, settingsResponse] = await Promise.all([
          invoiceAPI.get(invoiceId, session.accessToken),
          settingsAPI.list(undefined, session.accessToken),
        ])

        setInvoice(invoiceResponse.data?.invoice || invoiceResponse.invoice || null)
        setSettings(settingsResponse?.data || settingsResponse || {})
      } catch (err) {
        setError(err.message || 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [invoiceId, session])

  const handleViewPdf = async () => {
    if (!invoiceId || !session?.accessToken) return
    try {
      const blob = await invoiceAPI.getPdf(invoiceId, session.accessToken, false)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      setError(err.message || 'Failed to view invoice')
    }
  }

  const handleDownloadPdf = async () => {
    if (!invoiceId || !session?.accessToken) return
    try {
      const blob = await invoiceAPI.getPdf(invoiceId, session.accessToken, true)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Failed to download invoice')
    }
  }

  const handlePrintPdf = async () => {
    if (!invoiceId || !session?.accessToken) return
    try {
      const blob = await invoiceAPI.getPdf(invoiceId, session.accessToken, false)
      const url = URL.createObjectURL(blob)
      const popup = window.open(url, '_blank')
      if (!popup) return
      popup.focus()
      popup.print()
    } catch (err) {
      setError(err.message || 'Failed to print invoice')
    }
  }

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
          <div className="d-flex justify-content-end gap-2 mb-3">
            <button className="btn btn-outline-primary btn-sm" onClick={handleViewPdf}>View PDF</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={handlePrintPdf}>Print</button>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>Download</button>
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

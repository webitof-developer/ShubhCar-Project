'use client'
import PageTitle from '@/components/PageTitle'
import InvoiceTemplate from '@/components/invoice/InvoiceTemplate'
import { InvoiceShell } from '@/components/invoice/InvoiceShell'
import { invoiceAPI } from '@/helpers/invoiceApi'
import { orderAPI } from '@/helpers/orderApi'
import { settingsAPI } from '@/helpers/settingsApi'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Col, Row, Spinner } from 'react-bootstrap'

const CAPTURED_PAYMENT_STATUSES = ['paid', 'refunded']
const CREDIT_NOTE_ORDER_STATUSES = ['cancelled', 'returned', 'refunded']

const getUnavailableMessage = ({ order, documentType }) => {
  const orderStatus = String(order?.orderStatus || '').toLowerCase()
  const paymentStatus = String(order?.paymentStatus || '').toLowerCase()
  const hasCapturedPayment = CAPTURED_PAYMENT_STATUSES.includes(paymentStatus)

  if (documentType === 'invoice') {
    if (!hasCapturedPayment) {
      return 'Invoice is not available yet. It becomes available after successful payment capture.'
    }

    return 'Invoice could not be generated yet for this order.'
  }

  if (
    ['cancelled', 'returned'].includes(orderStatus) &&
    !hasCapturedPayment
  ) {
    return 'Credit note is not applicable for this order because payment was not captured. No refund is pending.'
  }

  if (!CREDIT_NOTE_ORDER_STATUSES.includes(orderStatus)) {
    return 'Credit note is not available for this order yet.'
  }

  return 'Credit note could not be generated yet for this order.'
}

const InvoiceDetails = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordId = searchParams.get('id')
  const source = String(searchParams.get('source') || 'invoice_list')
  const documentType = String(searchParams.get('documentType') || 'invoice').toLowerCase()
  const action = String(searchParams.get('action') || '').toLowerCase()
  const originOrderId = searchParams.get('orderId') || (source === 'order_detail' ? recordId : '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewerMessage, setViewerMessage] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [orderContext, setOrderContext] = useState(null)
  const [settings, setSettings] = useState({})
  const [printTriggered, setPrintTriggered] = useState(false)

  useEffect(() => {
    if (!recordId || !session?.accessToken) return

    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError('')
        setViewerMessage('')
        setInvoice(null)

        const settingsResponse = await settingsAPI.list(undefined, session.accessToken)
        setSettings(settingsResponse?.data || settingsResponse || {})

        let orderPayload = null
        if (originOrderId) {
          try {
            const orderResponse = await orderAPI.getOrderDetail(originOrderId, session.accessToken)
            orderPayload = orderResponse?.data?.order || orderResponse?.order || null
            setOrderContext(orderPayload)
          } catch {
            setOrderContext(null)
          }
        }

        let invoiceResponse = null
        try {
          if (source === 'invoice_list') {
            invoiceResponse = await invoiceAPI.get(recordId, session.accessToken)
          } else if (documentType === 'credit_note') {
            invoiceResponse = await orderAPI.getCreditNoteByOrder(originOrderId || recordId, session.accessToken)
          } else {
            invoiceResponse = await orderAPI.getInvoiceByOrder(originOrderId || recordId, session.accessToken)
          }
        } catch (err) {
          if (orderPayload) {
            setViewerMessage(getUnavailableMessage({ order: orderPayload, documentType }))
          } else {
            setError(err.message || `Failed to load ${documentType === 'credit_note' ? 'credit note' : 'invoice'}`)
          }
          return
        }

        setInvoice(invoiceResponse?.data?.invoice || invoiceResponse?.invoice || null)
      } catch (err) {
        setError(err.message || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [recordId, session, source, documentType, originOrderId])

  useEffect(() => {
    if (loading || !invoice || printTriggered) return
    if (action !== 'print' && action !== 'download') return

    let cancelled = false
    let fallbackTimer

    const waitForImages = () => {
      const images = Array.from(document.querySelectorAll('#invoice-template img'))
      if (!images.length) return Promise.resolve()

      return Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            const done = () => resolve()
            img.addEventListener('load', done, { once: true })
            img.addEventListener('error', done, { once: true })
            setTimeout(done, 2000)
          })
        })
      )
    }

    const runAutoPrint = async () => {
      try {
        if (document?.fonts?.ready) {
          await document.fonts.ready
        }
      } catch {
        // Font readiness is best-effort only.
      }

      await waitForImages()
      await new Promise((resolve) => setTimeout(resolve, 250))
      if (cancelled) return

      setPrintTriggered(true)
      window.print()
    }

    fallbackTimer = setTimeout(() => {
      if (cancelled || printTriggered) return
      setPrintTriggered(true)
      window.print()
    }, 3000)

    runAutoPrint()

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
    }
  }, [loading, invoice, action, printTriggered])

  const backTarget = useMemo(() => {
    if (source === 'order_detail' && originOrderId) {
      return `/orders/order-detail?id=${originOrderId}`
    }
    return '/invoice/invoice-list'
  }, [originOrderId, source])

  if (loading) {
    return (
      <>
        <PageTitle title="DOCUMENT DETAILS" />
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      </>
    )
  }

  if (!invoice) {
    return (
      <>
        <PageTitle title={documentType === 'credit_note' ? 'CREDIT NOTE DETAILS' : 'INVOICE DETAILS'} />
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3 d-print-none">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => router.push(backTarget)}>
                Back
              </button>
            </div>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            {viewerMessage ? <Alert variant="warning">{viewerMessage}</Alert> : null}
            {!error && !viewerMessage ? (
              <Alert variant="secondary">
                {documentType === 'credit_note' ? 'Credit note not found.' : 'Invoice not found.'}
              </Alert>
            ) : null}
          </Col>
        </Row>
      </>
    )
  }

  const adaptedOrder = {
    _id: invoice._id,
    type: invoice.type,
    status: invoice.status || 'issued',
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: invoice.orderSnapshot?.orderNumber || invoice.invoiceNumber || invoice._id,
    relatedInvoiceNumber: invoice.displayMeta?.originalInvoiceNumber || invoice.relatedInvoiceId?.invoiceNumber || '',
    placedAt: invoice.orderSnapshot?.placedAt || invoice.issuedAt || invoice.createdAt,
    createdAt: invoice.createdAt,
    paymentMethod: invoice.paymentSnapshot?.paymentMethod || invoice.orderSnapshot?.paymentMethod || '-',
    paymentStatus: invoice.paymentSnapshot?.status || orderContext?.paymentStatus || '-',
    subtotal: Number(invoice.totals?.subtotal || 0),
    discountAmount: Number(invoice.totals?.discountTotal || 0),
    taxAmount: Number(invoice.totals?.taxTotal || 0),
    shippingFee: Number(invoice.totals?.shippingFee || 0),
    grandTotal: Number(invoice.totals?.grandTotal || 0),
    taxBreakdown: invoice.totals?.taxBreakdown || { cgst: 0, sgst: 0, igst: 0 },
    paymentSnapshot: invoice.paymentSnapshot || null,
    refundMeta: invoice.refundMeta || {},
    cancelReason: orderContext?.cancelReason || invoice.displayMeta?.refundReason || '',
    cancelDetails: orderContext?.cancelDetails || invoice.displayMeta?.cancelDetails || '',
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
      <PageTitle title={invoice.type === 'credit_note' ? 'CREDIT NOTE DETAILS' : 'INVOICE DETAILS'} />
      <Row className="justify-content-center">
        <Col lg={12}>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="d-flex justify-content-between align-items-center gap-2 mb-3 d-print-none">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => router.push(backTarget)}>
              Back
            </button>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                Print
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                Download
              </button>
            </div>
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

'use client'
import logger from '@/lib/logger'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { settingsAPI } from '@/helpers/settingsApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Row, Spinner, Tab, Tabs } from 'react-bootstrap'
import { INDIA_COUNTRY, INDIA_STATES, normalizeIndiaStateCode } from '@/helpers/indiaRegions'

const EcommerceSettings = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    store_address: '',
    store_zip: '',
    store_city: '',
    store_country: INDIA_COUNTRY.code,
    billing_state: '',
    coupon_enabled: true,
    coupon_sequential: false,
    product_weight_unit: 'kg',
    product_dimensions_unit: 'cm',
    shipping_enabled: true,
    shipping_free_threshold: 0,
    shipping_flat_rate: 0,
    shipping_handling_days: '2-4 business days',
    maxSalesmanDiscountPercent: 0,
    salesmanCommissionPercent: 0,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.accessToken) {
        setLoading(false)
        return
      }
      try {
        const response = await settingsAPI.list(undefined, session.accessToken)
        const data = response.data || response
        const toBool = (value, fallback) => {
          if (value === true || value === 'true' || value === 1 || value === '1') return true
          if (value === false || value === 'false' || value === 0 || value === '0') return false
          return fallback
        }
        const toNumber = (value, fallback) => {
          if (value === null || value === undefined || value === '') return fallback
          const parsed = Number(value)
          return Number.isNaN(parsed) ? fallback : parsed
        }

        setFormData((prev) => ({
          ...prev,
          store_name: data.store_name || '',
          store_phone: data.store_phone || '',
          store_email: data.store_email || '',
          store_address: data.store_address || '',
          store_zip: data.store_zip || '',
          store_city: data.store_city || '',
          store_country: data.store_country || INDIA_COUNTRY.code,
          billing_state: normalizeIndiaStateCode(data.billing_state || ''),
          coupon_enabled: toBool(data.coupon_enabled, prev.coupon_enabled),
          coupon_sequential: toBool(data.coupon_sequential, prev.coupon_sequential),
          product_weight_unit: data.product_weight_unit || prev.product_weight_unit,
          product_dimensions_unit: data.product_dimensions_unit || prev.product_dimensions_unit,
          shipping_enabled: toBool(data.shipping_enabled, prev.shipping_enabled),
          shipping_free_threshold: toNumber(data.shipping_free_threshold, prev.shipping_free_threshold),
          shipping_flat_rate: toNumber(data.shipping_flat_rate, prev.shipping_flat_rate),
          shipping_handling_days: data.shipping_handling_days || prev.shipping_handling_days,
          maxSalesmanDiscountPercent: toNumber(data.maxSalesmanDiscountPercent, 0),
          salesmanCommissionPercent: toNumber(data.salesmanCommissionPercent, 0),
        }))
      } catch (error) {
        logger.error('Failed to fetch ecommerce settings', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [session])

  const handleSave = async () => {
    if (!session?.accessToken) return

    try {
      await settingsAPI.update(
        {
          store_name: formData.store_name,
          store_phone: formData.store_phone,
          store_email: formData.store_email,
          store_address: formData.store_address,
          store_zip: formData.store_zip,
          store_city: formData.store_city,
          store_country: formData.store_country || INDIA_COUNTRY.code,
          billing_state: normalizeIndiaStateCode(formData.billing_state),
          coupon_enabled: !!formData.coupon_enabled,
          coupon_sequential: !!formData.coupon_sequential,
          product_weight_unit: formData.product_weight_unit,
          product_dimensions_unit: formData.product_dimensions_unit,
          shipping_enabled: !!formData.shipping_enabled,
          shipping_free_threshold: Number(formData.shipping_free_threshold || 0),
          shipping_flat_rate: Number(formData.shipping_flat_rate || 0),
          shipping_handling_days: formData.shipping_handling_days,
          maxSalesmanDiscountPercent: Number(formData.maxSalesmanDiscountPercent || 0),
          salesmanCommissionPercent: Number(formData.salesmanCommissionPercent || 0),
        },
        session.accessToken,
      )
      toast.success('Ecommerce settings saved successfully!')
    } catch (error) {
      logger.error(error)
      toast.error('Failed to save ecommerce settings')
    }
  }

  if (loading) return <div className="text-center py-3"><Spinner size="sm" /></div>

  return (
    <>
      <Row>
        <Col lg={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <CardTitle as={'h4'} className="d-flex align-items-center gap-1 mb-0">
                <IconifyIcon icon="solar:cart-large-2-bold-duotone" className="text-primary fs-20" />
                Ecommerce Settings
              </CardTitle>
              <Button size="sm" variant="success" onClick={handleSave}>Save Changes</Button>
            </CardHeader>
            <CardBody>
              <Tabs defaultActiveKey="store" className="nav-tabs card-tabs">
                <Tab eventKey="store" title="Store Address">
                  <div className="alert alert-info border-info d-flex align-items-start gap-2 mt-3">
                    <IconifyIcon icon="mdi:information-outline" className="fs-20 mt-1" />
                    <div>
                      <strong>Store Address:</strong> Your business location and owner details. This is used for general store information and can be copied to Invoice Settings for tax documents.
                    </div>
                  </div>
                  <Row className="mt-3">
                    <Col lg={12}><h6 className="text-muted text-uppercase">Store Details</h6></Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="store_name" className="form-label">Store Name</label>
                        <input id="store_name" className="form-control" value={formData.store_name} onChange={(e) => setFormData((prev) => ({ ...prev, store_name: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="store_phone" className="form-label">Owner Phone Number</label>
                        <input
                          id="store_phone"
                          type="tel"
                          className="form-control"
                          value={formData.store_phone}
                          onChange={(e) => {
                            const digitsOnly = String(e.target.value || '').replace(/\D/g, '').slice(0, 10)
                            setFormData((prev) => ({ ...prev, store_phone: digitsOnly }))
                          }}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="store_email" className="form-label">Owner Email</label>
                        <input id="store_email" className="form-control" type="email" value={formData.store_email} onChange={(e) => setFormData((prev) => ({ ...prev, store_email: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={12}>
                      <div className="mb-3">
                        <label htmlFor="store_address" className="form-label">Store Address</label>
                        <textarea id="store_address" className="form-control" rows={3} value={formData.store_address} onChange={(e) => setFormData((prev) => ({ ...prev, store_address: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="mb-3">
                        <label htmlFor="store_city" className="form-label">City</label>
                        <input id="store_city" className="form-control" value={formData.store_city} onChange={(e) => setFormData((prev) => ({ ...prev, store_city: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="mb-3">
                        <label htmlFor="store_zip" className="form-label">PIN Code</label>
                        <input id="store_zip" className="form-control" value={formData.store_zip} onChange={(e) => setFormData((prev) => ({ ...prev, store_zip: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="mb-3">
                        <label htmlFor="store_country" className="form-label">Country</label>
                        <Form.Select id="store_country" value={formData.store_country} onChange={(e) => setFormData((prev) => ({ ...prev, store_country: e.target.value }))}>
                          <option value={INDIA_COUNTRY.code}>{INDIA_COUNTRY.name}</option>
                        </Form.Select>
                      </div>
                    </Col>

                    <Col lg={4}>
                      <div className="mb-3">
                        <label htmlFor="billing_state" className="form-label">State (Invoice)</label>
                        <Form.Select id="billing_state" value={normalizeIndiaStateCode(formData.billing_state)} onChange={(e) => setFormData((prev) => ({ ...prev, billing_state: e.target.value }))}>
                          <option value="">Select state</option>
                          {INDIA_STATES.map((state) => (
                            <option key={state.code} value={state.code}>{state.name}</option>
                          ))}
                        </Form.Select>
                      </div>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="coupons" title="Coupons">
                  <Row className="mt-3">
                    <Col lg={6}>
                      <Form.Check type="switch" id="coupon_enabled" label="Enable the use of coupon codes" checked={!!formData.coupon_enabled} onChange={(e) => setFormData((prev) => ({ ...prev, coupon_enabled: e.target.checked }))} />
                    </Col>
                    <Col lg={6}>
                      <Form.Check type="switch" id="coupon_sequential" label="Calculate coupon discounts sequentially" checked={!!formData.coupon_sequential} onChange={(e) => setFormData((prev) => ({ ...prev, coupon_sequential: e.target.checked }))} />
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="products" title="Products">
                  <Row className="mt-3">
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="product_weight_unit" className="form-label">Weight Unit</label>
                        <Form.Select id="product_weight_unit" value={formData.product_weight_unit} onChange={(e) => setFormData((prev) => ({ ...prev, product_weight_unit: e.target.value }))}>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="g">Gram (g)</option>
                          <option value="lb">Pound (lb)</option>
                        </Form.Select>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="product_dimensions_unit" className="form-label">Dimensions Unit</label>
                        <Form.Select id="product_dimensions_unit" value={formData.product_dimensions_unit} onChange={(e) => setFormData((prev) => ({ ...prev, product_dimensions_unit: e.target.value }))}>
                          <option value="cm">Centimeter (cm)</option>
                          <option value="mm">Millimeter (mm)</option>
                          <option value="in">Inch (in)</option>
                        </Form.Select>
                      </div>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="shipping" title="Shipping">
                  <Row className="mt-3">
                    <Col lg={6}>
                      <Form.Check type="switch" id="shipping_enabled" label="Enable shipping rates" checked={!!formData.shipping_enabled} onChange={(e) => setFormData((prev) => ({ ...prev, shipping_enabled: e.target.checked }))} />
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="shipping_free_threshold" className="form-label">Free shipping threshold</label>
                        <input id="shipping_free_threshold" className="form-control" type="number" value={formData.shipping_free_threshold} onChange={(e) => setFormData((prev) => ({ ...prev, shipping_free_threshold: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="shipping_flat_rate" className="form-label">Default flat rate</label>
                        <input id="shipping_flat_rate" className="form-control" type="number" value={formData.shipping_flat_rate} onChange={(e) => setFormData((prev) => ({ ...prev, shipping_flat_rate: e.target.value }))} />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="shipping_handling_days" className="form-label">Handling time</label>
                        <input id="shipping_handling_days" className="form-control" placeholder="2-4 business days" value={formData.shipping_handling_days} onChange={(e) => setFormData((prev) => ({ ...prev, shipping_handling_days: e.target.value }))} />
                      </div>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="salesperson" title="Salesperson">
                  <Row className="mt-3">
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="maxSalesmanDiscountPercent" className="form-label">Max Discount in Manual Order (%)</label>
                        <input id="maxSalesmanDiscountPercent" className="form-control" type="number" min="0" max="100" value={formData.maxSalesmanDiscountPercent} onChange={(e) => setFormData((prev) => ({ ...prev, maxSalesmanDiscountPercent: e.target.value }))} />
                        <small className="text-muted">Leave empty to use 0.</small>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label htmlFor="salesmanCommissionPercent" className="form-label">Salesperson Commission (%)</label>
                        <input id="salesmanCommissionPercent" className="form-control" type="number" min="0" max="100" value={formData.salesmanCommissionPercent} onChange={(e) => setFormData((prev) => ({ ...prev, salesmanCommissionPercent: e.target.value }))} />
                        <small className="text-muted">Leave empty to use 0.</small>
                      </div>
                    </Col>
                  </Row>
                </Tab>

              </Tabs>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default EcommerceSettings

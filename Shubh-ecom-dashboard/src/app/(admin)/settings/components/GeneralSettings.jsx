'use client'
import logger from '@/lib/logger'
import { settingsAPI } from '@/helpers/settingsApi'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'

const toMaxDaysInput = (value) => {
  if (!value) return ''
  const numeric = Number(value)
  if (Number.isFinite(numeric)) return String(Math.trunc(numeric))

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  return String(Math.max(1, diffDays))
}

const GeneralSettings = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    site_title: '',
    flash_deal_max_days: '2',
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
        setFormData((prev) => ({
          ...prev,
          site_title: data.site_title || '',
          flash_deal_max_days: toMaxDaysInput(data.flash_deal_max_days ?? data.flash_deal_range_end) || '2',
        }))
      } catch (error) {
        logger.error('Failed to fetch settings', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [session])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!session?.accessToken) return

    const maxDays = Number(formData.flash_deal_max_days)
    if (!Number.isInteger(maxDays)) {
      toast.error('Flash deal max days must be a whole number')
      return
    }
    if (maxDays < 1) {
      toast.error('Flash deal max days cannot be less than 1')
      return
    }

    try {
      const payload = {
        ...formData,
        flash_deal_max_days: maxDays,
        flash_deal_range_start: null,
        flash_deal_range_end: null,
      }
      await settingsAPI.update(payload, session.accessToken)
      toast.success('Settings saved successfully!')
    } catch (error) {
      logger.error(error)
      toast.error('Failed to save settings')
    }
  }

  if (loading) return <div className="text-center py-3"><Spinner size="sm" /></div>

  return (
    <Row>
      <Col lg={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <CardTitle as={'h4'} className="d-flex align-items-center gap-1">
              <IconifyIcon icon="solar:settings-bold-duotone" className="text-primary fs-20" />
              General Settings
            </CardTitle>
            <Button size="sm" variant="success" onClick={handleSave}>Save Changes</Button>
          </CardHeader>
          <CardBody>
            <Row>
              <Col lg={6}>
                <div className="mb-3">
                  <label htmlFor="site_title" className="form-label">Site Title</label>
                  <input
                    type="text"
                    id="site_title"
                    name="site_title"
                    className="form-control"
                    placeholder="Site Title"
                    value={formData.site_title}
                    onChange={handleChange}
                  />
                </div>
              </Col>
              <Col lg={6}>
                <div className="mb-3">
                  <small className="text-muted d-block mt-4">
                    Contact email, phone, and location are managed from Ecommerce Settings - Store Address.
                  </small>
                </div>
              </Col>
              <Col lg={12}><hr className="my-3" /></Col>
              <Col lg={6}>
                <div className="mb-3">
                  <label htmlFor="flash_deal_max_days" className="form-label">Flash Deal Max Days</label>
                  <input
                    type="number"
                    id="flash_deal_max_days"
                    name="flash_deal_max_days"
                    className="form-control"
                    min="1"
                    step="1"
                    value={formData.flash_deal_max_days}
                    onChange={handleChange}
                    placeholder="2"
                  />
                </div>
              </Col>
              <Col lg={6}>
                <div className="mb-3 d-flex align-items-end h-100">
                  <small className="text-muted">Default flash deal will run from now until max days. Minimum is 1 day.</small>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default GeneralSettings

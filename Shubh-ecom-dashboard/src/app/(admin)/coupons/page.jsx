'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import PageTItle from '@/components/PageTItle'
import CouponsBoxs from './components/CouponsBoxs'
import CouponsDataList from './components/CouponsDataList'
import couponService from '@/services/couponService'

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.coupons)) return payload.coupons
  return []
}

const CouponsListPage = () => {
  const { data: session } = useSession()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch coupons
  useEffect(() => {
    fetchCoupons()
  }, [session])

  const fetchCoupons = async () => {
    if (!session?.accessToken) return

    try {
      setLoading(true)
      const response = await couponService.getCoupons(session.accessToken)
      setCoupons(extractItems(response?.data || response))
    } catch (err) {
      console.error('Error fetching coupons:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageTItle title="COUPONS" />
      <CouponsBoxs coupons={coupons} loading={loading} />
      <CouponsDataList 
        coupons={coupons} 
        setCoupons={setCoupons}
        loading={loading}
      />
    </>
  )
}

export default CouponsListPage

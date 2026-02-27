'use client'

import PageTitle from '@/components/PageTitle'
import dynamic from 'next/dynamic'
const InvoiceAdd = dynamic(() => import('./InvoiceAdd'), {
  ssr: false,
})
const InvoicePage = () => {
  return (
    <>
      <PageTitle title="INVOICES CREATE" />
      <InvoiceAdd />
    </>
  )
}
export default InvoicePage

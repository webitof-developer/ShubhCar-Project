import PageTItle from '@/components/PageTItle'
import CustomerDataCard from './components/CustomerDataCard'
import CustomerDataList from './components/CustomerDataList'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Customers',
}
const CustomerPage = () => {
  return (
    <>
      <PageTItle title="CUSTOMER LIST" />
      {/* <CustomerDataCard /> */}
      <CustomerDataList />
    </>
  )
}
export default CustomerPage

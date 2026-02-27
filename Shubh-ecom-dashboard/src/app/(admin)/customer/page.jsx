import PageTitle from '@/components/PageTitle'
import CustomerDataCard from './components/CustomerDataCard'
import CustomerDataList from './components/CustomerDataList'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Customers',
}
const CustomerPage = () => {
  return (
    <>
      <PageTitle title="CUSTOMER LIST" />
      {/* <CustomerDataCard /> */}
      <CustomerDataList />
    </>
  )
}
export default CustomerPage

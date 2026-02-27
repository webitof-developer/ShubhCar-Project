import PageTitle from '@/components/PageTitle'
import OrdersList from '../components/OrdersList'

export const metadata = {
  title: 'Create Manual Order',
}

const ManualCreatePage = () => {
  return (
    <>
      <PageTitle title="CREATE MANUAL ORDER" />
      <OrdersList hideList />
    </>
  )
}

export default ManualCreatePage

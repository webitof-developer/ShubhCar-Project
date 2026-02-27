import ModernDashboard from './components/ModernDashboard'
import PageTitle from '@/components/PageTitle'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard',
}

const DashboardPage = () => {
  return (
    <>
      <PageTitle title="DASHBOARD" />
      <ModernDashboard />
    </>
  )
}

export default DashboardPage

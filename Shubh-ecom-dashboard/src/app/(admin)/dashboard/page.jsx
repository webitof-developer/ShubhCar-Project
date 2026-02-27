import ModernDashboard from './components/ModernDashboard'
import PageTItle from '@/components/PageTitle'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard',
}

const DashboardPage = () => {
  return (
    <>
      <PageTItle title="DASHBOARD" />
      <ModernDashboard />
    </>
  )
}

export default DashboardPage

export const dynamic = 'force-dynamic'
import GeneralSettings from './components/GeneralSettings'
import EcommerceSettings from './components/EcommerceSettings'
import InvoiceSettings from './components/InvoiceSettings'
import StorageSettings from './components/StorageSettings'
import PageTitle from '@/components/PageTitle'
const SettingsPage = () => {
  return (
    <>
      <PageTitle title="SETTINGS" />
      <GeneralSettings />
      <EcommerceSettings />
      <StorageSettings />
      <InvoiceSettings />
    </>
  )
}
export default SettingsPage

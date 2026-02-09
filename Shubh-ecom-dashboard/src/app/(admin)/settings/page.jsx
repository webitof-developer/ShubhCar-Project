export const dynamic = 'force-dynamic'
import GeneralSettings from './components/GeneralSettings'
import EcommerceSettings from './components/EcommerceSettings'
import LocalizationSettings from './components/LocalizationSettings'
import InvoiceSettings from './components/InvoiceSettings'
import StorageSettings from './components/StorageSettings'
import PageTItle from '@/components/PageTItle'
const SettingsPage = () => {
  return (
    <>
      <PageTItle title="SETTINGS" />
      <GeneralSettings />
      <EcommerceSettings />
      <StorageSettings />
      <LocalizationSettings />
      <InvoiceSettings />
    </>
  )
}
export default SettingsPage

import PageTItle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AddProduct from './AddProduct'

export const metadata = {
  title: 'Add Product'
}

const ProductAddPage = () => {
  return (
    <>
      <PageTItle title="ADD PRODUCT" />
      <Row>
        <AddProduct />
      </Row>
    </>
  )
}

export default ProductAddPage

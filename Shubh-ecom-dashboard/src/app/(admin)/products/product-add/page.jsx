import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AddProduct from './AddProduct'

export const metadata = {
  title: 'Add Product'
}

const ProductAddPage = () => {
  return (
    <>
      <PageTitle title="ADD PRODUCT" />
      <Row>
        <AddProduct />
      </Row>
    </>
  )
}

export default ProductAddPage

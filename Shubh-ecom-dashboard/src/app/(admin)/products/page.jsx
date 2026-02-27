import { Col, Row } from 'react-bootstrap'
import ProductList from './components/ProductList'
import PageTitle from '@/components/PageTitle'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Product List',
}
const ProductListPage = () => {
  return (
    <>
      <PageTitle title="PRODUCT LIST" />
      <Row>
        <Col xl={12}>
          <ProductList />
        </Col>
      </Row>
    </>
  )
}
export default ProductListPage

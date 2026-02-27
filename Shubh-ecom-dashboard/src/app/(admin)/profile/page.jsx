export const dynamic = 'force-dynamic'
import avatar1 from '@/assets/images/users/dummy-avatar.jpg'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'

import PageTItle from '@/components/PageTitle'
export const metadata = {
  title: 'Profile',
}
const ProfilePage = () => {
  return (
    <>
      <PageTItle title="PROFILE" />

    <Row>
      <Col xl={9} lg={8}>
        <Card className="overflow-hidden">
          <CardBody>
            <div className="bg-primary profile-bg rounded-top position-relative mx-n3 mt-n3">
              <Image
                src={avatar1}
                alt="avatar"
                className="avatar-xl border border-light border-3 rounded-circle position-absolute top-100 start-0 translate-middle ms-5"
              />
            </div>
            <div className="mt-5 d-flex flex-wrap align-items-center justify-content-between">
             
            </div>
         
          </CardBody>
        </Card>
      </Col>
      <Col xl={3} lg={4}>
        <Card>
          <CardHeader>
            <CardTitle as={'h4'}>Personal Information</CardTitle>
          </CardHeader>
          <CardBody>
            <div>
           
              <div className="mt-2">
                <Link href="" className="text-primary">
                  View More
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  
    </>


  )
}
export default ProfilePage

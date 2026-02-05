'use client'

import logoDark from '@/assets/images/logo-dark.png'
import logoLight from '@/assets/images/logo-light.png'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import Link from 'next/link'
import { Button, Card, Col, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
const ResetPassword = () => {
  const resetPasswordSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('please enter your email'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  })
  return (
    <div className="d-flex flex-column vh-100 p-3">
      <div className="d-flex flex-column flex-grow-1">
        <Row className="h-100">
          <Col xxl={12}>
            <Row className="justify-content-center h-100">
              <Col lg={4} className="py-lg-5">
                <div className="d-flex flex-column h-100 justify-content-center">
                  <div className="auth-logo mb-4">
                    <div className="logo-dark">
                      <Image src={logoDark} height={30} alt="logo dark" />
                    </div>
                    <div className="logo-light">
                      <Image src={logoLight} height={24} alt="logo light" />
                    </div>
                  </div>
                  <h2 className="fw-bold fs-24">Reset Password</h2>
                  <p className="text-muted mt-1 mb-4">
                    Enter your email address and we&apos;ll send you an email with instructions to reset your password.
                  </p>
                  <div>
                    <form className="authentication-form" onSubmit={handleSubmit(() => {})}>
                      <TextFormInput
                        control={control}
                        name="email"
                        containerClassName="mb-3"
                        label="Email"
                        id="email-id"
                        placeholder="Enter your email"
                      />
                      <div className="mb-1 text-center d-grid">
                        <Button variant="primary" type="submit">
                          Reset Password
                        </Button>
                      </div>
                    </form>
                  </div>
                  <p className="mt-5 text-danger text-center">
                    Back to
                    <Link href="/auth/sign-in" className="text-primary fw-bold ms-1 text-decoration-underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  )
}
export default ResetPassword

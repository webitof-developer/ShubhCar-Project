import logger from '@/lib/logger'


import { sleep } from '@/utils/promise'
import * as yup from 'yup'

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.reviews)) return payload.reviews
  if (Array.isArray(payload?.transactions)) return payload.transactions
  return []
}
export const getNotifications = async () => {
  return []
}

export const getAttributeData = async () => {
  return []
}

export const getSellersData = async () => {
  return []
}
// MODIFIED: Fetching real users from API
export const getAllUsers = async (token) => {
  if (!token) return []
  try {
    const { userAPI } = require('@/helpers/userApi')
    const response = await userAPI.list({}, token)
    return extractItems(response?.data || response)
  } catch (error) {
    logger.error('Error fetching users:', error)
    return []
  }
}
export const getAllTransactions = async (token) => {
  if (!token) return []
  try {
    const { paymentAPI } = require('@/helpers/paymentApi')
    const response = await paymentAPI.list({}, token)
    return extractItems(response?.data || response)
  } catch (error) {
    logger.error('Error fetching transactions:', error)
    return []
  }
}

export const getPermissionsListData = async () => {
  return []
}

export const getAllProjects = async () => {
  await sleep()
  return projectsData
}

export const getAllOrders = async (token) => {
  if (!token) return []
  try {
    const { orderAPI } = require('@/helpers/orderApi')
    const response = await orderAPI.list({}, token)
    const payload = response.data || []
    if (Array.isArray(payload)) return payload
    return payload.items || []
  } catch (error) {
    logger.error('Error fetching orders:', error)
    return []
  }
}
// MODIFIED: Fetching real reviews from API
export const getAllReviews = async (token) => {
  if (!token) return []
  try {
    const { reviewAPI } = require('@/helpers/reviewApi')
    const response = await reviewAPI.list({}, token)
    return extractItems(response?.data || response)
  } catch (error) {
    logger.error('Error fetching reviews:', error)
    return []
  }
}

export const serverSideFormValidate = async (data) => {
  const formSchema = yup.object({
    fName: yup
      .string()
      .min(3, 'First name should have at least 3 characters')
      .max(50, 'First name should not be more than 50 characters')
      .required('First name is required'),
    lName: yup
      .string()
      .min(3, 'Last name should have at least 3 characters')
      .max(50, 'Last name should not be more than 50 characters')
      .required('Last name is required'),
    username: yup
      .string()
      .min(3, 'Username should have at least 3 characters')
      .max(20, 'Username should not be more than 20 characters')
      .required('Username is required'),
    city: yup
      .string()
      .min(3, 'City should have at least 3 characters')
      .max(20, 'City should not be more than 20 characters')
      .required('City is required'),
    state: yup
      .string()
      .min(3, 'State should have at least 3 characters')
      .max(20, 'State should not be more than 20 characters')
      .required('State is required'),
    zip: yup.number().required('ZIP is required'),
  })
  try {
    const validatedObj = await formSchema.validate(data, {
      abortEarly: false,
    })
    return validatedObj
  } catch (error) {
    return error
  }
}
export const getEmailsCategoryCount = async () => {
  const mailsCount = {
    inbox: 0,
    starred: 0,
    draft: 0,
    sent: 0,
    deleted: 0,
    important: 0,
  }
  mailsCount.inbox = emailsData.filter((email) => email.toId === '101').length
  mailsCount.starred = emailsData.filter((email) => email.starred).length
  mailsCount.draft = emailsData.filter((email) => email.draft).length
  mailsCount.sent = emailsData.filter((email) => email.fromId === '101').length
  mailsCount.important = emailsData.filter((email) => email.important).length
  await sleep()
  return mailsCount
}

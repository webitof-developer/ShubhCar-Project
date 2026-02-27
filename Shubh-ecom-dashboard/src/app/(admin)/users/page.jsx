'use client'
import logger from '@/lib/logger'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { API_BASE_URL } from '@/helpers/apiBase'
import { useSearchParams } from 'next/navigation'
import { Card, CardBody, Col, Row, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { rolesAPI } from '@/helpers/rolesApi'
import { usePermissions } from '@/hooks/usePermissions'
import DataTable from '@/components/shared/DataTable'
import CRUDModal from '@/components/shared/CRUDModal'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'
import useAPI from '@/hooks/useAPI'

const ADMIN_FULL_ACCESS_VALUE = '__admin_full_access__'

const normalizeRoleId = (roleId) => {
  if (!roleId) return ''
  if (typeof roleId === 'string') return roleId
  if (typeof roleId === 'object') {
    if (roleId._id) return normalizeRoleId(roleId._id)
    if (typeof roleId.toString === 'function') {
      const asText = roleId.toString()
      if (asText && asText !== '[object Object]') return asText
    }
  }
  return ''
}

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.roles)) return payload.roles
  return []
}

const UsersPage = () => {
  const { data: session, status } = useSession()
  const { hasPermission } = usePermissions()
  const searchParams = useSearchParams()
  
  // Data State
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Permissions
  const canCreateUsers = hasPermission('users.create')
  const canUpdateUsers = hasPermission('users.update')
  const canDeleteUsers = hasPermission('users.delete')
  const canManageRole = session?.user?.role === 'admin'
  const safeUsers = Array.isArray(users) ? users : []
  const safeRoles = Array.isArray(roles) ? roles : []
  const roleOptions = (() => {
    const options = [{ value: ADMIN_FULL_ACCESS_VALUE, label: 'Admin (Full Access)' }]
    for (const role of safeRoles) {
      if (!role || typeof role !== 'object') continue
      if (!role._id) continue
      options.push({ value: role._id, label: role.name || 'Unnamed Role' })
    }
    return options
  })()

  // --- API Hooks ---

  // Delete User
  const { execute: deleteUser, loading: deleting } = useAPI(
    (id) => fetch(`${API_BASE_URL}/users/admin/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    }).then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to delete'))),
    { showSuccessToast: true, successMessage: 'User deleted successfully!' }
  )

  // Save User (Create/Update)
  const { execute: saveUser, loading: saving } = useAPI(
    (formData, id) => {
      const url = id ? `${API_BASE_URL}/users/admin/${id}` : `${API_BASE_URL}/users/admin`
      const payload = { ...formData }
      if (!id && payload.password) {
         // Create mode: password required
      } else if (id && !payload.password) {
         // Edit mode: if password empty, remove it to prevent overwrite
         delete payload.password
      }
      if (payload.roleId === ADMIN_FULL_ACCESS_VALUE || !payload.roleId) {
        delete payload.roleId
      }
      if (!canManageRole) {
        delete payload.roleId
      }
      return fetch(url, {
        method: id ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(new Error(err.message || 'Failed to save'))))
    },
    { showSuccessToast: true, successMessage: 'User saved successfully!' }
  )

  // --- Fetch Data ---

  const fetchUsers = async (page = 1) => {
    if (status !== 'authenticated') return
    const token = session?.accessToken
    if (!token) {
      setUsersLoading(false)
      return
    }

    try {
      setUsersLoading(true)
      const response = await fetch(
        `${API_BASE_URL}/users/admin?role=admin&page=${page}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(extractItems(data?.data || data))
      setFetchError(null)
    } catch (err) {
      logger.error(err)
      setFetchError(err.message)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchRoles = async () => {
    if (status !== 'authenticated') return
    const token = session?.accessToken
    if (!token) return
    try {
      const response = await rolesAPI.list(token)
      setRoles(extractItems(response?.data || response))
    } catch (err) {
      logger.error('Failed to fetch roles', err)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage, status, session?.accessToken])

  useEffect(() => {
    fetchRoles()
  }, [status, session?.accessToken])

  // --- External Actions (Query Params) ---
  useEffect(() => {
    const open = searchParams.get('open')
    const id = searchParams.get('id')
    if (open === 'create' && canCreateUsers) {
      handleOpenModal()
    } else if (open === 'edit' && id && canUpdateUsers) {
      const target = safeUsers.find((u) => u._id === id)
      if (target) {
        handleOpenModal(target)
      }
    }
  }, [searchParams, safeUsers, canCreateUsers, canUpdateUsers])

  // --- Handlers ---

  const handleOpenModal = (user = null) => {
    if (!user) {
      setEditingItem(null)
      setShowModal(true)
      return
    }
    setEditingItem({
      ...user,
      roleId: normalizeRoleId(user.roleId) || ADMIN_FULL_ACCESS_VALUE,
    })
    setShowModal(true)
  }

  const handleSubmit = async (formData) => {
    await saveUser(formData, editingItem?._id)
    setShowModal(false)
    fetchUsers(currentPage)
  }

  const handleDeleteClick = (user) => {
    setDeletingId(user._id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    await deleteUser(deletingId)
    setShowDeleteModal(false)
    fetchUsers(currentPage)
  }

  // --- Configurations ---

  const formFields = [
    { name: 'firstName', label: 'First Name', required: true },
    { name: 'lastName', label: 'Last Name' },
    { 
        name: 'email', label: 'Email', type: 'email', required: true,
        validate: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : null
    },
    { 
        name: 'phone', label: 'Phone', type: 'tel', placeholder: '10-digit mobile number',
        validate: (value) => value && !/^[6-9]\d{9}$/.test(value.replace(/\D/g, '')) ? 'Invalid 10-digit phone number' : null
    },
    { 
        name: 'password', 
        label: editingItem ? 'Password (leave blank to keep current)' : 'Password', 
        type: 'password', 
        required: !editingItem,
        validate: (value) => value && value.length < 6 ? 'Password must be at least 6 characters' : null
    },
    { 
        name: 'roleId', label: 'User Role', type: 'select', 
        options: roleOptions,
        disabled: !canManageRole,
        helpText: !canManageRole ? 'Only admin can change role' : undefined,
    },
    { 
        name: 'status', label: 'Status', type: 'select', 
        options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
    }
  ]

  // --- Render ---

  if (status === 'loading' || (usersLoading && !safeUsers.length)) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  }

  if (status === 'unauthenticated') return <Alert variant="warning">Please log in to view users.</Alert>
  if (!hasPermission('users.view')) return <Alert variant="warning">You do not have permission to view users.</Alert>

  return (
    <>
      <PageTitle title="USERS LIST" />

      {fetchError && (
        <Alert variant="danger" dismissible onClose={() => setFetchError(null)}>
          {fetchError}
        </Alert>
      )}

      <Row>
        <Col xl={12}>
          <Card>
            <div className="d-flex card-header justify-content-between align-items-center">
              <div><h4 className="card-title mb-0">Admin Users</h4></div>
              <Button
                size="sm" variant="primary"
                onClick={() => handleOpenModal()}
                className="d-flex align-items-center gap-1"
                disabled={!canCreateUsers}
              >
                <IconifyIcon icon="bx:plus" />
                Add New
              </Button>
            </div>
            <CardBody>
              <DataTable
                  columns={[
                    { key: 'checkbox', label: '', width: 20, render: () => <Form.Check /> },
                    { key: 'name', label: 'Name', render: (user) => (
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm bg-primary-subtle rounded-circle flex-centered flex-shrink-0 me-2">
                          <span className="text-primary fw-bold">{user.firstName?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="fw-medium">{user.firstName} {user.lastName}</div>
                      </div>
                    )},
                    { key: 'email', label: 'Email', render: (user) => user.email || '-' },
                    { key: 'phone', label: 'Phone', render: (user) => user.phone || '-' },
                    { key: 'role', label: 'Role', render: (user) => {
                      const resolvedRoleId = normalizeRoleId(user.roleId)
                      return safeRoles.find((role) => String(role._id) === resolvedRoleId)?.name || 'Admin (Full Access)'
                    } },
                    { key: 'status', label: 'Status', render: (user) => (
                      <Badge bg={user.status === 'active' ? 'success' : user.status === 'inactive' ? 'warning' : 'danger'} className="badge-subtle">
                        {user.status}
                      </Badge>
                    )},
                    { key: 'authProvider', label: 'Auth Provider', render: (user) => (
                      <Badge bg="info" className="badge-subtle text-capitalize">{user.authProvider}</Badge>
                    )},
                    { key: 'created', label: 'Created', render: (user) => new Date(user.createdAt).toLocaleDateString() },
                    { key: 'actions', label: 'Action', render: (user) => (
                      <div className="d-flex gap-2">
                        <Button variant="soft-primary" size="sm" onClick={() => handleOpenModal(user)} disabled={!canUpdateUsers}>
                          <IconifyIcon icon="solar:pen-2-broken" className="align-middle fs-18" />
                        </Button>
                        <Button variant="soft-danger" size="sm" onClick={() => handleDeleteClick(user)} disabled={!canDeleteUsers}>
                          <IconifyIcon icon="solar:trash-bin-minimalistic-2-broken" className="align-middle fs-18" />
                        </Button>
                      </div>
                    )}
                  ]}
                  data={safeUsers}
                  loading={usersLoading}
                  emptyMessage="No admin users found"
                />
            </CardBody>
            <div className="card-footer border-top">
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-end mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                  </li>
                  <li className="page-item active"><span className="page-link">{currentPage}</span></li>
                  <li className="page-item">
                    <button className="page-link" onClick={() => setCurrentPage((p) => p + 1)} disabled={safeUsers.length < 20}>Next</button>
                  </li>
                </ul>
              </nav>
            </div>
          </Card>
        </Col>
      </Row>

      <CRUDModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={editingItem ? 'Edit Admin User' : 'Add New Admin User'}
        fields={formFields}
        initialData={editingItem || { 
            firstName: '', lastName: '', email: '', phone: '', 
            password: '', roleId: ADMIN_FULL_ACCESS_VALUE, status: 'active' 
        }}
        onSubmit={handleSubmit}
        submitting={saving}
        editMode={!!editingItem}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName="User"
        deleting={deleting}
      />
    </>
  )
}
  
export default UsersPage

'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout, SectionHeader, Badge, Modal, LoadingSpinner, useToast, ToastProvider } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { Search, Plus, Edit2, Trash2, Users } from 'lucide-react';

function UsersContent() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', role: 'student', phone: '', password: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users({ page, per_page: 15, role: roleFilter, search });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [page, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', email: '', full_name: '', role: 'student', phone: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, full_name: u.full_name, role: u.role, phone: u.phone || '', password: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await adminApi.updateUser(editUser.id, form);
        showToast('User updated successfully', 'success');
      } else {
        await adminApi.createUser(form);
        showToast('User created successfully', 'success');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Failed to save user', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(id);
      showToast('User deleted', 'success');
      load();
    } catch { showToast('Failed to delete user', 'error'); }
  };

  const ROLE_TABS = ['', 'admin', 'teacher', 'student', 'parent'];
  const ROLE_LABELS: Record<string, string> = { '': 'All', admin: 'Admins', teacher: 'Teachers', student: 'Students', parent: 'Parents' };

  return (
    <DashboardLayout role="admin" title="User Management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>User Management</h2>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ROLE_TABS.map(r => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${roleFilter === r ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header text-left">Name</th>
              <th className="table-header text-left hidden md:table-cell">Username</th>
              <th className="table-header text-left hidden lg:table-cell">Email</th>
              <th className="table-header text-left">Role</th>
              <th className="table-header text-left hidden md:table-cell">Status</th>
              <th className="table-header text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><LoadingSpinner /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                        {u.full_name?.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500">{u.username}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-500 text-xs">{u.email}</td>
                  <td className="table-cell"><Badge label={u.role} type={u.role} /></td>
                  <td className="table-cell hidden md:table-cell"><Badge label={u.is_active ? 'Active' : 'Inactive'} type={u.is_active ? 'active' : 'inactive'} /></td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.full_name)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm disabled:opacity-50 py-1.5">Prev</button>
              <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm disabled:opacity-50 py-1.5">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Add New User'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Arun Kumar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" disabled={!!editUser} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
              <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editUser ? 'Update User' : 'Create User')}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default function AdminUsersPage() {
  return <ToastProvider><UsersContent /></ToastProvider>;
}

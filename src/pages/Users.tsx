import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, UserCheck, UserX, Shield, User as UserIcon } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { User, UserRole } from "../types";
import {
  Button, Input, Select, Modal, ConfirmDialog,
  Card, Table, Th, Td, SearchBar, PageHeader, Badge, StatusBadge, EmptyState,
} from "../components/ui";

const ROLES: UserRole[] = ["admin", "manager", "staff", "viewer"];
const DEPARTMENTS = ["Operations", "Logistics", "Warehouse", "Inventory", "Receiving", "Finance", "IT", "Management"];

const roleColors: Record<UserRole, string> = {
  admin: "red",
  manager: "purple",
  staff: "blue",
  viewer: "gray",
};

type UserForm = Omit<User, "id" | "createdAt" | "lastLogin"> & { password: string };

function emptyForm(): UserForm {
  return { name: "", email: "", password: "", role: "staff", avatar: "", department: "Operations", active: true };
}

export default function Users() {
  const { state, showToast, generateId, createUser, updateUser, deleteUser } = useApp();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const availableRoles = state.currentUser.role === "admin" ? ROLES : ROLES.filter((role) => role !== "admin");

  const filtered = useMemo(() => {
    let users = state.users;
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
    }
    if (filterRole) users = users.filter((u) => u.role === filterRole);
    return users;
  }, [state.users, search, filterRole]);

  const validate = (f: typeof form) => {
    const errors: Record<string, string> = {};
    if (!f.name.trim()) errors.name = "Name is required";
    if (!f.email.trim()) errors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = "Invalid email format";
    if (state.users.some((u) => u.email === f.email && u.id !== selectedUser?.id)) errors.email = "Email already exists";
    if (!selectedUser && f.password.length < 8) errors.password = "Password must be at least 8 characters";
    return errors;
  };

  const handleAdd = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const { password, ...userFields } = form;
    const user: User = {
      ...userFields,
      id: generateId("user"),
      avatar: initials,
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Never",
    };
    try {
      await createUser(user, password);
      showToast(`User "${form.name}" created`, "success");
      setShowAddModal(false);
      setForm(emptyForm());
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to create user", "error");
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    const errors = validate(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const { password: _password, ...userFields } = form;
    try {
      await updateUser({ ...selectedUser, ...userFields, avatar: initials });
      showToast(`User "${form.name}" updated`, "success");
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update user", "error");
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await updateUser({ ...user, active: !user.active });
      showToast(`${user.name} ${user.active ? "deactivated" : "activated"}`, "info");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update user", "error");
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, avatar: user.avatar, department: user.department, active: user.active });
    setFormErrors({});
    setShowEditModal(true);
  };

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = state.users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<UserRole, number>);

  const formFields = (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" error={formErrors.name} />
        <Input label="Email Address *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="j.smith@company.com" error={formErrors.email} />
      </div>
      {!selectedUser && (
        <Input label="Temporary Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={formErrors.password} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Role *"
          value={form.role}
          disabled={selectedUser?.id === state.currentUser.id}
          onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
        >
          {availableRoles.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </Select>
        <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded accent-blue-500" />
        <label htmlFor="active" className="text-sm text-slate-300">Active account</label>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${state.users.length} users · ${state.users.filter(u => u.active).length} active`}
        actions={
          <Button variant="primary" onClick={() => { setSelectedUser(null); setForm(emptyForm()); setFormErrors({}); setShowAddModal(true); }}>
            <Plus size={15} /> Add User
          </Button>
        }
      />

      {/* Role Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {ROLES.map((role) => (
          <Card key={role} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${role === "admin" ? "bg-red-500/10 text-red-400" : role === "manager" ? "bg-purple-500/10 text-purple-400" : role === "staff" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>
                <Shield size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100">{roleCounts[role]}</p>
                <p className="text-xs text-slate-500 capitalize">{role}s</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
        <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-36">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </Select>
      </div>

      {/* User Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Last Login</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={<UserIcon size={40} />} title="No users found" description="Add a user to get started" action={<Button variant="primary" size="sm" onClick={() => { setSelectedUser(null); setForm(emptyForm()); setShowAddModal(true); }}><Plus size={14} /> Add User</Button>} />
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const canModify = state.currentUser.role === "admin" || user.role !== "admin";
                const isCurrentUser = user.id === state.currentUser.id;
                return (
                <tr key={user.id} className="hover:bg-[#1E2A3A]/50 transition-colors group">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.active ? "from-blue-500 to-purple-600" : "from-slate-600 to-slate-700"} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {user.avatar}
                      </div>
                      <span className="text-xs font-medium text-slate-200">{user.name}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-400">{user.email}</span></Td>
                  <Td>
                    <Badge variant={roleColors[user.role] as any} className="capitalize">{user.role}</Badge>
                  </Td>
                  <Td><span className="text-xs text-slate-400">{user.department}</span></Td>
                  <Td><span className="text-xs text-slate-500">{user.lastLogin}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.active ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <span className={`text-xs ${user.active ? "text-emerald-400" : "text-slate-500"}`}>{user.active ? "Active" : "Inactive"}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{user.createdAt}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button disabled={!canModify} onClick={() => openEdit(user)} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300 hover:shadow-[0_0_14px_rgba(245,158,11,0.28)] focus-visible:shadow-[0_0_14px_rgba(245,158,11,0.28)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none" title={canModify ? "Edit" : "Administrators can only be edited by another administrator"}>
                        <Edit2 size={13} />
                      </button>
                      <button disabled={!canModify || isCurrentUser} onClick={() => void toggleActive(user)} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-[0_0_14px_rgba(59,130,246,0.28)] focus-visible:shadow-[0_0_14px_rgba(59,130,246,0.28)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none" title={isCurrentUser ? "You cannot deactivate your own account" : user.active ? "Deactivate" : "Activate"}>
                        {user.active ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                      <button onClick={() => setDeleteId(user.id)} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_14px_rgba(239,68,68,0.28)] focus-visible:shadow-[0_0_14px_rgba(239,68,68,0.28)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none" title={isCurrentUser ? "You cannot delete your own account" : "Delete"} disabled={!canModify || isCurrentUser}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
              })
            )}
          </tbody>
        </Table>
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="md">
        {formFields}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}><Plus size={14} /> Create User</Button>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="md">
        {formFields}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit}><Edit2 size={14} /> Save Changes</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void deleteUser(deleteId!)
            .then(() => showToast("User deleted", "warning"))
            .catch((error) => showToast(error instanceof Error ? error.message : "Unable to delete user", "error"));
        }}
        title="Delete User"
        message={`Are you sure you want to delete "${state.users.find(u => u.id === deleteId)?.name}"?`}
        confirmLabel="Delete User"
        variant="danger"
      />
    </div>
  );
}

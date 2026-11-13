import { useState, useMemo, useRef, type FormEvent } from "react";
import { Plus, Edit2, Trash2, UserCheck, UserX, Shield, User as UserIcon, Eye, EyeOff, Copy, RefreshCw, Check, X, AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { User, UserRole } from "../types";
import {
  Button, Input, Select, Modal, ConfirmDialog,
  Card, Table, Th, Td, SearchBar, PageHeader, Badge, StatusBadge, EmptyState,
} from "../components/ui";

const ROLES: UserRole[] = ["admin", "staff", "viewer"];
const DEPARTMENTS = ["Operations", "Logistics", "Warehouse", "Inventory", "Receiving", "Finance", "IT", "Management"];

const roleColors: Record<UserRole, string> = {
  admin: "red",
  staff: "blue",
  viewer: "gray",
};

type UserForm = Omit<User, "id" | "createdAt" | "lastLogin"> & { password: string; passwordConfirmation: string };

function emptyForm(): UserForm {
  return { name: "", email: "", password: "", passwordConfirmation: "", role: "staff", permission: "manage", avatar: "", department: "Operations", active: true };
}

function passwordRules(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    spaces: !/\s/.test(password),
  };
}

function passwordStrength(password: string): "weak" | "strong" | "extreme" {
  const rules = passwordRules(password);
  if (!rules.length || !rules.letter || !rules.number || !rules.spaces) return "weak";
  return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) ? "extreme" : "strong";
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
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordLevel = passwordStrength(form.password);
  const availableRoles = ROLES;

  const filtered = useMemo(() => {
    let users = state.users;
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
    }
    if (filterRole) users = users.filter((u) => u.role === filterRole);
    return users;
  }, [state.users, search, filterRole]);

  const validate = (f: typeof form, editing = Boolean(selectedUser)) => {
    const errors: Record<string, string> = {};
    if (!f.name.trim()) errors.name = "Name is required";
    if (!f.email.trim()) errors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = "Invalid email format";
    if (state.users.some((u) => u.email === f.email && u.id !== selectedUser?.id)) errors.email = "Email already exists";
    if (!ROLES.includes(f.role)) errors.role = "Select a valid role";
    const passwordRequired = !editing || f.password.length > 0;
    if (passwordRequired) {
      const rules = passwordRules(f.password);
      if (!rules.length || !rules.letter || !rules.number || !rules.spaces) {
        errors.password = "Password must be at least 8 characters, contain letters and numbers, and have no spaces";
      }
      if (!f.passwordConfirmation) errors.passwordConfirmation = "Confirm password is required";
      else if (f.passwordConfirmation !== f.password) errors.passwordConfirmation = "Passwords do not match";
    }
    return errors;
  };

  const updateForm = (field: keyof UserForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  };

  const submitAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate(form, false);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      if (errors.password || errors.passwordConfirmation) passwordInputRef.current?.focus();
      return;
    }
    await handleAdd();
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate(form, true);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      if (errors.password || errors.passwordConfirmation) passwordInputRef.current?.focus();
      return;
    }
    await handleEdit();
  };

  const makeExtremePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const all = upper + lower + digits;
    const random = (chars: string) => {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return chars[value[0] % chars.length];
    };
    const chars = [random(upper), random(lower), random(digits), ...Array.from({ length: 13 }, () => random(all))];
    for (let i = chars.length - 1; i > 0; i--) {
      const randomIndex = new Uint32Array(1);
      window.crypto.getRandomValues(randomIndex);
      const j = randomIndex[0] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const password = chars.join("");
    setForm((current) => ({ ...current, password, passwordConfirmation: password }));
    setFormErrors((current) => ({ ...current, password: "", passwordConfirmation: "" }));
  };

  const copyPassword = async () => {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    showToast("Password copied", "success");
  };

  const handleAdd = async () => {
    const errors = validate(form, false);
    if (Object.keys(errors).length) { setFormErrors(errors); if (errors.password || errors.passwordConfirmation) passwordInputRef.current?.focus(); return; }
    const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const { password, passwordConfirmation: _passwordConfirmation, ...userFields } = form;
    const user: User = {
      ...userFields,
      id: generateId("user"),
      avatar: initials,
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Never",
    };
    try {
      await createUser(user, password, form.passwordConfirmation);
      showToast(`User "${form.name}" created`, "success");
      setShowAddModal(false);
      setForm(emptyForm());
      setFormErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create user";
      if (/password/i.test(message)) {
        setFormErrors((current) => ({ ...current, password: message }));
        passwordInputRef.current?.focus();
      } else showToast(message, "error");
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    const errors = validate(form, true);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const { password: _password, passwordConfirmation: _passwordConfirmation, ...userFields } = form;
    try {
      await updateUser({ ...selectedUser, ...userFields, avatar: initials }, form.password || undefined, form.passwordConfirmation || undefined);
      showToast(`User "${form.name}" updated`, "success");
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update user";
      if (/password/i.test(message)) {
        setFormErrors((current) => ({ ...current, password: message }));
        passwordInputRef.current?.focus();
      } else showToast(message, "error");
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
    setForm({ name: user.name, email: user.email, password: "", passwordConfirmation: "", role: user.role, permission: user.permission, avatar: user.avatar, department: user.department, active: user.active });
    setShowPassword(false);
    setFormErrors({});
    setShowEditModal(true);
  };

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = state.users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<UserRole, number>);

  const passwordHints = (() => {
    const rules = passwordRules(form.password);
    if (!rules.spaces) return "Remove spaces from the password";
    if (!rules.length) return "Use 8 or more characters";
    if (!rules.letter) return "Add a letter";
    if (!rules.number) return "Add a number";
    if (passwordLevel === "strong" && (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password))) return "Add uppercase and lowercase letters";
    if (passwordLevel === "strong") return "Use 12 or more characters to reach Extreme";
    return "Your password meets the Extreme requirements";
  })();
  const strengthColor = passwordLevel === "weak" ? "#C62828" : passwordLevel === "strong" ? "#F9A825" : "#1B5E20";
  const passwordFormValid = Boolean(selectedUser && !form.password) || (
    passwordLevel !== "weak" && Boolean(form.passwordConfirmation) && form.passwordConfirmation === form.password
  );
  const confirmationError = form.passwordConfirmation
    ? form.passwordConfirmation === form.password ? "" : "Passwords do not match"
    : form.password ? "Confirm password is required" : formErrors.passwordConfirmation;

  const formFields = (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name *" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="John Smith" error={formErrors.name} />
        <Input label="Email Address *" type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="j.smith@company.com" error={formErrors.email} />
      </div>
      <>
        <div className="space-y-2">
          <label htmlFor="user-password" className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            {selectedUser ? "New Password (optional)" : "Temporary Password *"}
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id="user-password"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => { updateForm("password", e.target.value); updateForm("passwordConfirmation", ""); }}
                aria-describedby="password-rules password-strength-hint"
                aria-invalid={Boolean(formErrors.password)}
                className={`w-full rounded-lg border bg-canvas px-3 py-2.5 pr-10 text-sm text-content placeholder:text-content-subtle focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${formErrors.password ? "border-red-500" : "border-border-strong"}`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Button variant="secondary" onClick={copyPassword} disabled={!form.password} className="shrink-0"><Copy size={15} /> Copy</Button>
          </div>
          {formErrors.password && <p className="flex items-center gap-1.5 text-xs text-red-500" role="alert"><AlertCircle size={14} />{formErrors.password}</p>}
          <ul id="password-rules" className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" aria-label="Password requirements">
            {([
              ["length", "At least 8 characters", passwordRules(form.password).length],
              ["letter", "At least one letter", passwordRules(form.password).letter],
              ["number", "At least one number", passwordRules(form.password).number],
              ["spaces", "No spaces", passwordRules(form.password).spaces],
            ] as const).map(([key, label, met]) => (
              <li key={key} tabIndex={0} className={`flex items-center gap-1.5 rounded-sm outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${met ? "text-emerald-600 dark:text-emerald-400" : "text-content-subtle"}`}>
                {met ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                <span>{label}: {met ? "Met" : "Not met"}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2" role="status" aria-live="polite" aria-atomic="true">
            <div className="grid h-3 flex-1 grid-cols-3 gap-1" aria-hidden="true">
              {[1, 2, 3].map((segment) => (
                <span key={segment} className="border-2 border-content" style={{ backgroundColor: segment <= (passwordLevel === "weak" ? 1 : passwordLevel === "strong" ? 2 : 3) ? strengthColor : "transparent" }} />
              ))}
            </div>
            <span className="sr-only">Password strength: {passwordLevel}.</span>
            <span className="flex min-w-[92px] items-center gap-1 text-xs font-bold uppercase tracking-wider" style={{ color: strengthColor, fontFamily: "var(--font-display)" }} aria-hidden="true">
              {passwordLevel === "weak" ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}{passwordLevel}
            </span>
          </div>
          <p id="password-strength-hint" className="text-xs text-content-subtle">{passwordHints}</p>
          <div className="flex justify-between gap-3">
            <Input label={selectedUser ? "Confirm new password" : "Confirm password *"} type={showPassword ? "text" : "password"} value={form.passwordConfirmation} onChange={(e) => updateForm("passwordConfirmation", e.target.value)} error={confirmationError} autoComplete="new-password" />
            {!selectedUser && <Button variant="secondary" onClick={makeExtremePassword} className="mt-5 shrink-0"><RefreshCw size={14} /> Generate password</Button>}
          </div>
        </div>
      </>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Role *"
          value={form.role}
          disabled={selectedUser?.id === state.currentUser.id}
          error={formErrors.role}
          onChange={(e) => {
            const role = e.target.value as UserRole;
            setForm((current) => ({ ...current, role, permission: role === "viewer" ? "view" : current.permission }));
            setFormErrors((current) => ({ ...current, role: "" }));
          }}
        >
          {availableRoles.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </Select>
        <Select label="Permission *" value={form.permission} disabled={form.role === "viewer"} onChange={(e) => updateForm("permission", e.target.value as User["permission"])}>
          <option value="manage">Manage</option>
          <option value="view">View only</option>
        </Select>
        <Select label="Department" value={form.department} onChange={(e) => updateForm("department", e.target.value)}>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="active" checked={form.active} onChange={(e) => updateForm("active", e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
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
          <Button variant="primary" onClick={() => { setSelectedUser(null); setForm(emptyForm()); setFormErrors({}); setShowPassword(false); setShowAddModal(true); }}>
            <Plus size={15} /> Add User
          </Button>
        }
      />

      {/* Role Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {ROLES.map((role) => (
          <Card key={role} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${role === "admin" ? "bg-red-500/10 text-red-400" : role === "staff" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>
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
              <Th>Permission</Th>
              <Th>Last Login</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState icon={<UserIcon size={40} />} title="No users found" description="Add a user to get started" action={<Button variant="primary" size="sm" onClick={() => { setSelectedUser(null); setForm(emptyForm()); setFormErrors({}); setShowPassword(false); setShowAddModal(true); }}><Plus size={14} /> Add User</Button>} />
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
                  <Td><Badge variant={user.permission === "view" ? "gray" : "blue" as any} className="capitalize">{user.permission === "view" ? "View only" : "Manage"}</Badge></Td>
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
        <form onSubmit={submitAdd} noValidate>
          {formFields}
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!passwordFormValid}><Plus size={14} /> Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="md">
        <form onSubmit={submitEdit} noValidate>
          {formFields}
          <div className="flex justify-end gap-3 px-6 pb-6">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!passwordFormValid}><Edit2 size={14} /> Save Changes</Button>
          </div>
        </form>
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

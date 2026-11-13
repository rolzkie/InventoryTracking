import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Button, Card, Input, PageHeader } from "../components/ui";

export default function Categories() {
  const { state, showToast, refreshOperationalData } = useApp();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [busy, setBusy] = useState(false);
  const isAdmin = state.currentUser.role === "admin";
  const add = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await api.categories.create(name.trim(), color); setName(""); await refreshOperationalData(); showToast("Category added", "success"); }
    catch (error) { showToast(error instanceof Error ? error.message : "Unable to add category", "error"); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    try { await api.categories.delete(id); await refreshOperationalData(); showToast("Category removed", "success"); }
    catch (error) { showToast(error instanceof Error ? error.message : "Unable to remove category", "error"); }
  };
  const edit = async (category: (typeof state.categories)[number]) => {
    const updatedName = window.prompt("Category name", category.name)?.trim();
    if (!updatedName || updatedName === category.name) return;
    try { await api.categories.update(category.id, updatedName, category.color); await refreshOperationalData(); showToast("Category updated", "success"); }
    catch (error) { showToast(error instanceof Error ? error.message : "Unable to update category", "error"); }
  };
  return <div className="space-y-4">
    <PageHeader title="Categories" subtitle="Organize school equipment and supplies" />
    {isAdmin && <Card className="p-5"><form onSubmit={(event) => void add(event)} className="flex flex-wrap items-end gap-3">
      <Input label="Category name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
      <Input label="Color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add category"}</Button>
    </form></Card>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{state.categories.map((category) => <Card key={category.id} className="flex items-center gap-3 p-4">
      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="flex-1 text-sm text-slate-200">{category.name}</span>
      {isAdmin && <Button size="sm" variant="secondary" onClick={() => void edit(category)}>Edit</Button>}
      {isAdmin && <Button size="sm" variant="danger" onClick={() => void remove(category.id)}>Remove</Button>}
    </Card>)}</div>
  </div>;
}

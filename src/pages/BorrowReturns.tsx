import { FormEvent, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import type { BorrowRecord } from "../types";
import { Badge, Button, Card, Input, PageHeader, Select, Table, Td, Th } from "../components/ui";

export default function BorrowReturns() {
  const { state, showToast, refreshOperationalData } = useApp();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [itemId, setItemId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [loading, setLoading] = useState(false);
  const canWrite = state.currentUser.role !== "viewer" && state.currentUser.permission !== "view";

  const load = async () => setRecords(await api.borrowRecords.list());
  useEffect(() => { void load().catch((error) => showToast(error instanceof Error ? error.message : "Unable to load borrow records", "error")); }, []);

  const submitBorrow = async (event: FormEvent) => {
    event.preventDefault();
    if (!itemId || !borrowerName.trim() || !expectedReturnAt) return;
    setLoading(true);
    try {
      await api.borrowRecords.create({
        itemId: Number(itemId), borrowerName: borrowerName.trim(), quantity,
        borrowedAt: new Date().toISOString().slice(0, 10), expectedReturnAt,
      });
      await Promise.all([load(), refreshOperationalData()]);
      setBorrowerName(""); setItemId(""); setQuantity(1); setExpectedReturnAt("");
      showToast("Equipment loan recorded", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to record loan", "error");
    } finally { setLoading(false); }
  };

  const returnRemaining = async (record: BorrowRecord) => {
    try {
      await api.borrowRecords.returnItems(record.id, record.outstandingQuantity);
      await Promise.all([load(), refreshOperationalData()]);
      showToast("Returned quantity added back to available stock", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to record return", "error");
    }
  };

  return <div className="space-y-4">
    <PageHeader title="Borrow & Return" subtitle="Track borrowed school equipment and returned items" />
    {canWrite && <Card className="p-5">
      <form onSubmit={(event) => void submitBorrow(event)} className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
        <Select label="Equipment" value={itemId} onChange={(event) => setItemId(event.target.value)} required>
          <option value="">Select item</option>
          {state.items.filter((item) => item.quantity > 0).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} available</option>)}
        </Select>
        <Input label="Borrower name" value={borrowerName} onChange={(event) => setBorrowerName(event.target.value)} required maxLength={255} />
        <Input label="Quantity" type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
        <Input label="Expected return" type="date" value={expectedReturnAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExpectedReturnAt(event.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Record Borrowing"}</Button>
      </form>
    </Card>}
    <Card className="overflow-x-auto p-5">
      <Table>
        <thead><tr><Th>Item</Th><Th>Borrower</Th><Th>Qty</Th><Th>Borrowed</Th><Th>Due</Th><Th>Status</Th>{canWrite && <Th>Action</Th>}</tr></thead>
        <tbody>{records.map((record) => <tr key={record.id}>
          <Td>{record.itemName}</Td><Td>{record.borrowerName}</Td><Td>{record.outstandingQuantity} / {record.quantity}</Td>
          <Td>{record.borrowedAt}</Td><Td>{record.expectedReturnAt}</Td>
          <Td><Badge variant={record.status === "overdue" ? "red" : record.status === "returned" ? "green" : "amber"}>{record.status}</Badge></Td>
          {canWrite && <Td>{record.outstandingQuantity > 0 && <Button size="sm" variant="secondary" onClick={() => void returnRemaining(record)}>Record return</Button>}</Td>}
        </tr>)}</tbody>
      </Table>
      {records.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No borrow records yet.</p>}
    </Card>
  </div>;
}

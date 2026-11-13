import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Card, PageHeader, Table, Td, Th } from "../components/ui";

type LogRow = { id: number; action: string; userId: number | null; ipAddress: string | null; created_at: string; details: Record<string, unknown> | null; user?: { name: string; email: string } | null };

export default function ActivityLogs() {
  const { showToast } = useApp();
  const [rows, setRows] = useState<LogRow[]>([]);
  useEffect(() => {
    void api.activityLogs.list().then((data) => setRows(data as LogRow[])).catch((error) => showToast(error instanceof Error ? error.message : "Unable to load activity logs", "error"));
  }, []);
  return <div className="space-y-4">
    <PageHeader title="Activity Logs" subtitle="Successful sign-ins, changes, stock actions, and report access" />
    <Card className="overflow-x-auto p-5"><Table>
      <thead><tr><Th>When</Th><Th>User</Th><Th>Action</Th><Th>IP address</Th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}><Td>{new Date(row.created_at).toLocaleString()}</Td><Td>{row.user?.name ?? "Deleted account"}</Td><Td>{row.action}</Td><Td>{row.ipAddress ?? "—"}</Td></tr>)}</tbody>
    </Table>
    {!rows.length && <p className="py-6 text-center text-sm text-slate-500">No activity logged yet.</p>}</Card>
  </div>;
}

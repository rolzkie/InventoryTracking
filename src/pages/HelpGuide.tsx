import { ArrowLeft, ArrowRight, CircleHelp } from "lucide-react";

const sections = [
  { title: "Dashboard overview", body: "Use the dashboard to review total products, available stock, low stock warnings, borrowed items, recent activity, and recent transactions. Select the related navigation item to open a full list." },
  { title: "Find products", body: "Open Products to browse inventory. Use search and available filters to narrow the list by item, SKU, category, or stock status. Open a product row to review its details." },
  { title: "Record incoming or outgoing stock", body: "Open Stock In / Out (Transactions), choose the item, enter a positive quantity, select the transaction type, and add a note when useful. Save the transaction to update available stock and preserve its history." },
  { title: "Borrow and return equipment", body: "Open Borrow & Return to record the item, borrower, quantity, and expected return date. When equipment comes back, record the return so the available quantity is restored. Review overdue status in the same area." },
  { title: "Categories and reports", body: "Categories organizes products into useful groups. Reports summarizes inventory and stock activity; use the report actions to print or save a copy when available." },
  { title: "Accounts and permissions", body: "Administrators manage accounts, roles, and access from Users. Staff can maintain inventory and record stock activity. Viewers can review inventory and reports without making changes. Available actions depend on your assigned role." },
  { title: "Activity and alerts", body: "Activity Logs shows recorded user and inventory events. Low stock alerts identify items that may need replenishment. Review quantities and transaction history before making stock corrections." },
];

const faqs = [
  { q: "Why can’t I see an edit or delete action?", a: "Your role may be view-only, or the action may be restricted to protect inventory history. Ask an administrator to review your access." },
  { q: "How do I correct an incorrect stock quantity?", a: "Record an authorized stock adjustment using the appropriate stock transaction workflow, with a clear note. Do not erase historical transactions." },
  { q: "Why is an item marked low stock?", a: "Its available quantity has reached the configured low-stock threshold. Check the item details and contact an administrator if the threshold needs review." },
  { q: "How do I finish a borrow record?", a: "Open Borrow & Return, find the active loan, and record the returned quantity. Partial returns can be recorded until the full quantity is returned." },
  { q: "Who can create accounts or change roles?", a: "Administrators manage accounts and role assignments. Contact your school inventory administrator if you need access." },
  { q: "Where can I see who changed inventory?", a: "Use Activity Logs to review recorded actions, and Transactions to review stock movement details." },
];

export default function HelpGuide({ onContact, onBack }: { onContact: () => void; onBack: () => void }) {
  return (
    <section className="help-page">
      <header className="help-page-header">
        <div><p className="help-eyebrow"><CircleHelp size={15} /> Inventory System Help</p><h1>System guide & FAQs</h1><p>Learn the main inventory workflows and find answers to common questions.</p></div>
        <button type="button" className="help-back" onClick={onBack}><ArrowLeft size={15} /> Back to dashboard</button>
      </header>
      <div className="help-layout">
        <section className="help-panel"><h2>How to use the system</h2><div className="help-steps">{sections.map((item, i) => <article className="help-step" key={item.title}><span>{String(i + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div></section>
        <section className="help-panel"><h2>Frequently asked questions</h2><div className="help-faqs">{faqs.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div><button type="button" className="help-contact" onClick={onContact}>Contact Us <ArrowRight size={15} /></button></section>
      </div>
    </section>
  );
}

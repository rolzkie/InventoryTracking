import { useEffect, useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { contacts } from "../data/contactDirectory";

export default function ContactUs({ onBack }: { onBack: () => void }) {
  const [selectedContact, setSelectedContact] = useState<(typeof contacts)[number] | null>(null);

  useEffect(() => {
    if (!selectedContact) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedContact(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedContact]);

  return (
    <main className="contact-page min-h-screen px-4 py-6 sm:px-6">
      <section className="contact-card mx-auto w-full max-w-xl">
        <header className="contact-header">
          <h1>Contact Us</h1>
        </header>
        <div className="contact-content">
          <p className="contact-intro">For account access, inventory corrections, or system support, contact your school inventory administrator.</p>
          <div className="contact-list">
            {contacts.map((contact) => (
              <article className="contact-person" key={contact.name}>
                <div className="contact-avatar" aria-hidden="true">{contact.initials}</div>
                <div className="contact-person-copy">
                  <h2>{contact.name}</h2>
                  <span>{contact.role}</span>
                </div>
                <div className="contact-methods" aria-label="Contact method">
                  <button type="button" title={`Show contact information for ${contact.name}`} aria-label={`Show contact information for ${contact.name}`} onClick={() => setSelectedContact(contact)}><Mail size={14} /><span>Contact info</span></button>
                </div>
              </article>
            ))}
          </div>
          <div className="contact-office"><span>Office</span><strong>School Inventory Administration</strong></div>
          <button type="button" onClick={onBack} className="contact-signin">Back to sign in <span aria-hidden="true">→</span></button>
        </div>
      </section>
      {selectedContact && (
        <div className="contact-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedContact(null); }}>
          <section className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
            <header className="contact-dialog-header">
              <div><p>Contact details</p><h2 id="contact-dialog-title">{selectedContact.name}</h2></div>
              <button type="button" className="contact-dialog-close" onClick={() => setSelectedContact(null)} aria-label="Close contact details"><X size={18} /></button>
            </header>
            <a className="contact-dialog-row" href={`mailto:${selectedContact.email}`}><Mail size={16} /><span><small>Email</small><strong>{selectedContact.email}</strong></span></a>
            <a className="contact-dialog-row" href={`tel:${selectedContact.phone}`}><Phone size={16} /><span><small>Contact number</small><strong>{selectedContact.phone}</strong></span></a>
          </section>
        </div>
      )}
    </main>
  );
}

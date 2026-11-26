import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, X } from "lucide-react";
import { contacts } from "../data/contactDirectory";

export default function HelpContactUs({ onBack }: { onBack: () => void }) {
  const [selectedContact, setSelectedContact] = useState<(typeof contacts)[number] | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedContact) setSelectedContact(null);
      else onBack();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onBack, selectedContact]);

  return (
    <div className="help-contact-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onBack(); }}>
      <section className="help-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="help-contact-title">
        <header className="help-contact-header">
          <h1 id="help-contact-title">Contact Us</h1>
          <button type="button" onClick={onBack} className="help-contact-back"><ArrowLeft size={14} /> Back</button>
        </header>
        <div className="contact-content">
          <p className="contact-intro">For account access, inventory corrections, or system support, contact your school inventory administrator.</p>
          <div className="contact-list">
            {contacts.map((contact) => (
              <article className="contact-person" key={contact.name}>
                <div className="contact-avatar" aria-hidden="true">{contact.initials}</div>
                <div className="contact-person-copy"><h2>{contact.name}</h2><span>{contact.role}</span></div>
                <div className="contact-methods" aria-label="Contact method">
                  <button type="button" title={`Show contact information for ${contact.name}`} aria-label={`Show contact information for ${contact.name}`} onClick={() => setSelectedContact(contact)}><Mail size={14} /><span>Contact info</span></button>
                </div>
              </article>
            ))}
          </div>
          <div className="contact-office"><span>Office</span><strong>School Inventory Administration</strong></div>
        </div>
      </section>
      {selectedContact && (
        <div className="contact-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedContact(null); }}>
          <section className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="help-contact-details-title">
            <header className="contact-dialog-header">
              <div><p>Contact details</p><h2 id="help-contact-details-title">{selectedContact.name}</h2></div>
              <button type="button" className="contact-dialog-close" onClick={() => setSelectedContact(null)} aria-label="Close contact details"><X size={18} /></button>
            </header>
            <a className="contact-dialog-row" href={`mailto:${selectedContact.email}`}><Mail size={16} /><span><small>Email</small><strong>{selectedContact.email}</strong></span></a>
            <a className="contact-dialog-row" href={`tel:${selectedContact.phone}`}><Phone size={16} /><span><small>Contact number</small><strong>{selectedContact.phone}</strong></span></a>
          </section>
        </div>
      )}
    </div>
  );
}

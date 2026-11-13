import { ArrowLeft, Mail, Phone } from "lucide-react";

const contacts = [
  { initials: "RA", name: "Rolando Anacta Jr.", role: "Full-Stack Developer" },
  { initials: "JD", name: "Jesreel Cyrus Domanais", role: "Document Controller" },
  { initials: "KG", name: "Kevin Rei Gelle", role: "Document Controller" },
  { initials: "EM", name: "Errol Miranda", role: "Front-End Developer" },
];

export default function ContactUs({ onBack }: { onBack: () => void }) {
  return (
    <main className="contact-page min-h-screen px-4 py-6 sm:px-6">
      <section className="contact-card mx-auto w-full max-w-xl">
        <header className="contact-header flex items-center justify-between gap-4">
          <h1>Contact Us</h1>
          <button type="button" onClick={onBack} className="contact-back"><ArrowLeft size={14} /> Back</button>
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
                  <span title="Contact through your school directory"><Phone size={14} /><span className="sr-only">Phone details available through your school directory</span></span>
                  <span title="Contact through your school directory"><Mail size={14} /><span className="sr-only">Email details available through your school directory</span></span>
                </div>
              </article>
            ))}
          </div>
          <div className="contact-office"><span>Office</span><strong>School Inventory Administration</strong></div>
          <button type="button" onClick={onBack} className="contact-signin">Back to sign in <span aria-hidden="true">→</span></button>
        </div>
      </section>
    </main>
  );
}

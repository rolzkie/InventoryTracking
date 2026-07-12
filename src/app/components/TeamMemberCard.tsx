import { Facebook, Github, Instagram, Mail, Phone } from "lucide-react";

export type TeamMember = {
  name: string;
  role: string;
  image: string;
  phone: string;
  facebook: string;
  instagram: string;
  github: string;
  status: string;
};

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="group rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-sm shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15">
      <div className="flex items-start gap-3">
        <img src={member.image} alt={member.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              {member.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{member.role}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone size={13} className="text-muted-foreground" />
          <span className="truncate">{member.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={13} className="text-muted-foreground" />
          <a href={`https://www.facebook.com/${member.facebook.split('/').filter(Boolean).pop()}`} target="_blank" rel="noreferrer" className="truncate hover:text-foreground">
            {member.facebook}
          </a>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a href={member.facebook} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground">
          <Facebook size={14} />
        </a>
        <a href={member.instagram} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground">
          <Instagram size={14} />
        </a>
        <a href={member.github} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground">
          <Github size={14} />
        </a>
      </div>
    </div>
  );
}

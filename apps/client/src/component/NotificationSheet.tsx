import { useState, useEffect } from "react";
import type { NodeKind, NodeMetadata } from "./CreateWorkflow";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmailMetadata } from "@/nodes/notification/EmailNode";
import type { TelegramMetadata } from "@/nodes/notification/TelegramNode";

const NOTIFICATION_TYPES = [
  { id: "Email", title: "Email" },
  { id: "Telegram", title: "Telegram" },
];

export function NotificationSheet({
  open, onOpenChange, onSelect, initialType, editMetadata,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
  initialType?: string;
  editMetadata?: NodeMetadata;
}) {
  const [selectedType, setSelectedType] = useState("");

  // Email fields
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Telegram fields
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      if (editMetadata) {
        setSelectedType(initialType || "");
        if (initialType === "Email") {
          const meta = editMetadata as EmailMetadata;
          setEmailTo(meta.to || "");
          setEmailSubject(meta.subject || "");
          setEmailBody(meta.body || "");
        } else if (initialType === "Telegram") {
          const meta = editMetadata as TelegramMetadata;
          setBotToken(meta.botToken || "");
          setChatId(meta.chatId || "");
          setMessage(meta.message || "");
        }
      } else {
        setSelectedType(initialType || "");
        setEmailTo(""); setEmailSubject(""); setEmailBody("");
        setBotToken(""); setChatId(""); setMessage("");
      }
    }
  }, [open, initialType, editMetadata]);

  const isEditMode = !!editMetadata;

  const handleSubmit = () => {
    if (selectedType === "Email" && emailTo) {
      const metadata: EmailMetadata = { to: emailTo, subject: emailSubject, body: emailBody };
      onSelect("Email" as NodeKind, metadata);
      onOpenChange(false);
    } else if (selectedType === "Telegram" && chatId) {
      const metadata: TelegramMetadata = { botToken, chatId, message };
      onSelect("Telegram" as NodeKind, metadata);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-heading">{isEditMode ? "Edit Notification" : "Add Notification"}</SheetTitle>
          <SheetDescription>{isEditMode ? "Update notification settings." : "Send alerts when a trigger fires or an action executes."}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-5 py-3 sm:px-6">
          <div className="space-y-1.5">
            <Label>Notification Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {NOTIFICATION_TYPES.map(({ id, title }) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedType === "Email" && (
            <div className="space-y-3 p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid #8b5cf6" }}>
              <div className="space-y-1.5">
                <Label>To (Email Address)</Label>
                <Input type="email" placeholder="user@example.com" className="font-data" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input placeholder="Price Alert Triggered!" className="font-data" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <textarea
                  placeholder="SOL crossed $180. Trade executed on Hyperliquid."
                  className="font-data w-full p-2 text-sm"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedType === "Telegram" && (
            <div className="space-y-3 p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid #0ea5e9" }}>
              <div className="space-y-1.5">
                <Label>Bot Token</Label>
                <Input placeholder="123456:ABC-DEF..." className="font-data" value={botToken} onChange={(e) => setBotToken(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Chat ID</Label>
                <Input placeholder="-100123456789" className="font-data" value={chatId} onChange={(e) => setChatId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <textarea
                  placeholder="🚨 Alert: SOL price crossed $180!"
                  className="font-data w-full p-2 text-sm"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleSubmit} type="submit">
            {isEditMode ? "Update Notification" : "Create Notification"}
          </Button>
          <SheetClose asChild><Button variant="outline">Close</Button></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

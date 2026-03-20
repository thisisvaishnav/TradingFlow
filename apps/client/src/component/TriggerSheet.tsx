import { useState, useEffect } from "react";
import type { NodeKind, NodeMetadata } from "./CreateWorkflow";
import { Button } from "@/components/ui/button";
import { SUPPORTED_ASSETS } from "common/types";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PriceTriggerMetadata, TimerNodeMetadata } from "common/types";

const SUPPORTED_TRIGGERS = [
  { id: "timer", title: "Timer" },
  { id: "Price-trigger", title: "Price Trigger" },
];

export const TriggerSheet = ({
  open, onOpenChange, onSelect, initialTrigger, editMetadata,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
  initialTrigger?: string;
  editMetadata?: NodeMetadata;
}) => {
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const [metadata, setMetadata] = useState<PriceTriggerMetadata | TimerNodeMetadata>({ time: 3600 });

  // Pre-select trigger and populate metadata when sheet opens
  useEffect(() => {
    if (open) {
      if (editMetadata) {
        setMetadata(editMetadata);
      } else {
        setMetadata({ time: 3600 });
      }
      if (initialTrigger) {
        setSelectedTrigger(initialTrigger);
      } else {
        setSelectedTrigger("");
      }
    }
  }, [open, initialTrigger, editMetadata]);

  const isEditMode = !!editMetadata;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-heading">{isEditMode ? "Edit Trigger" : "Select Trigger"}</SheetTitle>
          <SheetDescription>{isEditMode ? "Modify trigger settings." : "Choose a trigger type to start your workflow."}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-5 py-3 sm:px-6">
          <div className="space-y-1.5">
            <Label>Trigger type</Label>
            <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select trigger" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SUPPORTED_TRIGGERS.map(({ id, title }) => (
                    <SelectItem key={id} value={id}>{title}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedTrigger === "timer" && (
            <div className="space-y-1.5 p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)" }}>
              <Label>Interval (seconds)</Label>
              <Input
                type="number"
                placeholder="3600"
                className="font-data"
                value={(metadata as TimerNodeMetadata).time || ""}
                onChange={(e) => setMetadata({ ...metadata, time: Number(e.target.value) })}
              />
            </div>
          )}

          {selectedTrigger === "Price-trigger" && (
            <div className="space-y-3 p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)" }}>
              <div className="space-y-1.5">
                <Label>Target Price</Label>
                <Input type="number" placeholder="0.00" className="font-data" onChange={(e) => setMetadata({ ...metadata, price: Number(e.target.value) })} value={(metadata as PriceTriggerMetadata).price || ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Asset</Label>
                <Select value={(metadata as PriceTriggerMetadata).asset || ""} onValueChange={(v) => setMetadata({ ...metadata, asset: v } as PriceTriggerMetadata)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select asset" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SUPPORTED_ASSETS.map((asset) => <SelectItem key={asset} value={asset}><span className="font-data">{asset}</span></SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button onClick={() => { if (selectedTrigger) { onSelect(selectedTrigger as NodeKind, metadata); onOpenChange(false); } }} type="submit">
            {isEditMode ? "Update Trigger" : "Create Trigger"}
          </Button>
          <SheetClose asChild><Button variant="outline">Close</Button></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
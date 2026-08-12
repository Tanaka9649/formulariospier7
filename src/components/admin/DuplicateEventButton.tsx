"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { duplicateEvent } from "@/server/events/actions";

export function DuplicateEventButton({ eventId }: { eventId: string }) {
  const [duplicating, setDuplicating] = useState(false);

  const handleClick = async () => {
    if (
      !confirm(
        "Duplicar este evento? Um novo evento em rascunho será criado com o mesmo formulário, personalização e certificado — sem participantes, links ou inscrições."
      )
    ) {
      return;
    }
    setDuplicating(true);
    try {
      await duplicateEvent(eventId);
    } catch (err) {
      setDuplicating(false);
      alert(err instanceof Error ? err.message : "Falha ao duplicar o evento.");
    }
  };

  return (
    <Button variant="secondary" onClick={handleClick} disabled={duplicating}>
      {duplicating ? "Duplicando..." : "Duplicar este evento"}
    </Button>
  );
}

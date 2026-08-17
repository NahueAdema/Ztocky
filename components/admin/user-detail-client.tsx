"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function UserDetailClient({
  userId,
  initialNotes,
}: {
  userId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function saveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Error al guardar", "error");
      } else {
        toast("Notas guardadas", "success");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notas de soporte</CardTitle>
        <Button
          variant="ghost"
          className="h-8 px-3 text-xs"
          onClick={saveNotes}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </CardHeader>
      <CardContent>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotaciones internas sobre este usuario (solo visible para admins)..."
          className="h-32 w-full rounded-xl border border-border/60 bg-card/50 p-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10 resize-none"
        />
      </CardContent>
    </Card>
  );
}

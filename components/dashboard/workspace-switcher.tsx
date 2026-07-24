"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Building2, Check, Loader2, Plus, ChevronDown } from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  role: string;
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/dashboard/workspace/members");
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data.workspaces || []);
          setActiveId(data.activeWorkspaceId || null);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === activeId) return;
    setSwitching(workspaceId);
    try {
      const res = await fetch("/api/auth/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        setActiveId(workspaceId);
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Cargando...
      </div>
    );
  }

  const active = workspaces.find((w) => w.id === activeId);

  if (workspaces.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium truncate">{active?.name || "Sin nombre"}</span>
      </div>
    );
  }

  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" className="w-full justify-between px-3 h-auto py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">{active?.name || "Seleccionar workspace"}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      }
    >
      {workspaces.map((ws) => (
        <DropdownMenuItem
          key={ws.id}
          onClick={() => handleSwitch(ws.id)}
          icon={switching === ws.id ? <Loader2 className="h-4 w-4 animate-spin" /> : ws.id === activeId ? <Check className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
        >
          <span className="truncate">{ws.name}</span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuItem
        onClick={() => router.push("/dashboard/settings")}
        icon={<Plus className="h-4 w-4 text-muted-foreground" />}
      >
        Agregar comercio
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

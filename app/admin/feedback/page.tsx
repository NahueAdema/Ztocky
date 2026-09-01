"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Send,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type FeedbackItem = {
  id: string;
  type: string;
  message: string;
  email: string | null;
  status: string;
  adminReply: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

const STATUS_FILTERS = [
  { value: "", label: "Todos", icon: null },
  { value: "NEW", label: "Nuevos", icon: AlertCircle, color: "text-danger" },
  { value: "IN_REVIEW", label: "En revisión", icon: Clock, color: "text-warning" },
  { value: "RESOLVED", label: "Resueltos", icon: CheckCircle2, color: "text-success" },
  { value: "CLOSED", label: "Cerrados", icon: Archive, color: "text-muted-foreground" },
];

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  BUG: { label: "Bug", color: "bg-danger/10 text-danger border-danger/30" },
  IMPROVEMENT: { label: "Mejora", color: "bg-success/10 text-success border-success/30" },
  SUGGESTION: { label: "Sugerencia", color: "bg-accent-light text-accent border-accent/30" },
  OTHER: { label: "Otro", color: "bg-primary/10 text-primary border-primary/30" },
};

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-danger/10 text-danger",
  IN_REVIEW: "bg-warning/10 text-warning",
  RESOLVED: "bg-success/10 text-success",
  CLOSED: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export default function AdminFeedbackPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast("Estado actualizado", "success");
        fetchFeedback();
        if (selected?.id === id) setSelected((s) => (s ? { ...s, status: newStatus } : s));
      }
    } catch {
      toast("Error al actualizar", "error");
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText.trim(), status: "RESOLVED" }),
      });
      if (res.ok) {
        toast("Respuesta guardada y feedback marcado como resuelto", "success");
        setReplyText("");
        fetchFeedback();
        setSelected(null);
      }
    } catch {
      toast("Error al responder", "error");
    } finally {
      setReplying(false);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Feedback</h1>
          <p className="text-sm text-muted-foreground">{total} mensajes de usuarios</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por mensaje, email o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                statusFilter === f.value
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              }`}
            >
              {f.icon && <f.icon className={`h-3 w-3 ${f.color}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <MessageSquare className="h-8 w-8 text-primary/50" />
          </div>
          <p className="text-sm font-semibold">Sin feedback</p>
          <p className="text-xs text-muted-foreground mt-1">No hay mensajes con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const typeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.OTHER;
            return (
              <button
                key={item.id}
                onClick={() => { setSelected(item); setReplyText(item.adminReply || ""); }}
                className="w-full text-left rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                      {item.adminReply && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Respondido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{item.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.user.name}</span>
                      <span>{item.user.email}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${(TYPE_LABELS[selected.type] || TYPE_LABELS.OTHER).color}`}>
                  {(TYPE_LABELS[selected.type] || TYPE_LABELS.OTHER).label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {selected.user.name} ({selected.user.email}) · {formatDate(selected.createdAt)}
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.message}</p>
                {selected.email && (
                  <p className="mt-2 text-xs text-muted-foreground">Email opcional: {selected.email}</p>
                )}
              </div>

              {/* Status change */}
              <div className="flex flex-wrap gap-1.5">
                {(["NEW", "IN_REVIEW", "RESOLVED", "CLOSED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selected.id, s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                      selected.status === s
                        ? `${STATUS_STYLES[s]} border-current`
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {/* Reply */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Respuesta del admin</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribí una respuesta para el usuario..."
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
                />
                <button
                  onClick={() => handleReply(selected.id)}
                  disabled={!replyText.trim() || replying}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {replying ? "Enviando..." : "Responder y marcar resuelto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

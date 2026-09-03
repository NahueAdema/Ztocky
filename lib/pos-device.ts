const DEVICE_ID_KEY = "ztocky_pos_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // localStorage no disponible: genero un id efímero
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

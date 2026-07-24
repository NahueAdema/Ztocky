"use client";

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Truck,
  FileText,
  AlertTriangle,
  Bell,
  TrendingUp,
  Bot,
  Search,
  Settings,
  Keyboard,
  ChevronRight,
  ChevronDown,
  SearchIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const sections = [
  {
    id: "dashboard",
    title: "Inicio (Dashboard)",
    icon: LayoutDashboard,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "products",
    title: "Productos",
    icon: Boxes,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "pos",
    title: "Punto de Venta",
    icon: ShoppingCart,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "sales",
    title: "Ventas",
    icon: ShoppingCart,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "suppliers",
    title: "Proveedores",
    icon: Truck,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "purchase-orders",
    title: "Ordenes de Compra",
    icon: FileText,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "alerts",
    title: "Alertas",
    icon: AlertTriangle,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "supplier-notifications",
    title: "Notificaciones de Proveedor",
    icon: Bell,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "simulator",
    title: "Simulador de Escenarios",
    icon: TrendingUp,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "ai-console",
    title: "Consola de IA",
    icon: Bot,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "global-search",
    title: "Busqueda Global",
    icon: Search,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "settings",
    title: "Configuracion",
    icon: Settings,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "shortcuts",
    title: "Atajos de Teclado",
    icon: Keyboard,
    color: "bg-primary/10 text-primary",
  },
];

function SidebarLink({
  section,
  active,
  onClick,
}: {
  section: (typeof sections)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{section.title}</span>
    </button>
  );
}

function GuideSection({
  id,
  title,
  icon,
  color,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  children: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </section>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function ShortcutTable({ shortcuts }: { shortcuts: { key: string; action: string }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2.5 text-left font-semibold text-foreground">Tecla</th>
            <th className="px-4 py-2.5 text-left font-semibold text-foreground">Accion</th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map((s) => (
            <tr key={s.key} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-2.5">
                <Badge tone="accent">{s.key}</Badge>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{s.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuidePage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [search]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Guia de Uso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documentacion completa de todas las funciones de Ztocky.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar en la guia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mobile nav toggle */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium lg:hidden"
      >
        Navegacion
        {mobileNavOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? "block" : "hidden"
          } w-full shrink-0 lg:block lg:w-56 lg:sticky lg:top-24 lg:self-start`}
        >
          <nav className="space-y-0.5">
            {filteredSections.map((s) => (
              <SidebarLink
                key={s.id}
                section={s}
                active={activeSection === s.id}
                onClick={() => scrollTo(s.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* Inicio */}
          <GuideSection
            id="dashboard"
            title="Inicio (Dashboard)"
            icon={LayoutDashboard}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Que muestra el Dashboard">
              <p>
                El panel de control muestra un resumen en tiempo real de tu negocio con
                los siguientes KPIs:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>Riesgo critico:</strong> Productos que necesitan compra urgente.</li>
                <li><strong>Ordenes pendientes:</strong> Ordenes de compra sin recibir.</li>
                <li><strong>Ventas semana:</strong> Unidades vendidas y cantidad de transacciones.</li>
                <li><strong>Ingresos semana:</strong> Total facturado y variacion vs semana anterior.</li>
              </ul>
            </InfoBlock>
            <InfoBlock title="Grafico de ventas semanales">
              <p>
                Visualiza la facturacion diaria de los ultimos 7 dias. Las barras muestran
                el ingreso de cada dia, con el dia actual resaltado en color primario.
              </p>
            </InfoBlock>
            <InfoBlock title="Top productos (30 dias)">
              <p>
                Los productos mas vendidos en el ultimo mes, con su cantidad vendida,
                ingresos generados, stock actual y dias restantes antes de agotarse.
              </p>
            </InfoBlock>
            <InfoBlock title="Proximos agotamientos">
              <p>
                Lista de productos con riesgo de stock, mostrando el consumo diario,
                proveedor y dias restantes. Puedes crear una orden de compra directamente
                desde aqui.
              </p>
            </InfoBlock>
            <InfoBlock title="Acciones rapidas">
              <p>
                Accesos directos a Ver productos, Proveedores, Escanear y Simulador.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Productos */}
          <GuideSection
            id="products"
            title="Productos"
            icon={Boxes}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Crear un producto">
              <p>
                Haz clic en <Badge tone="accent">Nuevo</Badge> y completa los campos
                obligatorios: nombre, SKU (codigo de barras), categoria, precios y stock.
                Puedes vincularlo a un proveedor al momento de la creacion.
              </p>
            </InfoBlock>
            <InfoBlock title="Editar o eliminar">
              <p>
                Usa el boton de lapiz para editar o la papelera para eliminar. La
                eliminacion requiere confirmacion.
              </p>
            </InfoBlock>
            <InfoBlock title="Categorias">
              <p>
                Las categorias organizan tus productos (ej: Almacen, Bebidas, Limpieza).
                Se asignan al crear o editar. Se pueden filtrar desde la tabla.
              </p>
            </InfoBlock>
            <InfoBlock title="SKU (Codigo de barras)">
              <p>
                El SKU es un identificador unico para cada producto. Se usa para
                busquedas rapidas y escaneo con lector de barras. Debe ser unico en todo
                el workspace.
              </p>
            </InfoBlock>
            <InfoBlock title="Gestion de precios">
              <p>
                <strong>Precio costo:</strong> Cuanto te cuesta adquirir el producto.
                <br />
                <strong>Precio venta:</strong> A cuanto lo vendes.
                <br />
                <strong>Margen:</strong> Se calcula automaticamente como
                ((venta - costo) / venta) x 100. Se muestra en la tabla con indicador
                de color: verde (&gt;40%), amarillo (25-40%), rojo (&lt;25%).
              </p>
            </InfoBlock>
            <InfoBlock title="Gestion de stock">
              <p>
                <strong>Stock actual:</strong> Unidades disponibles.
                <br />
                <strong>Stock minimo:</strong> Umbral para alertas de reposicion.
                Cuando el stock actual es menor o igual al minimo, se muestra una
                alerta en el dashboard y en la tabla.
              </p>
            </InfoBlock>
            <InfoBlock title="Importacion masiva (CSV / Excel)">
              <p>
                Puedes importar productos desde un archivo CSV o Excel (.xlsx). Las
                columnas deben ser: nombre, sku, categoria, currentStock, minStock,
                costPrice, sellingPrice, isActive. La importacion se realiza en lotes
                de 50 registros.
              </p>
            </InfoBlock>
            <InfoBlock title="Exportar productos">
              <p>
                Usa el boton <Badge tone="accent">Exportar</Badge> para descargar
                todos los productos en formato CSV o Excel (.xlsx).
              </p>
            </InfoBlock>
            <InfoBlock title="Filtros de la tabla">
              <p>
                Puedes filtrar por <strong>categoria</strong> (selector desplegable),
                <strong>stock</strong> (Bajo / OK) y <strong>margen</strong> (&lt;25% /
                25-40% / &gt;40%). Los filtros se combinan entre si.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Punto de Venta */}
          <GuideSection
            id="pos"
            title="Punto de Venta"
            icon={ShoppingCart}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Abrir el Punto de Venta">
              <p>
                Antes de vender, debes abrir una sesion de Punto de Venta. Esto registra el
                momento de apertura y permite el control de efectivo.
              </p>
            </InfoBlock>
            <InfoBlock title="Escaneo de codigos de barras">
              <p>
                Conecta un lector de barras USB y escanea los productos. El sistema
                los agrega automaticamente al carrito. El campo de escaneo tiene foco
                permanente para agilizar el proceso.
              </p>
            </InfoBlock>
            <InfoBlock title="Atajos de teclado en el Punto de Venta">
              <ShortcutTable
                shortcuts={[
                  { key: "F2", action: "Enfocar campo de escaneo" },
                  { key: "F3", action: "Buscar productos" },
                  { key: "F4", action: "Ir a pago" },
                  { key: "Esc", action: "Limpiar carrito / cancelar" },
                ]}
              />
            </InfoBlock>
            <InfoBlock title="Agregar productos al carrito">
              <p>
                Puedes agregar productos de tres formas: escaneando el codigo de
                barras, buscando por nombre/SKU, o navegando por categorias.
              </p>
            </InfoBlock>
            <InfoBlock title="Controles de cantidad">
              <p>
                Botones rapidos para cantidades x1, x5, x10, o edicion directa del
                numero. Tambien puedes modificar la cantidad desde la lupa de cada
                item.
              </p>
            </InfoBlock>
            <InfoBlock title="Descuentos">
              <p>
                Puedes aplicar descuentos por item (porcentaje o monto fijo) o un
                descuento total sobre toda la venta.
              </p>
            </InfoBlock>
            <InfoBlock title="Seleccion de cliente">
              <p>
                Opcional. Puedes vincular la venta a un cliente registrado para
                historial y cuenta corriente.
              </p>
            </InfoBlock>
            <InfoBlock title="Metodos de pago">
              <p>
                Los metodos disponibles son:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><Badge tone="success">Efectivo</Badge> - Pago en efectivo con calculo de vuelto.</li>
                <li><Badge tone="accent">Tarjeta</Badge> - Credito o debito.</li>
                <li><Badge tone="default">Transferencia</Badge> - Transferencia bancaria.</li>
                <li><Badge tone="warning">Cta Cte</Badge> - Cuenta corriente del cliente.</li>
              </ul>
            </InfoBlock>
            <InfoBlock title="Calculation de vuelto">
              <p>
                Al seleccionar efectivo, ingresa el monto recibido. El sistema calcula
                automaticamente el vuelto.
              </p>
            </InfoBlock>
            <InfoBlock title="Generar e imprimir comprobante">
              <p>
                Al finalizar la venta, se genera un comprobante PDF que puedes
                imprimir o enviar por email.
              </p>
            </InfoBlock>
            <InfoBlock title="Anular una venta">
              <p>
                Puedes anular ventas desde el historial. La anulacion revierte el
                stock y registra la accion con motivo.
              </p>
            </InfoBlock>
            <InfoBlock title="Cerrar el Punto de Venta">
              <p>
                Al cerrar el Punto de Venta, se genera un resumen del dia con totales por metodo
                de pago, cantidad de ventas y efectivo en el Punto de Venta. Tambien puedes
                exportar el resumen a CSV.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Ventas */}
          <GuideSection
            id="sales"
            title="Ventas"
            icon={ClipboardList}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Historial de ventas">
              <p>
                Consulta todas las ventas realizadas con fecha, productos, total,
                metodo de pago y estado.
              </p>
            </InfoBlock>
            <InfoBlock title="Filtros">
              <p>
                Filtra por <strong>periodo</strong> (hoy, semana, mes, rango custom) y
                por <strong>producto</strong> (nombre o SKU).
              </p>
            </InfoBlock>
            <InfoBlock title="Detalle de una venta">
              <p>
                Haz clic en una venta para ver los items, cantidades, precios,
                descuentos aplicados y metodo de pago.
              </p>
            </InfoBlock>
            <InfoBlock title="Anular ventas">
              <p>
                Desde el detalle de una venta puedes anularla. Esto revierte el stock
                y deja registro de la anulacion.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Proveedores */}
          <GuideSection
            id="suppliers"
            title="Proveedores"
            icon={Truck}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Crear un proveedor">
              <p>
                Registra nuevos proveedores con nombre, contacto (email, telefono),
                direccion y notas.
              </p>
            </InfoBlock>
            <InfoBlock title="Editar proveedor">
              <p>
                Actualiza la informacion de contacto o datos del proveedor en
                cualquier momento.
              </p>
            </InfoBlock>
            <InfoBlock title="Vincular productos">
              <p>
                Asocia productos a sus proveedores con precio de compra y cantidad
                minima de pedido. Esto permite generar ordenes de compra
                automaticamente.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Ordenes de Compra */}
          <GuideSection
            id="purchase-orders"
            title="Ordenes de Compra"
            icon={FileText}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Crear una orden">
              <p>
                Selecciona el proveedor, agrega productos con cantidades y precios.
                La orden se crea en estado <Badge tone="warning">Pendiente</Badge>.
              </p>
            </InfoBlock>
            <InfoBlock title="Flujo de estados">
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge tone="warning">Pendiente</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge tone="accent">Aprobada</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge tone="success">Recibida</Badge>
              </div>
              <p className="mt-2">
                <strong>Pendiente:</strong> Orden creada, esperando aprobacion.
                <br />
                <strong>Aprobada:</strong> Confirmada y en camino.
                <br />
                <strong>Recibida:</strong> Stock actualizado automaticamente.
              </p>
            </InfoBlock>
            <InfoBlock title="Recibir stock">
              <p>
                Al marcar una orden como recibida, el stock de los productos se
                incrementa automaticamente.
              </p>
            </InfoBlock>
            <InfoBlock title="Filtros">
              <p>
                Filtra ordenes por <strong>estado</strong> y <strong>proveedor</strong>.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Alertas */}
          <GuideSection
            id="alerts"
            title="Alertas"
            icon={AlertTriangle}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Tipos de alertas">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge tone="danger">Stock critico</Badge>
                  Producto con stock muy por debajo del minimo. Compra urgente.
                </li>
                <li className="flex items-center gap-2">
                  <Badge tone="warning">Stock bajo</Badge>
                  Producto por debajo del stock minimo. Requiere reposicion.
                </li>
                <li className="flex items-center gap-2">
                  <Badge tone="muted">Inventario estancado</Badge>
                  Producto sin movimiento en los ultimos 30 dias.
                </li>
              </ul>
            </InfoBlock>
            <InfoBlock title="Responder a alertas">
              <p>
                Desde cada alerta puedes crear una orden de compra directamente o
                ignorar la alerta.
              </p>
            </InfoBlock>
            <InfoBlock title="Descartar alertas">
              <p>
                Marca una alerta como resuelta para ocultarla del listado activo.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Notificaciones de Proveedor */}
          <GuideSection
            id="supplier-notifications"
            title="Notificaciones de Proveedor"
            icon={Bell}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Como funcionan">
              <p>
                Las notificaciones permiten comunicarte con tus proveedores desde la
                plataforma. Puedes enviar alertas de stock bajo o solicitudes de
                cotizacion.
              </p>
            </InfoBlock>
            <InfoBlock title="Enviar notificaciones">
              <p>
                Selecciona el proveedor, escribe el mensaje y envia. El proveedor
                recibira la notificacion por email.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Simulador */}
          <GuideSection
            id="simulator"
            title="Simulador de Escenarios"
            icon={TrendingUp}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Que hace el simulador">
              <p>
                Permite probar diferentes configuraciones de puntos de reorden y stock
                de seguridad para ver como afectarian tu negocio.
              </p>
            </InfoBlock>
            <InfoBlock title="Como usarlo">
              <p>
                Selecciona un producto, ajusta los parametros (consumo diario, tiempo
                de entrega, nivel de servicio) y visualiza el impacto en costos y
                disponibilidad.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Consola de IA */}
          <GuideSection
            id="ai-console"
            title="Consola de IA"
            icon={Bot}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Consultas en lenguaje natural">
              <p>
                Escribe preguntas sobre tu negocio en espanol. La IA tiene acceso a
                tu inventario, ventas, proveedores y ordenes de compra.
              </p>
            </InfoBlock>
            <InfoBlock title="Ejemplos de consultas">
              <div className="space-y-1.5">
                <p>&quot;Cuales son los 5 productos mas vendidos este mes?&quot;</p>
                <p>&quot;Que productos tienen stock critico?&quot;</p>
                <p>&quot;Cual es el margen promedio de la categoria Almacen?&quot;</p>
                <p>&quot;Cuantos dias me queda de stock del Cafe Brasil?&quot;</p>
                <p>&quot;Genera una orden de compra para el proveedor X&quot;</p>
              </div>
            </InfoBlock>
            <InfoBlock title="Datos accedidos">
              <p>
                La IA puede consultar productos, ventas historicas, proveedores,
                ordenes de compra, alertas y metricas del dashboard.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Busqueda Global */}
          <GuideSection
            id="global-search"
            title="Busqueda Global"
            icon={Search}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Como funciona">
              <p>
                La busqueda global escanea productos, proveedores y ordenes de
                compra simultaneamente. Puedes buscar por nombre, SKU o cualquier
                texto relevante.
              </p>
            </InfoBlock>
            <InfoBlock title="Acceso rapido">
              <ShortcutTable
                shortcuts={[
                  { key: "Cmd+K", action: "Abrir busqueda global (header)" },
                  { key: "/", action: "Enfocar busqueda global" },
                ]}
              />
            </InfoBlock>
          </GuideSection>

          {/* Configuracion */}
          <GuideSection
            id="settings"
            title="Configuracion"
            icon={Settings}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Workspace">
              <p>
                Renombra tu workspace para identificarlo facilmente.
              </p>
            </InfoBlock>
            <InfoBlock title="Equipo">
              <p>
                Invita miembros por email y asigna roles:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><Badge tone="default">Owner</Badge> Control total del workspace.</li>
                <li><Badge tone="accent">Admin</Badge> Puede gestionar productos, proveedores y ventas.</li>
                <li><Badge tone="muted">Member</Badge> Acceso de lectura y operaciones basicas.</li>
              </ul>
            </InfoBlock>
            <InfoBlock title="Tema">
              <p>
                Alterna entre modo oscuro y claro desde el icono de sol/luna en el
                header, o desde el menu de usuario.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Atajos de Teclado */}
          <GuideSection
            id="shortcuts"
            title="Atajos de Teclado"
            icon={Keyboard}
            color="bg-primary/10 text-primary"
          >
            <ShortcutTable
              shortcuts={[
                { key: "F2", action: "Enfocar campo de escaneo (Punto de Venta)" },
                { key: "F3", action: "Buscar productos (Punto de Venta)" },
                { key: "F4", action: "Ir a pago (Punto de Venta)" },
                { key: "Esc", action: "Limpiar carrito / cancelar accion" },
                { key: "/", action: "Enfocar busqueda global" },
                { key: "Cmd+K", action: "Abrir busqueda global" },
              ]}
            />
          </GuideSection>
        </div>
      </div>
    </div>
  );
}

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
  Users,
  Undo2,
  ReceiptText,
  Landmark,
  ScanLine,
  CreditCard,
  Store,
  UserCog,
  Smartphone,
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
    id: "expenses",
    title: "Gastos",
    icon: ReceiptText,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "finanzas",
    title: "Finanzas",
    icon: Landmark,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "scan",
    title: "Escanear",
    icon: ScanLine,
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
    id: "customers",
    title: "Clientes",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "returns",
    title: "Devoluciones",
    icon: Undo2,
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
    id: "my-business",
    title: "Mi Negocio",
    icon: Store,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "team",
    title: "Equipo",
    icon: UserCog,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "app",
    title: "App y Notificaciones",
    icon: Smartphone,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "subscription",
    title: "Suscripcion y Planes",
    icon: CreditCard,
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

          {/* Gastos */}
          <GuideSection
            id="expenses"
            title="Gastos"
            icon={ReceiptText}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Registrar gastos">
              <p>
                Usa el boton <Badge tone="accent">Nuevo gasto</Badge> para cargar gastos
                manuales con descripcion, monto, categoria (sueldos, alquiler,
                servicios, etc.) y metodo de pago.
              </p>
            </InfoBlock>
            <InfoBlock title="Cerrar mes">
              <p>
                El boton <Badge tone="accent">Cerrar mes</Badge> congela el resultado
                del mes y bloquea la edicion de sus gastos. Es ideal al cierre
                contable para dejar un registro fijo.
              </p>
            </InfoBlock>
            <InfoBlock title="Reporte y exportacion">
              <p>
                El reporte mensual cruza ingresos, gastos manuales y compras a
                proveedores. Puedes exportar los gastos en CSV o Excel (.xlsx).
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Finanzas */}
          <GuideSection
            id="finanzas"
            title="Finanzas"
            icon={Landmark}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Panel financiero">
              <p>
                Es la vista financiera del negocio: ingresos por ventas, gastos
                manuales y compras a proveedores, con el resultado mensual
                (ingresos - egresos).
              </p>
            </InfoBlock>
            <InfoBlock title="Analisis">
              <p>
                Compara mes a mes, visualiza los gastos por metodo de pago y los
                totales acumulados. Los graficos muestran la evolucion de ingresos
                vs. egresos.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Escanear */}
          <GuideSection
            id="scan"
            title="Escanear"
            icon={ScanLine}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Escaneo con camara">
              <p>
                Usa la camara del celular o un lector USB para escanear codigos de
                barras. Al detectar un producto, se abre su ficha para consultar
                stock, precios y editar datos.
              </p>
            </InfoBlock>
            <InfoBlock title="Requisitos">
              <p>
                Necesitas conexion HTTPS y aceptar el permiso de camara. En iOS usa
                Safari; en Android funciona Chrome o la app instalada (PWA).
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
            <InfoBlock title="Ventas sin conexion">
              <p>
                Si perdes la conexion, las ventas quedan en una cola de
                <strong> pendientes</strong> y se sincronizan automaticamente cuando
                vuelve el internet. La pantalla te avisa el estado de cada venta.
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

          {/* Clientes */}
          <GuideSection
            id="customers"
            title="Clientes"
            icon={Users}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Como se crean">
              <p>
                Los clientes se crean automaticamente cuando vendes a cuenta corriente
                (Cta Cte) desde el Punto de Venta. Tambien puedes registrarlos
                manualmente con nombre, telefono y email.
              </p>
            </InfoBlock>
            <InfoBlock title="Ficha del cliente">
              <p>
                Cada cliente tiene su historial de ventas, saldo pendiente, pagos
                registrados y comprobantes. Puedes imprimir o descargar el ticket
                (PDF) de cada venta.
              </p>
            </InfoBlock>
            <InfoBlock title="Cuenta corriente">
              <p>
                Al vender a Cta Cte la deuda queda registrada en la ficha. Puedes
                cargar pagos (efectivo, tarjeta, transferencia) para ir saldando el
                saldo.
              </p>
            </InfoBlock>
            <InfoBlock title="Exportar">
              <p>
                Usa el boton <Badge tone="accent">Exportar</Badge> para descargar el
                listado de clientes en CSV o Excel (.xlsx).
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Devoluciones */}
          <GuideSection
            id="returns"
            title="Devoluciones"
            icon={Undo2}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Crear una devolucion">
              <p>
                Desde la seccion Devoluciones usa el boton <Badge tone="accent">Nueva devolucion</Badge>,
                selecciona la venta, los productos a devolver y el motivo. El stock se
                restaura automaticamente.
              </p>
            </InfoBlock>
            <InfoBlock title="Metodos y saldos">
              <p>
                Si la venta original fue a Cta Cte o con tarjeta, la devolucion queda
                vinculada al cliente y a su cuenta. Las devoluciones registradas se
                muestran en el historial.
              </p>
            </InfoBlock>
            <InfoBlock title="Exportar">
              <p>
                Puedes exportar el registro de devoluciones en CSV o Excel (.xlsx).
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
            <InfoBlock title="Detalle del proveedor">
              <p>
                Al entrar en un proveedor ves su tablero con: catalogo de productos,
                comparador de precios (indica cual proveedor es el mas barato por
                producto), aumentos de precios recientes, ordenes de compra vinculadas
                y un resumen generado con IA.
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
            <InfoBlock title="Compra sugerida">
              <p>
                El panel de <strong>sugerencias de compra</strong> calcula cuanto reponer
                por proveedor segun la velocidad de venta (burn rate) y el tiempo de
                entrega (lead time). Los productos urgentes se marcan con una etiqueta.
                Con <Badge tone="accent">Generar compra sugerida</Badge> creas todas las
                ordenes recomendadas de una sola vez.
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
            <InfoBlock title="Reglas de alerta (automatizacion)">
              <p>
                Desde la pestana <strong>Reglas</strong> puedes automatizar las
                notificaciones. Cada regla vigila algo <em>y usa los canales que
                elijas</em>:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>Estado de stock:</strong> avisa cuando un producto queda critico, bajo o estancado.</li>
                <li><strong>Eventos:</strong> avisa de eventos del feed (ordenes, pagos, registros, etc.).</li>
                <li><strong>Resumen (digest):</strong> envia un resumen periodico diario, cada 3 dias, semanal o mensual.</li>
              </ul>
            </InfoBlock>
            <InfoBlock title="Canales de notificacion">
              <p>
                Cada regla puede notificar por <strong>email</strong>, <strong>in-app</strong>
                (campana en la app) y <strong>push</strong> (pantalla del celular). Elegi
                uno o varios segun la importancia.
              </p>
            </InfoBlock>
            <InfoBlock title="Ejecutar ahora">
              <p>
                El boton <Badge tone="accent">Ejecutar ahora</Badge> corre las reglas al
                instante y te informa cuantos productos, eventos y resumenes se
                generaron. Tambien se ejecutan automaticamente todos los dias via cron.
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

          {/* Mi Negocio */}
          <GuideSection
            id="my-business"
            title="Mi Negocio"
            icon={Store}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Datos del negocio">
              <p>
                Configura la <strong>razon social</strong>, <strong>CUIT</strong> (o CUIL),
                direccion, localidad, telefono y email de contacto de tu comercio. La
                razon social y el CUIT aparecen en los tickets y comprobantes.
              </p>
            </InfoBlock>
            <InfoBlock title="Regimen fiscal">
              <p>
                Selecciona tu condicion impositiva: <strong>Monotributo</strong>,
                <strong> Responsable Inscripto</strong> o <strong>Exento</strong>. Define
                como se emiten los comprobantes.
              </p>
            </InfoBlock>
            <InfoBlock title="Condiciones de venta">
              <p>
                Escibe el texto que se muestra al pie de los comprobantes (ej. medios de
                pago aceptados, plazo de cuenta corriente).
              </p>
            </InfoBlock>
            <InfoBlock title="Reglas de venta">
              <p>
                Controla el <strong>tope de descuento</strong> permitido en el Punto de
                Venta (0 = sin limite) y quien puede <strong>anular ventas</strong>:
                solo el propietario, propietario y administrador, o todos los miembros.
              </p>
            </InfoBlock>
            <InfoBlock title="Acceso">
              <p>
                Mi Negocio esta disponible desde el icono de comercio en el header del
                dashboard.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Equipo */}
          <GuideSection
            id="team"
            title="Equipo"
            icon={UserCog}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Roles">
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><Badge tone="default">Propietario</Badge> Control total. No se puede quitar.</li>
                <li><Badge tone="accent">Administrador</Badge> Gestiona miembros y la configuracion.</li>
                <li><Badge tone="muted">Miembro</Badge> Operaciones basicas y acceso de lectura.</li>
              </ul>
            </InfoBlock>
            <InfoBlock title="Invitar miembros">
              <p>
                Desde <strong>Equipo</strong> (menu de usuario) o desde
                <strong> Configuracion → Equipo</strong>, envia una invitacion por email
                y elige el rol. El invitado recibe un link para unirse al workspace.
              </p>
            </InfoBlock>
            <InfoBlock title="Gestionar miembros">
              <p>
                Puedes <strong>cambiar el rol</strong> de un miembro,<strong> reenviar
                invitaciones</strong> pendientes o <strong>eliminar un miembro</strong> del
                equipo. Las invitaciones tienen vencimiento.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* App y Notificaciones */}
          <GuideSection
            id="app"
            title="App y Notificaciones"
            icon={Smartphone}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Instalar como app (PWA)">
              <p>
                Ztocky es una app web progresiva: desde el menu del navegador puedes
                agregarla a la pantalla de inicio del celular y usarla como una app
                instalada. En iOS usa Safari; en Android Chrome o la app.
              </p>
            </InfoBlock>
            <InfoBlock title="Notificaciones push">
              <p>
                Al activar las notificaciones, recibis avisos en la pantalla del
                celular/escritorio (por ejemplo alertas de stock). Al tocar una
                notificacion, la app te lleva directo a las alertas.
              </p>
            </InfoBlock>
            <InfoBlock title="Modo claro / oscuro">
              <p>
                Alterna el tema desde el icono de sol/luna en el menu de usuario o en el
                header. La preferencia se guarda.
              </p>
            </InfoBlock>
          </GuideSection>

          {/* Suscripcion */}
          <GuideSection
            id="subscription"
            title="Suscripcion y Planes"
            icon={CreditCard}
            color="bg-primary/10 text-primary"
          >
            <InfoBlock title="Prueba gratis">
              <p>
                Cada nuevo workspace incluye <strong>30 dias de prueba gratuita</strong>.
                Durante la prueba accedes al plan completo sin costo.
              </p>
            </InfoBlock>
            <InfoBlock title="Planes disponibles">
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><Badge tone="accent">Basica</Badge> - Para negocios chicos comenzando.</li>
                <li><Badge tone="accent">Pro</Badge> - Para negocios en crecimiento con mas productos y equipo.</li>
                <li><Badge tone="accent">Unlimited</Badge> - Sin limites de productos, con IA, push y finanzas avanzadas.</li>
              </ul>
              <p className="mt-2">
                Los precios y limites de cada plan se administran desde el panel de
                Admin y pueden ajustarse sin tocar codigo.
              </p>
            </InfoBlock>
            <InfoBlock title="Donde veo mi plan">
              <p>
                En <strong>Configuracion</strong> podes ver el plan actual, los dias
                restantes de prueba, el estado de la suscripcion y acceder a la
                informacion de facturacion.
              </p>
            </InfoBlock>
            <InfoBlock title="Cuenta vencida (solo lectura)">
              <p>
                Si tu plan se vence, la cuenta pasa a <strong>modo solo lectura</strong>:
                podes ver tus datos y exportarlos (CSV/Excel), pero no crear, editar
                ni borrar nada. Tus datos quedan intactos.
              </p>
            </InfoBlock>
            <InfoBlock title="Administracion">
              <p>
                Si tu cuenta tiene rol <strong>SUPER_ADMIN</strong>, en el menu de
                usuario aparece el <strong>Panel de administracion</strong>: gestion de
                usuarios, estados de suscripcion, metricas y feedback.
              </p>
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
            <InfoBlock title="Perfil">
              <p>
                Actualiza tu <strong>nombre</strong> y tu <strong>CUIT/CUIL</strong>. El
                email no se puede cambiar.
              </p>
            </InfoBlock>
            <InfoBlock title="Cuenta y verificacion">
              <p>
                En la tarjeta <strong>Cuenta</strong> ves tu rol global, el rol en el
                comercio y el estado de tu email. Si el email esta pendiente, usa
                <Badge tone="accent">Reenviar</Badge> para mandar el link de
                verificacion.
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
            <InfoBlock title="Suscripcion">
              <p>
                La tarjeta <strong>Mi plan</strong> muestra tu plan actual, los dias que
                quedan de prueba gratuita y el estado de la cuenta. Ver seccion
                <strong> Suscripcion y Planes</strong> para mas detalle.
              </p>
            </InfoBlock>
            <InfoBlock title="Tema">
              <p>
                Alterna entre modo oscuro y claro desde el icono de sol/luna en el
                header, o desde el menu de usuario.
              </p>
            </InfoBlock>
            <InfoBlock title="Cambiar contraseña">
              <p>
                En la <strong>Zona de peligro</strong> puedes cambiar tu contraseña
                ingresando la actual y la nueva. La contraseña no se puede recuperar,
                solo restablecer con el link de &ldquo;olvide mi contraseña&rdquo;.
              </p>
            </InfoBlock>
            <InfoBlock title="Eliminar cuenta">
              <p>
                La <strong>Zona de peligro</strong> tambien permite eliminar tu cuenta.
                Es una accion <strong>irreversible</strong>: se pide escribirlo para
                confirmar y no se puede deshacer.
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

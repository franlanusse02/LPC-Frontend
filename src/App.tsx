import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-provider";
import RootLayout from "./layouts/RootLayout";
import Login from "@/modules/identity/pages/Login";

import AdminDashboard from "@/modules/analytics/pages/AdminDashboard";
import EncargadoDashboard from "@/modules/analytics/pages/EncargadoDashboard";
import ContabilidadDashboard from "@/modules/analytics/pages/ContabilidadDashboard";

import CierresEncargado from "@/modules/cierres/pages/CierresEncargado";
import CierresContabilidad from "@/modules/cierres/pages/CierresContabilidad";
import NuevoCierrePage from "@/modules/cierres/pages/nuevo-cierre";
import EditarCierrePage from "@/modules/cierres/pages/editar-cierre";

import { AdminRoute } from "@/modules/identity/components/AdminRoute";
import { ProtectedRoute } from "@/modules/identity/components/ProtectedRoute";
import { AuthListener } from "@/modules/identity/components/AuthListener";

import ComedoresPage from "./modules/catalogo/pages/comedores";
import PuntosDeVentaPage from "./modules/catalogo/pages/puntos-de-venta";
import UsuariosPage from "./modules/catalogo/pages/usuarios";
import ProductosPage from "./modules/catalogo/pages/productos";
import ConsumidoresPage from "./modules/catalogo/pages/consumidores";
import ProveedoresPage from "./modules/catalogo/pages/proveedores";
import BancosPage from "./modules/catalogo/pages/bancos";
import TiposEventoPage from "./modules/catalogo/pages/tipos-eventos";
import EdificiosPage from "./modules/catalogo/pages/edificios";
import SalasPage from "./modules/catalogo/pages/salas";
import SociedadesPage from "./modules/catalogo/pages/sociedades";
import ComprasEncargado from "./modules/compras/pages/ComprasEncargado";
import NuevaFacturaPage from "./modules/compras/pages/nueva-factura";
import ComprasContabilidad from "./modules/compras/pages/ComprasContabilidad";
import EditarFacturaPage from "./modules/compras/pages/EditarFacturaPage";
import ConsumosEncargado from "./modules/consumos/pages/ConsumosEncargado";
import NuevoConsumoPage from "./modules/consumos/pages/nuevo-consumo";
import ConsumosContabilidad from "./modules/consumos/pages/ConsumosContabilidad";
import EventosEncargado from "./modules/eventos/pages/EventosEncargado";
import NuevoEventoPage from "./modules/eventos/pages/nuevo-evento";
import EventosContabilidad from "./modules/eventos/pages/EventosContabilidad";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthListener />

        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Only */}
          <Route element={<AdminRoute />}>
            <Route element={<RootLayout />}>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/sociedades" element={<SociedadesPage />} />
            </Route>

            {/* Encargado */}
            <Route element={<ProtectedRoute allowOnly="ENCARGADO" />}>
              <Route element={<RootLayout />}>
                <Route path="/encargado" element={<EncargadoDashboard />} />
                <Route
                  path="/encargado/cierres"
                  element={<CierresEncargado />}
                />
                <Route
                  path="/encargado/cierres/nuevo"
                  element={<NuevoCierrePage />}
                />
                <Route
                  path="/encargado/compras"
                  element={<ComprasEncargado />}
                />
                <Route
                  path="/encargado/compras/nueva"
                  element={<NuevaFacturaPage />}
                />
                <Route
                  path="/encargado/consumos"
                  element={<ConsumosEncargado />}
                />
                <Route
                  path="/encargado/consumos/nuevo"
                  element={<NuevoConsumoPage />}
                />
                <Route
                  path="/encargado/eventos"
                  element={<EventosEncargado />}
                />
                <Route
                  path="/encargado/eventos/nuevo"
                  element={<NuevoEventoPage />}
                />
              </Route>
            </Route>

            {/* Contabilidad */}
            <Route element={<ProtectedRoute allowOnly="CONTABILIDAD" />}>
              <Route element={<RootLayout />}>
                <Route
                  path="/contabilidad"
                  element={<ContabilidadDashboard />}
                />
                <Route
                  path="/contabilidad/cierres"
                  element={<CierresContabilidad />}
                />
                <Route
                  path="/contabilidad/cierres/:id"
                  element={<EditarCierrePage />}
                />
                <Route
                  path="/contabilidad/compras"
                  element={<ComprasContabilidad />}
                />
                <Route
                  path="/contabilidad/compras/:id/editar"
                  element={<EditarFacturaPage />}
                />
                <Route
                  path="/contabilidad/consumos"
                  element={<ConsumosContabilidad />}
                />
                <Route
                  path="/contabilidad/eventos"
                  element={<EventosContabilidad />}
                />

                {/* Catalogo */}
                <Route path="/catalogo/comedores" element={<ComedoresPage />} />
                <Route
                  path="/catalogo/puntos-de-venta"
                  element={<PuntosDeVentaPage />}
                />
                <Route path="/catalogo/productos" element={<ProductosPage />} />
                <Route
                  path="/catalogo/consumidores"
                  element={<ConsumidoresPage />}
                />
                <Route
                  path="/catalogo/proveedores"
                  element={<ProveedoresPage />}
                />
                <Route path="/catalogo/bancos" element={<BancosPage />} />
                <Route
                  path="/catalogo/tipos-eventos"
                  element={<TiposEventoPage />}
                />
                <Route path="/catalogo/edificios" element={<EdificiosPage />} />
                <Route path="/catalogo/salas" element={<SalasPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

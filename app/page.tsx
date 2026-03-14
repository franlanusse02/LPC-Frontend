"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  createCierre,
  getComedores,
  getPuntosDeVenta,
  login,
  type Comedor,
  type PuntoDeVenta,
} from "@/lib/api"

const MEDIOS_PAGO = ["Efectivo", "Débito", "Crédito", "Transferencia"]

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

interface PaymentLine {
  medioPago: string
  monto: string
}

export default function App() {
  const [step, setStep] = useState(0)
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [comedores, setComedores] = useState<Comedor[]>([])
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVenta[]>([])
  const [fechaOperacion, setFechaOperacion] = useState(getTodayDate())
  const [comedor, setComedor] = useState("")
  const [puntoVenta, setPuntoVenta] = useState("")
  const [platosVendidos, setPlatosVendidos] = useState("")
  const [lines, setLines] = useState<PaymentLine[]>([])

  const filteredPuntosDeVenta = puntosDeVenta.filter(
    (punto) => !comedor || String(punto.comedorId) === comedor
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const normalizedUsuario = usuario.replace(/\D/g, "")
      const cuil = Number(normalizedUsuario)

      if (!Number.isFinite(cuil)) {
        throw new Error("Ingresa un CUIL valido")
      }

      const auth = await login(cuil, password)
      const [comedoresData, puntosData] = await Promise.all([
        getComedores(auth.token),
        getPuntosDeVenta(auth.token),
      ])

      setToken(auth.token)
      setComedores(comedoresData)
      setPuntosDeVenta(puntosData)
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion")
    }
  }

  const addLine = () => {
    setLines([...lines, { medioPago: "", monto: "" }])
  }

  const removeLine = (index: number) => {
    setLines((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const updateLine = (index: number, field: keyof PaymentLine, value: string) => {
    const updated = [...lines]
    updated[index][field] = value
    setLines(updated)
  }

  const handleLogout = () => {
    setStep(0)
    setToken(null)
    setError("")
    setComedores([])
    setPuntosDeVenta([])
    setUsuario("")
    setPassword("")
    setFechaOperacion(getTodayDate())
    setComedor("")
    setPuntoVenta("")
    setPlatosVendidos("")
    setLines([])
  }

  const handleFinalizar = async () => {
    if (!token) {
      setError("La sesion expiro. Inicia sesion nuevamente.")
      setStep(0)
      return
    }

    const puntoVentaId = Number(puntoVenta)
    const totalPlatosVendidos = Number(platosVendidos)

    if (!Number.isFinite(puntoVentaId) || !Number.isFinite(totalPlatosVendidos)) {
      alert("Completa el punto de venta y la cantidad de platos vendidos.")
      return
    }

    try {
      await createCierre(token, {
        puntoVentaId,
        fechaOperacion,
        totalPlatosVendidos,
        comentarios: "",
      })

      alert("Cierre finalizado")
      handleLogout()
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo crear el cierre")
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Login */}
      {step === 0 && (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="w-full max-w-md bg-white p-10">
            <div className="mb-10 flex items-center gap-3">
              <span className="text-4xl font-bold tracking-tight">LPC</span>
              <div className="text-[10px] font-bold uppercase leading-tight tracking-wide">
                GESTION
                <br />
                COMEDORES
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide">
                  CUIL
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full border-0 bg-neutral-100 p-3 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-0 bg-neutral-100 p-3 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black p-3 text-sm font-bold uppercase tracking-wide text-white"
              >
                Ingresar
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Step 1-3: App with header */}
      {step >= 1 && token && (
        <div className="min-h-screen">
          <header className="w-full border-b border-neutral-200 bg-white">
            <div className="flex w-full items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold tracking-tight">LPC</span>
                <div className="text-[10px] font-bold uppercase leading-tight tracking-wide">
                  GESTION
                  <br />
                  COMEDORES
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold uppercase tracking-wide"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-4xl px-6 py-6">
            {/* Welcome */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center py-32">
                <h1 className="mb-10 text-2xl font-bold uppercase tracking-wide">
                  Bienvenido {usuario}
                </h1>
                <button
                  onClick={() => setStep(2)}
                  className="bg-white px-10 py-3 text-sm font-bold uppercase tracking-wide shadow-sm ring-1 ring-neutral-200"
                >
                  + Nuevo Cierre
                </button>
              </div>
            )}

            {/* Form */}
            {step >= 2 && (
              <div className="bg-white">
                <div className="bg-neutral-100 p-6">
                  <h2 className="mb-8 text-xl font-bold uppercase tracking-wide">
                    Nuevo Cierre
                  </h2>
                  <div className="flex flex-col gap-8 md:flex-row">
                    {/* Left column */}
                    <div className="flex-1 space-y-5">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide">
                          Fecha Operacion
                        </label>
                        <input
                          type="date"
                          value={fechaOperacion}
                          onChange={(e) => setFechaOperacion(e.target.value)}
                          className="w-full max-w-xs border-0 bg-white p-3 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide">
                          Comedor
                        </label>
                        <select
                          value={comedor}
                          onChange={(e) => {
                            setComedor(e.target.value)
                            setPuntoVenta("")
                          }}
                          className="w-full max-w-xs border-0 bg-white p-3 text-sm focus:outline-none"
                        >
                          <option value="">Seleccionar...</option>
                          {comedores.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide">
                          Punto de Venta
                        </label>
                        <select
                          value={puntoVenta}
                          onChange={(e) => setPuntoVenta(e.target.value)}
                          className="w-full max-w-xs border-0 bg-white p-3 text-sm focus:outline-none"
                        >
                          <option value="">Seleccionar...</option>
                          {filteredPuntosDeVenta.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide">
                          Numero de Platos Vendidos
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={platosVendidos}
                          onChange={(e) => setPlatosVendidos(e.target.value)}
                          className="w-full max-w-xs border-0 bg-white p-3 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Right column - Lines */}
                    <div className="flex-1">
                      <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wide">
                        Lineas
                      </h3>
                      <div className="space-y-4">
                        {lines.map((line, i) => (
                          <div key={i} className="flex flex-col gap-3 md:flex-row md:items-end">
                            <div className="flex-1">
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide">
                                Medio de Pago
                              </label>
                              <select
                                value={line.medioPago}
                                onChange={(e) =>
                                  updateLine(i, "medioPago", e.target.value)
                                }
                                className="w-full border-0 bg-white p-3 text-sm focus:outline-none"
                              >
                                <option value="">Seleccionar...</option>
                                {MEDIOS_PAGO.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide">
                                Monto
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.monto}
                                onChange={(e) =>
                                  updateLine(i, "monto", e.target.value)
                                }
                                className="w-full border-0 bg-white p-3 text-sm focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLine(i)}
                              aria-label="Eliminar linea"
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-start bg-white text-red-600 ring-1 ring-neutral-200 transition-colors hover:bg-red-50 focus:outline-none md:self-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addLine}
                          className="mx-auto block bg-white px-8 py-3 text-sm font-bold uppercase tracking-wide ring-1 ring-neutral-200"
                        >
                          +Nueva Linea
                        </button>
                      </div>
                      {lines.length > 0 && (
                        <div className="mt-8 text-center">
                          <button
                            onClick={handleFinalizar}
                            className="bg-black px-10 py-3 text-sm font-bold uppercase tracking-wide text-white"
                          >
                            Finalizar Cierre
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

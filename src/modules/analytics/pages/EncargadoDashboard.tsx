import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  PackagePlus,
  ClipboardList,
  BanknoteArrowUp,
} from "lucide-react";

export default function EncargadoDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Acceso Encargado
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Elegí un módulo para cargar datos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/cierres")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <BanknoteArrowUp className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Cierres
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/compras")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <PackagePlus className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Compras
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/eventos")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <CalendarPlus className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Eventos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/consumos")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <ClipboardList className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Consumos
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

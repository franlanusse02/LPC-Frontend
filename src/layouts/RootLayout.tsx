import { Header } from "@/components/header";
import { Outlet } from "react-router-dom";
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout() {
  return (
    <div className="font-sans antialiased">
      <Header />
      <Outlet />
      <Toaster />
    </div>
  );
}

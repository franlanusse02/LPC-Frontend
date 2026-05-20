import { Header } from "@/components/header";
import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div className="font-sans antialiased">
      <Header />
      <Outlet />
    </div>
  );
}

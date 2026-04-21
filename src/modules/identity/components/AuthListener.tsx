import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = () => navigate("/login", { replace: true });
    window.addEventListener("auth:expired", handle);
    return () => window.removeEventListener("auth:expired", handle);
  }, [navigate]);

  return null;
}

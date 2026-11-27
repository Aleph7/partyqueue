import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "./components/ToastContainer";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./context/ToastContext";
import { GuestPage } from "./pages/GuestPage";
import { HostPage } from "./pages/HostPage";

export function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<GuestPage />} />
            <Route path="/room/:roomId" element={<GuestPage />} />
            <Route path="/host" element={<HostPage />} />
            <Route path="/room/:roomId/host" element={<HostPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;

import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./components/Landing";
import { Toaster } from "./components/ui/toaster";
import { Navbar } from "./layouts/Navbar";

function App() {
    return (
        <div>
            <BrowserRouter>
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                    <Navbar />
                    <Routes>
                        <Route path="*" element={<Navigate to={"/"} replace />} />
                        <Route path="/" element={<Landing />} />
                    </Routes>
                </ThemeProvider>
            </BrowserRouter>
            <Toaster />
        </div>
    );
}

export default App;

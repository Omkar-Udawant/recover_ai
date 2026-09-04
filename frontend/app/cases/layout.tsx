import { ProtectedRoute } from "@/components/protected-route";
export default function CasesLayout({ children }: { children: React.ReactNode }) { return <ProtectedRoute>{children}</ProtectedRoute>; }

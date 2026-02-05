import Link from "next/link";
import { LayoutDashboard, FileText, Wallet, BarChart } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-6 font-bold text-xl">SmartInvoice</div>

      <nav className="space-y-2 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link href="/invoices" className="flex items-center gap-2">
          <FileText size={18} /> Invoices
        </Link>
        <Link href="/expenses" className="flex items-center gap-2">
          <Wallet size={18} /> Expenses
        </Link>
        <Link href="/reports" className="flex items-center gap-2">
          <BarChart size={18} /> Reports
        </Link>
      </nav>
    </aside>
  );
}

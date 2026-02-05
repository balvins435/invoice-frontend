import Link from "next/link";
import { LayoutDashboard, FileText, Wallet, BarChart } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b">
      <div className="flex items-center justify-between p-4">
        <div className="font-bold text-xl">SmartInvoice</div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/invoices" className="flex items-center gap-2">
            <FileText size={18} /> Invoices
          </Link>
          <Link href="/expenses" className="flex items-center gap-2">
            <Wallet size={18} /> Expenses
          </Link>
          <Link href="/reports" className="flex items-center gap-2">        <BarChart size={18} /> Reports    </Link>   
        </div>
      </div>
    </nav>
  );
}   
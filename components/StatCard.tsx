import Link from "next/link";
import { LayoutDashboard, FileText, Wallet, BarChart } from "lucide-react";

export default function StatCard({ title, value }: { title: string; value: string } )
{
    return (    
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
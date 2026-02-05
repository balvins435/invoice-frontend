import StatCard from "@/components/StatCard";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Revenue" value="KES 150,000" />
      <StatCard title="Expenses" value="KES 85,000" />
      <StatCard title="Profit" value="KES 65,000" />
      <StatCard title="VAT Payable" value="KES 12,000" />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import DashboardLayout from "../components/dashboard-layout"

const navItems = [
  { label: "Home", href: "/donor" },
  { label: "Donate to NGO", href: "/donor/donate" },
  { label: "View My Donations", href: "/donor/my-donations" },
]

export default function DonorDashboard() {
  return (
    <DashboardLayout title="Donor Dashboard" navItems={navItems} userRole="donor">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Welcome, John</h2>
          <p className="text-muted-foreground">
            Make a difference by donating to verified NGOs and track your contributions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Donations Made</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Amount Donated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.45 ETH</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}


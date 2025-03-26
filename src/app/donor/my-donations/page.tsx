"use client"

import { useState } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import DashboardLayout from "../../components/dashboard-layout"

const navItems = [
  { label: "Home", href: "/donor" },
  { label: "Donate to NGO", href: "/donor/donate" },
  { label: "View My Donations", href: "/donor/my-donations" },
]

const mockDonations = [
  {
    id: "1",
    ngoName: "Clean Water Initiative",
    amount: "0.5",
    timestamp: "2023-05-15T10:30:00Z",
  },
  {
    id: "2",
    ngoName: "Education for All",
    amount: "1.2",
    timestamp: "2023-05-20T14:45:00Z",
  },
  {
    id: "3",
    ngoName: "Food Security Project",
    amount: "0.75",
    timestamp: "2023-05-25T09:15:00Z",
  },
  {
    id: "4",
    ngoName: "Clean Water Initiative",
    amount: "0.3",
    timestamp: "2023-06-01T16:20:00Z",
  },
  {
    id: "5",
    ngoName: "Healthcare Access Program",
    amount: "0.7",
    timestamp: "2023-06-05T11:10:00Z",
  },
]

export default function MyDonations() {
  const [searchTerm, setSearchTerm] = useState("")
  const [donations] = useState(mockDonations)

  const filteredDonations = donations.filter((donation) =>
    donation.ngoName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <DashboardLayout title="View My Donations" navItems={navItems}>
      <div className="space-y-4">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input placeholder="Search by NGO name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NGO Name</TableHead>
                  <TableHead>Amount (ETH)</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>{donation.ngoName}</TableCell>
                    <TableCell>{donation.amount}</TableCell>
                    <TableCell>{formatDate(donation.timestamp)}</TableCell>
                  </TableRow>
                ))}
                {filteredDonations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No donations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


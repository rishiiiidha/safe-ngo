"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import DashboardLayout from "../../../components/dashboard-layout"
import { useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { Loader2 } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import { useParams } from "next/navigation"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f", 
  chain: sepolia,
})

export default function ViewNGOs() {
  const router = useRouter()
  const { toast } = useToast()
  const activeAccount = useActiveAccount()
  const params = useParams()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const adminAddress = Array.isArray(params.adminAddress) 
    ? params.adminAddress[0] 
    : params.adminAddress

  const [ngos, setNgos] = useState<Array<{
    ngoContractAddress: string
    name: string
    description: string
    ipfsDocumentHash: string
    ngoAdmin: string
    isActive: boolean
    registrationTime: number
  }>>([])

  const navItems = [
    { label: "Home", href: `/admin/${adminAddress}` },
    { label: "Manage Admins", href: `/admin/${adminAddress}/manage-admins` },
    { label: "Manage NGOs", href: `/admin/${adminAddress}/manage-ngos` },
    { label: "Change NGO Status", href: `/admin/${adminAddress}/change-ngo-status` },
    { label: "View All NGOs", href: `/admin/${adminAddress}/view-ngos` },
  ]

  const { data, isPending: isDataPending } = useReadContract({
    contract,
    method: "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
    params: [],
    //@ts-ignore
    enabled: isAuthorized,
  })

  useEffect(() => {
    if (data) {
      //@ts-ignore
      setNgos(data)
    }
  }, [data])

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!activeAccount?.address) {
        toast({
          title: "No wallet connected",
          description: "Please connect your wallet to access the dashboard",
          variant: "destructive",
          duration: 5000,
        })
        router.push("/login")
        return
      }

      setIsLoading(true)
      setErrorMessage("")
      
      try {
        const isAdmin = await readContract({
          contract,
          method: "function isAdmin(address _admin) view returns (bool)",
          params: [activeAccount.address],
        })

        if (!isAdmin) {
          toast({
            title: "Access denied",
            description: "You are not registered as an admin",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/login")
          return
        }

        if (adminAddress && adminAddress.toLowerCase() !== activeAccount.address.toLowerCase()) {
          toast({
            title: "Invalid admin address",
            description: "You are not authorized to access this admin dashboard",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/login")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Error verifying admin access:", error)
        setErrorMessage("Authentication error: " + (error instanceof Error ? error.message : "Unknown error"))
        
        toast({
          title: "Authentication error",
          description: "There was an error verifying your access. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (activeAccount?.address) {
      verifyAdminAccess()
    }
  }, [activeAccount?.address, adminAddress, router, toast])

  if (isLoading) {
    return (
      <DashboardLayout title="View All NGOs" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading dashboard...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your admin access.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="View All NGOs" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to view NGOs.</p>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="View All NGOs" navItems={navItems} userRole="admin">
      <Card>
        <CardContent className="p-6">
          {isDataPending ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NGO Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Admin Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ngos.map((ngo) => (
                  <TableRow key={ngo.ngoContractAddress}>
                    <TableCell className="font-medium">{ngo.name}</TableCell>
                    <TableCell>{ngo.description}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {ngo.ngoAdmin.substring(0, 6)}...{ngo.ngoAdmin.substring(ngo.ngoAdmin.length - 4)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ngo.isActive ? "default" : "secondary"}>
                        {ngo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(Number(ngo.registrationTime) * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/transparency/${ngo.ngoContractAddress}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
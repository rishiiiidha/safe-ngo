"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import DashboardLayout from "../../components/dashboard-layout"
import { useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { formatEther } from "ethers"
import { useToast } from "../../hooks/use-toast"
import { Button } from "../../components/ui/button"
import { Loader2, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Input } from "../../components/ui/input"

const navItems = [
  { label: "Home", href: "/donor" },
  { label: "Donate to NGO", href: "/donor/donate" },
  { label: "My Donations", href: "/donor/my-donations" },
]

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const mainContract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

export default function MyDonationsPage() {
  const router = useRouter()
  const {push} = router
  const { toast } = useToast()
  const activeAccount = useActiveAccount()

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [dataLoadingError, setDataLoadingError] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [donations, setDonations] = useState<Array<{
    donationId: bigint
    donor: string
    ngoContract: string
    amount: bigint
    timestamp: bigint
    ngoName: string
  }>>([])
  const fetchDonations = useCallback (async (donorAddress: string) => {
    try {
      setDataLoadingError(false)
      let donationsData: Array<{
        donationId: bigint
        donor: string
        ngoContract: string
        amount: bigint
        timestamp: bigint
        ngoName: string
      }> = []

      const ngos = await readContract({
        contract: mainContract,
        method: "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
        params: [],
      }) as any[]

      for (const ngo of ngos) {
        try {
          const ngoContract = getContract({
            client,
            address: ngo.ngoContractAddress,
            chain: sepolia,
          })
          console.log(ngoContract)

          const totalDonations = await readContract({
            contract: ngoContract,
            method: "function getDonationCount() view returns (uint256)",
            params: [],
          }) as bigint
          console.log(totalDonations)

          for (let i = 0; i < Number(totalDonations); i++) {
            try {
              const donation = await readContract({
                contract: ngoContract,
                method: "function getDonation(uint256 _index) view returns (address donor, uint256 amount, uint256 timestamp)",
                params: [BigInt(i)],
              })


              if (donation &&
                typeof donation[0] === 'string' &&
                typeof donation[1] === 'bigint' &&
                typeof donation[2] === 'bigint'
              ) {

                if (donation[0].toLowerCase() === donorAddress.toLowerCase()) {
                  donationsData.push({
                    donationId: BigInt(i),
                    donor: donation[0],
                    ngoContract: ngo.ngoContractAddress,
                    amount: donation[1],
                    timestamp: donation[2],
                    ngoName: ngo.name
                  })
                }
              }
            } catch (error) {
              console.error(`Error fetching donation index ${i} from NGO ${ngo.ngoContractAddress}:`, error)
              continue
            }
          }
        } catch (error) {
          console.error(`Error processing NGO ${ngo.ngoContractAddress}:`, error)
          continue
        }
      }

      donationsData.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      setDonations(donationsData)

    } catch (error) {
      console.error("Error in fetchDonations:", error)
      setDataLoadingError(true)
      setErrorMessage(`Failed to load donations: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Donation Data Error",
        description: "Could not load your donation history",
        variant: "destructive",
        duration: 5000,
      })
    }
  },[toast])

  useEffect(() => {
    const verifyDonorAccess = async () => {
      if (!activeAccount?.address) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage("")

      try {
        const isDonor = await readContract({
          contract: mainContract,
          method: "function isDonor(address _donor) view returns (bool)",
          params: [activeAccount.address],
        })

        if (!isDonor) {
          toast({
            title: "Access denied",
            description: "You are not registered as a donor. Please register from the login page.",
            variant: "destructive",
            duration: 5000,
          })
          push("/login")
          return
        }

        setIsAuthorized(true)
        await fetchDonations(activeAccount.address)
      } catch (error) {
        console.error("Error in donor dashboard initialization:", error)
        setErrorMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        toast({
          title: "Initialization error",
          description: "There was an error loading the dashboard. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    verifyDonorAccess()
  }, [activeAccount?.address,fetchDonations,push , toast])



  const handleRetry = async () => {
    if (!activeAccount?.address) return

    setDataLoadingError(false)
    setIsLoading(true)
    try {
      await fetchDonations(activeAccount.address)
    } finally {
      setIsLoading(false)
    }
  }

  const goToTransparencyPage = (contractAddress: string) => {
    window.open(`/transparency/${contractAddress}`, '_blank')
  }


  const filteredDonations = donations.filter(donation => 
    donation.ngoName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <DashboardLayout title="My Donations" navItems={navItems} userRole="donor">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading your donations...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we load your donation history.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="My Donations" navItems={navItems} userRole="donor">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to access this page.</p>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => push("/login")}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Donations" navItems={navItems} userRole="donor">
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground">
            View your complete donation history across all NGOs
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {dataLoadingError ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-red-500 mb-4">Failed to load donations</p>
                <Button variant="outline" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            ) : donations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">You haven&apos;t made any donations yet.</p>
                <Button
                  className="mt-4"
                  onClick={() => push("/donor/donate")}
                >
                  Make Your First Donation
                </Button>
              </div>
            ) : (
              <>
               
                <div className="mb-4 relative">
                  <div className="flex items-center border rounded-md p-2 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <Search className="h-5 w-5 text-gray-400 mr-2" />
                    <Input
                      type="text"
                      placeholder="Search donations by NGO name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {searchQuery && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSearchQuery("")}
                        className="h-7 w-7 p-0"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>

                {searchQuery && (
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing {filteredDonations.length} of {donations.length} donations
                    {filteredDonations.length === 0 && (
                      <div className="mt-2 p-4 bg-gray-50 rounded-md text-center">
                        No donations found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}

                {filteredDonations.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NGO</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDonations.map((donation, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {donation.ngoName}
                          </TableCell>
                          <TableCell>{formatEther(donation.amount)} ETH</TableCell>
                          <TableCell>
                            {new Date(Number(donation.timestamp) * 1000).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToTransparencyPage(donation.ngoContract)}
                            >
                              View NGO
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
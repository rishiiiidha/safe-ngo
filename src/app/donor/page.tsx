"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import DashboardLayout from "../components/dashboard-layout"
import { useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { formatEther } from "ethers"
import { useToast } from "../hooks/use-toast"
import { Button } from "../components/ui/button"
import { Loader2 } from "lucide-react"

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

export default function DonorDashboard() {
  const router = useRouter()
  const {push } = router;
  const { toast } = useToast()
  const activeAccount = useActiveAccount()

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [dataLoadingError, setDataLoadingError] = useState(false)

  const [donorData, setDonorData] = useState({
    totalDonations: 0,
    totalAmountDonated: "0",
    donations: [] as Array<{
      donationId: bigint
      donor: string
      ngoContract: string
      amount: bigint
      timestamp: bigint
      message: string
      ngoName: string
    }>
  })
  const fetchDonorData = useCallback (async (donorAddress: string) => {
    try {
      setDataLoadingError(false);

      let totalAmount = BigInt(0);
      const donationsData: Array<{
        donationId: bigint;
        donor: string;
        ngoContract: string;
        amount: bigint;
        timestamp: bigint;
        message: string;
        ngoName: string;
      }> = [];

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
          });

          const totalDonations = await readContract({
            contract: ngoContract,
            method: "function getDonationCount() view returns (uint256)",
            params: [],
          }) as bigint;

          for (let i = 0; i < Number(totalDonations); i++) {
            try {
              const donation = await readContract({
                contract: ngoContract,
                method: "function getDonation(uint256 _index) view returns (address donor, uint256 amount, uint256 timestamp)",
                params: [BigInt(i)],
              });


              if (donation &&
                typeof donation[0] === 'string' &&
                typeof donation[1] === 'bigint' &&
                typeof donation[2] === 'bigint') {


                if (donation[0].toLowerCase() === donorAddress.toLowerCase()) {
                  totalAmount += donation[1];
                  donationsData.push({
                    donationId: BigInt(i),
                    donor: donation[0],
                    ngoContract: ngo.ngoContractAddress,
                    amount: donation[1],
                    timestamp: donation[2],
                    message: "Donation",
                    ngoName: ngo.name
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching donation index ${i} from NGO ${ngo.ngoContractAddress}:`, error);
              continue;
            }
          }
        } catch (error) {
          console.error(`Error processing NGO ${ngo.ngoContractAddress}:`, error);
          continue;
        }
      }

      donationsData.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      setDonorData({
        totalDonations: donationsData.length,
        totalAmountDonated: totalAmount.toString(),
        donations: donationsData
      });

    } catch (error) {
      console.error("Error in fetchDonorData:", error);
      setDataLoadingError(true);
      setErrorMessage(`Failed to load donations: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast({
        title: "Donation Data Error",
        description: "Could not load your donation history",
        variant: "destructive",
        duration: 5000,
      });
    }
  },[toast])

  useEffect(() => {
    const verifyDonorAccess = async () => {
      if (!activeAccount?.address) {
        toast({
          title: "No wallet connected",
          description: "Please connect your wallet to access the dashboard",
          variant: "destructive",
          duration: 5000,
        })
        setTimeout(() => {
         push("/login")
        }
          , 5000)
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

        await fetchDonorData(activeAccount.address)
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
  }, [activeAccount?.address , fetchDonorData, push, toast])



  const handleRetry = async () => {
    if (!activeAccount?.address) return

    setDataLoadingError(false)
    setIsLoading(true)
    try {
      await Promise.all([
        fetchDonorData(activeAccount.address)
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Donor Dashboard" navItems={navItems} userRole="donor">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading dashboard...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your access and load your donation data.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="Donor Dashboard" navItems={navItems} userRole="donor">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to access the donor dashboard.</p>
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
    <DashboardLayout title="Donor Dashboard" navItems={navItems} userRole="donor">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Welcome, Donor</h2>
          <p className="text-muted-foreground">
            Make a difference by donating to verified NGOs and track your contributions.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Wallet Address: {activeAccount?.address ? `${activeAccount.address.substring(0, 6)}...${activeAccount.address.substring(activeAccount.address.length - 4)}` : "Not connected"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Donations Made</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donorData.totalDonations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Amount Donated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatEther(donorData.totalAmountDonated)} ETH
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Recently Supported NGOs</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {donorData.donations.length > 0 ? (
              donorData.donations.slice(0, 3).map((donation, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{donation.ngoName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatEther(donation.amount)} ETH</div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(Number(donation.timestamp) * 1000).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground col-span-3">You haven&apos;t made any donations yet.</p>
            )}
          </div>
          {donorData.donations.length > 0 && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => push("/donor/my-donations")}
              >
                View All Donations
              </Button>
            </div>
          )}
        </div>

        <div>

        </div>
      </div>
    </DashboardLayout>
  )
}

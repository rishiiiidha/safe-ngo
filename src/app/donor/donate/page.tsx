"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card"
import DashboardLayout from "../../components/dashboard-layout"
import { useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { formatEther } from "ethers"
import { useToast } from "../../hooks/use-toast"
import { Button } from "../../components/ui/button"
import { Loader2, Info, ExternalLink } from "lucide-react"
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"

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

export default function DonatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const activeAccount = useActiveAccount()
  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction()

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  interface Ngo {
    ngoContractAddress: string;
    name: string;
    description: string;
    ipfsDocumentHash: string;
    ngoAdmin: string;
    isActive: boolean;
    registrationTime: number;
  }

  const [ngos, setNgos] = useState<Ngo[]>([])
  const [selectedNgo, setSelectedNgo] = useState<string | null>(null)
  const [donationAmount, setDonationAmount] = useState("")
  const [donationMessage, setDonationMessage] = useState("")

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
          router.push("/login")
        }, 5000)
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
          router.push("/login")
          return
        }

        setIsAuthorized(true)
        await fetchNGOs()
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
  }, [activeAccount?.address])

  const fetchNGOs = async () => {
    try {
      const ngosData = await readContract({
        contract: mainContract,
        method: "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
        params: [],
      }) as any[]

      setNgos(ngosData.filter((ngo) => ngo.isActive))
    } catch (error) {
      console.error("Error fetching NGOs:", error)
      setErrorMessage("Failed to load NGOs. Please try again.")
      toast({
        title: "Data Loading Error",
        description: "Could not load NGO data",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDonate = async () => {
    if (!selectedNgo || !donationAmount) {
      toast({
        title: "Missing information",
        description: "Please select an NGO and enter an amount",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    const amount = parseFloat(donationAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      const ngoContract = getContract({
        client,
        address: selectedNgo,
        chain: sepolia,
      })
      console.log("Selected NGO Contract:", ngoContract)

      const transaction = prepareContractCall({
        contract: ngoContract,
        method: "function donate() payable",
        params: [],
        value: BigInt(amount * 10 ** 18)
      })

      await sendTransaction(transaction, {
        onSuccess: () => {
          toast({
            title: "Donation Successful",
            description: `Your donation of ${amount} ETH has been processed`,
            duration: 5000,
          })
          setDonationAmount("")
          setDonationMessage("")
        },
        onError: (error) => {
          console.error("Donation error:", error)
          toast({
            title: "Donation Failed",
            description: error.message || "Transaction failed",
            variant: "destructive",
            duration: 5000,
          })
        }
      })
    } catch (error) {
      console.error("Error preparing donation:", error)
      toast({
        title: "Donation Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const goToTransparencyPage = (contractAddress: any) => {
    window.open(`/transparency/${contractAddress}`, '_blank')
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Donate to NGO" navItems={navItems} userRole="donor">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading NGOs...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your access and load available NGOs.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="Donate to NGO" navItems={navItems} userRole="donor">
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
              onClick={() => router.push("/login")}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Donate to NGO" navItems={navItems} userRole="donor">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="w-full md:w-7/12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Available NGOs</h2>
              <Badge variant="outline" className="px-3 py-1">
                {ngos.length} Organizations
              </Badge>
            </div>

            {ngos.length === 0 ? (
              <div className="p-8 text-center border rounded-lg">
                <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No NGOs Available</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  There are no active NGOs accepting donations at this time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ngos.map((ngo: any) => (
                  <Card
                    key={ngo.ngoContractAddress}
                    className={`overflow-hidden transition-all ${selectedNgo === ngo.ngoContractAddress
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                      }`}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div
                        className="p-4 md:p-5 flex-grow cursor-pointer"
                        onClick={() => setSelectedNgo(ngo.ngoContractAddress)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{ngo.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Registered: {new Date(Number(ngo.registrationTime) * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedNgo === ngo.ngoContractAddress && (
                            <Badge className="ml-2">Selected</Badge>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm">
                          {ngo.description}
                        </p>
                      </div>

                      <div className="flex md:flex-col justify-between items-center border-t md:border-t-0 md:border-l p-3 md:p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => goToTransparencyPage(ngo.ngoContractAddress)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-5/12 mt-6 md:mt-0">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Make a Donation</CardTitle>
                <CardDescription>
                  Support the cause you believe in with a direct donation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedNgo ? (
                  <>
                    <div className="p-3 bg-primary/5 rounded-md flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Selected Organization</p>
                        <p className="text-base">{ngos.find(n => n.ngoContractAddress === selectedNgo)?.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNgo(null)}
                      >
                        Change
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="amount" className="block text-sm font-medium">
                        Donation Amount (ETH)
                      </label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          min="0.001"
                          step="0.001"
                          placeholder="0.1"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          className="pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-sm text-muted-foreground">ETH</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum donation: 0.001 ETH
                      </p>
                    </div>

                    <div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleDonate}
                        disabled={isTransactionPending || !donationAmount}
                      >
                        {isTransactionPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Donation...
                          </>
                        ) : (
                          "Donate Now"
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center mt-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="flex items-center text-xs text-muted-foreground gap-1"
                        onClick={() => goToTransparencyPage(selectedNgo)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Transparency Report
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Select an NGO</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-6">
                      Please select an organization from the list to proceed with your donation
                    </p>
                    {ngos.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedNgo(ngos[0].ngoContractAddress)}
                      >
                        Select an Organization
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-col space-y-4 border-t pt-6">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Why donate through our platform?</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>100% of your donation goes directly to the NGO</li>
                    <li>Transparent tracking of funds via blockchain</li>
                    <li>Secure and immediate fund transfer</li>
                  </ul>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
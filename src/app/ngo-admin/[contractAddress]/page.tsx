"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import DashboardLayout from "../../components/dashboard-layout"
import { useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { formatEther } from "ethers"
import { useToast } from "../../hooks/use-toast"
import { Button } from "../../components/ui/button"
import { Loader2 } from "lucide-react"



const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const mainContract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

export default function NGOAdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const params = useParams()
  console.log("Params:", params)
  const contractAddress = Array.isArray(params.contractAddress) 
    ? params.contractAddress[0] 
    : params.contractAddress
  const navItems = [
      { label: "Home", href: `/ngo-admin/${contractAddress}` },
      { label: "Update NGO Details", href: `/ngo-admin/${contractAddress}/update-details` },
      { label: "Record Expenditure", href: `/ngo-admin/${contractAddress}/record-expenditure` },
      { label: "View Donations", href: `/ngo-admin/${contractAddress}/view-donations` },
      { label: "View Expenditures", href: `/ngo-admin/${contractAddress}/view-expenditures` },
    ]
  const activeAccount = useActiveAccount()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [dataLoadingError, setDataLoadingError] = useState(false)
  
  const [ngoData, setNgoData] = useState({
    name: "",
    description: "",
    creationTime: "",
    balance: "0",
    donationCount: "0",
    totalDonations: "0",
    totalExpenditures: "0",
    transparencyScore: "0",
    ipfsDocumentHash: "",
    expenditureCount: "0"
  })

  useEffect(() => {
    console.log("Contract Address from URL:", contractAddress)
    
    const verifyAdminAccess = async () => {
      if (!activeAccount?.address) {
        toast({
          title: "No wallet connected",
          description: "Please connect your wallet to access the dashboard",
          variant: "destructive",
          duration: 5000,
        })
        router.push("/")
        return
      }

      setIsLoading(true)
      setErrorMessage("")
      
      try {
        console.log("Checking if account is NGO admin:", activeAccount.address)
        
        const isNGOAdmin = await readContract({
          contract: mainContract,
          method: "function isNGOAdmin(address _ngoAdmin) view returns (bool)",
          params: [activeAccount.address],
        })
        
        console.log("Is NGO Admin result:", isNGOAdmin)

        if (!isNGOAdmin) {
          toast({
            title: "Access denied",
            description: "You are not registered as an NGO admin",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/")
          return
        }

        console.log("Fetching NGO contract for admin:", activeAccount.address)
        
        const adminNGOContractAddress = await readContract({
          contract: mainContract,
          method: "function getNGOContractByAdmin(address _ngoAdmin) view returns (address)",
          params: [activeAccount.address],
        })
        
        console.log("Admin's NGO Contract:", adminNGOContractAddress)
        console.log("URL Contract Address:", contractAddress)

        if (contractAddress && contractAddress.toLowerCase() !== adminNGOContractAddress.toLowerCase()) {
          toast({
            title: "Invalid NGO contract",
            description: "You are not authorized to access this NGO dashboard",
            variant: "destructive",
            duration: 5000,
          })
          router.push(`/login`)
          return
        }

        if (!contractAddress) {
          router.push(`/login`)
          return
        }

        setIsAuthorized(true)
        
        await fetchNGOData(contractAddress)
      } catch (error) {
        console.error("Error verifying admin access:", error)
        //@ts-ignore
        setErrorMessage("Authentication error: " + (error.message || "Unknown error"))
        
        toast({
          title: "Authentication error",
          description: "There was an error verifying your access. Please try logging in again.",
          variant: "destructive",
          duration: 5000,
        })
        
        setTimeout(() => {
          router.push("/")
        }, 5000)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeAccount?.address) {
      verifyAdminAccess()
    }
  }, [activeAccount?.address, contractAddress, router, toast])

  //@ts-ignore
  const fetchNGOData = async (contractAddress) => {
    try {
      setDataLoadingError(false)
      
      console.log("Creating contract instance for:", contractAddress)
      
      const ngoContract = getContract({
        client,
        address: contractAddress,
        chain: sepolia,
      })
      
      console.log("NGO Contract instance created:", ngoContract.address)
      
      //@ts-ignore
      const safeReadContract = async (methodSignature, params = []) => {
        try {
          console.log(`Fetching ${methodSignature}...`)
          const result = await readContract({
            contract: ngoContract,
            method: methodSignature,
            params: params,
          })
          console.log(`${methodSignature} result:`, result)
          return result
        } catch (error) {
          console.error(`Error fetching ${methodSignature}:`, error)
          return null
        }
      }
      
      const nameResult = await safeReadContract("function name() view returns (string)", []) || "Unknown NGO";
      const descriptionResult = await safeReadContract("function description() view returns (string)", []) || "No description available";
      const creationTimeResult = await safeReadContract("function creationTime() view returns (uint256)", []) || "0";
      const balanceResult = await safeReadContract("function getBalance() view returns (uint256)", []) || "0";
      const donationCountResult = await safeReadContract("function getDonationCount() view returns (uint256)", []) || "0";
      const totalDonationsResult = await safeReadContract("function totalDonations() view returns (uint256)", []) || "0";
      const totalExpendituresResult = await safeReadContract("function totalExpenditures() view returns (uint256)", []) || "0";
      const transparencyScoreResult = await safeReadContract("function getTransparencyScore() view returns (uint256)", []) || "0";
      const ipfsDocumentHashResult = await safeReadContract("function ipfsDocumentHash() view returns (string)", []) || "";
      const expenditureCountResult = await safeReadContract("function getExpenditureCount() view returns (uint256)", []) || "0";
      
      console.log("All data fetched successfully")
      
      setNgoData({
        name: nameResult,
        description: descriptionResult,
        creationTime: creationTimeResult?.toString() || "0",
        balance: balanceResult?.toString() || "0",
        donationCount: donationCountResult?.toString() || "0",
        totalDonations: totalDonationsResult?.toString() || "0",
        totalExpenditures: totalExpendituresResult?.toString() || "0",
        transparencyScore: transparencyScoreResult?.toString() || "0",
        ipfsDocumentHash: ipfsDocumentHashResult || "",
        expenditureCount: expenditureCountResult?.toString() || "0",
      });
    } catch (error) {
      console.error("Fatal error fetching NGO data:", error);
      setDataLoadingError(true);
      //@ts-ignore
      setErrorMessage("Data loading error: " + (error.message || "Unknown error"));
      
      toast({
        title: "Data fetching error",
        description: "There was an error loading NGO data. Please check contract address and try again.",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRetry = async () => {
    if (contractAddress) {
      setDataLoadingError(false);
      setIsLoading(true);
      try {
        await fetchNGOData(contractAddress);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="NGO Admin Dashboard" navItems={navItems} userRole="ngo">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading dashboard...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your access and load NGO data.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="NGO Admin Dashboard" navItems={navItems} userRole="ngo">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to access this NGO dashboard.</p>
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

  if (dataLoadingError) {
    return (
      <DashboardLayout title="NGO Admin Dashboard" navItems={navItems} userRole="ngo">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Data Loading Error</h2>
            <p className="text-muted-foreground mt-2">There was an error loading your NGO data.</p>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-xl">
                <p className="text-sm text-red-500 break-words">{errorMessage}</p>
              </div>
            )}
            <div className="mt-6 flex gap-4 justify-center">
              <Button 
                variant="default"
                onClick={handleRetry}
              >
                Retry
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/login")}
              >
                Return to Login
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="NGO Admin Dashboard" navItems={navItems} userRole="ngo">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Welcome, {ngoData.name || "Loading..."}</h2>
          <p className="text-muted-foreground">
            {ngoData.description || "Loading NGO description..."}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Created on: {ngoData.creationTime && ngoData.creationTime !== "0" 
              ? new Date(Number(ngoData.creationTime) * 1000).toLocaleDateString() 
              : "Information not available"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Contract Address: {contractAddress || "Loading..."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatEther(ngoData.totalDonations || "0")} ETH
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenditures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatEther(ngoData.totalExpenditures || "0")} ETH
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatEther(ngoData.balance || "0")} ETH
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Donation Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ngoData.donationCount || "0"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expenditure Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ngoData.expenditureCount || "0"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transparency Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ngoData.transparencyScore || "0"}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IPFS Document</CardTitle>
          </CardHeader>
          <CardContent>
            {ngoData.ipfsDocumentHash ? (
              <a
                href={`https://ipfs.io/ipfs/${ngoData.ipfsDocumentHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Document
              </a>
            ) : (
              <p className="text-muted-foreground">No document uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import DashboardLayout from "../../../components/dashboard-layout"
import { useToast } from "../../../hooks/use-toast"
import { prepareContractCall, readContract } from "thirdweb"
import { useSendTransaction, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { uploadToPinata } from "../../../lib/pinata"
import { useSearchParams, useRouter, useParams } from "next/navigation"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const mainContract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

export default function RecordExpenditure() {
  const router = useRouter()
  const { toast } = useToast()
  const params = useParams()
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    ipfsHash: "",
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileName, setFileName] = useState("")
  const { mutate: sendTransaction } = useSendTransaction()

  useEffect(() => {
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
        const isNGOAdmin = await readContract({
          contract: mainContract,
          method: "function isNGOAdmin(address _ngoAdmin) view returns (bool)",
          params: [activeAccount.address],
        })

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
        

        const adminNGOContractAddress = await readContract({
          contract: mainContract,
          method: "function getNGOContractByAdmin(address _ngoAdmin) view returns (address)",
          params: [activeAccount.address],
        })
        console.log("Admin NGO Contract Address from record expenditure:", adminNGOContractAddress)
        console.log("Contract Address from record expenditure:", contractAddress)
      
        if (contractAddress && contractAddress.toLowerCase() !== adminNGOContractAddress.toLowerCase()) {
          toast({
            title: "Invalid NGO contract",
            description: "You are not authorized to access this NGO dashboard",
            variant: "destructive",
            duration: 5000,
          })
          router.push(`/ngo-admin/${adminNGOContractAddress}`)
          return
        }

        if (!contractAddress) {
          router.push(`/ngo-admin/${adminNGOContractAddress}`)
          return
        }

        setIsAuthorized(true)
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
      } finally {
        setIsLoading(false)
      }
    }

    if (activeAccount?.address) {
      verifyAdminAccess()
    }
  }, [activeAccount?.address, contractAddress, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setFileName(file.name)
    setIsUploading(true)
    
    try {
      const ipfsHash = await uploadToPinata(file)
      setFormData(prev => ({ ...prev, ipfsHash }))
      
      toast({
        title: "Receipt uploaded successfully",
        description: `File "${file.name}" has been uploaded to IPFS`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your receipt",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contractAddress) {
      toast({
        title: "Error",
        description: "NGO contract address not found",
        variant: "destructive",
      })
      return
    }

    if (!formData.description || !formData.amount || !formData.ipfsHash) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to record an expenditure",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const ngoContract = getContract({
        client,
        address: contractAddress,
        chain: sepolia,
      })

      // Convert amount to wei (assuming the contract expects wei)
      const amountInWei = BigInt(Math.floor(parseFloat(formData.amount) * 1e18))
   
      const transaction = prepareContractCall({
        contract: ngoContract,
        method: "function recordExpenditure(string _description, uint256 _amount, string _ipfsReceiptHash)",
        params: [
          formData.description,
          //@ts-ignore
          amountInWei.toString(),
          formData.ipfsHash,
        ],
      })

      toast({
        title: "Recording expenditure",
        description: "Please confirm the transaction in your wallet",
        duration: 5000,
      })

      const txResult = await sendTransaction(transaction)
      console.log("Transaction submitted:", txResult)
      
      toast({
        title: "Expenditure recorded",
        description: "Transaction has been submitted to the blockchain",
        variant: "default",
        duration: 5000,
      })
      
      // Reset form
      setFormData({
        description: "",
        amount: "",
        ipfsHash: "",
      })
      setFileName("")
      
    } catch (error) {
      console.error("Error recording expenditure:", error)
      toast({
        title: "Recording failed",
        description: "There was an error recording the expenditure",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Record Expenditure" navItems={navItems} userRole="ngo">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading...</h2>
            <p className="text-muted-foreground mt-2">Verifying your access permissions</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="Record Expenditure" navItems={navItems} userRole="ngo">
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
    <DashboardLayout title="Record Expenditure" navItems={navItems} userRole="ngo">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Record New Expenditure</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Purpose of the expenditure"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt Documentation</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading || isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSubmitting}
                  className="flex-shrink-0"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Receipt"
                  )}
                </Button>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                  {fileName ? (
                    <span className="flex items-center">
                      <Check className="mr-1 h-4 w-4 text-green-500" />
                      {fileName}
                    </span>
                  ) : (
                    "No file selected"
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipfsHash">IPFS Receipt Hash</Label>
              <Input
                id="ipfsHash"
                name="ipfsHash"
                placeholder="QmXyz..."
                value={formData.ipfsHash}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Upload receipt or supporting documents to IPFS and provide the hash here.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Expenditure"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
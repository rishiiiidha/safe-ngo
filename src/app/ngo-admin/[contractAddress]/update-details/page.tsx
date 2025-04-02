"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import DashboardLayout from "../../../components/dashboard-layout"
import { useToast } from "../../../hooks/use-toast"
import { readContract, prepareContractCall } from "thirdweb"
import {  useSendTransaction, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { useParams } from "next/navigation"
import { Loader2, Check, Upload } from "lucide-react"
import { uploadToPinata } from "../../../lib/pinata"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const mainContract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

export default function UpdateNGODetails() {
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
  const { toast } = useToast()
  const activeAccount = useActiveAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ipfsHash: "",
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileName, setFileName] = useState("")
  const { mutate: sendTransaction } = useSendTransaction()

  useEffect(() => {
    const fetchNGODetails = async () => {
      if (!contractAddress) return
      
      try {
        const ngoContract = getContract({
          client,
          address: contractAddress,
          chain: sepolia,
        })

        const [name, description, ipfsHash] = await Promise.all([
          readContract({
            contract: ngoContract,
            method: "function name() view returns (string)",
          }),
          readContract({
            contract: ngoContract,
            method: "function description() view returns (string)",
          }),
          readContract({
            contract: ngoContract,
            method: "function ipfsDocumentHash() view returns (string)",
          }),
        ])

        setFormData({
          name: name || "",
          description: description || "",
          ipfsHash: ipfsHash || "",
        })
      } catch (error) {
        console.error("Error fetching NGO details:", error)
        toast({
          title: "Error",
          description: "Failed to load NGO details",
          variant: "destructive",
        })
      }
    }

    const verifyAdminAccess = async () => {
      if (!activeAccount?.address) {
        toast({
          title: "No wallet connected",
          description: "Please connect your wallet to access the dashboard",
          variant: "destructive",
          duration: 5000,
        })
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
          return
        }

        const adminNGOContractAddress = await readContract({
          contract: mainContract,
          method: "function getNGOContractByAdmin(address _ngoAdmin) view returns (address)",
          params: [activeAccount.address],
        })

        if (contractAddress.toLowerCase() !== adminNGOContractAddress.toLowerCase()) {
          toast({
            title: "Invalid NGO contract",
            description: "You are not authorized to update this NGO's details",
            variant: "destructive",
            duration: 5000,
          })
          return
        }

        setIsAuthorized(true)
        await fetchNGODetails()
      } catch (error) {
        console.error("Error verifying admin access:", error)
        setErrorMessage("Authentication error: " + (error as Error).message)
        toast({
          title: "Authentication error",
          description: "There was an error verifying your access",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (activeAccount?.address && contractAddress) {
      verifyAdminAccess()
    }
  }, [activeAccount?.address, contractAddress, toast])

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
        title: "Document uploaded successfully",
        description: `File "${file.name}" has been uploaded to IPFS`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document",
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

    if (!formData.name || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
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

      const transaction = prepareContractCall({
        contract: ngoContract,
        method: "function updateNGODetails(string _name, string _description, string _ipfsDocumentHash)",
        params: [
          formData.name,
          formData.description,
          formData.ipfsHash || "", 
        ],
      })

      toast({
        title: "Updating NGO details",
        description: "Please confirm the transaction in your wallet",
        duration: 5000,
      })

      await sendTransaction(transaction)
      
      toast({
        title: "Details updated",
        description: "NGO information has been updated on the blockchain",
        variant: "default",
        duration: 5000,
      })
      
    } catch (error) {
      console.error("Error updating NGO details:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating the NGO details",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

 

  if (isLoading) {
    return (
      <DashboardLayout title="Update NGO Details" navItems={navItems} userRole="ngo">
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
      <DashboardLayout title="Update NGO Details" navItems={navItems} userRole="ngo">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to access this page.</p>
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
    <DashboardLayout title="Update NGO Details" navItems={navItems} userRole="ngo">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Update NGO Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Documentation</Label>
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
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                  {fileName ? (
                    <span className="flex items-center">
                      <Check className="mr-1 h-4 w-4 text-green-500" />
                      {fileName}
                    </span>
                  ) : formData.ipfsHash ? (
                    <span className="flex items-center">
                      <Check className="mr-1 h-4 w-4 text-green-500" />
                      Document attached
                    </span>
                  ) : (
                    "No file chosen"
                  )}
                </div>
              </div>
              <Input
                id="ipfsHash"
                name="ipfsHash"
                placeholder="IPFS Hash (will be auto-filled when uploading file)"
                value={formData.ipfsHash}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Upload your NGO documentation to IPFS (PDF, JPG, PNG). Max 10MB.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || isUploading || !formData.name || !formData.description}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update NGO Details"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
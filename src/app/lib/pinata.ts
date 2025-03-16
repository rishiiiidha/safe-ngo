import axios from 'axios'

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_SECRET_API_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  throw new Error("Pinata API keys are missing. Please add them to your environment variables.")
}

export const uploadToPinata = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const metadata = JSON.stringify({
    name: file.name,
  })
  formData.append('pinataMetadata', metadata)

  const options = JSON.stringify({
    cidVersion: 0,
  })
  formData.append('pinataOptions', options)

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    })
    return res.data.IpfsHash
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    throw error
  }
}
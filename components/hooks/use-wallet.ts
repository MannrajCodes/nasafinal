"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"

export function useWallet() {
  const [wallet, setWallet] = useState<ethers.Wallet | ethers.HDNodeWallet | null>(null)

  useEffect(() => {
    // WARNING: Storing private keys in localStorage is insecure and for demo purposes only.
    // In a real application, use a browser wallet like MetaMask.
    let privateKey = localStorage.getItem("orbital-privateKey")

    if (!privateKey) {
      // If no key, create a new wallet
      const newWallet = ethers.Wallet.createRandom()
      privateKey = newWallet.privateKey
      localStorage.setItem("orbital-privateKey", privateKey)
      console.log("New wallet created. Address:", newWallet.address)
      setWallet(newWallet)
    } else {
      // If key exists, load the wallet
      try {
        const existingWallet = new ethers.Wallet(privateKey)
        setWallet(existingWallet)
      } catch (error) {
        console.error("Failed to load wallet from private key:", error)
      }
    }
  }, [])

  return wallet
}
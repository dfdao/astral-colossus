import { useState, useEffect } from "preact/hooks";
import { useContract, usePlayer } from ".";

export const useContributions = () => {
  const { colossus } = useContract()
  const { address } = usePlayer()
  const [contributions, setContributions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(true)

  if (error) console.log(error)

  useEffect(() => {
    const getContributions = () => {
      return colossus.contributions(address).then(score => {
        setContributions(Number(score))
        if (loading) setLoading(false)
      }).catch(setError)
    }
    const interval = setInterval(getContributions, 10000)
    getContributions()
    return () => clearInterval(interval)
  }, [])

  return {
    contributions,
    loading,
    error
  }
}
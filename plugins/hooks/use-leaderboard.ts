import { useState, useEffect } from "preact/hooks";
import { useContract } from ".";

type Score = {
  address: string
  score: number
  rank: number
}

export const useLeaderboard = () => {
  const { colossus } = useContract()
  const [leaderboard, setLeaderboard] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (error) console.log(error)

  useEffect(() => {
    const getContributions = () => {
      return colossus.playerCounter().then(async count => {
        const lb = []
        for(let i = 0; i < Number(count); i++) {
          const address = await colossus.players(i);
          const playerScore = await colossus.contributions(address);
          const score = Number(playerScore)
          console.log(`addy ${address} score ${score}`);
          lb.push({ address, score, rank: 0 })
        }
        const leaderboardRanked = lb.sort((a, b) => a.score - b.score ).map((entry, index) => {
          return {...entry, rank: index + 1 }
        })
        setLeaderboard(leaderboardRanked)
        if (loading) setLoading(false)
      }).catch(setError)


    }
    const interval = setInterval(getContributions, 5000)
    getContributions()
    return () => clearInterval(interval)
  }, [])

  return {
    leaderboard,
    loading,
    error
  }
}
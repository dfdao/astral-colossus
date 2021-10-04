import { useState, useEffect } from "preact/hooks";
import { useContract } from ".";

type Score = {
  address: string
  score: number
  rank: number
}

type ScoreOfficial = {
  ethAddress: string
  score: number
  twitter?: string
}

async function downloadLeaderboard() {
	return fetch('https://api.zkga.me/leaderboard')
		.then(response => response.json())
}

export const useLeaderboard = () => {
  const { colossus } = useContract()
  const [leaderboard, setLeaderboard] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (error) console.log(error)

  useEffect(() => {
    const getContributions = async () => {
      const officialLeaderboard = await downloadLeaderboard()
      const getLeaderboardPlayer = (address: string) => officialLeaderboard.entries.find((entry: ScoreOfficial) => {
        entry.ethAddress === address
      })
      console.log('lb', officialLeaderboard.entries)
      return colossus.playerCounter().then(async count => {
        // load all scores in parallel using promises
        const lb = await Promise.all([...Array(Number(count))].map(async (_unused, i) => {
          const address = await colossus.players(i);
          const playerScore = await colossus.contributions(address);
          const score = Number(playerScore);
          console.log(`addy ${address} score ${score}`);
          return { address, score, rank: 0 };
        }));
        const leaderboardRanked = lb.sort((a, b) => b.score - a.score ).map((entry, index) => {
          return {...entry, rank: index + 1 }
        })
        setLeaderboard(leaderboardRanked)
        if (loading) setLoading(false)
      }).catch(setError)


    }
    const interval = setInterval(getContributions, 10000)
    getContributions()
    return () => clearInterval(interval)
  }, [])

  return {
    leaderboard,
    loading,
    error
  }
}

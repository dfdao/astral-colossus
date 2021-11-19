import { useState, useEffect } from "preact/hooks";
import { useContract } from ".";
import { CONTRACT_ADDRESS } from "../helpers/constants";

type Score = {
  address: string
  score: number
  rank: number
  leaderboardRank: number
  leaderboardScore: number
}

type ScoreOfficialWithoutRank = {
  ethAddress: string
  score: number
  twitter?: string
}

type ScoreOfficial = {
  ethAddress: string
  score: number
  rank: number
  twitter?: string
}

async function downloadLeaderboard() {
  const leaderboard = await fetch('https://api.zkga.me/leaderboard')
    .then(response => response.json())
    .then(({ entries }) => {
      return entries.sort((a: ScoreOfficialWithoutRank, b: ScoreOfficialWithoutRank) => b.score - a.score).map((entry: ScoreOfficialWithoutRank, index: number) => {
        return {...entry, rank: index + 1} as ScoreOfficial
      })
    })
    .catch(() => console.log('failed fetching leaderboard api'))
	return leaderboard as ScoreOfficial[]
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
      const getLeaderboardPlayer = (address: string) => officialLeaderboard.find((entry) => {
        return entry.ethAddress === address.toLowerCase()
      })

      return colossus.playerCounter().then(async count => {
        // load all scores in parallel using promises
        const lb = await Promise.all([...Array(Number(count))].map(async (_unused, i) => {
          const address = await colossus.players(i);
          const playerScore = await colossus.contributions(address);
          const score = Number(playerScore);
          return { address, score, rank: 0 };
        }));
        const leaderboardRanked = lb.sort((a, b) => b.score - a.score ).map((entry, index) => {
          const leaderboardPlayer = getLeaderboardPlayer(entry.address) as ScoreOfficial
          return {...entry, rank: index + 1, leaderboardRank: leaderboardPlayer.rank, leaderboardScore: leaderboardPlayer.score }
        })
        const colossusPlayerOfficial = getLeaderboardPlayer(CONTRACT_ADDRESS) as ScoreOfficial
        const colossusPlayer: Score = {
          address: colossusPlayerOfficial.ethAddress,  
          score: colossusPlayerOfficial.score,
          rank: 0,
          leaderboardRank: colossusPlayerOfficial.rank,
          leaderboardScore: colossusPlayerOfficial.score,
        }
        setLeaderboard([colossusPlayer, ...leaderboardRanked])
        if (loading) setLoading(false)
      }).catch(setError)


    }
    const interval = setInterval(getContributions, 30000)
    getContributions()
    return () => clearInterval(interval)
  }, [])

  return {
    leaderboard,
    loading,
    error
  }
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Calendar, ExternalLink, Star } from 'lucide-react'

interface FavoriteJob {
  id: string
  job_search_result_id: string
  created_at: string
  job_search_results: {
    job_title: string
    company_name: string
    location: string
    job_url: string
    posted_date: string | null
    job_board: string
    search_id: string
  }
}

export function FavoriteJobs({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<FavoriteJob[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadFavorites()
  }, [userId])

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('job_favorites')
        .select(`
          id,
          job_search_result_id,
          created_at,
          job_search_results (
            job_title,
            company_name,
            location,
            job_url,
            posted_date,
            job_board,
            search_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFavorites(data || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      await supabase
        .from('job_favorites')
        .delete()
        .eq('id', favoriteId)

      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading favorites...</div>
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No favorite jobs yet.</p>
        <p className="text-sm mt-2">Star jobs from your search results to save them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        You have {favorites.length} favorited job{favorites.length !== 1 ? 's' : ''}
      </p>
      
      {favorites.map((favorite) => (
        <div key={favorite.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{favorite.job_search_results.job_title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {favorite.job_search_results.company_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {favorite.job_search_results.location}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span>From: {favorite.job_search_results.job_board}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Saved {new Date(favorite.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/dashboard/results/${favorite.job_search_results.search_id}`)}
              >
                View Search
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(favorite.job_search_results.job_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFavorite(favorite.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Star className="h-4 w-4 fill-current" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
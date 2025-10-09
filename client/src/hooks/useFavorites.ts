import { useState, useEffect } from 'react';
import { favoriteService } from '../services/favoriteService';
import { Venue } from '../types/venue';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorite venues
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favoriteVenues = await favoriteService.getFavorites();
      const favoriteIds = new Set(favoriteVenues.map((venue: Venue) => venue._id));
      setFavorites(favoriteIds);
      setError(null);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status for a venue
  const toggleFavorite = async (venueId: string) => {
    try {
      const isCurrentlyFavorite = favorites.has(venueId);
      let success = false;
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        success = await favoriteService.removeFavorite(venueId);
        if (success) {
          const newFavorites = new Set(favorites);
          newFavorites.delete(venueId);
          setFavorites(newFavorites);
        }
      } else {
        // Add to favorites
        success = await favoriteService.addFavorite(venueId);
        if (success) {
          const newFavorites = new Set(favorites);
          newFavorites.add(venueId);
          setFavorites(newFavorites);
        }
      }
      
      if (!success) {
        setError('Failed to update favorite');
        return false;
      }
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite');
      return false;
    }
  };

  // Check if a venue is favorited
  const isFavorited = (venueId: string) => {
    return favorites.has(venueId);
  };

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorited,
    fetchFavorites
  };
};

export default useFavorites;
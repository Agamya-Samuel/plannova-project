import apiClient from '../lib/api';
import { Venue } from '../types/venue';

export const favoriteService = {
  // Get user's favorite venues
  getFavorites: async (): Promise<Venue[]> => {
    try {
      const response = await apiClient.get('/venues/favorites');
      return response.data.venues;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  // Add venue to favorites
  addFavorite: async (venueId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post(`/venues/${venueId}/favorite`);
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  },

  // Remove venue from favorites
  removeFavorite: async (venueId: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/venues/${venueId}/favorite`);
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  },

  // Toggle favorite status
  toggleFavorite: async (venueId: string): Promise<boolean> => {
    try {
      await apiClient.post(`/venues/${venueId}/favorite`);
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }
};

export default favoriteService;
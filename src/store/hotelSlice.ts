import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createHotelApi,
  deleteHotelApi,
  extractApiError,
  getHotelByIdApi,
  getHotelsApi,
  updateHotelApi,
} from '../api/hotelApi';
import type { Hotel, HotelQueryFilters, PaginationState } from '../types/hotel';

export interface HotelState {
  list: Hotel[];
  selectedHotel: Hotel | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  pagination: PaginationState;
}

const initialState: HotelState = {
  list: [],
  selectedHotel: null,
  loading: false,
  submitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  },
};

export const fetchHotels = createAsyncThunk(
  'hotels/fetchHotels',
  async (filters: HotelQueryFilters = {}, { rejectWithValue }) => {
    try {
      return await getHotelsApi(filters);
    } catch (error) {
      return rejectWithValue(extractApiError(error, 'Failed to load hotels.'));
    }
  }
);

export const fetchHotelById = createAsyncThunk(
  'hotels/fetchHotelById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await getHotelByIdApi(id);
    } catch (error) {
      return rejectWithValue(extractApiError(error, 'Failed to load hotel details.'));
    }
  }
);

export const createHotel = createAsyncThunk(
  'hotels/createHotel',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await createHotelApi(formData);
    } catch (error) {
      return rejectWithValue(extractApiError(error, 'Failed to create hotel.'));
    }
  }
);

export const updateHotel = createAsyncThunk(
  'hotels/updateHotel',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      return await updateHotelApi(id, formData);
    } catch (error) {
      return rejectWithValue(extractApiError(error, 'Failed to update hotel.'));
    }
  }
);

export const deleteHotel = createAsyncThunk(
  'hotels/deleteHotel',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteHotelApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(extractApiError(error, 'Failed to delete hotel.'));
    }
  }
);

const hotelSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    clearHotelError(state) {
      state.error = null;
    },
    clearSelectedHotel(state) {
      state.selectedHotel = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchHotels
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load hotels.';
      })
      // fetchHotelById
      .addCase(fetchHotelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHotel = action.payload;
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.loading = false;
        state.selectedHotel = null;
        state.error = (action.payload as string) || 'Failed to load hotel details.';
      })
      // createHotel
      .addCase(createHotel.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedHotel = action.payload;
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || 'Failed to create hotel.';
      })
      // updateHotel
      .addCase(updateHotel.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedHotel = action.payload;
        state.list = state.list.map((hotel) =>
          hotel.id === action.payload.id ? action.payload : hotel
        );
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || 'Failed to update hotel.';
      })
      // deleteHotel
      .addCase(deleteHotel.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.submitting = false;
        state.list = state.list.filter((hotel) => hotel.id !== action.payload);
        if (state.selectedHotel?.id === action.payload) {
          state.selectedHotel = null;
        }
      })
      .addCase(deleteHotel.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || 'Failed to delete hotel.';
      });
  },
});

export const { clearHotelError, clearSelectedHotel } = hotelSlice.actions;
export default hotelSlice.reducer;

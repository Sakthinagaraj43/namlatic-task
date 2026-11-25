import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import HotelListPage from './pages/HotelListPage';
import HotelFormPage from './pages/HotelFormPage';
import HotelDetailPage from './pages/HotelDetailPage';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HotelListPage />} />
            <Route path="/hotels/add" element={<HotelFormPage />} />
            <Route path="/hotels/:id/edit" element={<HotelFormPage />} />
            <Route path="/hotels/:id" element={<HotelDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

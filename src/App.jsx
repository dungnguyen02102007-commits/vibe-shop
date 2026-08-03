import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Component tạm thời cho các trang khác
const SellerPage = () => <div className="p-10 text-center h-screen bg-gray-50"> <h1 className="text-2xl font-bold">Khu vực Người Bán</h1><p>Đang phát triển...</p> </div>;
const BuyerPage = () => <div className="p-10 text-center h-screen bg-gray-50"> <h1 className="text-2xl font-bold">Khu vực Người Mua</h1><p>Đang phát triển...</p> </div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/buyer" element={<BuyerPage />} />
      </Routes>
    </Router>
  );
}

export default App;

import { Layout, Menu } from "antd";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Signals from "./pages/Signals";
import SeatTracker from "./pages/SeatTracker";
import SeatBattle from "./pages/SeatBattle";
import SeatBattleProductDetail from "./pages/SeatBattleProductDetail";
import Trends from "./pages/Trends";
import TrendProductDetail from "./pages/TrendProductDetail";
import ProductDashboard from "./pages/ProductDashboard";
import FundFlows from "./pages/FundFlows";
import FundFlowProductDetail from "./pages/FundFlowProductDetail";
import Guide from "./pages/Guide";
import UsStocks from "./pages/UsStocks";
import "./App.css";

const { Header, Content } = Layout;

function AppShell() {
  const location = useLocation();

  const selectedKey = location.pathname.startsWith("/signals")
    ? "/signals"
    : location.pathname.startsWith("/seat-tracker")
    ? "/seat-tracker"
    : location.pathname.startsWith("/seat-battle")
    ? "/seat-battle"
    : location.pathname.startsWith("/trends")
    ? "/trends"
    : location.pathname.startsWith("/fund-flows")
    ? "/fund-flows"
    : location.pathname.startsWith("/us-stocks")
    ? "/us-stocks"
    : "/";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="app-header">
        <div className="app-logo">交易可查分析系统</div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          className="app-menu"
          items={[
            {
              key: "/",
              label: <Link to="/">仪表盘</Link>,
            },
            {
              key: "/seat-tracker",
              label: <Link to="/seat-tracker">席位追踪</Link>,
            },
            {
              key: "/seat-battle",
              label: <Link to="/seat-battle">席位对对碰</Link>,
            },
            {
              key: "/trends",
              label: <Link to="/trends">历史趋势</Link>,
            },
            {
              key: "/fund-flows",
              label: <Link to="/fund-flows">资金流向</Link>,
            },
            {
              key: "/signals",
              label: <Link to="/signals">旧版信号</Link>,
            },
            {
              key: "/us-stocks",
              label: <Link to="/us-stocks">美股强度</Link>,
            },
          ]}
        />
      </Header>

      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/seat-tracker" element={<SeatTracker />} />
          <Route path="/seat-battle" element={<SeatBattle />} />
          <Route path="/seat-battle/products/:product" element={<SeatBattleProductDetail />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/trends/:product" element={<TrendProductDetail />} />
          <Route path="/fund-flows" element={<FundFlows />} />
          <Route path="/fund-flows/products/:product" element={<FundFlowProductDetail />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/products/:product" element={<ProductDashboard />} />
          <Route path="/us-stocks/*" element={<UsStocks />} />
        </Routes>
      </Content>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;

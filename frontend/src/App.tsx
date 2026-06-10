import { Layout, Menu } from "antd";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Signals from "./pages/Signals";
import SeatTracker from "./pages/SeatTracker";
import ProductDashboard from "./pages/ProductDashboard";
import "./App.css";

const { Header, Content } = Layout;

function AppShell() {
  const location = useLocation();

  const selectedKey = location.pathname.startsWith("/signals")
    ? "/signals"
    : location.pathname.startsWith("/seat-tracker")
    ? "/seat-tracker"
    : "/";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="app-header">
        <div className="app-logo">期货席位追踪系统</div>

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
              key: "/signals",
              label: <Link to="/signals">旧版信号</Link>,
            },
          ]}
        />
      </Header>

      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/seat-tracker" element={<SeatTracker />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/products/:product" element={<ProductDashboard />} />
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

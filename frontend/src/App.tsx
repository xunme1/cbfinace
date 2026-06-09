import { Layout, Menu } from "antd";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Signals from "./pages/Signals";
import ProductDetail from "./pages/ProductDetail";
import "./App.css";

const { Header, Content } = Layout;

function AppShell() {
  const location = useLocation();

  const selectedKey = location.pathname.startsWith("/signals")
    ? "/signals"
    : "/";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="app-header">
        <div className="app-logo">期货持仓矩阵分析系统</div>

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
              key: "/signals",
              label: <Link to="/signals">信号列表</Link>,
            },
          ]}
        />
      </Header>

      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/products/:product" element={<ProductDetail />} />
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

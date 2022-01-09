import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import Stake from "./stake/Stake";
import Admin from "./admin/Admin";
import Home from "./home/Home";
import { Navbar, NavDropdown, Nav } from "react-bootstrap";
import WalletButton from "../components/WalletButton";
import { useContractProvider } from "../providers/ContractProvider";
import { useEffect } from "react";

export default function RoutesController() {
  return (
    <Router>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Text style={{ fontSize: "1.5rem" }}>
            <Link to="/">Home</Link>
          </Navbar.Text>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              <Link to="/stake">Staking</Link>
            </Navbar.Text>
            <div style={{ paddingLeft: "2rem" }} />
            <Navbar.Text>
              <Link to="/admin">Admin</Link>
            </Navbar.Text>
            <WalletButton />
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container style={{ marginTop: "5rem" }}>
        <Routes>
          <Route path="/stake" element={<Stake />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Container>
    </Router>
  );
}

import "./App.css";
import Routes from "./pages/Routes";
import ContractProvider from "./providers/ContractProvider";
import UserProvider from "./providers/UserProvider";

// TODO: Add providers
function App() {
  return (
    <ContractProvider>
      <UserProvider>
        <Routes />
      </UserProvider>
    </ContractProvider>
  );
}

export default App;

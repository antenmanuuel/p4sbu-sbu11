import AppContent from "./AppContent";
import { BrowserRouter as Router } from "react-router-dom";
import ManageTickets from './pages/admin/ManageTickets';

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
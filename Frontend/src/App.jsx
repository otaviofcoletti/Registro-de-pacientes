import { Header } from "./layout/Header";
import './global.css';
import styles from './App.module.css'; // Crie um novo arquivo App.module.css
import CadastroPaciente from "./pages/CadastroPaciente";
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Home from "./pages/Home";
import Footer from "./layout/Footer";
import PatientList from "./pages/PatientList";
import PatientDetails from "./pages/PatientDetails";
import Paint from "./pages/Paint";
import EditPatient from "./pages/EditPatient";
function App() {

  return (
    <div>      
      <Router>
        <Header />
          <Routes>
            <Route exact path="/" element={<Home />}/>
            <Route path="/cadastro" element={<CadastroPaciente />}/>
            <Route path="/pacientes" element={<PatientList />} />
            <Route path="/ficha/:cpf" element={<PatientDetails />} />
            <Route path="/editar-paciente/:cpf" element={<EditPatient />} />
            <Route path="/paint" element={<Paint />} />
          </Routes>
        <Footer/>
      </Router>
    </div>

  )
}

export default App

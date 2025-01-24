import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

export function Header() {
  const navigate = useNavigate();

  const goBack = () => {
    if (location.pathname !== '/') {
        navigate(-1); // Navega para a página anterior somente se não estiver na home
      }
  };

  const goHome = () => {
    navigate('/'); // Navega para a página inicial
  };

  return (
    <header className={styles.header}>
      <button className={styles.navButton} onClick={goBack}>
        ← Voltar
      </button>
      <div className={styles.logo}>
        <strong>Pró Odonto •‿• </strong>
      </div>
      <button className={styles.navButton} onClick={goHome}>
        Home →
      </button>
    </header>
  );
}

export default Header;

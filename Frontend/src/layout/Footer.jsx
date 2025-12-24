import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p>&copy; 2026 Pró Odonto. Todos os direitos reservados.</p>
        <ul className={styles.links}>
          <li><a href="/sobre">Sobre</a></li>
          <li><a href="/politica">Política de Privacidade</a></li>
          <li><a href="/contato">Contato</a></li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;

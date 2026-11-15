import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Pantry</Link>
        {' | '}
        <Link to="/shopping-list">Shopping list</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<p>Pantry view not implemented.</p>} />
          <Route path="/shopping-list" element={<p>Shopping list view not implemented.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
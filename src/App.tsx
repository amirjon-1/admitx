import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, Colleges, Essays, Markets, Voice, Activities } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/essays" element={<Essays />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/markets" element={<Markets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

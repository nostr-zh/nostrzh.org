import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Header,
  Hero,
  About,
  Relays,
  Resources,
  Footer,
  BlogList,
  BlogPost,
} from "./components";

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Relays />
      <Resources />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

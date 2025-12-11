import { Header, Hero, About, Relays, Resources, Footer } from "./components";

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />
      <main>
        <Hero />
        <About />
        <Relays />
        <Resources />
      </main>
      <Footer />
    </div>
  );
}

export default App;

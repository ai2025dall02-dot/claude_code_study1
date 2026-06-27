import Nav from "@/components/Nav";
import LeaderIntro from "@/components/LeaderIntro";
import Hero from "@/components/Hero";
import Programme from "@/components/Programme";
import Manifesto from "@/components/Manifesto";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <LeaderIntro />
      <Nav />
      <main id="main">
        <Hero />
        <Programme />
        <Manifesto />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

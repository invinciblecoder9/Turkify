import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { Upload } from "@/components/Upload";
import dynamic from "next/dynamic";
const DynamicAppbar = dynamic(() => import('@/components/Appbar').then(mod => mod.Appbar), { ssr: false });
export default function Home() {
  return (
    <main>
      <DynamicAppbar />
      <Hero />
      <Upload />
    </main>
  );
}

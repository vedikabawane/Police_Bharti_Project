import { Outlet } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";
import Footer from "../components/common/Footer";

function PublicLayout() {
  return (
    <div className="relative isolate min-h-screen bg-pb-light">
      <div className="relative z-10 flex min-h-screen w-full min-w-0 flex-col">
        <Navbar />
        <main className="pb-public-layout min-w-0 flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default PublicLayout;

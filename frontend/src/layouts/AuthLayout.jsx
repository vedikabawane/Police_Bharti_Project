import { Outlet } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";
import Footer from "../components/common/Footer";

function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-pb-light">

      <Navbar />

      <main className="pb-workspace-content min-w-0 flex-1">
        <Outlet />
      </main>

      <Footer />

    </div>
  );
}

export default AuthLayout;

import { useState } from "react";
import { Outlet } from "react-router-dom";

import StudentNavbar from "../components/student/StudentNavbar";
import StudentSidebar from "../components/student/StudentSidebar";

function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-pb-light">

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <StudentSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Right Side */}
        <div className="flex min-w-0 flex-1 flex-col">

          <StudentNavbar
            isSidebarOpen={isSidebarOpen}
            onMenuClick={() => setIsSidebarOpen(true)}
          />

          <main className="pb-workspace-content min-w-0 flex-1">
            <Outlet />
          </main>

        </div>

      </div>

    </div>
  );
}

export default StudentLayout;

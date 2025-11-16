import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Marketplace } from "./components/Marketplace";
import { CreateListing } from "./components/CreateListing";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ListingDetail } from "./components/ListingDetail";
import { Messages } from "./components/Messages";
import { Id } from "../convex/_generated/dataModel";

type Page = "home" | "create" | "dashboard" | "admin" | "messages" | { type: "listing"; id: string };

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const adminStatus = useQuery(api.admin.getMyAdminStatus);

  const isAdmin = adminStatus?.isAdmin || false;

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <button
                onClick={() => handleNavigation("home")}
                className="text-xl sm:text-2xl font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                Tawa
              </button>

              <Authenticated>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-6">
                  <button
                    onClick={() => setCurrentPage("home")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === "home"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Browse
                  </button>
                  <button
                    onClick={() => setCurrentPage("create")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === "create"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === "dashboard"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    My Listings
                  </button>
                  <button
                    onClick={() => setCurrentPage("messages")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === "messages"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Messages
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentPage("admin")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === "admin"
                          ? "bg-rose-50 text-rose-600"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Admin {adminStatus?.role === "super_admin" && "⭐"}
                    </button>
                  )}
                </nav>
              </Authenticated>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Authenticated>
                {/* Desktop User Info */}
                <div className="hidden sm:flex items-center space-x-3">
                  <span className="text-sm text-gray-600 truncate max-w-[150px] lg:max-w-none">
                    {loggedInUser?.name || loggedInUser?.email}
                    {isAdmin && (
                      <span className="ml-2 px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-full">
                        {adminStatus?.role === "super_admin" ? "Super Admin" : "Moderator"}
                      </span>
                    )}
                  </span>
                  <SignOutButton />
                </div>

                {/* Mobile Hamburger Menu */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {mobileMenuOpen ? (
                      <path d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </Authenticated>
              <Unauthenticated>
                <div className="text-xs sm:text-sm text-gray-600">
                  Sign in to start listing
                </div>
              </Unauthenticated>
            </div>
          </div>

          {/* Mobile Menu */}
          <Authenticated>
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t">
                <nav className="flex flex-col space-y-2">
                  {/* User Info on Mobile */}
                  <div className="px-3 py-2 text-sm text-gray-600 border-b pb-3 mb-2">
                    <div className="font-medium truncate">{loggedInUser?.name || loggedInUser?.email}</div>
                    {isAdmin && (
                      <span className="inline-block mt-1 px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-full">
                        {adminStatus?.role === "super_admin" ? "Super Admin" : "Moderator"}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleNavigation("home")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      currentPage === "home"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Browse
                  </button>
                  <button
                    onClick={() => handleNavigation("create")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      currentPage === "create"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => handleNavigation("dashboard")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      currentPage === "dashboard"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    My Listings
                  </button>
                  <button
                    onClick={() => handleNavigation("messages")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      currentPage === "messages"
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Messages
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleNavigation("admin")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        currentPage === "admin"
                          ? "bg-rose-50 text-rose-600"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Admin {adminStatus?.role === "super_admin" && "⭐"}
                    </button>
                  )}

                  {/* Sign Out Button on Mobile */}
                  <div className="pt-3 border-t">
                    <SignOutButton />
                  </div>
                </nav>
              </div>
            )}
          </Authenticated>
        </div>
      </header>

      <main className="flex-1">
        <Authenticated>
          {currentPage === "home" && (
            <Marketplace onViewListing={(id) => setCurrentPage({ type: "listing", id })} />
          )}
          {currentPage === "create" && <CreateListing onSuccess={() => setCurrentPage("dashboard")} />}
          {currentPage === "dashboard" && (
            <UserDashboard onViewListing={(id) => setCurrentPage({ type: "listing", id })} />
          )}
          {currentPage === "messages" && <Messages />}
          {currentPage === "admin" && isAdmin && <AdminDashboard />}
          {typeof currentPage === "object" && currentPage.type === "listing" && (
            <ListingDetail 
              listingId={currentPage.id as Id<"listings">} 
              onBack={() => setCurrentPage("home")}
            />
          )}
        </Authenticated>

        <Unauthenticated>
          <div className="max-w-md mx-auto mt-16 px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Rent & List Anything
              </h1>
              <p className="text-xl text-gray-600">
                Fast, Simple, Secure marketplace for Nigeria
              </p>
            </div>
            <SignInForm />
          </div>
        </Unauthenticated>
      </main>

      <Toaster />
    </div>
  );
}

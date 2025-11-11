import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "management">("pending");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"super_admin" | "moderator">("moderator");

  const stats = useQuery(api.admin.getAdminStats);
  const { results: pendingListings, status, loadMore } = usePaginatedQuery(
    api.admin.getPendingListings,
    {},
    { initialNumItems: 12 }
  );
  const adminStatus = useQuery(api.admin.getMyAdminStatus);
  const allAdmins = useQuery(api.admin.getAllAdmins);
  
  const approveListing = useMutation(api.admin.approveListing);
  const rejectListing = useMutation(api.admin.rejectListing);
  const initializeSuperAdmin = useMutation(api.admin.initializeSuperAdmin);
  const grantAdminRole = useMutation(api.admin.grantAdminRole);
  const revokeAdminRole = useMutation(api.admin.revokeAdminRole);
  const toggleFeatured = useMutation(api.listings.toggleFeaturedListing);

  const isSuperAdmin = adminStatus?.role === "super_admin";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const handleApprove = async (listingId: string) => {
    try {
      await approveListing({ id: listingId as Id<"listings"> });
      toast.success("Listing approved");
    } catch (error) {
      toast.error("Failed to approve listing");
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      await rejectListing({ id: listingId as Id<"listings"> });
      toast.success("Listing rejected");
    } catch (error) {
      toast.error("Failed to reject listing");
    }
  };

  const handleToggleFeatured = async (listingId: string, featured: boolean) => {
    try {
      await toggleFeatured({ id: listingId as Id<"listings">, featured });
      toast.success(featured ? "Listing featured" : "Listing unfeatured");
    } catch (error) {
      toast.error("Failed to update listing");
    }
  };

  const handleInitializeSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    try {
      await initializeSuperAdmin({ email: newAdminEmail.trim() });
      toast.success("Super admin initialized successfully");
      setNewAdminEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize super admin");
    }
  };

  const handleGrantAdminRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    try {
      await grantAdminRole({ userEmail: newAdminEmail.trim(), role: newAdminRole });
      toast.success(`${newAdminRole} role granted successfully`);
      setNewAdminEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to grant admin role");
    }
  };

  const handleRevokeAdmin = async (email: string) => {
    try {
      await revokeAdminRole({ userEmail: email });
      toast.success("Admin role revoked");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke admin role");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
          {adminStatus?.role === "super_admin" && (
            <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              Super Admin
            </span>
          )}
        </h1>
        <p className="text-gray-600">Manage listings and platform activity</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
            <div className="text-sm text-gray-600">Total Listings</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingListings}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-2xl font-bold text-green-600">{stats.approvedListings}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.totalAdmins}</div>
            <div className="text-sm text-gray-600">Total Admins</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Listings ({stats?.pendingListings || 0})
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("management")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "management"
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Admin Management
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Pending Listings Tab */}
      {activeTab === "pending" && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Listings</h2>
          {pendingListings ? (
            pendingListings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="bg-white rounded-2xl shadow-sm border"
                  >
                    <div className="aspect-square bg-gray-100 rounded-t-2xl overflow-hidden">
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <img
                          src={listing.imageUrls[0] || ""}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-4xl">📷</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="text-sm text-gray-500 mb-1">{listing.category}</div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-rose-600">
                          {formatPrice(listing.price)}
                        </span>
                        <span className="text-sm text-gray-500">{listing.location}</span>
                      </div>
                      
                      <div className="text-xs text-gray-400 mb-4">
                        Seller: {listing.seller?.name || listing.seller?.email}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(listing._id)}
                            className="flex-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(listing._id)}
                            className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                        <button
                          onClick={() => handleToggleFeatured(listing._id, true)}
                          className="w-full px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          ⭐ Approve & Feature
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                {status === "CanLoadMore" && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => loadMore(12)}
                      className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      Load More Listings
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No pending listings to review</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-2xl"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Management Tab (Super Admin Only) */}
      {activeTab === "management" && isSuperAdmin && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Management</h2>
            
            {/* Initialize Super Admin (if none exists) */}
            {allAdmins && allAdmins.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">Initialize First Super Admin</h3>
                <form onSubmit={handleInitializeSuperAdmin} className="flex gap-4">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Initialize Super Admin
                  </button>
                </form>
              </div>
            )}

            {/* Grant Admin Role */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Admin Role</h3>
              <form onSubmit={handleGrantAdminRole} className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter user email"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as "super_admin" | "moderator")}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="moderator">Moderator</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    Grant Role
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Moderator:</strong> Can approve/reject listings<br/>
                  <strong>Super Admin:</strong> Full access including admin management
                </div>
              </form>
            </div>

            {/* Current Admins */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Admins</h3>
              {allAdmins ? (
                allAdmins.length > 0 ? (
                  <div className="space-y-4">
                    {allAdmins.map((admin) => (
                      <div
                        key={admin._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {admin.user?.name || "Anonymous"}
                          </div>
                          <div className="text-sm text-gray-600">{admin.user?.email}</div>
                          <div className="text-xs text-gray-500">
                            Role: <span className="font-medium capitalize">{admin.role}</span>
                            {admin.grantedBy && (
                              <> • Granted by: {admin.grantedBy.name || admin.grantedBy.email}</>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.role === "super_admin" 
                              ? "bg-yellow-100 text-yellow-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {admin.role === "super_admin" ? "Super Admin" : "Moderator"}
                          </span>
                          {admin.user?.email && (
                            <button
                              onClick={() => handleRevokeAdmin(admin.user!.email!)}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    No admins found
                  </div>
                )
              ) : (
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

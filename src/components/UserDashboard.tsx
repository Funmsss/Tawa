import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface UserDashboardProps {
  onViewListing: (id: string) => void;
}

export function UserDashboard({ onViewListing }: UserDashboardProps) {
  const listings = useQuery(api.listings.getUserListings);
  const updateStatus = useMutation(api.listings.updateListingStatus);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const handleMarkAsSold = async (listingId: string) => {
    try {
      await updateStatus({ id: listingId as Id<"listings">, status: "sold" });
      toast.success("Listing marked as sold");
    } catch (error) {
      toast.error("Failed to update listing");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "sold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
        <p className="text-gray-600">Manage your active and past listings</p>
      </div>

      {listings ? (
        listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing._id}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-200"
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{listing.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-rose-600">
                      {formatPrice(listing.price)}
                    </span>
                    <span className="text-sm text-gray-500">{listing.location}</span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-3">
                    {listing.views || 0} views • {new Date(listing._creationTime).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewListing(listing._id)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    {listing.status === "approved" && (
                      <button
                        onClick={() => handleMarkAsSold(listing._id)}
                        className="flex-1 px-3 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                      >
                        Mark Sold
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-6">Start listing by creating your first listing</p>
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
  );
}

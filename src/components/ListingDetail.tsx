import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ListingDetailProps {
  listingId: Id<"listings">;
  onBack: () => void;
}

export function ListingDetail({ listingId, onBack }: ListingDetailProps) {
  const [message, setMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const viewIncrementedRef = useRef(false);
  
  const listing = useQuery(api.listings.getListingById, { id: listingId });
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const sendMessage = useMutation(api.messages.sendMessage);
  const incrementViews = useMutation(api.listings.incrementViews);

  // Increment views only once when component mounts and listing is loaded
  useEffect(() => {
    if (listing && !viewIncrementedRef.current) {
      viewIncrementedRef.current = true;
      incrementViews({ id: listingId });
    }
  }, [listing, incrementViews, listingId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!listing?.seller?._id) {
      toast.error("Seller information unavailable. Please refresh the page.");
      return;
    }

    try {
      await sendMessage({
        listingId: listingId,
        receiverId: listing.seller._id,
        content: message.trim(),
      });

      toast.success("Message sent successfully");
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = loggedInUser?._id === listing.seller?._id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <span className="mr-2">←</span>
        Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            {listing.imageUrls && listing.imageUrls.length > 0 ? (
              <img
                src={listing.imageUrls[currentImageIndex] || ""}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl">📷</span>
              </div>
            )}
          </div>
          
          {listing.imageUrls && listing.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    currentImageIndex === index ? "border-rose-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={url || ""}
                    alt={`${listing.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">{listing.category}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
            <div className="text-3xl font-bold text-rose-600 mb-4">
              {formatPrice(listing.price)}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <span className="mr-1">📍</span>
              {listing.location}
            </span>
            <span className="flex items-center">
              <span className="mr-1">👁️</span>
              {listing.views || 0} views
            </span>
            <span className="flex items-center">
              <span className="mr-1">📅</span>
              {new Date(listing._creationTime).toLocaleDateString()}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Condition</div>
            <div className="capitalize">{listing.condition}</div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-semibold">
                {listing.seller?.name?.[0] || listing.seller?.email?.[0] || "?"}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {listing.seller?.name || "Anonymous"}
                </div>
                <div className="text-sm text-gray-600">
                  {listing.seller?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          {!isOwner && listing.status === "approved" && (
            <div className="bg-white border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Seller</h3>
              {!listing?.seller?._id ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="mb-2">Seller information is currently unavailable.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Refresh page
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi, I'm interested in this item..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          )}

          {isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-sm text-blue-800">
                This is your listing. Status: <span className="font-semibold capitalize">{listing.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

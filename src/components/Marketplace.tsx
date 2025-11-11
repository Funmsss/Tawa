import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface MarketplaceProps {
  onViewListing: (id: string) => void;
}

export function Marketplace({ onViewListing }: MarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | undefined>();
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [search, setSearch] = useState("");

  const categories = useQuery(api.categories.getCategories);
  const listings = useQuery(api.listings.getListings, {
    categoryId: selectedCategory,
    location: location || undefined,
    minPrice,
    maxPrice,
    search: search || undefined,
  });
  const featuredListings = useQuery(api.listings.getFeaturedListings);
  const seedCategories = useMutation(api.categories.seedCategories);

  useEffect(() => {
    if (categories && categories.length === 0) {
      seedCategories();
    }
  }, [categories, seedCategories]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Find anything you need
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover great deals from people around you
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-2xl shadow-lg border">
            <input
              type="text"
              placeholder="What are you looking for?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <button className="px-8 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(
                  selectedCategory === category._id ? undefined : category._id
                )}
                className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
                  selectedCategory === category._id
                    ? "border-rose-500 bg-rose-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="text-sm font-medium text-gray-900">{category.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Price Range:</span>
          <input
            type="number"
            placeholder="Min price"
            value={minPrice || ""}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 w-32"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max price"
            value={maxPrice || ""}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 w-32"
          />
          {(minPrice || maxPrice) && (
            <button
              onClick={() => {
                setMinPrice(undefined);
                setMaxPrice(undefined);
              }}
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Featured Listings */}
      {featuredListings && featuredListings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                onClick={() => onViewListing(listing._id)}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Listings */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {selectedCategory ? "Filtered Results" : "Latest Listings"}
        </h2>
        {listings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                onClick={() => onViewListing(listing._id)}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
    </div>
  );
}

interface ListingCardProps {
  listing: any;
  onClick: () => void;
  formatPrice: (price: number) => string;
}

function ListingCard({ listing, onClick, formatPrice }: ListingCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      <div className="aspect-square bg-gray-100 rounded-t-2xl overflow-hidden">
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">📷</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-500 mb-1">{listing.category}</div>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-rose-600">
            {formatPrice(listing.price)}
          </span>
          <span className="text-sm text-gray-500">{listing.location}</span>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {listing.views || 0} views • {new Date(listing._creationTime).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export type Listing = {
  id: string;
  title: string;
  photos: string[];
  price: number;
  deposit: number;
  distanceKm: number;
  campus: string;
  roomType: "Studio" | "Private Room" | "Shared Room" | "1BR" | "2BR";
  occupants: number;
  amenities: string[];
  landlordId: string;
  rating: number;
  reviewCount: number;
  status: "Live" | "Pending Review" | "Rejected";
  availableFrom: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
};

export type Landlord = {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  joined: string;
  bio: string;
};

export type Review = {
  id: string;
  listingId: string;
  landlordId: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
};

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

export type Conversation = {
  id: string;
  landlordId: string;
  listingId: string;
  lastPreview: string;
  unread: number;
  messages: Message[];
};

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=70`;

export const landlords: Landlord[] = [
  {
    id: "l1",
    name: "Amara Okafor",
    avatar: "https://i.pravatar.cc/120?img=47",
    verified: true,
    rating: 4.8,
    reviewCount: 42,
    joined: "2022",
    bio: "Managing student housing near Riverside Campus for 6 years.",
  },
  {
    id: "l2",
    name: "David Mensah",
    avatar: "https://i.pravatar.cc/120?img=12",
    verified: true,
    rating: 4.6,
    reviewCount: 28,
    joined: "2023",
    bio: "Family-owned apartments a short walk from the main gate.",
  },
  {
    id: "l3",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/120?img=32",
    verified: false,
    rating: 4.2,
    reviewCount: 11,
    joined: "2024",
    bio: "New landlord offering fully furnished studios.",
  },
  {
    id: "l4",
    name: "Jordan Bell",
    avatar: "https://i.pravatar.cc/120?img=15",
    verified: true,
    rating: 4.9,
    reviewCount: 61,
    joined: "2021",
    bio: "Boutique student residences with 24/7 security.",
  },
];

export const listings: Listing[] = [
  {
    id: "1",
    title: "Sunlit Studio near Riverside Campus",
    photos: [
      img("1522708323590-d24dbb6b0267"),
      img("1502672260266-1c1ef2d93688"),
      img("1505692794403-34cbb5aabe8b"),
    ],
    price: 520,
    deposit: 520,
    distanceKm: 0.4,
    campus: "Riverside University",
    roomType: "Studio",
    occupants: 1,
    amenities: ["WiFi", "Furnished", "Laundry", "Utilities Included"],
    landlordId: "l1",
    rating: 4.8,
    reviewCount: 24,
    status: "Live",
    availableFrom: "2026-08-15",
    address: "12 Oak Lane, Riverside",
    lat: 40.72,
    lng: -74.0,
    description:
      "A bright, quiet studio with a full kitchenette and a study nook overlooking the park. Ideal for a focused student.",
  },
  {
    id: "2",
    title: "Cozy Private Room in Shared Flat",
    photos: [img("1493809842364-78817add7ffb"), img("1560448204-e02f11c3d0e2")],
    price: 340,
    deposit: 300,
    distanceKm: 1.1,
    campus: "Riverside University",
    roomType: "Private Room",
    occupants: 3,
    amenities: ["WiFi", "Shared Kitchen", "Laundry"],
    landlordId: "l2",
    rating: 4.5,
    reviewCount: 18,
    status: "Live",
    availableFrom: "2026-09-01",
    address: "45 Elm Street",
    lat: 40.723,
    lng: -74.005,
    description: "Furnished private bedroom in a friendly 3-person share. Common areas cleaned weekly.",
  },
  {
    id: "3",
    title: "Modern 1BR with Balcony",
    photos: [img("1522708323590-d24dbb6b0267"), img("1502672023488-70e25813eb80")],
    price: 780,
    deposit: 780,
    distanceKm: 0.9,
    campus: "Riverside University",
    roomType: "1BR",
    occupants: 2,
    amenities: ["WiFi", "AC", "Balcony", "Gym", "Furnished"],
    landlordId: "l4",
    rating: 4.9,
    reviewCount: 33,
    status: "Live",
    availableFrom: "2026-08-01",
    address: "88 Harbor Ave",
    lat: 40.718,
    lng: -74.01,
    description: "Newly renovated one-bedroom with west-facing balcony and building gym.",
  },
  {
    id: "4",
    title: "Budget Shared Room, 10 min walk",
    photos: [img("1560185127-6ed189bf02f4"), img("1522708323590-d24dbb6b0267")],
    price: 220,
    deposit: 200,
    distanceKm: 0.8,
    campus: "Riverside University",
    roomType: "Shared Room",
    occupants: 4,
    amenities: ["WiFi", "Shared Kitchen"],
    landlordId: "l3",
    rating: 4.1,
    reviewCount: 9,
    status: "Live",
    availableFrom: "2026-08-20",
    address: "3 Pine Court",
    lat: 40.725,
    lng: -73.998,
    description: "Affordable shared room, best for students who plan to spend most time on campus.",
  },
  {
    id: "5",
    title: "Spacious 2BR for Roommates",
    photos: [img("1502672260266-1c1ef2d93688"), img("1493809842364-78817add7ffb")],
    price: 1150,
    deposit: 1150,
    distanceKm: 1.6,
    campus: "Riverside University",
    roomType: "2BR",
    occupants: 2,
    amenities: ["WiFi", "Parking", "Furnished", "Dishwasher"],
    landlordId: "l1",
    rating: 4.7,
    reviewCount: 15,
    status: "Live",
    availableFrom: "2026-09-15",
    address: "210 Cedar Blvd",
    lat: 40.73,
    lng: -74.012,
    description: "Two large bedrooms and an open living area, great for a pair of roommates.",
  },
  {
    id: "6",
    title: "Furnished Studio in Old Town",
    photos: [img("1505692794403-34cbb5aabe8b")],
    price: 610,
    deposit: 500,
    distanceKm: 2.0,
    campus: "Riverside University",
    roomType: "Studio",
    occupants: 1,
    amenities: ["WiFi", "Furnished", "AC"],
    landlordId: "l2",
    rating: 4.4,
    reviewCount: 12,
    status: "Live",
    availableFrom: "2026-08-10",
    address: "5 Market Sq",
    lat: 40.715,
    lng: -74.02,
    description: "Charming studio in a historic building, close to cafes and grocery.",
  },
  {
    id: "7",
    title: "Quiet Room in Landlord's Home",
    photos: [img("1560448204-e02f11c3d0e2")],
    price: 380,
    deposit: 380,
    distanceKm: 1.4,
    campus: "Riverside University",
    roomType: "Private Room",
    occupants: 1,
    amenities: ["WiFi", "Meals Optional", "Garden"],
    landlordId: "l4",
    rating: 4.9,
    reviewCount: 22,
    status: "Live",
    availableFrom: "2026-09-01",
    address: "77 Willow Way",
    lat: 40.728,
    lng: -74.003,
    description: "Homestay-style room with a welcoming host family.",
  },
  {
    id: "8",
    title: "Luxury Studio – Pending Review",
    photos: [img("1502672023488-70e25813eb80")],
    price: 950,
    deposit: 950,
    distanceKm: 0.6,
    campus: "Riverside University",
    roomType: "Studio",
    occupants: 1,
    amenities: ["WiFi", "AC", "Gym", "Concierge"],
    landlordId: "l3",
    rating: 0,
    reviewCount: 0,
    status: "Pending Review",
    availableFrom: "2026-10-01",
    address: "1 Skyline Tower",
    lat: 40.721,
    lng: -74.007,
    description: "High-end studio in a new tower, currently awaiting admin verification.",
  },
  {
    id: "9",
    title: "Basement Room – Rejected",
    photos: [img("1560185127-6ed189bf02f4")],
    price: 180,
    deposit: 180,
    distanceKm: 3.5,
    campus: "Riverside University",
    roomType: "Private Room",
    occupants: 1,
    amenities: ["WiFi"],
    landlordId: "l3",
    rating: 0,
    reviewCount: 0,
    status: "Rejected",
    availableFrom: "2026-08-01",
    address: "9 Underhill",
    lat: 40.71,
    lng: -74.03,
    description: "Rejected during review: photos did not meet minimum standards.",
  },
];

export const reviews: Review[] = [
  { id: "r1", listingId: "1", landlordId: "l1", author: "Maya P.", avatar: "https://i.pravatar.cc/60?img=5", rating: 5, date: "2025-06-12", text: "Landlord was responsive and the studio was exactly as pictured. Loved it." },
  { id: "r2", listingId: "1", landlordId: "l1", author: "Chen W.", avatar: "https://i.pravatar.cc/60?img=8", rating: 4, date: "2025-03-02", text: "Great location, small kitchen but sufficient. Would recommend." },
  { id: "r3", listingId: "3", landlordId: "l4", author: "Sofia R.", avatar: "https://i.pravatar.cc/60?img=9", rating: 5, date: "2025-05-20", text: "Beautiful apartment, security team is fantastic." },
  { id: "r4", listingId: "2", landlordId: "l2", author: "Tomás L.", avatar: "https://i.pravatar.cc/60?img=14", rating: 4, date: "2025-04-08", text: "Friendly flatmates and a fair rent." },
  { id: "r5", listingId: "5", landlordId: "l1", author: "Aisha K.", avatar: "https://i.pravatar.cc/60?img=25", rating: 5, date: "2025-07-01", text: "Perfect for roommates. Everything worked from day one." },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    landlordId: "l1",
    listingId: "1",
    lastPreview: "Sure, viewings are available this Saturday.",
    unread: 1,
    messages: [
      { id: "m1", from: "me", text: "Hi! Is the studio still available for August?", time: "10:14" },
      { id: "m2", from: "them", text: "Hello! Yes, still available. Would you like to book a viewing?", time: "10:22" },
      { id: "m3", from: "me", text: "Yes please, this weekend if possible.", time: "10:24" },
      { id: "m4", from: "them", text: "Sure, viewings are available this Saturday.", time: "10:31" },
    ],
  },
  {
    id: "c2",
    landlordId: "l4",
    listingId: "3",
    lastPreview: "Deposit is one month, refundable.",
    unread: 0,
    messages: [
      { id: "m5", from: "me", text: "Hi, what's the deposit policy?", time: "Yesterday" },
      { id: "m6", from: "them", text: "Deposit is one month, refundable.", time: "Yesterday" },
    ],
  },
];

export const tenants = [
  { id: "t1", name: "Maya Patel", listing: "Sunlit Studio near Riverside Campus", moveIn: "2025-09-01", rent: 520, status: "Active" },
  { id: "t2", name: "Chen Wu", listing: "Spacious 2BR for Roommates", moveIn: "2025-09-15", rent: 575, status: "Active" },
  { id: "t3", name: "Aisha Khan", listing: "Spacious 2BR for Roommates", moveIn: "2025-09-15", rent: 575, status: "Active" },
];

export const paymentLog = [
  { id: "p1", tenant: "Maya Patel", month: "Jun 2026", amount: 520, status: "Paid", date: "2026-06-01" },
  { id: "p2", tenant: "Chen Wu", month: "Jun 2026", amount: 575, status: "Paid", date: "2026-06-02" },
  { id: "p3", tenant: "Aisha Khan", month: "Jun 2026", amount: 575, status: "Paid", date: "2026-06-01" },
  { id: "p4", tenant: "Maya Patel", month: "Jul 2026", amount: 520, status: "Pending", date: "—" },
  { id: "p5", tenant: "Chen Wu", month: "Jul 2026", amount: 575, status: "Pending", date: "—" },
];

export const reportedListings = [
  { id: "rep1", listing: "Budget Shared Room, 10 min walk", reason: "Photos look outdated", reporter: "Student user #482", date: "2026-06-28" },
  { id: "rep2", listing: "Basement Room – Rejected", reason: "Poor conditions", reporter: "Student user #109", date: "2026-06-15" },
];

export const AMENITIES = [
  "WiFi", "Furnished", "Laundry", "Utilities Included", "Shared Kitchen",
  "AC", "Balcony", "Gym", "Parking", "Dishwasher", "Meals Optional", "Garden", "Concierge",
];

export const CAMPUSES = ["Riverside University", "Northgate College", "Harbor Institute"];

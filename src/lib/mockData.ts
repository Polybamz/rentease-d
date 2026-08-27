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
  /** uid of the sender for real conversations; "me"/"them" for seed/demo data only. */
  from: string;
  text: string;
  /** Client-side send time, used for ordering and display of real messages. */
  createdAtMs?: number;
  /** Legacy display string used only by seed/demo messages. */
  time?: string;
};

export type Conversation = {
  id: string;
  /** uid of the landlord participant. */
  landlordId: string;
  /** uid of the student participant (real conversations only). */
  studentId?: string;
  /** [studentId, landlordId] — used to query "my conversations". */
  participants?: string[];
  listingId: string;
  lastPreview: string;
  unread: number;
  messages: Message[];
};

// Seed listings below reference local placeholder images at `/images/*.jpg`.

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
    photos: ["/images/1.jpg"],
    price: 312000,
    deposit: 312000,
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
];

export const reviews: Review[] = [
  {
    id: "r1",
    listingId: "1",
    landlordId: "l1",
    author: "Maya P.",
    avatar: "/images/1.jpg",
    rating: 5,
    date: "2025-06-12",
    text: "Landlord was responsive and the studio was exactly as pictured. Loved it.",
  },
  {
    id: "r2",
    listingId: "1",
    landlordId: "l1",
    author: "Chen W.",
    avatar: "https://i.pravatar.cc/60?img=8",
    rating: 4,
    date: "2025-03-02",
    text: "Great location, small kitchen but sufficient. Would recommend.",
  },
  {
    id: "r3",
    listingId: "3",
    landlordId: "l4",
    author: "Sofia R.",
    avatar: "https://i.pravatar.cc/60?img=9",
    rating: 5,
    date: "2025-05-20",
    text: "Beautiful apartment, security team is fantastic.",
  },
  {
    id: "r4",
    listingId: "2",
    landlordId: "l2",
    author: "Tomás L.",
    avatar: "https://i.pravatar.cc/60?img=14",
    rating: 4,
    date: "2025-04-08",
    text: "Friendly flatmates and a fair rent.",
  },
  {
    id: "r5",
    listingId: "5",
    landlordId: "l1",
    author: "Aisha K.",
    avatar: "https://i.pravatar.cc/60?img=25",
    rating: 5,
    date: "2025-07-01",
    text: "Perfect for roommates. Everything worked from day one.",
  },
];

// Demo-only conversations (dev seed). "demo-student" isn't a real auth uid,
// so these won't appear in any real signed-in user's inbox — they exist so
// the /messages UI has something to render before real conversations exist.
export const conversations: Conversation[] = [
  {
    id: "c1",
    landlordId: "l1",
    studentId: "demo-student",
    participants: ["demo-student", "l1"],
    listingId: "1",
    lastPreview: "Sure, viewings are available this Saturday.",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "demo-student",
        text: "Hi! Is the studio still available for August?",
        time: "10:14",
      },
      {
        id: "m2",
        from: "l1",
        text: "Hello! Yes, still available. Would you like to book a viewing?",
        time: "10:22",
      },
      {
        id: "m3",
        from: "demo-student",
        text: "Yes please, this weekend if possible.",
        time: "10:24",
      },
      { id: "m4", from: "l1", text: "Sure, viewings are available this Saturday.", time: "10:31" },
    ],
  },
  {
    id: "c2",
    landlordId: "l4",
    studentId: "demo-student",
    participants: ["demo-student", "l4"],
    listingId: "3",
    lastPreview: "Deposit is one month, refundable.",
    unread: 0,
    messages: [
      { id: "m5", from: "demo-student", text: "Hi, what's the deposit policy?", time: "Yesterday" },
      { id: "m6", from: "l4", text: "Deposit is one month, refundable.", time: "Yesterday" },
    ],
  },
];

export const tenants = [
  {
    id: "t1",
    name: "Maya Patel",
    listing: "Sunlit Studio near Riverside Campus",
    moveIn: "2025-09-01",
    rent: 312000,
    status: "Active",
  },
  {
    id: "t2",
    name: "Chen Wu",
    listing: "Spacious 2BR for Roommates",
    moveIn: "2025-09-15",
    rent: 345000,
    status: "Active",
  },
  {
    id: "t3",
    name: "Aisha Khan",
    listing: "Spacious 2BR for Roommates",
    moveIn: "2025-09-15",
    rent: 345000,
    status: "Active",
  },
];

export const paymentLog = [
  {
    id: "p1",
    tenant: "Maya Patel",
    month: "Jun 2026",
    amount: 312000,
    status: "Paid",
    date: "2026-06-01",
  },
  {
    id: "p2",
    tenant: "Chen Wu",
    month: "Jun 2026",
    amount: 345000,
    status: "Paid",
    date: "2026-06-02",
  },
  {
    id: "p3",
    tenant: "Aisha Khan",
    month: "Jun 2026",
    amount: 345000,
    status: "Paid",
    date: "2026-06-01",
  },
  {
    id: "p4",
    tenant: "Maya Patel",
    month: "Jul 2026",
    amount: 312000,
    status: "Pending",
    date: "—",
  },
  { id: "p5", tenant: "Chen Wu", month: "Jul 2026", amount: 345000, status: "Pending", date: "—" },
];

export const reportedListings = [
  {
    id: "rep1",
    listing: "1",
    reason: "Photos look outdated",
    reporter: "Student user #482",
    date: "2026-06-28",
  },
  {
    id: "rep2",
    listing: "1",
    reason: "Poor conditions",
    reporter: "Student user #109",
    date: "2026-06-15",
  },
];

export const AMENITIES = [
  "WiFi",
  "Furnished",
  "Laundry",
  "Utilities Included",
  "Shared Kitchen",
  "AC",
  "Balcony",
  "Gym",
  "Parking",
  "Dishwasher",
  "Meals Optional",
  "Garden",
  "Concierge",
];

export const CAMPUSES = ["Riverside University", "Northgate College", "Harbor Institute"];

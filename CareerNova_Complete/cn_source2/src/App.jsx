import { useState, useEffect, useContext, createContext, useRef } from "react";
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  resetPasswordEmail,
  logOut,
  onAuthChange,
} from "./firebase.js";
import {
  getAuth,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

// ─── CONTEXT ────────────────────────────────────────────────────────────────
const AppContext = createContext(null);
const ThemeContext = createContext(null);

// ─── Firebase handles all auth — see src/firebase.js ───────────────────────

const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.3 5.3C36.9 37.8 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"
    />
  </svg>
);

// Decode the JWT payload returned by Google Identity Services
const decodeJwt = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// ─── PROFILE HELPERS ─────────────────────────────────────────────────────────
// A new user starts with an empty profile (no fake skills / experience).
const emptyProfile = {
  form: { name: "", headline: "", location: "", about: "", email: "" },
  skills: [],
  experience: [],
};

// Compute profile strength (0–100) from the data a user has actually filled in.
const computeProfileStrength = (profile) => {
  const form = profile?.form || {};
  const skills = profile?.skills || [];
  const experience = profile?.experience || [];
  let score = 0;
  if (form.name) score += 10;
  if (form.email) score += 10;
  if (form.headline) score += 10;
  if (form.location) score += 10;
  if (form.about) score += 10;
  if (skills.length > 0) score += Math.min(skills.length, 5) * 3; // up to 15
  if (experience.length > 0) score += Math.min(experience.length, 4) * 5; // up to 20
  return Math.min(Math.round(score), 100);
};

// ─── SAMPLE DATA ────────────────────────────────────────────────────────────
const COMPANIES = [
  {
    id: 1,
    name: "Google",
    industry: "Technology",
    size: "10,000+",
    logo: "G",
    color: "#4285F4",
    jobs: 42,
    description: "Building products for everyone.",
  },
  {
    id: 2,
    name: "Microsoft",
    industry: "Technology",
    size: "10,000+",
    logo: "M",
    color: "#00A4EF",
    jobs: 38,
    description: "Empowering every person and organization.",
  },
  {
    id: 3,
    name: "Amazon",
    industry: "E-Commerce & Cloud",
    size: "10,000+",
    logo: "A",
    color: "#FF9900",
    jobs: 65,
    description: "Earth's most customer-centric company.",
  },
  {
    id: 4,
    name: "Adobe",
    industry: "Software",
    size: "5,000–10,000",
    logo: "Ad",
    color: "#FF0000",
    jobs: 24,
    description: "Changing the world through digital experiences.",
  },
  {
    id: 5,
    name: "Infosys",
    industry: "IT Services",
    size: "10,000+",
    logo: "In",
    color: "#007CC3",
    jobs: 89,
    description: "Navigating your next.",
  },
  {
    id: 6,
    name: "TCS",
    industry: "IT Services",
    size: "10,000+",
    logo: "T",
    color: "#EF3829",
    jobs: 112,
    description: "Building on belief.",
  },
  {
    id: 7,
    name: "Flipkart",
    industry: "E-Commerce",
    size: "10,000+",
    logo: "F",
    color: "#2874F0",
    jobs: 31,
    description: "India's leading digital commerce platform.",
  },
  {
    id: 8,
    name: "Swiggy",
    industry: "Food Tech",
    size: "5,000–10,000",
    logo: "S",
    color: "#FC8019",
    jobs: 19,
    description: "Delivering happiness to your doorstep.",
  },
];

const JOBS = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "Google",
    companyId: 1,
    location: "Bengaluru, Karnataka",
    salary: "₹30L – ₹50L/yr",
    experience: "4–7 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["React", "TypeScript", "GraphQL", "CSS"],
    posted: "2 days ago",
    match: 96,
    description:
      "Build next-gen user interfaces for Google's core products. You'll work with world-class engineers on high-scale web applications.",
    responsibilities: [
      "Design and implement scalable UI components",
      "Collaborate with product and design teams",
      "Conduct code reviews and mentor juniors",
      "Optimize performance of web applications",
    ],
    requirements: [
      "4+ years of React experience",
      "Strong TypeScript skills",
      "Experience with GraphQL",
      "Excellent communication",
    ],
    benefits: [
      "Health insurance",
      "Stock options",
      "Remote work days",
      "Learning budget ₹1L/yr",
    ],
    category: "Software Developer",
    featured: true,
  },
  {
    id: 2,
    title: "Python Backend Engineer",
    company: "Microsoft",
    companyId: 2,
    location: "Hyderabad, Telangana",
    salary: "₹25L – ₹45L/yr",
    experience: "3–6 years",
    type: "Full-time",
    mode: "On-site",
    skills: ["Python", "Django", "PostgreSQL", "Docker"],
    posted: "1 day ago",
    match: 91,
    description:
      "Join Azure's backend team to build resilient, high-throughput microservices powering millions of users globally.",
    responsibilities: [
      "Design scalable microservices",
      "Optimize database queries",
      "Write comprehensive unit tests",
      "Participate in on-call rotation",
    ],
    requirements: [
      "3+ years Python",
      "Django/FastAPI experience",
      "Database design skills",
      "Cloud platform knowledge",
    ],
    benefits: [
      "Comprehensive health plan",
      "ESPP",
      "Flexible hours",
      "Annual retreats",
    ],
    category: "Software Developer",
    featured: true,
  },
  {
    id: 3,
    title: "Data Scientist",
    company: "Amazon",
    companyId: 3,
    location: "Bengaluru, Karnataka",
    salary: "₹28L – ₹52L/yr",
    experience: "3–5 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["Python", "ML", "SQL", "Spark", "AWS"],
    posted: "3 days ago",
    match: 88,
    description:
      "Use statistical modeling and machine learning to optimize Amazon's supply chain and recommendation systems.",
    responsibilities: [
      "Build ML models for business problems",
      "Analyze large datasets",
      "Present findings to leadership",
      "A/B test model improvements",
    ],
    requirements: [
      "Masters in related field",
      "3+ years ML experience",
      "Proficient in Python/R",
      "Strong SQL skills",
    ],
    benefits: [
      "Amazon equity",
      "Health & dental",
      "401k equivalent",
      "Career growth",
    ],
    category: "Data Analyst",
    featured: true,
  },
  {
    id: 4,
    title: "UI/UX Designer",
    company: "Adobe",
    companyId: 4,
    location: "Noida, Uttar Pradesh",
    salary: "₹18L – ₹32L/yr",
    experience: "2–5 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["Figma", "Prototyping", "Design Systems", "User Research"],
    posted: "5 days ago",
    match: 94,
    description:
      "Shape the future of creative tools. Design intuitive experiences for Adobe's suite of creative products used by millions.",
    responsibilities: [
      "Lead end-to-end UX design",
      "Create wireframes and prototypes",
      "Conduct usability testing",
      "Maintain design system",
    ],
    requirements: [
      "Strong Figma skills",
      "Portfolio of shipped products",
      "User research experience",
      "Cross-team collaboration",
    ],
    benefits: [
      "Adobe CC license",
      "Health coverage",
      "Learning credits",
      "Creative environment",
    ],
    category: "UI/UX Designer",
    featured: true,
  },
  {
    id: 5,
    title: "Cybersecurity Analyst",
    company: "TCS",
    companyId: 6,
    location: "Chennai, Tamil Nadu",
    salary: "₹12L – ₹22L/yr",
    experience: "2–4 years",
    type: "Full-time",
    mode: "On-site",
    skills: ["SIEM", "Penetration Testing", "ISO 27001", "Incident Response"],
    posted: "1 week ago",
    match: 82,
    description:
      "Protect TCS and its clients from evolving cyber threats. Work on SOC operations and security assessments.",
    responsibilities: [
      "Monitor security events",
      "Conduct vulnerability assessments",
      "Respond to security incidents",
      "Prepare compliance reports",
    ],
    requirements: [
      "CEH or CISSP preferred",
      "2+ years SOC experience",
      "Threat intelligence knowledge",
      "Scripting skills",
    ],
    benefits: [
      "Insurance",
      "On-site facility",
      "Training programs",
      "Provident fund",
    ],
    category: "Cybersecurity",
    featured: false,
  },
  {
    id: 6,
    title: "Cloud Solutions Architect",
    company: "Microsoft",
    companyId: 2,
    location: "Remote",
    salary: "₹40L – ₹70L/yr",
    experience: "6–10 years",
    type: "Full-time",
    mode: "Remote",
    skills: ["Azure", "Terraform", "Kubernetes", "DevOps"],
    posted: "4 days ago",
    match: 79,
    description:
      "Architect enterprise cloud solutions on Azure. Guide Fortune 500 clients through digital transformation.",
    responsibilities: [
      "Design cloud architectures",
      "Lead client workshops",
      "Create technical proposals",
      "Mentor solution engineers",
    ],
    requirements: [
      "Azure certifications",
      "6+ years architecture experience",
      "Enterprise consulting exposure",
      "Excellent communication",
    ],
    benefits: [
      "Top compensation",
      "Azure credits",
      "Travel budget",
      "Stock grants",
    ],
    category: "Software Developer",
    featured: false,
  },
  {
    id: 7,
    title: "Product Manager",
    company: "Flipkart",
    companyId: 7,
    location: "Bengaluru, Karnataka",
    salary: "₹22L – ₹40L/yr",
    experience: "3–6 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: [
      "Product Strategy",
      "Roadmapping",
      "SQL",
      "Stakeholder Management",
    ],
    posted: "2 days ago",
    match: 85,
    description:
      "Drive product strategy for Flipkart's checkout and payments experience serving 400M+ customers.",
    responsibilities: [
      "Define product vision",
      "Write PRDs and user stories",
      "Work with design and engineering",
      "Track KPIs and OKRs",
    ],
    requirements: [
      "MBA preferred",
      "3+ years PM experience",
      "E-commerce background helpful",
      "Data-driven mindset",
    ],
    benefits: ["ESOP", "Health insurance", "Flexible leave", "Product perks"],
    category: "Product Manager",
    featured: false,
  },
  {
    id: 8,
    title: "Digital Marketing Manager",
    company: "Swiggy",
    companyId: 8,
    location: "Bengaluru, Karnataka",
    salary: "₹14L – ₹24L/yr",
    experience: "3–5 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["SEO", "SEM", "Meta Ads", "Analytics", "Content Strategy"],
    posted: "6 days ago",
    match: 77,
    description:
      "Scale Swiggy's user acquisition and retention through performance and brand marketing campaigns.",
    responsibilities: [
      "Manage paid digital campaigns",
      "Optimize SEO strategy",
      "Analyze campaign performance",
      "Collaborate with creative teams",
    ],
    requirements: [
      "Google Ads & Meta certifications preferred",
      "Strong analytics skills",
      "Campaign management experience",
      "Budget management",
    ],
    benefits: [
      "Meal credits",
      "Health coverage",
      "Flexible work",
      "Learning allowance",
    ],
    category: "Digital Marketing",
    featured: false,
  },
  {
    id: 9,
    title: "DevOps Engineer",
    company: "Infosys",
    companyId: 5,
    location: "Pune, Maharashtra",
    salary: "₹15L – ₹28L/yr",
    experience: "3–5 years",
    type: "Full-time",
    mode: "On-site",
    skills: ["Jenkins", "Kubernetes", "Docker", "Ansible", "AWS"],
    posted: "3 days ago",
    match: 80,
    description:
      "Build and maintain CI/CD pipelines for enterprise clients across banking, retail, and healthcare sectors.",
    responsibilities: [
      "Design CI/CD workflows",
      "Manage Kubernetes clusters",
      "Implement monitoring solutions",
      "Automate infrastructure",
    ],
    requirements: [
      "3+ years DevOps experience",
      "Kubernetes certification preferred",
      "Strong Linux skills",
      "Scripting expertise",
    ],
    benefits: [
      "Provident fund",
      "Insurance",
      "On-campus facilities",
      "Performance bonus",
    ],
    category: "Software Developer",
    featured: false,
  },
  {
    id: 10,
    title: "Financial Analyst",
    company: "Amazon",
    companyId: 3,
    location: "Hyderabad, Telangana",
    salary: "₹16L – ₹28L/yr",
    experience: "2–4 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["Excel", "SQL", "Financial Modeling", "Tableau"],
    posted: "1 week ago",
    match: 73,
    description:
      "Drive financial planning and analysis for Amazon's India operations, covering P&L, forecasting, and variance analysis.",
    responsibilities: [
      "Build financial models",
      "Monthly close activities",
      "Prepare executive reports",
      "Support business reviews",
    ],
    requirements: [
      "CA / MBA Finance",
      "2+ years FP&A experience",
      "Advanced Excel skills",
      "SQL proficiency",
    ],
    benefits: [
      "Amazon equity",
      "Health plan",
      "Meal allowance",
      "Career development",
    ],
    category: "Finance",
    featured: false,
  },
  {
    id: 11,
    title: "React Native Developer",
    company: "Flipkart",
    companyId: 7,
    location: "Bengaluru, Karnataka",
    salary: "₹20L – ₹38L/yr",
    experience: "3–5 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["React Native", "JavaScript", "iOS", "Android", "Redux"],
    posted: "5 days ago",
    match: 90,
    description:
      "Build and optimize Flipkart's mobile app experience for 300M+ users on iOS and Android.",
    responsibilities: [
      "Develop mobile features",
      "Improve app performance",
      "Collaborate with UX team",
      "Conduct code reviews",
    ],
    requirements: [
      "3+ years React Native",
      "Published apps preferred",
      "Performance optimization skills",
      "REST API integration",
    ],
    benefits: ["ESOP", "Health insurance", "Flexible hours", "Learning budget"],
    category: "Software Developer",
    featured: false,
  },
  {
    id: 12,
    title: "Machine Learning Engineer",
    company: "Google",
    companyId: 1,
    location: "Bengaluru, Karnataka",
    salary: "₹35L – ₹65L/yr",
    experience: "4–8 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["TensorFlow", "PyTorch", "Python", "MLOps", "GCP"],
    posted: "2 days ago",
    match: 87,
    description:
      "Research and deploy ML models that power Google Search, Ads, and Assistant for billions of users.",
    responsibilities: [
      "Design ML systems",
      "Train and evaluate models",
      "Deploy models to production",
      "Research new approaches",
    ],
    requirements: [
      "PhD or Masters preferred",
      "4+ years ML engineering",
      "Publication record helpful",
      "Strong coding skills",
    ],
    benefits: [
      "Top compensation",
      "Google perks",
      "Research budget",
      "Stock options",
    ],
    category: "Data Analyst",
    featured: false,
  },
  {
    id: 13,
    title: "Sales Manager – Enterprise",
    company: "TCS",
    companyId: 6,
    location: "Mumbai, Maharashtra",
    salary: "₹18L – ₹32L/yr",
    experience: "5–8 years",
    type: "Full-time",
    mode: "On-site",
    skills: ["B2B Sales", "CRM", "Negotiation", "Account Management"],
    posted: "1 week ago",
    match: 69,
    description:
      "Drive enterprise technology sales for TCS's BFSI vertical, managing a portfolio of top Indian banks and insurers.",
    responsibilities: [
      "Own revenue targets",
      "Build CXO relationships",
      "Lead proposals and pitches",
      "Forecast pipeline accurately",
    ],
    requirements: [
      "5+ years enterprise sales",
      "IT services background preferred",
      "BFSI knowledge helpful",
      "Strong presentation skills",
    ],
    benefits: [
      "Attractive incentives",
      "Travel allowance",
      "Insurance",
      "Provident fund",
    ],
    category: "Sales",
    featured: false,
  },
  {
    id: 14,
    title: "Blockchain Developer",
    company: "Infosys",
    companyId: 5,
    location: "Bengaluru, Karnataka",
    salary: "₹22L – ₹40L/yr",
    experience: "3–6 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: [
      "Solidity",
      "Ethereum",
      "Web3.js",
      "Smart Contracts",
      "Hyperledger",
    ],
    posted: "4 days ago",
    match: 75,
    description:
      "Design and implement blockchain solutions for enterprise clients in supply chain and financial services.",
    responsibilities: [
      "Develop smart contracts",
      "Integrate Web3 frontends",
      "Audit blockchain code",
      "Research new protocols",
    ],
    requirements: [
      "3+ years blockchain development",
      "Solidity proficiency",
      "DeFi knowledge helpful",
      "Security-first mindset",
    ],
    benefits: [
      "Premium pay",
      "Innovation labs access",
      "Conference budget",
      "Insurance",
    ],
    category: "Software Developer",
    featured: false,
  },
  {
    id: 15,
    title: "HR Business Partner",
    company: "Adobe",
    companyId: 4,
    location: "Noida, Uttar Pradesh",
    salary: "₹14L – ₹24L/yr",
    experience: "4–7 years",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["HRBP", "Talent Management", "Employee Relations", "OD"],
    posted: "3 days ago",
    match: 71,
    description:
      "Be a strategic people partner for Adobe India's engineering and design teams, driving culture and talent programs.",
    responsibilities: [
      "Partner with business leaders",
      "Drive performance programs",
      "Handle employee relations",
      "Lead engagement initiatives",
    ],
    requirements: [
      "MBA HR preferred",
      "4+ years HRBP experience",
      "Stakeholder management skills",
      "Data-driven approach",
    ],
    benefits: [
      "Adobe CC license",
      "Health coverage",
      "Competitive salary",
      "Work-life balance",
    ],
    category: "Finance",
    featured: false,
  },
];

const CATEGORIES = [
  "Software Developer",
  "Data Analyst",
  "UI/UX Designer",
  "Digital Marketing",
  "Cybersecurity",
  "Product Manager",
  "Sales",
  "Finance",
];

// ─── ICONS ──────────────────────────────────────────────────────────────────
// ─── CN LOGO COMPONENTS ──────────────────────────────────────────────────────
const CnMark = ({ size = 36 }) => {
  const r  = size * 0.30;
  const cx = size * 0.44;
  const cy = size * 0.50;
  const x1 = cx + r;
  const x2 = cx + r * 1.95;
  const top = cy - r;
  const bot = cy + r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d={`M ${x1} ${top} A ${r} ${r} 0 1 0 ${x1} ${bot}`}
        stroke="white" strokeWidth={size * 0.12} strokeLinecap="round"/>
      <line x1={x1} y1={top} x2={x2} y2={bot}
        stroke="#22D3EE" strokeWidth={size * 0.095} strokeLinecap="round"/>
      <line x1={x2} y1={top} x2={x2} y2={bot}
        stroke="#A78BFA" strokeWidth={size * 0.095} strokeLinecap="round"/>
    </svg>
  );
};

const CnLogo = ({ size = 36, textSize = 20 }) => (
  <div style={{ display:"flex", alignItems:"center", gap: Math.round(size * 0.24) }}>
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: "#151B3D",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink: 0,
      boxShadow: "0 2px 10px rgba(124,58,237,0.3)",
    }}>
      <CnMark size={Math.round(size * 0.7)} />
    </div>
    <span style={{
      fontWeight: 800, fontSize: textSize, letterSpacing: "-0.4px", lineHeight: 1,
      fontFamily: "inherit",
    }}>
      <span style={{ background:"linear-gradient(135deg,#151B3D,#4B1FBF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Career</span><span style={{ background:"linear-gradient(135deg,#7C3AED,#22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Nova</span>
    </span>
  </div>
);

const CnLogoDark = ({ size = 36, textSize = 20 }) => (
  <div style={{ display:"flex", alignItems:"center", gap: Math.round(size * 0.24) }}>
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.15)",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink: 0,
    }}>
      <CnMark size={Math.round(size * 0.7)} />
    </div>
    <span style={{ fontWeight:800, fontSize:textSize, letterSpacing:"-0.4px", fontFamily:"inherit" }}>
      <span style={{ color:"white" }}>Career</span><span style={{ color:"#22D3EE" }}>Nova</span>
    </span>
  </div>
);

const Icon = ({ name, size = 18, className = "" }) => {
  const icons = {
    search: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    location: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    briefcase: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect width="20" height="14" x="2" y="7" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    heart: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    "heart-fill": (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="#EF4444"
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    bell: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
    user: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    settings: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    logout: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    menu: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    ),
    x: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    ),
    check: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
    star: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        className={className}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    trending: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    chart: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    file: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    send: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
    building: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    ),
    lightning: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    ai: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 2a5 5 0 1 0 5 5" />
        <path d="M12 7v5l3 3" />
        <circle cx="19" cy="5" r="2" />
        <path d="M3 17a5 5 0 0 1 5-5h4" />
        <path d="M8 22H6a2 2 0 0 1-2-2v-2a4 4 0 0 1 4-4h2" />
      </svg>
    ),
    chevronRight: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    ),
    chevronDown: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    ),
    share: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    flag: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    home: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    plus: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    ),
    eye: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    trash: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    ),
    upload: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    download: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    clock: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    edit: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    filter: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    paperclip: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    ),
    messageSquare: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    camera: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
    moon: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
    sun: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
    shield: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    key: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
  :root {
    --primary: #151B3D;
    --violet: #7C3AED;
    --cyan: #22D3EE;
    --bg: #F8FAFC;
    --dark: #0B1026;
    --card: #ffffff;
    --success: #10B981;
    --warning: #F59E0B;
    --danger: #EF4444;
    --text: #1F2937;
    --text-strong: #374151;
    --text-soft: #4B5563;
    --text-muted: #6B7280;
    --text-faint: #9CA3AF;
    --border: #E5E7EB;
    --border-soft: #F3F4F6;
    --tint-violet: #EDE9FE;
    --tint-green: #D1FAE5;
    --tint-amber: #FEF3C7;
    --tint-cyan: #ECFEFF;
    --tint-red: #FEE2E2;
    --green: #059669;
    --amber: #D97706;
    --teal: #0891B2;
    --red: #DC2626;
    --grad: linear-gradient(135deg, #151B3D, #7C3AED, #22D3EE);
    --grad-btn: linear-gradient(135deg, #7C3AED, #22D3EE);
    --auth-bg: linear-gradient(135deg, #F5F3FF, #ECFEFF);
    --shadow: 0 4px 24px rgba(21,27,61,0.08);
    --shadow-lg: 0 8px 40px rgba(21,27,61,0.14);
  }
  [data-theme="dark"] {
    --primary: #E5E7EB;
    --bg: #0B1026;
    --card: #121A2E;
    --text: #E5E7EB;
    --text-strong: #CBD5E1;
    --text-soft: #A3AEC2;
    --text-muted: #8896AC;
    --text-faint: #64748B;
    --border: #253049;
    --border-soft: #1C243C;
    --tint-violet: #241B45;
    --tint-green: #0F3129;
    --tint-amber: #332919;
    --tint-cyan: #0D2F35;
    --tint-red: #3A1D24;
    --green: #34D399;
    --amber: #FBBF24;
    --teal: #22D3EE;
    --red: #F87171;
    --auth-bg: linear-gradient(135deg, #171031, #0B1026);
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.55);
  }
  .glass {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.6);
  }
  .grad-text {
    background: var(--grad-btn);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .btn-primary {
    background: var(--grad-btn);
    color: white;
    border: none;
    padding: 10px 22px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }
  .btn-outline {
    background: transparent;
    color: var(--violet);
    border: 1.5px solid var(--violet);
    padding: 9px 20px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .btn-outline:hover { background: var(--violet); color: white; transform: translateY(-1px); }
  .btn-ghost {
    background: transparent;
    color: var(--text-muted);
    border: 1.5px solid var(--border);
    padding: 9px 16px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-ghost:hover { border-color: var(--violet); color: var(--violet); }
  .card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); border: 1px solid var(--border); }
  .tag { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 500; background: #EDE9FE; color: var(--violet); border: 1px solid #DDD6FE; }
  .tag-cyan { background: #ECFEFF; color: #0891B2; border-color: #A5F3FC; }
  .tag-green { background: #D1FAE5; color: #059669; border-color: #6EE7B7; }
  .tag-orange { background: #FEF3C7; color: #D97706; border-color: #FCD34D; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge-violet { background: #EDE9FE; color: var(--violet); }
  .badge-green { background: #D1FAE5; color: #059669; }
  .badge-orange { background: #FEF3C7; color: #D97706; }
  .badge-cyan { background: #ECFEFF; color: #0891B2; }
  .badge-red { background: #FEE2E2; color: #DC2626; }
  .progress-bar { height: 8px; background: var(--border); border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--grad-btn); border-radius: 999px; transition: width 0.6s ease; }
  input, select, textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: var(--text);
    background: var(--card);
    transition: border 0.2s;
    outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 5px; display: block; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    border: 1.5px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .google-btn:hover { border-color: #7C3AED; box-shadow: var(--shadow); }
  .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-or { display: flex; align-items: center; gap: 12px; margin: 4px 0 16px; color: var(--text-faint); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .auth-or::before, .auth-or::after { content: ""; flex: 1; height: 1px; background: var(--border); }
  .divider { height: 1px; background: var(--border); margin: 24px 0; }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .sidebar-link:hover { background: var(--border-soft); color: var(--text); }
  .sidebar-link.active { background: var(--tint-violet); color: var(--violet); font-weight: 600; }
  .section-title { font-size: 28px; font-weight: 800; color: var(--primary); }
  .section-sub { font-size: 16px; color: var(--text-muted); margin-top: 8px; }
  .animate-in { animation: fadeUp 0.4s ease both; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  .job-card { transition: all 0.25s; }
  .job-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
  .company-card { transition: all 0.25s; }
  .company-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .match-ring { background: conic-gradient(var(--violet) var(--pct, 0%), var(--border) var(--pct, 0%)); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .nav-link { font-size: 14px; font-weight: 500; color: var(--text-soft); cursor: pointer; padding: 8px 4px; border: none; background: none; transition: color 0.15s; white-space: nowrap; }
  .nav-link:hover { color: var(--violet); }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; backdrop-filter: blur(2px); }
  /* ── Utilities ─────────────────────────────────────────────────────── */
  .show-mobile  { display: none; }
  .hide-mobile  { display: flex; }

  /* Above 640px: always show sidebar, never show mobile tab bar */
  @media (min-width: 641px) {
    .show-mobile { display: none !important; }
    .hide-mobile { display: flex !important; }
    .dash-layout { flex-direction: row !important; }
  }

  /* ── Scrollbar ──────────────────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--violet); }

  /* ── Tooltip ────────────────────────────────────────────────────────── */
  .tooltip { position: relative; }
  .tooltip:hover::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #1F2937;
    color: white;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 200;
    pointer-events: none;
  }

  /* ── Skeleton shimmer ───────────────────────────────────────────────── */
  .skeleton {
    background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .star-bg { position:absolute;width:3px;height:3px;background:white;border-radius:50%;animation:twinkle 3s infinite; }
  @keyframes twinkle { 0%,100%{opacity:.2} 50%{opacity:1} }

  /* ── Grid system ────────────────────────────────────────────────────── */
  .grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }

  /* ── Dark theme ─────────────────────────────────────────────────────── */
  [data-theme="dark"] body { background: var(--bg); color: var(--text); }
  [data-theme="dark"] nav { background: rgba(13,18,36,0.95) !important; border-bottom-color: var(--border) !important; box-shadow: 0 2px 20px rgba(0,0,0,0.35) !important; }
  [data-theme="dark"] .glass { background: rgba(19,26,46,0.85); border-color: var(--border); }
  [data-theme="dark"] .overlay { background: rgba(0,0,0,0.65); }
  [data-theme="dark"] .tooltip:hover::after { background: #334155; }
  [data-theme="dark"] :is(input,select,textarea)::placeholder { color: var(--text-faint); }
  [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #334155; }
  [data-theme="dark"] .skeleton { background: linear-gradient(90deg,#1C243C 25%,#26304A 50%,#1C243C 75%); }
  [data-theme="dark"] .skeleton, [data-theme="dark"] .match-ring { --border: #26304A; }
  [data-theme="dark"] .badge-violet { background:var(--tint-violet); color:var(--violet); }
  [data-theme="dark"] .badge-green  { background:var(--tint-green);  color:var(--green);  }
  [data-theme="dark"] .badge-orange { background:var(--tint-amber);  color:var(--amber);  }
  [data-theme="dark"] .badge-cyan   { background:var(--tint-cyan);   color:var(--teal);   }
  [data-theme="dark"] .badge-red    { background:var(--tint-red);    color:var(--red);    }
  [data-theme="dark"] .tag          { background:var(--tint-violet); color:var(--violet); border-color:var(--border); }
  [data-theme="dark"] .tag-cyan     { background:var(--tint-cyan);   color:var(--teal);   border-color:var(--border); }
  [data-theme="dark"] .tag-green    { background:var(--tint-green);  color:var(--green);  border-color:var(--border); }
  [data-theme="dark"] .tag-orange   { background:var(--tint-amber);  color:var(--amber);  border-color:var(--border); }
  [data-theme="dark"] .btn-ghost    { border-color:var(--border); color:var(--text-muted); }
  [data-theme="dark"] .btn-ghost:hover { border-color:var(--violet); color:var(--violet); }
  [data-theme="dark"] .divider { background: var(--border); }
  [data-theme="dark"] .sidebar-link { color: var(--text-muted); }
  [data-theme="dark"] .sidebar-link:hover  { background:var(--border-soft); color:var(--text); }
  [data-theme="dark"] .sidebar-link.active { background:var(--tint-violet); color:var(--violet); }
  [data-theme="dark"] .section-title { color: var(--text); }
  [data-theme="dark"] .card { box-shadow: 0 4px 24px rgba(0,0,0,0.3); }

  /* ════════════════════════════════════════════════════════════════════
     PROFESSIONAL RESPONSIVE SYSTEM
     — mobile-first, fluid sizing, safe-area aware, touch-friendly
     Breakpoints: 1280 · 1024 · 768 · 600 · 480 · 360
     ════════════════════════════════════════════════════════════════════ */

  /* ── Large desktop / 4K ≥1280px ──────────────────────────────────── */
  @media (min-width: 1280px) {
    .grid-4 { grid-template-columns: repeat(4,1fr); }
    .grid-3 { grid-template-columns: repeat(3,1fr); }
  }

  /* ── Tablet landscape  ≤1024px ────────────────────────────────────── */
  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2,1fr); }
    .grid-3 { grid-template-columns: repeat(2,1fr); }
  }

  /* ── Tablet portrait  ≤768px ─────────────────────────────────────── */
  @media (max-width: 768px) {
    /* Sidebar stays visible on tablets — only hidden on phones (≤640px) */
    /* Typography */
    .section-title { font-size: clamp(20px,5.5vw,26px) !important; line-height:1.25 !important; }
    .section-sub   { font-size: clamp(13px,3.5vw,15px) !important; }

    /* Show/hide — general mobile */
    .show-mobile { display: flex !important; }

    /* Buttons — keep usable on small screens */
    .btn-primary, .btn-outline, .btn-ghost {
      font-size: 13px;
      padding: 9px 14px;
      min-height: 44px;
    }
    .btn-primary { white-space: normal; word-break: break-word; }

    /* Inputs — 16px prevents iOS auto-zoom */
    input, select, textarea { font-size: 16px !important; min-height: 44px; }

    /* Cards */
    .card { border-radius: 12px !important; }

    /* Sidebar links */
    .sidebar-link { min-height: 44px; }

    /* Grid collapses */
    .grid-2 { grid-template-columns: 1fr !important; }
    .grid-3 { grid-template-columns: 1fr 1fr !important; }
    .grid-4 { grid-template-columns: 1fr 1fr !important; }

    /* Dashboard: tab bar lives at bottom, content needs clearance */
    .dash-content { padding-bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important; }

    /* Overlay / drawer safe width */
    .drawer { width: min(300px, 88vw) !important; }
  }

  /* ── Phone  ≤640px — hide desktop sidebar, show mobile tab bar ─── */
  @media (max-width: 640px) {
    .hide-mobile  { display: none !important; }
    .dash-layout  { flex-direction: column !important; }
  }

  /* ── Mobile  ≤600px ─────────────────────────────────────────────── */
  @media (max-width: 600px) {
    .grid-3 { grid-template-columns: 1fr !important; }
    .grid-4 { grid-template-columns: 1fr 1fr !important; }

    /* Auth card stretch */
    .auth-card { padding: clamp(20px,5vw,36px) !important; }

    /* Toast above mobile tab bar */
    .toast-box {
      bottom: calc(68px + env(safe-area-inset-bottom,0px)) !important;
      left: 12px !important; right: 12px !important;
      width: auto !important; min-width: 0 !important;
    }
  }

  /* ── Small mobile  ≤480px ────────────────────────────────────────── */
  @media (max-width: 480px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr !important; }
    .section-title { font-size: clamp(18px,5vw,22px) !important; }

    /* Modals go near-full-width */
    .modal-sheet {
      width: 96vw !important;
      max-width: 96vw !important;
      padding: clamp(14px,4vw,20px) !important;
      border-radius: 16px !important;
    }
    /* Action button rows stack */
    .action-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
    .action-row > * { width: 100% !important; justify-content: center !important; }
  }

  /* ── Very small phones  ≤360px (Galaxy A, budget phones) ─────────── */
  @media (max-width: 360px) {
    .section-title { font-size: 18px !important; }
    .btn-primary, .btn-outline, .btn-ghost { font-size: 12px; padding: 8px 10px; }
    .card { border-radius: 10px !important; }
    nav { padding-left: 8px !important; padding-right: 8px !important; }
  }

  /* ── Touch / coarse pointer (any touch device) ──────────────────── */
  @media (hover:none) and (pointer:coarse) {
    button, [role="button"], .sidebar-link, .nav-link,
    .btn-primary, .btn-outline, .btn-ghost,
    input, select, textarea { min-height: 44px; }

    /* Disable sticky hover states that get stuck on touch */
    .job-card:hover    { transform: none !important; box-shadow: var(--shadow)   !important; }
    .company-card:hover{ transform: none !important; box-shadow: var(--shadow)   !important; }
    .btn-primary:hover { transform: none !important; opacity: 1 !important; }
    .btn-outline:hover { transform: none !important; }
  }

  /* ── Landscape phone  (height ≤ 480px, width > height) ─────────── */
  @media (max-height: 480px) and (orientation: landscape) {
    nav  { height: 50px !important; }
    main { min-height: calc(100dvh - 50px) !important; }
    .hero-section { padding-top: 16px !important; padding-bottom: 16px !important; }
    .auth-wrap  { padding: 8px 16px !important; min-height: unset !important; }
  }

  /* ── High-density / retina (cosmetic only) ──────────────────────── */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    ::-webkit-scrollbar { width: 4px; }
  }

  /* ── Print ──────────────────────────────────────────────────────── */
  @media print {
    nav, .show-mobile, footer, .toast-box { display: none !important; }
    .card { box-shadow: none !important; border: 1px solid #ccc !important; }
    main  { min-height: auto !important; }
    body  { background: white !important; color: #000 !important; }
    a     { color: #000 !important; text-decoration: underline; }
  }
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = "success", onClose }) => (
  <div
    style={{
      position: "fixed",
      bottom: "clamp(16px,4vw,28px)",
      right: "clamp(12px,3vw,28px)",
      zIndex: 9999,
      maxWidth: "calc(100vw - 24px)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      background:
        type === "success"
          ? "#10B981"
          : type === "error"
            ? "#EF4444"
            : "#7C3AED",
      color: "white",
      padding: "12px 20px",
      borderRadius: 14,
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      fontSize: 14,
      fontWeight: 600,
      animation: "fadeUp 0.3s ease",
      minWidth: "min(240px,calc(100vw - 24px))",
    }}
  >
    <Icon name={type === "success" ? "check" : "x"} size={16} />
    {msg}
    <button
      onClick={onClose}
      style={{
        marginLeft: "auto",
        background: "none",
        border: "none",
        color: "white",
        cursor: "pointer",
        padding: 2,
      }}
    >
      <Icon name="x" size={14} />
    </button>
  </div>
);

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────
const ToggleSwitch = ({ on, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    disabled={disabled}
    onClick={() => onChange(!on)}
    style={{
      width: 46,
      height: 25,
      borderRadius: 999,
      padding: 2,
      background: on ? "var(--violet)" : "var(--border)",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 0.25s ease",
      position: "relative",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span
      style={{
        width: 21,
        height: 21,
        borderRadius: "50%",
        background: "white",
        transform: on ? "translateX(21px)" : "translateX(0)",
        transition: "transform 0.25s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        display: "block",
      }}
    />
  </button>
);

// ─── NAV BAR ────────────────────────────────────────────────────────────────
const Navbar = ({ page, setPage, user, setUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  const navItems = [
    { label: "Home", id: "home" },
    { label: "Find Jobs", id: "jobs" },
    { label: "Companies", id: "companies" },
    { label: "Career Resources", id: "resources" },
    { label: "For Employers", id: "employer" },
  ];
  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: scrolled
            ? "rgba(255,255,255,0.95)"
            : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
          transition: "all 0.3s",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 clamp(12px,3vw,24px)",
            display: "flex",
            alignItems: "center",
            height: 64,
            gap: "clamp(8px,2vw,32px)",
          }}
        >
          {/* Logo */}
          <div
            onClick={() => setPage("home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <CnLogo size={34} textSize={19} />
          </div>
          {/* Desktop Nav */}
          <div
            className="hide-mobile"
            style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}
          >
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className="nav-link"
                style={{
                  color: page === n.id ? "#7C3AED" : undefined,
                  fontWeight: page === n.id ? 600 : undefined,
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginLeft: "auto",
            }}
          >
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="btn-ghost"
              style={{ padding: "8px 10px" }}
            >
              <Icon name={darkMode ? "sun" : "moon"} size={17} />
            </button>
            {user ? (
              <>
                <button
                  onClick={() => setPage("dashboard")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: "var(--card)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-strong)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      overflow: "hidden",
                    }}
                  >
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <span className="hide-mobile">{user.name.split(" ")[0]}</span>
                </button>
                <button className="btn-ghost" onClick={async () => { try { await logOut(); } catch(e){} setUser(null); }}>
                  <Icon name="logout" size={15} />
                  <span className="hide-mobile">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-ghost hide-mobile"
                  onClick={() => setPage("login")}
                >
                  Log In
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setPage("signup")}
                >
                  Sign Up <Icon name="chevronRight" size={15} />
                </button>
              </>
            )}
            {/* Mobile menu */}
            <button
              className="show-mobile btn-ghost"
              style={{ padding: "8px 10px" }}
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div className="overlay" onClick={() => setMenuOpen(false)} />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(300px,88vw)",
              height: "100dvh",
              background: "var(--card)",
              zIndex: 60,
              boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
              padding: 24,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <CnLogo size={30} textSize={17} />
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <Icon name="x" size={22} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navItems.map((n) => (
                <button
                  key={n.id}
                  className="sidebar-link"
                  onClick={() => {
                    setPage(n.id);
                    setMenuOpen(false);
                  }}
                  style={{ fontWeight: page === n.id ? 600 : undefined }}
                >
                  {n.label}
                </button>
              ))}
              <div
                style={{ height: 1, background: "var(--border)", margin: "12px 0" }}
              />
              {user ? (
                <>
                  <button
                    className="sidebar-link"
                    onClick={() => {
                      setPage("dashboard");
                      setMenuOpen(false);
                    }}
                  >
                    <Icon name="home" size={16} />
                    Dashboard
                  </button>
                  <button
                    className="sidebar-link"
                    onClick={async () => {
                      try { await logOut(); } catch(e){} setUser(null);
                      setMenuOpen(false);
                    }}
                  >
                    <Icon name="logout" size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-ghost"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                    onClick={() => {
                      setPage("login");
                      setMenuOpen(false);
                    }}
                  >
                    Log In
                  </button>
                  <button
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => {
                      setPage("signup");
                      setMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
              <div style={{ marginTop: 12, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <button
                  className="sidebar-link"
                  onClick={() => setDarkMode(!darkMode)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name={darkMode ? "sun" : "moon"} size={16} />
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch on={darkMode} onChange={setDarkMode} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ─── JOB CARD ────────────────────────────────────────────────────────────────
const JobCard = ({ job, onView, onApply, saved, onSave }) => {
  const company = COMPANIES.find((c) => c.id === job.companyId);
  return (
    <div
      className="card job-card animate-in"
      style={{ padding: 20, position: "relative" }}
    >
      {job.featured && (
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <span className="badge badge-orange">
            <Icon name="star" size={10} /> Featured
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${company?.color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            color: company?.color,
            flexShrink: 0,
            border: `2px solid ${company?.color}33`,
          }}
        >
          {company?.logo}
        </div>
        <div style={{ flex: "1 1 0px", minWidth: "min(0px,100%)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--text)",
                  lineHeight: 1.3,
                }}
              >
                {job.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                {job.company}
              </p>
            </div>
            <button
              onClick={() => onSave(job.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: saved ? "#EF4444" : "var(--text-faint)",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              className="tooltip"
              data-tip={saved ? "Unsave" : "Save Job"}
            >
              <Icon name={saved ? "heart-fill" : "heart"} size={18} />
            </button>
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <Icon name="location" size={12} />
              {job.location}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <Icon name="briefcase" size={12} />
              {job.experience}
            </span>
            <span
              className={`badge ${job.mode === "Remote" ? "badge-green" : job.mode === "Hybrid" ? "badge-violet" : "badge-orange"}`}
            >
              {job.mode}
            </span>
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
          >
            {job.skills.slice(0, 3).map((s) => (
              <span key={s} className="tag" style={{ fontSize: 11 }}>
                {s}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span
                style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 8px" }}
              >
                +{job.skills.length - 3}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--green)" }}>
                {job.salary}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--text-faint)",
                }}
              >
                <Icon name="clock" size={11} />
                {job.posted}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    job.match >= 90
                      ? "var(--green)"
                      : job.match >= 80
                        ? "#7C3AED"
                        : "var(--amber)",
                  background:
                    job.match >= 90
                      ? "var(--tint-green)"
                      : job.match >= 80
                        ? "var(--tint-violet)"
                        : "var(--tint-amber)",
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                <Icon name="lightning" size={11} />
                {job.match}% Match
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center", padding: "9px 12px" }}
              onClick={() => onApply(job)}
            >
              Apply Now
            </button>
            <button className="btn-ghost" onClick={() => onView(job)}>
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
const HomePage = ({ setPage, setJobFilter, user }) => {
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLoc, setSearchLoc] = useState("");
  const [searchExp, setSearchExp] = useState("");
  const { savedJobs, setSavedJobs, showToast } = useContext(AppContext);

  const handleSearch = () => {
    setJobFilter({
      title: searchTitle,
      location: searchLoc,
      experience: searchExp,
    });
    setPage("jobs");
  };

  const handleSave = (jobId) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
    showToast(
      savedJobs.includes(jobId) ? "Job removed" : "Job saved!",
      savedJobs.includes(jobId) ? "error" : "success",
    );
  };

  const stars = Array.from({ length: 60 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    size: Math.random() * 3 + 1,
  }));

  return (
    <div>
      {/* HERO */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #0B1026 0%, #151B3D 50%, #1a0a3d 100%)",
          color: "white",
          padding: "clamp(40px,8vh,100px) clamp(12px,3.5vw,20px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: 480,
        }}
      >
        {stars.map((s, i) => (
          <div
            key={i}
            className="star-bg"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              width: s.size,
              height: s.size,
              opacity: 0.4,
            }}
          />
        ))}
        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "15%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "10%",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 820,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(124,58,237,0.2)",
              border: "1px solid rgba(124,58,237,0.4)",
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: "#C4B5FD",
              marginBottom: 24,
            }}
          >
            <Icon name="lightning" size={14} /> AI-Powered Job Matching · 2026
          </div>
          <h1
            style={{
              fontSize: "clamp(28px,5vw,60px)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Find Work That Moves
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Career Forward.
            </span>
          </h1>
          <p
            style={{
              fontSize: "clamp(14px, 2vw, 18px)",
              color: "var(--text-faint)",
              maxWidth: "min(560px,100%)",
              margin: "0 auto clamp(20px,5vw,36px)",
              lineHeight: 1.7,
            }}
          >
            Discover thousands of opportunities, connect with leading companies,
            and build the career you deserve.
          </p>
          {/* Search Bar */}
          <div
            className="glass"
            style={{
              borderRadius: 18,
              padding: "16px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              maxWidth: 820,
              margin: "0 auto",
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                flex: "2 1 160px", minWidth: "min(160px,100%)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                position: "relative",
              }}
            >
              <Icon
                name="search"
                size={18}
                style={{ position: "absolute", left: 12, color: "var(--text-faint)" }}
              />
              <input
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Job title, skills or company"
                style={{
                  paddingLeft: 40,
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div
              style={{
                flex: "1 1 130px", minWidth: "min(130px,100%)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderLeft: "1px solid var(--border)",
                paddingLeft: 12,
                position: "relative",
              }}
            >
              <Icon
                name="location"
                size={18}
                style={{ position: "absolute", left: 24, color: "var(--text-faint)" }}
              />
              <input
                value={searchLoc}
                onChange={(e) => setSearchLoc(e.target.value)}
                placeholder="Location"
                style={{
                  paddingLeft: 40,
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                }}
              />
            </div>
            <div
              style={{
                flex: "1 1 130px", minWidth: "min(130px,100%)",
                borderLeft: "1px solid var(--border)",
                paddingLeft: 12,
              }}
            >
              <select
                value={searchExp}
                onChange={(e) => setSearchExp(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: searchExp ? "var(--text)" : "var(--text-faint)",
                }}
              >
                <option value="">Experience</option>
                <option>Fresher</option>
                <option>1–3 years</option>
                <option>3–5 years</option>
                <option>5–10 years</option>
                <option>10+ years</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={handleSearch}
              style={{ minWidth: "min(140px,100%)", justifyContent: "center" }}
            >
              <Icon name="search" size={16} /> Search Jobs
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
            Trending:{" "}
            <span
              onClick={() => {
                setJobFilter({ title: "React" });
                setPage("jobs");
              }}
              style={{ color: "#A78BFA", cursor: "pointer", marginLeft: 4 }}
            >
              React Developer
            </span>
            ,{" "}
            <span
              onClick={() => {
                setJobFilter({ title: "ML" });
                setPage("jobs");
              }}
              style={{ color: "#A78BFA", cursor: "pointer", marginLeft: 4 }}
            >
              ML Engineer
            </span>
            ,{" "}
            <span
              onClick={() => {
                setJobFilter({ title: "Product" });
                setPage("jobs");
              }}
              style={{ color: "#A78BFA", cursor: "pointer", marginLeft: 4 }}
            >
              Product Manager
            </span>
          </p>
        </div>
        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 40,
            marginTop: 48,
            flexWrap: "wrap",
          }}
        >
          {[
            ["50K+", "Active Jobs"],
            ["12K+", "Companies"],
            ["2M+", "Candidates"],
            ["95%", "Placement Rate"],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        style={{ padding: "clamp(30px,6vw,60px) clamp(12px,3.5vw,20px)", maxWidth: 1200, margin: "0 auto" }}
      >
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Browse by Category
        </h2>
        <p className="section-sub" style={{ textAlign: "center" }}>
          Find your perfect role across the most in-demand fields
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          {[
            { label: "Software Developer", count: "8.4K", icon: "💻" },
            { label: "Data Analyst", count: "3.2K", icon: "📊" },
            { label: "UI/UX Designer", count: "1.8K", icon: "🎨" },
            { label: "Digital Marketing", count: "2.1K", icon: "📣" },
            { label: "Cybersecurity", count: "1.2K", icon: "🔐" },
            { label: "Product Manager", count: "2.6K", icon: "🗂️" },
            { label: "Sales", count: "4.5K", icon: "📈" },
            { label: "Finance", count: "3.7K", icon: "💰" },
          ].map((c) => (
            <button
              key={c.label}
              onClick={() => {
                setJobFilter({ category: c.label });
                setPage("jobs");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                borderRadius: 999,
                border: "1.5px solid var(--border)",
                background: "var(--card)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-strong)",
                transition: "all 0.2s",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--violet)";
                e.currentTarget.style.color = "var(--violet)";
                e.currentTarget.style.background = "var(--tint-violet)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-strong)";
                e.currentTarget.style.background = "var(--card)";
              }}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span> {c.label}
              <span
                style={{
                  background: "var(--tint-violet)",
                  color: "#7C3AED",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section
        style={{ padding: "0 clamp(12px,3.5vw,20px) clamp(30px,6vw,60px)", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 className="section-title">Featured Jobs</h2>
            <p className="section-sub">
              Curated picks from top companies hiring now
            </p>
          </div>
          <button className="btn-outline" onClick={() => setPage("jobs")}>
            View All Jobs <Icon name="chevronRight" size={15} />
          </button>
        </div>
        <div className="grid-3">
          {JOBS.filter((j) => j.featured).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedJobs.includes(job.id)}
              onSave={handleSave}
              onView={(j) => {
                setJobFilter({ selected: j });
                setPage("job-detail");
              }}
              onApply={(j) => {
                if (!user) {
                  showToast("Please sign in to apply for jobs", "error");
                  setPage("login");
                  return;
                }
                setJobFilter({ selected: j });
                setPage("apply-job");
              }}
            />
          ))}
        </div>
      </section>

      {/* AI FEATURES */}
      <section
        style={{
          background: "linear-gradient(135deg, #0B1026, #151B3D)",
          padding: "clamp(36px,7vw,72px) clamp(12px,3.5vw,20px)",
          color: "white",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 clamp(12px,3.5vw,20px)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(124,58,237,0.25)",
                border: "1px solid rgba(124,58,237,0.5)",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: "#C4B5FD",
                marginBottom: 20,
              }}
            >
              <Icon name="ai" size={13} /> Powered by AI
            </div>
            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 42px)",
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Your Career,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Supercharged by AI
              </span>
            </h2>
            <p
              style={{
                color: "var(--text-faint)",
                fontSize: 16,
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              Our AI engine analyzes your skills and experience to surface the
              most relevant jobs, score your profile, and give actionable advice
              to level up your career faster.
            </p>
            {[
              {
                icon: "lightning",
                title: "AI Match Score",
                desc: "Know your fit before you apply — see exactly why a role is or isn't right for you.",
              },
              {
                icon: "file",
                title: "Resume Analysis",
                desc: "Get instant feedback on your resume with skill gap analysis and improvement tips.",
              },
              {
                icon: "bell",
                title: "Smart Alerts",
                desc: "Never miss an opportunity — get notified the moment a matching job goes live.",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{ display: "flex", gap: 14, marginBottom: 20 }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(124,58,237,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={f.icon} size={18} style={{ color: "#A78BFA" }} />
                </div>
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.5 }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => setPage("signup")}
            >
              {" "}
              Get Started Free <Icon name="chevronRight" size={15} />
            </button>
          </div>
          {/* AI Score Card */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="card" style={{ width: 300, padding: 24 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "conic-gradient(var(--violet) 92%, var(--border) 0%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "var(--card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: 20,
                        background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      92%
                    </span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>
                  AI Match Score
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  Senior Frontend Developer · Google
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  ["React / TypeScript", 98],
                  ["System Design", 85],
                  ["GraphQL", 78],
                  ["Cloud (GCP)", 60],
                ].map(([skill, pct]) => (
                  <div key={skill}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-strong)",
                        marginBottom: 4,
                      }}
                    >
                      <span>{skill}</span>
                      <span
                        style={{
                          color:
                            pct > 85
                              ? "var(--green)"
                              : pct > 70
                                ? "#7C3AED"
                                : "var(--amber)",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                <Icon name="send" size={14} /> Apply with AI Match
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TOP COMPANIES */}
      <section
        style={{ padding: "clamp(36px,7vw,72px) clamp(12px,3.5vw,20px)", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 className="section-title">Top Companies Hiring</h2>
            <p className="section-sub">
              World-class companies actively looking for talent
            </p>
          </div>
          <button className="btn-outline" onClick={() => setPage("companies")}>
            All Companies <Icon name="chevronRight" size={15} />
          </button>
        </div>
        <div
          className="grid-3"
          style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
        >
          {COMPANIES.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className="card company-card"
              style={{ padding: 20, textAlign: "center", cursor: "pointer" }}
              onClick={() => {
                setJobFilter({ companyId: c.id });
                setPage("jobs");
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${c.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 900,
                  color: c.color,
                  margin: "0 auto 12px",
                  border: `2px solid ${c.color}33`,
                }}
              >
                {c.logo}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                {c.industry}
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <span className="badge badge-violet">{c.size}</span>
                <span className="badge badge-green">{c.jobs} Jobs</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
          padding: "64px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 40px)",
            fontWeight: 900,
            color: "white",
            marginBottom: 12,
          }}
        >
          Ready to launch your career?
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.85)",
            marginBottom: 32,
          }}
        >
          Join 2M+ professionals who found their dream job on CareerNova.
        </p>
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setPage("signup")}
            style={{
              background: "var(--card)",
              color: "#7C3AED",
              border: "none",
              padding: "14px 32px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="user" size={16} /> Get Started Free
          </button>
          <button
            onClick={() => setPage("employer")}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "2px solid rgba(255,255,255,0.5)",
              padding: "14px 32px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="building" size={16} /> Post a Job
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#0B1026",
          color: "var(--text-faint)",
          padding: "48px 20px 28px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 40,
              marginBottom: 40,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <CnLogoDark size={30} textSize={17} />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                India's most advanced AI-powered job platform. Connecting talent
                with opportunity since 2024.
              </p>
            </div>
            {[
              [
                "For Job Seekers",
                [
                  "Find Jobs",
                  "Companies",
                  "Resume Builder",
                  "Career Resources",
                  "Job Alerts",
                ],
              ],
              [
                "For Employers",
                [
                  "Post a Job",
                  "Search Candidates",
                  "Analytics",
                  "Pricing",
                  "Enterprise",
                ],
              ],
              ["Company", ["About", "Blog", "Careers", "Press", "Contact"]],
            ].map(([title, links]) => (
              <div key={title}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "white",
                    marginBottom: 16,
                    fontSize: 14,
                  }}
                >
                  {title}
                </div>
                {links.map((l) => (
                  <div
                    key={l}
                    style={{
                      fontSize: 13,
                      marginBottom: 10,
                      cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#A78BFA")}
                    onMouseLeave={(e) => (e.target.style.color = "var(--text-faint)")}
                  >
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid #1F2937",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13 }}>
              © 2026 CareerNova. All rights reserved.
            </span>
            <span style={{ fontSize: 13 }}>Privacy · Terms · Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── JOBS PAGE ───────────────────────────────────────────────────────────────
const JobsPage = ({ jobFilter, setPage, setJobFilter, user }) => {
  const { savedJobs, setSavedJobs, showToast, applications, setApplications } =
    useContext(AppContext);
  const [filters, setFilters] = useState({
    type: "",
    mode: "",
    salary: "",
    experience: "",
    category: jobFilter?.category || "",
    query: jobFilter?.title || "",
    location: jobFilter?.location || "",
  });
  const [sort, setSort] = useState("relevant");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = JOBS.filter((j) => {
    if (
      filters.query &&
      !j.title.toLowerCase().includes(filters.query.toLowerCase()) &&
      !j.skills.some((s) =>
        s.toLowerCase().includes(filters.query.toLowerCase()),
      ) &&
      !j.company.toLowerCase().includes(filters.query.toLowerCase())
    )
      return false;
    if (
      filters.location &&
      !j.location.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;
    if (filters.type && j.type !== filters.type) return false;
    if (filters.mode && j.mode !== filters.mode) return false;
    if (filters.category && j.category !== filters.category) return false;
    if (jobFilter?.companyId && j.companyId !== jobFilter.companyId)
      return false;
    return true;
  }).sort((a, b) => {
    if (sort === "match") return b.match - a.match;
    if (sort === "recent") return a.posted.localeCompare(b.posted);
    return b.match - a.match;
  });

  const handleSave = (jobId) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
    showToast(
      savedJobs.includes(jobId) ? "Job removed" : "Job saved! ❤️",
      savedJobs.includes(jobId) ? "error" : "success",
    );
  };
  const handleApply = (job) => {
    if (!user) {
      showToast("Please sign in to apply for jobs", "error");
      setPage("login");
      return;
    }
    setJobFilter({ selected: job });
    setPage("apply-job");
  };

  const FiltersPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          <Icon name="filter" size={15} /> Filters
        </span>
        <button
          style={{
            fontSize: 12,
            color: "#7C3AED",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={() =>
            setFilters({
              type: "",
              mode: "",
              salary: "",
              experience: "",
              category: "",
              query: "",
              location: "",
            })
          }
        >
          Clear All
        </button>
      </div>
      {[
        {
          label: "Job Type",
          key: "type",
          opts: ["", "Full-time", "Part-time", "Contract", "Internship"],
        },
        {
          label: "Work Mode",
          key: "mode",
          opts: ["", "Remote", "Hybrid", "On-site", "Online", "Offline"],
        },
        { label: "Category", key: "category", opts: ["", ...CATEGORIES] },
        {
          label: "Experience",
          key: "experience",
          opts: ["", "Fresher", "1–3 years", "3–5 years", "5–10 years"],
        },
      ].map((f) => (
        <div key={f.key} className="form-group">
          <label>{f.label}</label>
          <select
            value={filters[f.key]}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
          >
            {f.opts.map((o) => (
              <option key={o} value={o}>
                {o || `All ${f.label}s`}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(14px,3vw,28px) clamp(12px,3.5vw,20px)" }}>
      {/* Search Bar */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 2, minWidth: 180, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-faint)",
            }}
          >
            <Icon name="search" size={16} />
          </div>
          <input
            style={{ paddingLeft: 38 }}
            value={filters.query}
            onChange={(e) =>
              setFilters((p) => ({ ...p, query: e.target.value }))
            }
            placeholder="Job title, skills, or company"
          />
        </div>
        <div style={{ flex: "1 1 130px", minWidth: "min(130px,100%)", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-faint)",
            }}
          >
            <Icon name="location" size={16} />
          </div>
          <input
            style={{ paddingLeft: 38 }}
            value={filters.location}
            onChange={(e) =>
              setFilters((p) => ({ ...p, location: e.target.value }))
            }
            placeholder="Location"
          />
        </div>
        <button
          className="show-mobile btn-ghost"
          onClick={() => setSidebarOpen(true)}
        >
          <Icon name="filter" size={16} /> Filters
        </button>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {/* Sidebar – desktop */}
        <div
          className="card hide-mobile"
          style={{
            width: 240,
            minWidth: 220,
            padding: 20,
            alignSelf: "flex-start",
            position: "sticky",
            top: 76,
          }}
        >
          <FiltersPanel />
        </div>
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <>
            <div className="overlay" onClick={() => setSidebarOpen(false)} />
            <div
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: "min(300px,88vw)",
                height: "100dvh",
                background: "var(--card)",
                zIndex: 60,
                padding: "clamp(14px,4vw,24px)",
                overflowY: "auto",
                boxShadow: "8px 0 40px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 16 }}>Filters</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
              <FiltersPanel />
              <button
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 20,
                }}
                onClick={() => setSidebarOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </>
        )}
        {/* Main */}
        <div style={{ flex: "1 1 0px", minWidth: "min(0px,100%)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 15 }}>
              <span style={{ color: "#7C3AED", fontWeight: 700 }}>
                {filtered.length}
              </span>{" "}
              jobs found
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Sort:</span>
              <select
                style={{ width: "auto", padding: "7px 12px", fontSize: 13 }}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="relevant">Most Relevant</option>
                <option value="recent">Most Recent</option>
                <option value="match">Highest Match</option>
              </select>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3
                style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}
              >
                No jobs found
              </h3>
              <p style={{ color: "var(--text-faint)" }}>
                Try adjusting your filters or search terms.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={() =>
                  setFilters({
                    type: "",
                    mode: "",
                    salary: "",
                    experience: "",
                    category: "",
                    query: "",
                    location: "",
                  })
                }
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={savedJobs.includes(job.id)}
                  onSave={handleSave}
                  onView={(j) => {
                    setJobFilter({ selected: j });
                    setPage("job-detail");
                  }}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── JOB DETAIL ──────────────────────────────────────────────────────────────
const JobDetailPage = ({ job, setPage, setJobFilter, user }) => {
  const { savedJobs, setSavedJobs, showToast, applications, setApplications } =
    useContext(AppContext);
  const company = COMPANIES.find((c) => c.id === job.companyId);
  const isSaved = savedJobs.includes(job.id);
  const toggleSave = () => {
    setSavedJobs((prev) =>
      prev.includes(job.id)
        ? prev.filter((id) => id !== job.id)
        : [...prev, job.id],
    );
    showToast(isSaved ? "Job removed" : "Job saved! ❤️", isSaved ? "error" : "success");
  };
  const isApplied = applications.find((a) => a.jobId === job.id);
  const similar = JOBS.filter(
    (j) =>
      j.id !== job.id &&
      (j.category === job.category || j.companyId === job.companyId),
  ).slice(0, 3);

  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState({ reason: "", details: "" });
  const reportReasons = [
    "Fake or suspicious job posting",
    "Wrong information",
    "Salary not as described",
    "Expired / job no longer available",
    "Scam or phishing attempt",
    "Other",
  ];

  const handleSubmitReport = () => {
    if (!report.reason) {
      showToast("Please select a reason", "error");
      return;
    }
    let reports = [];
    try {
      reports = JSON.parse(localStorage.getItem("cn_reports") || "[]");
    } catch {
      reports = [];
    }
    reports.push({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      reason: report.reason,
      details: report.details.trim(),
      date: new Date().toISOString(),
    });
    localStorage.setItem("cn_reports", JSON.stringify(reports));
    setShowReport(false);
    setReport({ reason: "", details: "" });
    showToast("Report submitted. Thank you! 🚩");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(14px,3vw,28px) clamp(12px,3.5vw,20px)" }}>
      <button
        className="btn-ghost"
        onClick={() => setPage("jobs")}
        style={{ marginBottom: 20 }}
      >
        <Icon
          name="chevronRight"
          size={14}
          style={{ transform: "rotate(180deg)" }}
        />{" "}
        Back to Jobs
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Main */}
        <div>
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: `${company?.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 900,
                  color: company?.color,
                  flexShrink: 0,
                }}
              >
                {company?.logo}
              </div>
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: "var(--text)",
                    lineHeight: 1.2,
                  }}
                >
                  {job.title}
                </h1>
                <div
                  style={{ fontWeight: 600, color: "#7C3AED", marginTop: 4 }}
                >
                  {job.company}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    <Icon name="location" size={13} />
                    {job.location}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    <Icon name="briefcase" size={13} />
                    {job.experience}
                  </span>
                  <span
                    className={`badge ${job.mode === "Remote" ? "badge-green" : job.mode === "Hybrid" ? "badge-violet" : "badge-orange"}`}
                  >
                    {job.mode}
                  </span>
                  <span className="badge badge-cyan">{job.type}</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    <Icon name="clock" size={13} />
                    Posted {job.posted}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}
                >
                  {job.salary}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    background: `${job.match >= 90 ? "var(--tint-green)" : "var(--tint-violet)"}`,
                    color: job.match >= 90 ? "var(--green)" : "#7C3AED",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="lightning" size={12} />
                  {job.match}% Match
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                className={`btn-outline ${isSaved ? "" : ""}`}
                onClick={toggleSave}
                title={isSaved ? "Remove from saved jobs" : "Save this job"}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: isSaved ? "var(--tint-red)" : undefined,
                  borderColor: isSaved ? "#EF4444" : undefined,
                  color: isSaved ? "#EF4444" : undefined,
                }}
              >
                <Icon name={isSaved ? "heart-fill" : "heart"} size={16} />
                {isSaved ? "Saved" : "Save Job"}
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => {
                  if (!user) {
                    showToast("Please sign in to apply for jobs", "error");
                    setPage("login");
                    return;
                  }
                  if (isApplied) {
                    showToast("You've already applied to this job!", "error");
                  } else {
                    setPage("apply-job");
                  }
                }}
              >
                {isApplied ? (
                  <>
                    <Icon name="check" size={15} /> Applied
                  </>
                ) : (
                  <>
                    <Icon name="send" size={15} /> Apply Now
                  </>
                )}
              </button>
              <button
                className="btn-ghost"
                onClick={() => showToast("Link copied to clipboard!")}
              >
                <Icon name="share" size={16} />
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowReport(true)}
              >
                <Icon name="flag" size={16} /> Report
              </button>
            </div>
          </div>
          {/* Details */}
          {[
            {
              title: "About the Role",
              content: (
                <p style={{ color: "var(--text-soft)", lineHeight: 1.8 }}>
                  {job.description}
                </p>
              ),
            },
            {
              title: "Key Responsibilities",
              content: (
                <ul
                  style={{ color: "var(--text-soft)", lineHeight: 2, paddingLeft: 18 }}
                >
                  {job.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ),
            },
            {
              title: "Requirements",
              content: (
                <ul
                  style={{ color: "var(--text-soft)", lineHeight: 2, paddingLeft: 18 }}
                >
                  {job.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ),
            },
            {
              title: "Benefits & Perks",
              content: (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {job.benefits.map((b) => (
                    <span
                      key={b}
                      className="tag tag-green"
                      style={{ fontSize: 13 }}
                    >
                      <Icon name="check" size={12} /> {b}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              title: "Required Skills",
              content: (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {job.skills.map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                </div>
              ),
            },
          ].map((section) => (
            <div
              key={section.title}
              className="card"
              style={{ padding: 24, marginBottom: 16 }}
            >
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  marginBottom: 14,
                  color: "var(--text)",
                }}
              >
                {section.title}
              </h2>
              {section.content}
            </div>
          ))}
        </div>
        {/* Sidebar */}
        <div>
          <div className="card" style={{ padding: 22, marginBottom: 16 }}>
            <h3
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 14,
                color: "var(--text)",
              }}
            >
              Company Overview
            </h3>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${company?.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 900,
                  color: company?.color,
                }}
              >
                {company?.logo}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>
                  {company?.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  {company?.industry}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {company?.description}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Company size</span>
              <span style={{ fontWeight: 600, color: "var(--text-strong)" }}>
                {company?.size}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Open positions</span>
              <span style={{ fontWeight: 600, color: "#7C3AED" }}>
                {company?.jobs}
              </span>
            </div>
          </div>
          {/* Similar */}
          <div className="card" style={{ padding: 22 }}>
            <h3
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 14,
                color: "var(--text)",
              }}
            >
              Similar Jobs
            </h3>
            {similar.map((j) => (
              <div
                key={j.id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-soft)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setJobFilter({ selected: j });
                }}
              >
                <div
                  style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}
                >
                  {j.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                  {j.company} · {j.location}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--green)",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {j.salary}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        {showReport && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(3px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setShowReport(false)}
          >
            <div
              className="card"
              style={{
                width: "100%",
                maxWidth: 460,
                padding: 26,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
                  Report this job
                </div>
                <button
                  onClick={() => setShowReport(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                Let us know why you&apos;re reporting{" "}
                <strong style={{ color: "#7C3AED" }}>{job.title}</strong> at{" "}
                {job.company}.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {reportReasons.map((r) => (
                  <label
                    key={r}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      border: `1.5px solid ${report.reason === r ? "#7C3AED" : "var(--border)"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      background: report.reason === r ? "var(--tint-violet)" : "var(--card)",
                      fontSize: 14,
                      color: "var(--text-strong)",
                    }}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      checked={report.reason === r}
                      onChange={() => setReport((p) => ({ ...p, reason: r }))}
                      style={{ width: "auto" }}
                    />
                    {r}
                  </label>
                ))}
              </div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}>
                Additional details (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Describe the issue..."
                value={report.details}
                onChange={(e) => setReport((p) => ({ ...p, details: e.target.value }))}
                style={{ marginTop: 6, marginBottom: 18 }}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={() => setShowReport(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSubmitReport}>
                  <Icon name="flag" size={14} /> Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

// ─── COMPANIES PAGE ───────────────────────────────────────────────────────────
const CompaniesPage = ({ setPage, setJobFilter }) => {
  const [query, setQuery] = useState("");
  const filtered = COMPANIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.industry.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(18px,3.5vw,36px) clamp(12px,3.5vw,20px)" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1 className="section-title">Top Companies</h1>
        <p className="section-sub">
          Explore world-class organizations actively hiring
        </p>
        <div
          style={{ position: "relative", maxWidth: 440, margin: "20px auto 0" }}
        >
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-faint)",
            }}
          >
            <Icon name="search" size={16} />
          </div>
          <input
            style={{ paddingLeft: 42 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies..."
          />
        </div>
      </div>
      <div className="grid-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
        {filtered.map((c) => (
          <div
            key={c.id}
            className="card company-card"
            style={{ padding: 24, textAlign: "center", cursor: "pointer" }}
            onClick={() => {
              setJobFilter({ companyId: c.id });
              setPage("jobs");
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: `${c.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 900,
                color: c.color,
                margin: "0 auto 14px",
                border: `2px solid ${c.color}33`,
              }}
            >
              {c.logo}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
              {c.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
              {c.industry}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              {c.description}
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-violet">{c.size}</span>
              <span className="badge badge-green">{c.jobs} Open Jobs</span>
            </div>
            <button
              className="btn-outline"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 16,
                padding: "8px",
              }}
            >
              View Jobs
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── JOB APPLICATION PAGE ────────────────────────────────────────────────────
const JobApplicationPage = ({ job, setPage, setJobFilter, user }) => {
  const company = COMPANIES.find((c) => c.id === job.companyId);
  const { showToast, applications, setApplications } = useContext(AppContext);
  const isApplied = applications.find((a) => a.jobId === job.id);

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    coverLetter: "",
    linkedin: "",
    portfolio: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be under 5MB", "error");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (!form.email.includes("@")) {
      showToast("Please enter a valid email", "error");
      return;
    }
    if (!form.phone.trim()) {
      showToast("Please enter your phone number", "error");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    if (!isApplied) {
      setApplications((prev) => [
        ...prev,
        {
          jobId: job.id,
          job,
          status: "Applied",
          appliedAt: new Date().toLocaleDateString(),
        },
      ]);
    }
    setSubmitting(false);
    showToast("Application submitted successfully! 🎉");
    setJobFilter({ ...jobFilter, selected: null });
    setPage("job-detail");
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(14px,3vw,28px) clamp(12px,3.5vw,20px)" }}>
      <button
        className="btn-ghost"
        onClick={() => setPage("job-detail")}
        style={{ marginBottom: 20 }}
      >
        <Icon
          name="chevronRight"
          size={14}
          style={{ transform: "rotate(180deg)" }}
        />{" "}
        Back to Job Details
      </button>

      {/* Job Summary Card */}
      <div
        className="card"
        style={{
          padding: 22,
          marginBottom: 24,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `${company?.color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 900,
            color: company?.color,
            border: `2px solid ${company?.color}33`,
            flexShrink: 0,
          }}
        >
          {company?.logo}
        </div>
        <div style={{ flex: "1 1 200px", minWidth: "min(200px,100%)" }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
            {job.title}
          </h2>
          <p style={{ fontSize: 14, color: "#7C3AED", fontWeight: 600 }}>
            {job.company}
          </p>
          <div
            style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <Icon name="location" size={12} />
              {job.location}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <Icon name="briefcase" size={12} />
              {job.experience}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--green)" }}>
              {job.salary}
            </span>
          </div>
        </div>
        <div
          style={{
            background: `${job.match >= 90 ? "var(--tint-green)" : "var(--tint-violet)"}`,
            color: job.match >= 90 ? "var(--green)" : "#7C3AED",
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name="lightning" size={12} />
          {job.match}% Match
        </div>
      </div>

      <h1
        style={{
          fontWeight: 800,
          fontSize: 24,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        Apply for this position
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
        Fill out the form below to submit your application to {company?.name}.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left Column – Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Personal Information */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--tint-violet)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7C3AED",
                }}
              >
                <Icon name="user" size={16} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                Personal Information
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--tint-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--teal)",
                }}
              >
                <Icon name="share" size={16} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                Online Presence
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={form.linkedin}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, linkedin: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Portfolio / Website</label>
                <input
                  placeholder="https://yoursite.com"
                  value={form.portfolio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, portfolio: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--tint-amber)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--amber)",
                }}
              >
                <Icon name="messageSquare" size={16} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                Cover Letter
              </h3>
            </div>
            <div className="form-group">
              <textarea
                rows={6}
                placeholder="Tell us why you're a great fit for this role..."
                value={form.coverLetter}
                onChange={(e) =>
                  setForm((p) => ({ ...p, coverLetter: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
              <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
                {form.coverLetter.length} / 2000 characters
              </p>
            </div>
          </div>
        </div>

        {/* Right Column – Resume & Submit */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Resume Upload */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--tint-green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--green)",
                }}
              >
                <Icon name="file" size={16} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                Resume / CV
              </h3>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: 14,
                padding: "clamp(18px,3.5vw,36px) clamp(12px,3.5vw,20px)",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                background: resumeFile ? "var(--tint-green)" : "var(--border-soft)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--violet)";
                e.currentTarget.style.background = "var(--tint-violet)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = resumeFile
                  ? "var(--green)"
                  : "var(--border)";
                e.currentTarget.style.background = resumeFile
                  ? "var(--tint-green)"
                  : "var(--border-soft)";
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {resumeFile ? (
                <>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "var(--tint-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Icon name="check" size={22} style={{ color: "var(--green)" }} />
                  </div>
                  <p
                    style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}
                  >
                    {resumeFile.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {(resumeFile.size / 1024).toFixed(0)} KB · Click to replace
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "var(--border-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Icon
                      name="upload"
                      size={22}
                      style={{ color: "var(--text-faint)" }}
                    />
                  </div>
                  <p
                    style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}
                  >
                    Click to upload your resume
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
                    PDF, DOC, or DOCX (max 5MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Application Tips */}
          <div
            className="card"
            style={{
              padding: 24,
              background: "var(--auth-bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Icon name="ai" size={18} style={{ color: "#7C3AED" }} />
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                Application Tips
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Tailor your cover letter to this specific role",
                "Highlight relevant skills from the job description",
                "Keep your resume concise and well-formatted",
                "Double-check all information before submitting",
              ].map((tip, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#7C3AED",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Icon name="check" size={12} style={{ color: "white" }} />
                  </div>
                  <span
                    style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.5 }}
                  >
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          <div className="card" style={{ padding: 24 }}>
            <h3
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "var(--text)",
                marginBottom: 12,
              }}
            >
              Required Skills
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {job.skills.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px 24px",
              fontSize: 16,
              opacity: submitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Icon name="send" size={18} /> Submit Application
              </>
            )}
          </button>
          <p style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
            By submitting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const DashboardPage = ({ user, setPage, setJobFilter, profile, setProfile }) => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { savedJobs, setSavedJobs, applications, setApplications, showToast } =
    useContext(AppContext);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "profile", label: "My Profile", icon: "user" },
    { id: "applications", label: "Applied Jobs", icon: "send" },
    { id: "saved", label: "Saved Jobs", icon: "heart" },
    { id: "alerts", label: "Job Alerts", icon: "bell" },
    { id: "resume", label: "Resume", icon: "file" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashSection
            user={user}
            setActiveSection={setActiveSection}
            applications={applications}
            savedJobs={savedJobs}
            setPage={setPage}
            setJobFilter={setJobFilter}
            profile={profile}
          />
        );
      case "profile":
        return <ProfileSection user={user} showToast={showToast} profile={profile} setProfile={setProfile} />;
      case "applications":
        return (
          <ApplicationsSection
            applications={applications}
            setPage={setPage}
            setJobFilter={setJobFilter}
          />
        );
      case "saved":
        return (
          <SavedSection
            savedJobs={savedJobs}
            setSavedJobs={setSavedJobs}
            setPage={setPage}
            setJobFilter={setJobFilter}
            user={user}
          />
        );
      case "alerts":
        return <AlertsSection showToast={showToast} />;
      case "resume":
        return <ResumeSection showToast={showToast} />;
      case "settings":
        return <SettingsSection showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <>
    <div
      className="dash-layout"
      style={{
        display: "flex",
        alignItems: "flex-start",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(14px,3vw,24px) clamp(12px,3.5vw,20px)",
        gap: "clamp(12px,2vw,24px)",
      }}
    >
      {/* Sidebar */}
      <div
        className="card hide-mobile"
        style={{
          width: 230,
          minWidth: 220,
          flexShrink: 0,
          padding: 16,
          alignSelf: "flex-start",
          position: "sticky",
          top: 76,
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "8px 12px",
            marginBottom: 16,
            background: "var(--bg)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {user?.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{user?.role}</div>
          </div>
        </div>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activeSection === item.id ? "active" : ""}`}
            onClick={() => setActiveSection(item.id)}
          >
            <Icon name={item.icon} size={16} /> {item.label}
            {item.id === "applications" && applications.length > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "#7C3AED",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 999,
                }}
              >
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="dash-content" style={{ flex: 1, minWidth: 0, maxWidth: "100%", alignSelf: "flex-start" }}>{renderSection()}</div>
    </div>

    {/* Mobile tab bar — fixed, outside the flex layout */}
    <div
      className="show-mobile"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
        zIndex: 40,
        padding: "6px 0",
        paddingBottom: "env(safe-area-inset-bottom,6px)",
      }}
    >
      {sidebarItems.slice(0, 5).map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveSection(item.id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 4px",
            color: activeSection === item.id ? "#7C3AED" : "var(--text-faint)",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          <Icon name={item.icon} size={18} />
          {item.label.split(" ")[0]}
        </button>
      ))}
    </div>
    </>
  );
};

const DashSection = ({
  user,
  setActiveSection,
  applications,
  savedJobs,
  setPage,
  setJobFilter,
  profile,
}) => {
  // Derived stats from real data
  const interviewCount = applications.filter(
    (a) => ["Interview", "Shortlisted", "Selected"].includes(a.status)
  ).length;
  const profileViews = applications.length * 12 + 15 + savedJobs.length * 3;
  const completion = computeProfileStrength(profile);
  const stats = [
    {
      label: "Applications",
      value: applications.length,
      icon: "send",
      color: "#7C3AED",
      bg: "var(--tint-violet)",
    },
    {
      label: "Saved Jobs",
      value: savedJobs.length,
      icon: "heart",
      color: "#EF4444",
      bg: "var(--tint-red)",
    },
    {
      label: "Profile Views",
      value: profileViews,
      icon: "eye",
      color: "var(--green)",
      bg: "var(--tint-green)",
    },
    {
      label: "Interviews",
      value: interviewCount,
      icon: "trending",
      color: "var(--amber)",
      bg: "var(--tint-amber)",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text)" }}>
        Welcome back, {user?.name?.split(" ")[0]} 👋
      </div>
      <div className="grid-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.color,
                }}
              >
                <Icon name={s.icon} size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Profile completion */}
      <div className="card" style={{ padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--text)" }}>
            Profile Strength
          </div>
          <span style={{ fontWeight: 700, color: "#7C3AED", fontSize: 18 }}>
            {completion}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${completion}%` }} />
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}
        >
          {[
            ["✅ Basic Info", !!(profile?.form?.name && profile?.form?.email)],
            ["✅ Work Experience", (profile?.experience || []).length > 0],
            ["⚠️ Add Skills", (profile?.skills || []).length >= 3],
            ["⚠️ Upload Resume", false],
            ["⚠️ Add Projects", false],
          ].map(([item, done]) => (
            <span
              key={item}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 999,
                background: done ? "var(--tint-green)" : "var(--tint-amber)",
                color: done ? "var(--green)" : "var(--amber)",
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <button
          className="btn-outline"
          style={{ marginTop: 14 }}
          onClick={() => setActiveSection("profile")}
        >
          Complete Profile
        </button>
      </div>
      {/* AI Recommendations */}
      <div
        className="card"
        style={{
          padding: 22,
          background: "var(--auth-bg)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="ai" size={16} style={{ color: "#7C3AED" }} /> AI Job
          Recommendations
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {JOBS.slice(0, 4).map((j) => (
            <div
              key={j.id}
              onClick={() => {
                setJobFilter({ selected: j });
                setPage("job-detail");
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--card)",
                borderRadius: 12,
                cursor: "pointer",
                border: "1px solid rgba(124,58,237,0.1)",
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}
                >
                  {j.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  {j.company} · {j.location}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: "var(--tint-violet)",
                  color: "#7C3AED",
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                {j.match}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileSection = ({ user, showToast, profile, setProfile }) => {
  // Load profile from profile state or localStorage
  const loadProfile = () => {
    try {
      if (profile?.form && (profile.skills?.length > 0 || profile.experience?.length > 0 || profile.form.name)) return profile;
      return JSON.parse(localStorage.getItem("cn_profile") || "null");
    } catch {
      return null;
    }
  };
  const savedProfile = loadProfile();

  const [form, setForm] = useState(
    savedProfile?.form || {
      name: user?.name || "",
      headline: "",
      location: "",
      about: "",
      email: user?.email || "",
    }
  );
  const [skills, setSkills] = useState(
    savedProfile?.skills || []
  );
  const [experience, setExperience] = useState(
    savedProfile?.experience || []
  );

  const [photo, setPhoto] = useState(savedProfile?.photo || "");

  // Skills state
  const [skillInput, setSkillInput] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // Experience state
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [newExp, setNewExp] = useState({
    role: "",
    company: "",
    period: "",
    desc: "",
  });

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) {
      setAddingSkill(false);
      return;
    }
    if (skills.includes(value)) {
      showToast("Skill already added", "error");
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillInput("");
    setAddingSkill(false);
    showToast(`Added "${value}" ✅`);
  };

  const removeSkill = (s) => {
    setSkills((prev) => prev.filter((x) => x !== s));
    showToast(`Removed "${s}"`);
  };

  const saveAll = () => {
    const profileData = { form, skills, experience, photo };
    localStorage.setItem("cn_profile", JSON.stringify(profileData));
    if (setProfile) setProfile({ form, skills, experience });
    showToast("Profile saved! ✅");
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      showToast("Profile photo updated ✅");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExpSubmit = () => {
    if (!newExp.role.trim() || !newExp.company.trim()) {
      showToast("Role and company are required", "error");
      return;
    }
    if (editingExp !== null) {
      setExperience((prev) =>
        prev.map((e, i) => (i === editingExp ? { ...newExp } : e))
      );
      showToast("Experience updated ✅");
    } else {
      setExperience((prev) => [...prev, { ...newExp }]);
      showToast("Experience added ✅");
    }
    setNewExp({ role: "", company: "", period: "", desc: "" });
    setShowExpForm(false);
    setEditingExp(null);
  };

  const removeExperience = (i) => {
    setExperience((prev) => prev.filter((_, idx) => idx !== i));
    showToast("Experience removed");
  };

  const startEditExp = (i) => {
    setEditingExp(i);
    setNewExp(experience[i]);
    setShowExpForm(true);
  };

  const expInputs = [
    { key: "role", label: "Job Title", ph: "e.g. Senior Frontend Developer" },
    { key: "company", label: "Company", ph: "e.g. Google" },
    { key: "period", label: "Period", ph: "e.g. 2022 – Present" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>
        My Profile
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 900,
                fontSize: 32,
                overflow: "hidden",
              }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                form.name.charAt(0)
              )}
            </div>
            <label
              htmlFor="profile-photo"
              title="Upload profile photo"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#7C3AED",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "2px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <Icon name="camera" size={13} />
            </label>
            <input
              id="profile-photo"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-faint)",
                marginTop: 4,
              }}
            >
              Upload DP
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
              {form.name}
            </div>
            <div style={{ color: "#7C3AED", fontSize: 14, fontWeight: 600 }}>
              {form.headline}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-faint)",
                marginTop: 2,
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <Icon name="location" size={12} />
              {form.location}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div
              style={{
                textAlign: "center",
                background: "var(--tint-violet)",
                padding: "12px 20px",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 22, color: "#7C3AED" }}>
                {Math.min(40 + skills.length * 3 + experience.length * 5, 100)}%
              </div>
              <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>
                Profile Strength
              </div>
            </div>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Professional Headline</label>
            <input
              value={form.headline}
              onChange={(e) =>
                setForm((p) => ({ ...p, headline: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              value={form.location}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label>About</label>
          <textarea
            rows={3}
            value={form.about}
            onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Skills</span>
          {!addingSkill && (
            <button
              className="btn-ghost"
              style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={() => setAddingSkill(true)}
            >
              <Icon name="plus" size={12} /> Add Skill
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {skills.map((s) => (
            <span key={s} className="tag">
              {s}
              <button
                onClick={() => removeSkill(s)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#7C3AED",
                  marginLeft: 4,
                  padding: "0 0 0 2px",
                  fontSize: 12,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {addingSkill && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <input
              autoFocus
              style={{ flex: 1 }}
              value={skillInput}
              placeholder="Type a skill and press Add"
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSkill();
              }}
            />
            <button className="btn-primary" onClick={addSkill}>
              Add
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setAddingSkill(false);
                setSkillInput("");
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {/* Experience */}
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Experience</span>
          {!showExpForm && (
            <button
              className="btn-ghost"
              style={{ padding: "4px 12px", fontSize: 12 }}
              onClick={() => {
                setEditingExp(null);
                setNewExp({ role: "", company: "", period: "", desc: "" });
                setShowExpForm(true);
              }}
            >
              <Icon name="plus" size={12} /> Add Experience
            </button>
          )}
        </div>

        {experience.map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              paddingBottom: 16,
              borderBottom:
                i < experience.length - 1 ? "1px solid var(--border-soft)" : "none",
              marginBottom: i < experience.length - 1 ? 16 : 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--tint-violet)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <Icon name="briefcase" size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>{e.role}</div>
              <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>
                {e.company}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                {e.period}
              </div>
              {e.desc && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {e.desc}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7C3AED",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: 0,
                  }}
                  onClick={() => startEditExp(i)}
                >
                  Edit
                </button>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: 0,
                  }}
                  onClick={() => removeExperience(i)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {showExpForm && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border-soft)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              {editingExp !== null ? "Edit Experience" : "Add Experience"}
            </div>
            <div className="grid-2">
              {expInputs.map((f) => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    value={newExp[f.key]}
                    placeholder={f.ph}
                    onChange={(e) =>
                      setNewExp((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={2}
                value={newExp.desc}
                onChange={(e) =>
                  setNewExp((p) => ({ ...p, desc: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn-primary" onClick={handleExpSubmit}>
                {editingExp !== null ? "Save Changes" : "Add Experience"}
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowExpForm(false);
                  setEditingExp(null);
                  setNewExp({ role: "", company: "", period: "", desc: "" });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        className="btn-primary"
        style={{ alignSelf: "flex-start" }}
        onClick={saveAll}
      >
        <Icon name="check" size={15} /> Save Changes
      </button>
    </div>
  );
};

const ApplicationsSection = ({ applications, setPage, setJobFilter }) => {
  const statusColors = {
    Applied: "badge-violet",
    "Application Viewed": "badge-cyan",
    Shortlisted: "badge-orange",
    Interview: "badge-orange",
    Selected: "badge-green",
    Rejected: "badge-red",
  };
  const allStatuses = [
    "Applied",
    "Application Viewed",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected",
  ];
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text)",
          marginBottom: 20,
        }}
      >
        Applied Jobs
      </div>
      {applications.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontWeight: 700 }}>No applications yet</h3>
          <p style={{ color: "var(--text-faint)" }}>
            Start applying to jobs to track your progress here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {applications.map((app, i) => {
            const statusIdx = allStatuses.indexOf(app.status);
            return (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      onClick={() => {
                        setJobFilter({ selected: app.job });
                        setPage("job-detail");
                      }}
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#7C3AED",
                        cursor: "pointer",
                      }}
                    >
                      {app.job.title}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}
                    >
                      {app.job.company} · {app.job.location}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}
                    >
                      Applied on {app.appliedAt}
                    </div>
                  </div>
                  <span
                    className={`badge ${statusColors[app.status] || "badge-violet"}`}
                  >
                    {app.status}
                  </span>
                </div>
                {/* Status Timeline */}
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  {allStatuses.slice(0, 5).map((s, si) => (
                    <div
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flex: si < 4 ? 1 : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background:
                            si <= statusIdx
                              ? "linear-gradient(135deg, #7C3AED, #22D3EE)"
                              : "var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {si < statusIdx && (
                          <Icon
                            name="check"
                            size={11}
                            style={{ color: "white" }}
                          />
                        )}
                        {si === statusIdx && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "var(--card)",
                            }}
                          />
                        )}
                      </div>
                      {si < 4 && (
                        <div
                          style={{
                            height: 2,
                            flex: 1,
                            background: si < statusIdx ? "#7C3AED" : "var(--border)",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  {allStatuses.slice(0, 5).map((s, si) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 9,
                        color: si <= statusIdx ? "#7C3AED" : "var(--text-faint)",
                        fontWeight: si === statusIdx ? 700 : 400,
                        textAlign: "center",
                        flex: si < 4 ? 1 : "none",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <button
                  className="btn-ghost"
                  style={{ marginTop: 14, padding: "7px 14px" }}
                  onClick={() => {
                    setJobFilter({ selected: app.job });
                    setPage("job-detail");
                  }}
                >
                  View Job Details →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SavedSection = ({ savedJobs, setSavedJobs, setPage, setJobFilter, user }) => {
  const { showToast, applications, setApplications } = useContext(AppContext);
  const saved = JOBS.filter((j) => savedJobs.includes(j.id));
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text)",
          marginBottom: 20,
        }}
      >
        Saved Jobs
      </div>
      {saved.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
          <h3 style={{ fontWeight: 700 }}>No saved jobs</h3>
          <p style={{ color: "var(--text-faint)" }}>
            Save interesting jobs and come back to apply later.
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => setPage("jobs")}
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        saved.map((job) => (
          <div
            key={job.id}
            className="card"
            style={{ padding: 18, marginBottom: 14 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}
                >
                  {job.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
                  {job.company} · {job.location}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--green)",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {job.salary}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {job.skills.slice(0, 3).map((s) => (
                    <span key={s} className="tag" style={{ fontSize: 11 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setSavedJobs((prev) => prev.filter((id) => id !== job.id));
                  showToast("Job removed");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#EF4444",
                }}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center", padding: "8px" }}
                onClick={() => {
                  if (!user) {
                    showToast("Please sign in to apply for jobs", "error");
                    setPage("login");
                    return;
                  }
                  setJobFilter({ selected: job });
                  setPage("apply-job");
                }}
              >
                Apply Now
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setJobFilter({ selected: job });
                  setPage("job-detail");
                }}
              >
                Details
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const AlertsSection = ({ showToast }) => {
  const loadAlerts = () => {
    try {
      return JSON.parse(localStorage.getItem("cn_alerts") || "null");
    } catch {
      return null;
    }
  };
  const savedAlerts = loadAlerts();
  const [alerts, setAlerts] = useState(
    savedAlerts || [
      {
        id: 1,
        title: "React Developer",
        location: "Bengaluru",
        frequency: "Daily",
        active: true,
      },
      {
        id: 2,
        title: "Product Manager",
        location: "Remote",
        frequency: "Weekly",
        active: true,
      },
    ]
  );
  const [form, setForm] = useState({
    title: "",
    location: "",
    experience: "",
    frequency: "Daily",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("cn_alerts", JSON.stringify(alerts));
    } catch {}
  }, [alerts]);

  const handleCreate = () => {
    if (!form.title.trim()) {
      setError("Enter a job title or skills to create an alert.");
      return;
    }
    setAlerts((prev) => [
      ...prev,
      { id: Date.now(), ...form, active: true },
    ]);
    setForm({
      title: "",
      location: "",
      experience: "",
      frequency: "Daily",
    });
    setError("");
    showToast("Alert created! 🔔");
  };
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text)",
          marginBottom: 20,
        }}
      >
        Job Alerts
      </div>
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
          Create New Alert
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Job Title / Skills</label>
            <input
              value={form.title}
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                if (error) setError("");
              }}
              placeholder="e.g. React Developer"
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              value={form.location}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="e.g. Bengaluru or Remote"
            />
          </div>
          <div className="form-group">
            <label>Experience Level</label>
            <select
              value={form.experience}
              onChange={(e) =>
                setForm((p) => ({ ...p, experience: e.target.value }))
              }
            >
              <option>Any</option>
              <option>Fresher</option>
              <option>1–3 years</option>
              <option>3–5 years</option>
            </select>
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select
              value={form.frequency}
              onChange={(e) =>
                setForm((p) => ({ ...p, frequency: e.target.value }))
              }
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Instant</option>
            </select>
          </div>
        </div>
        {error && (
          <div
            style={{
              color: "#EF4444",
              fontSize: 12,
              marginTop: 10,
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}
        <button
          className="btn-primary"
          style={{ marginTop: 14 }}
          onClick={handleCreate}
        >
          <Icon name="bell" size={15} /> Create Alert
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((a) => (
          <div
            key={a.id}
            className="card"
            style={{
              padding: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
                {a.location || "Any location"} · {a.frequency}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="badge"
                style={{
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  padding: 0,
                }}
                onClick={() =>
                  setAlerts((prev) =>
                    prev.map((al) =>
                      al.id === a.id ? { ...al, active: !al.active } : al
                    )
                  )
                }
                title={a.active ? "Click to pause" : "Click to activate"}
              >
                <span
                  className={`badge ${a.active ? "badge-green" : "badge-orange"}`}
                >
                  {a.active ? "Active" : "Paused"}
                </span>
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#EF4444",
                }}
                onClick={() =>
                  setAlerts((prev) => prev.filter((al) => al.id !== a.id))
                }
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResumeSection = ({ showToast }) => {
  const loadResume = () => {
    try {
      return JSON.parse(localStorage.getItem("cn_resume") || "null");
    } catch {
      return null;
    }
  };
  const saved = loadResume();

  const [template, setTemplate] = useState(0);
  const templates = ["Modern", "Classic", "Minimal"];

  const [personal, setPersonal] = useState(
    saved?.personal || {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
    }
  );
  const [jobDetails, setJobDetails] = useState(
    saved?.jobDetails || { title: "", company: "", duration: "", desc: "" }
  );
  const [education, setEducation] = useState(
    saved?.education || { degree: "", institution: "", year: "" }
  );
  const [skills, setSkills] = useState(saved?.skills || "");
  const [custom, setCustom] = useState(
    saved?.custom || { title: "Additional Information", content: "" }
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        "cn_resume",
        JSON.stringify({ personal, jobDetails, education, skills, custom })
      );
    } catch (e) {}
  }, [personal, jobDetails, education, skills, custom]);

  const setP = (k) => (e) =>
    setPersonal((p) => ({ ...p, [k]: e.target.value }));
  const setJ = (k) => (e) =>
    setJobDetails((p) => ({ ...p, [k]: e.target.value }));
  const setE = (k) => (e) =>
    setEducation((p) => ({ ...p, [k]: e.target.value }));
  const setC = (k) => (e) =>
    setCustom((p) => ({ ...p, [k]: e.target.value }));

  const skillList = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const downloadResume = () => {
    const skillHtml = skillList.length
      ? `<div class="section"><h3>Skills</h3><p>${skillList.map(esc).join(", ")}</p></div>`
      : "";
    const expHtml =
      jobDetails.title || jobDetails.company
        ? `<div class="section"><h3>Work Experience</h3><p><strong>${esc(jobDetails.title || "")}</strong>${esc(jobDetails.company ? " · " + jobDetails.company : "")}${esc(jobDetails.duration ? " · " + jobDetails.duration : "")}</p><p>${esc(jobDetails.desc)}</p></div>`
        : "";
    const eduHtml =
      education.degree || education.institution
        ? `<div class="section"><h3>Education</h3><p><strong>${esc(education.degree || "")}</strong>${esc(education.institution ? " · " + education.institution : "")}${esc(education.year ? " · " + education.year : "")}</p></div>`
        : "";
    const custHtml = custom.content.trim()
      ? `<div class="section"><h3>${esc(custom.title || "Additional Information")}</h3><p>${esc(custom.content)}</p></div>`
      : "";
    const headBg =
      template === 0
        ? "linear-gradient(135deg, #7C3AED, #22D3EE)"
        : template === 1
          ? "#151B3D"
          : "#F8FAFC";
    const headColor = template < 2 ? "#fff" : "#1F2937";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(personal.name || "Resume")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
  .head { background: ${headBg}; color: ${headColor}; padding: 28px; border-radius: 10px; margin-bottom: 24px; }
  .head h1 { font-size: 28px; }
  .head .sub { opacity: 0.85; margin-top: 6px; }
  .contact { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; font-size: 13px; opacity: 0.9; }
  .section { margin-bottom: 22px; }
  .section h3 { color: #7C3AED; border-bottom: 2px solid #7C3AED; padding-bottom: 5px; margin-bottom: 8px; font-size: 16px; }
  p { margin: 3px 0; font-size: 14px; }
</style></head><body>
  <div class="head">
    <h1>${esc(personal.name || "Your Name")}</h1>
    <div class="sub">${esc(personal.headline || "Professional Headline")}${esc(personal.location ? " · " + personal.location : "")}</div>
    <div class="contact">
      ${esc(personal.email) ? `<span>${esc(personal.email)}</span>` : ""}
      ${esc(personal.phone) ? `<span>${esc(personal.phone)}</span>` : ""}
      ${esc(personal.linkedin) ? `<span>${esc(personal.linkedin)}</span>` : ""}
    </div>
  </div>
  ${expHtml}${eduHtml}${skillHtml}${custHtml}
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Resume-${(personal.name || "Candidate").replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Resume downloaded! 📄");
  };

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    showToast(`Uploaded "${file.name}" ✅`);
    e.target.value = "";
  };

  const field = (label, value, onChange, ph) => (
    <div className="form-group" style={{ marginBottom: 10 }}>
      <input value={value} onChange={onChange} placeholder={ph || label} />
    </div>
  );

  const headerBg =
    template === 0
      ? "linear-gradient(135deg, #7C3AED, #22D3EE)"
      : template === 1
        ? "#151B3D"
        : "var(--bg)";
  const headerColor = template < 2 ? "white" : "var(--text)";

  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text)",
          marginBottom: 20,
        }}
      >
        Resume Builder
      </div>
      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        {templates.map((t, i) => (
          <button
            key={t}
            onClick={() => setTemplate(i)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: `2px solid ${template === i ? "#7C3AED" : "var(--border)"}`,
              background: template === i ? "var(--tint-violet)" : "var(--card)",
              color: template === i ? "#7C3AED" : "var(--text-strong)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {t} Template
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Personal Details */}
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                color: "var(--text)",
              }}
            >
              Personal Details
            </div>
            {field("Full Name", personal.name, setP("name"), "Full Name")}
            {field("Headline", personal.headline, setP("headline"), "Professional Headline")}
            {field("Email", personal.email, setP("email"), "Email")}
            {field("Phone", personal.phone, setP("phone"), "Phone")}
            {field("Location", personal.location, setP("location"), "Location")}
            {field("LinkedIn", personal.linkedin, setP("linkedin"), "LinkedIn URL")}
          </div>

          {/* Work Experience */}
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                color: "var(--text)",
              }}
            >
              Work Experience
            </div>
            {field("Job Title", jobDetails.title, setJ("title"), "Job Title")}
            {field("Company", jobDetails.company, setJ("company"), "Company")}
            {field("Duration", jobDetails.duration, setJ("duration"), "Duration (e.g. 2022 – Present)")}
            <label
              className="form-group"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}
            >
              Description
              <textarea
                rows={3}
                value={jobDetails.desc}
                onChange={setJ("desc")}
                placeholder="Describe your responsibilities and achievements"
              />
            </label>
          </div>

          {/* Education */}
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                color: "var(--text)",
              }}
            >
              Education
            </div>
            {field("Degree", education.degree, setE("degree"), "Degree / Certification")}
            {field("Institution", education.institution, setE("institution"), "Institution")}
            {field("Year", education.year, setE("year"), "Year (e.g. 2019)")}
          </div>

          {/* Skills */}
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                color: "var(--text)",
              }}
            >
              Skills
            </div>
            <textarea
              rows={3}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Add skills separated by commas, e.g. React, JavaScript, Node.js"
              style={{ marginBottom: 8 }}
            />
          </div>

          {/* Custom Section */}
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 8,
                color: "var(--text)",
              }}
            >
              Custom Section
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 12 }}>
              Create your own section (e.g. Projects, Certifications, Languages).
            </div>
            {field("Section Title", custom.title, setC("title"), "Section title e.g. Projects")}
            <label
              className="form-group"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}
            >
              Content
              <textarea
                rows={3}
                value={custom.content}
                onChange={setC("content")}
                placeholder="Description or bullet points for this section"
              />
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text-faint)",
              marginBottom: 14,
            }}
          >
            Live Preview
          </div>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              padding: 20,
              minHeight: 440,
            }}
          >
            <div
              style={{
                background: headerBg,
                padding: 20,
                borderRadius: 8,
                color: headerColor,
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {personal.name || "Your Name"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                {personal.headline || "Professional Headline"}
                {personal.location ? ` · ${personal.location}` : ""}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 8,
                  fontSize: 11,
                  opacity: 0.9,
                }}
              >
                {personal.email && <span>{personal.email}</span>}
                {personal.phone && <span>{personal.phone}</span>}
                {personal.linkedin && <span>{personal.linkedin}</span>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {(jobDetails.title || jobDetails.company) && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 6,
                      borderBottom: "2px solid #7C3AED",
                      paddingBottom: 4,
                    }}
                  >
                    Experience
                  </div>
                  <p>
                    <strong>{jobDetails.title || ""}</strong>
                    {jobDetails.company && ` · ${jobDetails.company}`}
                    {jobDetails.duration && ` · ${jobDetails.duration}`}
                  </p>
                  {jobDetails.desc && <p>{jobDetails.desc}</p>}
                </div>
              )}
              {(education.degree || education.institution) && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 6,
                      borderBottom: "2px solid #7C3AED",
                      paddingBottom: 4,
                    }}
                  >
                    Education
                  </div>
                  <p>
                    <strong>{education.degree || ""}</strong>
                    {education.institution && ` · ${education.institution}`}
                    {education.year && ` · ${education.year}`}
                  </p>
                </div>
              )}
              {skillList.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 6,
                      borderBottom: "2px solid #7C3AED",
                      paddingBottom: 4,
                    }}
                  >
                    Skills
                  </div>
                  <p>{skillList.join(", ")}</p>
                </div>
              )}
              {custom.content.trim() && (
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 6,
                      borderBottom: "2px solid #7C3AED",
                      paddingBottom: 4,
                    }}
                  >
                    {custom.title || "Additional Information"}
                  </div>
                  <p>{custom.content}</p>
                </div>
              )}
              {!jobDetails.title &&
                !education.degree &&
                skillList.length === 0 &&
                !custom.content.trim() && (
                  <p style={{ color: "var(--text-faint)" }}>
                    Fill in the form on the left — your resume updates here in
                    real time.
                  </p>
                )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={downloadResume}
            >
              <Icon name="download" size={15} /> Download Resume
            </button>
            <label className="btn-ghost" style={{ cursor: "pointer" }}>
              <Icon name="upload" size={15} /> Upload
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.html"
                style={{ display: "none" }}
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const SegmentedChoice = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 8 }}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        style={{
          flex: 1,
          padding: "9px 10px",
          borderRadius: 10,
          border: `1.5px solid ${value === o.value ? "var(--violet)" : "var(--border)"}`,
          background:
            value === o.value ? "var(--tint-violet)" : "transparent",
          color: value === o.value ? "var(--violet)" : "var(--text-muted)",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ─── CHANGE PASSWORD MODAL (with "Forgot current password?" link) ─────────────
const ChangePwModal = ({ onClose, pw, setPw, pwLoading, savePassword, userEmail }) => {
  const auth = getAuth();   // ← fix: declare auth inside the component
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const { showToast } = useContext(AppContext);

  const sendReset = async () => {
    const email = auth.currentUser?.email || userEmail;
    if (!email) { showToast("No email found. Please log in again.", "error"); return; }
    setSending(true);
    try {
      await resetPasswordEmail(email);
      setSent(true);
      showToast("Reset email sent! Check your inbox 📬");
    } catch (err) {
      showToast(err.message || "Failed to send reset email.", "error");
    } finally {
      setSending(false);
    }
  };

  const realEmail = auth.currentUser?.email || userEmail;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="card" style={{
        position:"fixed", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)", zIndex:100,
        width: "min(400px,94vw)", maxWidth: "94vw", padding: "clamp(16px,4vw,28px)",
        animation:"fadeUp 0.2s ease",
      }}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="key" size={16}/>
            </div>
            <span style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Change Password</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}>
            <Icon name="x" size={18}/>
          </button>
        </div>

        {/* ── Sent state ── */}
        {sent ? (
          <div style={{textAlign:"center",padding:"8px 0 4px"}}>
            <div style={{fontSize:44,marginBottom:12}}>📬</div>
            <div style={{fontWeight:700,fontSize:16,color:"var(--text)",marginBottom:8}}>Reset email sent!</div>
            <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,marginBottom:16}}>
              A password reset link was sent to<br/>
              <strong style={{color:"var(--text)"}}>{realEmail}</strong>
            </div>
            <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"12px 16px",textAlign:"left",marginBottom:20}}>
              {["Open the email from Firebase / noreply@…",'Click "Reset password" in the email',"Set your new password on the page that opens","Come back here and log in again ✅"].map((s,i)=>(
                <div key={i} style={{display:"flex",gap:8,fontSize:12,color:"#166534",marginBottom:i<3?6:0}}>
                  <span style={{fontWeight:700,flexShrink:0}}>{i+1}.</span><span>{s}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={onClose}>Done</button>
          </div>
        ) : (
          /* ── Normal form ── */
          <>
            {/* Current password + forgot link */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <label style={{fontSize:13,fontWeight:600,color:"var(--text)",margin:0}}>Current Password</label>
                <button
                  style={{background:"none",border:"none",cursor:sending?"not-allowed":"pointer",fontSize:12,color:"var(--violet)",fontWeight:600,padding:0,opacity:sending?0.6:1}}
                  onClick={sendReset} disabled={sending}>
                  {sending ? "Sending…" : "Forgot current password?"}
                </button>
              </div>
              <input type="password" value={pw.current}
                onChange={e=>setPw(p=>({...p,current:e.target.value}))}
                placeholder="Enter current password"
                style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--border)",borderRadius:10,fontSize:14,outline:"none",fontFamily:"inherit",background:"var(--input-bg,var(--card))",color:"var(--text)"}}
                onFocus={e=>e.target.style.borderColor="var(--violet)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}
              />
              <div style={{fontSize:11,color:"var(--text-faint)",marginTop:4}}>
                Forgot it? Click the link above — we'll email a reset link to <strong>{realEmail}</strong>
              </div>
            </div>

            {/* New password */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:5}}>New Password</label>
              <input type="password" value={pw.next}
                onChange={e=>setPw(p=>({...p,next:e.target.value}))}
                placeholder="At least 6 characters"
                style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--border)",borderRadius:10,fontSize:14,outline:"none",fontFamily:"inherit",background:"var(--input-bg,var(--card))",color:"var(--text)"}}
                onFocus={e=>e.target.style.borderColor="var(--violet)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}
              />
            </div>

            {/* Confirm */}
            <div style={{marginBottom:20}}>
              <label style={{fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:5}}>Confirm New Password</label>
              <input type="password" value={pw.confirm}
                onChange={e=>setPw(p=>({...p,confirm:e.target.value}))}
                placeholder="Re-enter new password"
                style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--border)",borderRadius:10,fontSize:14,outline:"none",fontFamily:"inherit",background:"var(--input-bg,var(--card))",color:"var(--text)"}}
                onFocus={e=>e.target.style.borderColor="var(--violet)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}
              />
            </div>

            <div style={{height:1,background:"var(--border)",marginBottom:16}}/>

            <button className="btn-primary"
              style={{width:"100%",justifyContent:"center",padding:12,opacity:(!pw.current||!pw.next||!pw.confirm||pwLoading)?0.5:1}}
              onClick={savePassword}
              disabled={pwLoading||!pw.current||!pw.next||!pw.confirm}>
              <Icon name="key" size={15}/>
              {pwLoading?" Updating…":" Update Password"}
            </button>
          </>
        )}
      </div>
    </>
  );
};

const SettingsSection = ({ showToast }) => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  // ── read persisted settings ──────────────────────────────────────────────
  const readSettings = () => {
    try { return JSON.parse(localStorage.getItem("cn_settings") || "null") || {}; }
    catch { return {}; }
  };
  const boot = readSettings();

  const [account, setAccount] = useState({
    email:           boot.email           || "candidate@email.com",
    emailVerified:   !!boot.emailVerified,
    passwordUpdated: boot.passwordUpdated || "",
  });
  const [notif, setNotif] = useState({
    jobAlerts:   boot.notif?.jobAlerts   ?? true,
    appUpdates:  boot.notif?.appUpdates  ?? true,
    companyNews: boot.notif?.companyNews ?? false,
  });
  const [privacy, setPrivacy] = useState({
    profile: boot.privacy?.profile || "public",
    resume:  boot.privacy?.resume  || "recruiters",
  });

  // ── modal open/close flags ───────────────────────────────────────────────
  const [showPw,          setShowPw]          = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);

  // ── Change-Password form ─────────────────────────────────────────────────
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Change-Email flow ────────────────────────────────────────────────────
  const [newEmail,       setNewEmail]       = useState("");
  const [emailChangePw,  setEmailChangePw]  = useState("");
  const [emailChangeStep, setEmailChangeStep] = useState("password"); // "password" | "sent"
  const [emailLoading,   setEmailLoading]   = useState(false);

  // ── Email-Verify OTP modal (verify current email) ────────────────────────
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailOtpAttempts, setEmailOtpAttempts] = useState(0);
  const [emailOtpTimer, setEmailOtpTimer] = useState(60);
  const [emailOtpLockTimer, setEmailOtpLockTimer] = useState(0);
  const [emailOtpLockDuration, setEmailOtpLockDuration] = useState(30);
  const emailOtpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const emailOtpTimerRef = useRef(null);
  const emailOtpLockRef = useRef(null);

  // ── persist on every state change ───────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("cn_settings", JSON.stringify({ ...account, notif, privacy }));
    } catch {}
  }, [account, notif, privacy]);

  const auth = getAuth();

  // ════════════════════════════════════════════════════════════════════════
  //  1. VERIFY EMAIL  →  OTP is emailed to the user, then confirmed
  // ════════════════════════════════════════════════════════════════════════
  // Send a 6-digit OTP to the user's email via the OTP server
  const sendEmailVerifyOtp = async () => {
    const user = auth.currentUser;
    if (!user) { showToast("Please log in first", "error"); return false; }
    setEmailVerifyLoading(true);
    setEmailOtpError("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email || account.email,
          name: user.displayName || "",
          purpose: "verify",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send OTP");
      setOtpToken(data.token || "");
      setEmailOtp(["", "", "", "", "", ""]);
      setEmailOtpAttempts(0);
      setEmailOtpTimer(60);
      clearInterval(emailOtpTimerRef.current);
      emailOtpTimerRef.current = setInterval(
        () =>
          setEmailOtpTimer((t) => {
            if (t <= 1) { clearInterval(emailOtpTimerRef.current); return 0; }
            return t - 1;
          }),
        1000,
      );
      return true;
    } catch (err) {
      if (err.code === "auth/too-many-requests")
        showToast("Too many requests — wait a few minutes and try again.", "error");
      else
        showToast("Could not send OTP: " + err.message, "error");
      return false;
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const startEmailVerify = async () => {
    const user = auth.currentUser;
    if (!user) { showToast("Please log in first", "error"); return; }
    if (account.emailVerified) { showToast("Your email is already verified ✅"); return; }
    const ok = await sendEmailVerifyOtp();
    if (ok) {
      setShowEmailVerify(true);
      showToast("OTP sent! Check your email inbox 📬");
    }
  };

  // Resend a fresh OTP from within the verify modal
  const resendEmailOtp = async () => {
    setEmailOtp(["", "", "", "", "", ""]);
    setEmailOtpAttempts(0);
    setEmailOtpLockTimer(0);
    setEmailOtpLockDuration(30);
    clearInterval(emailOtpLockRef.current);
    await sendEmailVerifyOtp();
  };

  // OTP box handlers (single digit + auto-advance)
  const handleEmailOtpKey = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...emailOtp];
    next[i] = val;
    setEmailOtp(next);
    if (val && i < 5) emailOtpRefs[i + 1].current?.focus();
  };
  const handleEmailOtpBackspace = (i, e) => {
    if (e.key === "Backspace" && !emailOtp[i] && i > 0)
      emailOtpRefs[i - 1].current?.focus();
  };

  // Temporary lockout after too many wrong attempts
  const startEmailOtpLock = (secs) => {
    clearInterval(emailOtpLockRef.current);
    setEmailOtpLockTimer(secs);
    emailOtpLockRef.current = setInterval(() => {
      setEmailOtpLockTimer((t) => {
        if (t <= 1) { clearInterval(emailOtpLockRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // Confirm the OTP with the server, then mark the email as verified
  const submitEmailOtp = async () => {
    const entered = emailOtp.join("");
    if (entered.length < 6) { setEmailOtpError("Enter the 6-digit OTP."); return; }
    if (emailOtpLockTimer > 0) return;
    setEmailOtpLoading(true);
    setEmailOtpError("");
    const verifyUser = auth.currentUser;
    const verifyEmail = (verifyUser && verifyUser.email) || account.email;
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpToken, otp: entered }),
      });
      const data = await res.json();
      if (!data.valid) {
        if (data.reason === "expired") {
          setEmailOtpError("OTP has expired. Please resend a new one.");
        } else if (data.reason === "not_found" || data.reason === "invalid") {
          setEmailOtpError("OTP not found. Please resend a new one.");
        } else {
          const newAttempts = emailOtpAttempts + 1;
          setEmailOtpAttempts(newAttempts);
          if (newAttempts >= 3) {
            const dur = emailOtpLockDuration;
            setEmailOtpLockDuration((d) => d + 30);
            startEmailOtpLock(dur);
            setEmailOtpAttempts(0);
            setEmailOtpError(`Too many wrong attempts. Wait ${dur}s before trying again.`);
          } else {
            setEmailOtpError(`Incorrect OTP. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} left.`);
            setTimeout(() => emailOtpRefs[0].current?.focus(), 0);
          }
        }
        return;
      }
      // OTP verified ✓
      clearInterval(emailOtpTimerRef.current);
      setAccount((p) => ({ ...p, emailVerified: true }));
      setShowEmailVerify(false);
      setEmailOtp(["", "", "", "", "", ""]);
      setEmailOtpAttempts(0);
      showToast("Email verified successfully ✅");
    } catch (err) {
      setEmailOtpError(err.message || "Could not verify OTP. Try again.");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  2. CHANGE EMAIL  →  re-auth with password → update email → verify
  // ════════════════════════════════════════════════════════════════════════
  const startEmailChange = () => {
    setNewEmail("");
    setEmailChangePw("");
    setEmailChangeStep("password");
    setShowEmailChange(true);
  };

  const confirmEmailChange = async () => {
    if (!newEmail.includes("@")) { showToast("Enter a valid email address", "error"); return; }
    if (!emailChangePw)          { showToast("Enter your current password", "error"); return; }
    const user = auth.currentUser;
    if (!user) { showToast("Please log in first", "error"); return; }
    setEmailLoading(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, emailChangePw);
      await reauthenticateWithCredential(user, credential);
      // Update the email in Firebase
      await updateEmail(user, newEmail);
      // Send verification to the new address
      await sendEmailVerification(user);
      setAccount(p => ({ ...p, email: newEmail, emailVerified: false }));
      setEmailChangeStep("sent");
      showToast("Email updated! Verification email sent to your new address 📬");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential")
        showToast("Current password is incorrect.", "error");
      else if (err.code === "auth/email-already-in-use")
        showToast("That email is already in use by another account.", "error");
      else if (err.code === "auth/requires-recent-login")
        showToast("Session expired. Please log out and log in again, then retry.", "error");
      else
        showToast("Error: " + err.message, "error");
    } finally {
      setEmailLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  3. CHANGE PASSWORD  →  re-auth with current password → updatePassword
  // ════════════════════════════════════════════════════════════════════════
  const savePassword = async () => {
    if (!pw.current)          { showToast("Enter your current password", "error"); return; }
    if (pw.next.length < 6)   { showToast("New password must be at least 6 characters", "error"); return; }
    if (pw.next !== pw.confirm){ showToast("New passwords do not match", "error"); return; }
    const user = auth.currentUser;
    if (!user) { showToast("Please log in first", "error"); return; }
    setPwLoading(true);
    try {
      // Re-authenticate with old password first
      const credential = EmailAuthProvider.credential(user.email, pw.current);
      await reauthenticateWithCredential(user, credential);
      // Now update to the new password
      await updatePassword(user, pw.next);
      setAccount(p => ({
        ...p,
        passwordUpdated: new Date().toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        }),
      }));
      setShowPw(false);
      setPw({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully 🔒");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential")
        showToast("Current password is incorrect.", "error");
      else if (err.code === "auth/weak-password")
        showToast("New password is too weak — use at least 6 characters.", "error");
      else if (err.code === "auth/requires-recent-login")
        showToast("Session expired. Log out and log in again, then retry.", "error");
      else
        showToast("Error: " + err.message, "error");
    } finally {
      setPwLoading(false);
    }
  };

  // ── persist settings button ──────────────────────────────────────────────
  const saveSettings = () => {
    try {
      localStorage.setItem("cn_settings", JSON.stringify({ ...account, notif, privacy }));
    } catch {}
    showToast("Settings saved! ✅");
  };

  const notifRows = [
    { key: "jobAlerts",   label: "Job Alerts",          desc: "Get notified when new matching jobs are posted" },
    { key: "appUpdates",  label: "Application Updates",  desc: "Status changes on your applications" },
    { key: "companyNews", label: "Company News",          desc: "News and announcements from companies" },
  ];

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text)", marginBottom: 20 }}>
        Settings
      </div>

      {/* ── Account Card ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>Account</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          Verify your email and manage your password
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Email row */}
          <div>
            <label>Email Address</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input type="email" value={account.email} disabled
                style={{ background: "var(--border-soft)", opacity: 0.9 }}
                title="Use 'Change Email' to update" />
              {account.emailVerified ? (
                <span className="badge badge-green"
                  style={{ flexShrink: 0, alignSelf: "center", padding: "6px 12px", fontSize: 12, gap: 5 }}>
                  <Icon name="check" size={13} /> Verified
                </span>
              ) : (
                <button className="btn-ghost" style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                  onClick={startEmailVerify} disabled={emailVerifyLoading}>
                  <Icon name="shield" size={14} />
                  {emailVerifyLoading ? " Sending…" : " Verify"}
                </button>
              )}
              <button className="btn-ghost" style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                onClick={startEmailChange}>
                <Icon name="edit" size={14} /> Change Email
              </button>
            </div>
            <small style={{ color: "var(--text-muted)", display: "block", marginTop: 5 }}>
              Changing your email requires your current password &amp; a verification link
            </small>
          </div>

          {/* Password row */}
          <div>
            <label>Password</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="password" value="••••••••" readOnly />
              <button className="btn-ghost" style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                onClick={() => setShowPw(true)}>
                <Icon name="key" size={14} /> Change Password
              </button>
            </div>
            {account.passwordUpdated && (
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: 5 }}>
                Last updated: {account.passwordUpdated}
              </small>
            )}
          </div>

        </div>
      </div>

      {/* ── Notifications Card ──────────────────────────────────────── */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>Notifications</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
          Choose what you want to be notified about
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", borderRadius: 10, background: "var(--tint-violet)",
          marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--violet)",
        }}>
          <span>{notifRows.filter(r => notif[r.key]).length} of {notifRows.length} notifications enabled</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="bell" size={13} />
            {notifRows.every(r => notif[r.key]) ? "All active"
              : notifRows.every(r => !notif[r.key]) ? "All muted"
              : "Partially active"}
          </span>
        </div>
        {notifRows.map(r => (
          <div key={r.key} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0", borderBottom: "1px solid var(--border-soft)",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{r.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                  padding: "2px 8px", borderRadius: 999,
                  background: notif[r.key] ? "var(--tint-green)" : "var(--border-soft)",
                  color: notif[r.key] ? "var(--green)" : "var(--text-faint)",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                    background: notif[r.key] ? "var(--green)" : "var(--text-faint)" }} />
                  {notif[r.key] ? "On" : "Off"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.desc}</div>
            </div>
            <ToggleSwitch on={notif[r.key]} onChange={v => setNotif(p => ({ ...p, [r.key]: v }))} />
          </div>
        ))}
      </div>

      {/* ── Privacy Card ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>Privacy</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
          Control who can see your information
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Profile Visibility</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {privacy.profile === "public" ? "Anyone can view your public profile" : "Only you can see your profile"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700,
                color: privacy.profile === "public" ? "var(--green)" : "var(--text-faint)" }}>
                {privacy.profile === "public" ? "Public" : "Private"}
              </span>
              <ToggleSwitch on={privacy.profile === "public"}
                onChange={v => setPrivacy(p => ({ ...p, profile: v ? "public" : "private" }))} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Resume Visibility</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {privacy.resume === "public" ? "Anyone can download your resume"
                  : privacy.resume === "recruiters" ? "Only registered recruiters can view your resume"
                  : "Your resume is not shared with anyone"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700,
                color: privacy.resume === "private" ? "var(--text-faint)" : "var(--green)" }}>
                {privacy.resume === "public" ? "Public" : privacy.resume === "recruiters" ? "Recruiters" : "Private"}
              </span>
              <ToggleSwitch on={privacy.resume === "public"}
                onChange={v => setPrivacy(p => ({ ...p, resume: v ? "public" : "private" }))} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Appearance Card ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>Appearance</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
          Personalize how the app looks for you
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Dark Mode</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Reduce glare with a darker interface</div>
          </div>
          <ToggleSwitch on={darkMode} onChange={setDarkMode} />
        </div>
      </div>

      <button className="btn-primary" onClick={saveSettings}>
        <Icon name="check" size={15} /> Save Settings
      </button>

      {/* ══════════════════════════════════════════════════════════════
           MODAL 1 — Email Verification (OTP sent to inbox)
         ══════════════════════════════════════════════════════════════ */}
      {showEmailVerify && (
        <>
          <div className="overlay" onClick={() => setShowEmailVerify(false)} />
          <div className="card" style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", zIndex: 100,
            width: "min(380px,94vw)", maxWidth: "94vw", padding: "clamp(16px,4vw,26px)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Verify Your Email</div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                onClick={() => setShowEmailVerify(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              We've sent a 6-digit OTP to{" "}
              <strong style={{ color: "var(--text)" }}>{account.email}</strong>.
              Enter it below to verify your email address.
            </p>
            <div style={{
              background: "var(--tint-violet)", color: "var(--violet)",
              padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 16, textAlign: "center",
            }}>
              📬 Check your inbox (and spam folder) for the OTP email
            </div>

            {/* OTP input boxes */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {emailOtp.map((v, i) => (
                <input
                  key={i}
                  ref={emailOtpRefs[i]}
                  maxLength={1}
                  value={v}
                  onChange={(e) => handleEmailOtpKey(i, e.target.value)}
                  onKeyDown={(e) => handleEmailOtpBackspace(i, e)}
                  disabled={emailOtpLockTimer > 0}
                  style={{
                    width: 42, height: 50, borderRadius: 10,
                    border: `2px solid ${emailOtpLockTimer > 0 ? "var(--red)" : v ? "var(--violet)" : "var(--border)"}`,
                    textAlign: "center", fontSize: 20, fontWeight: 700, outline: "none",
                    background: v ? "var(--tint-violet)" : "var(--card)",
                    color: emailOtpLockTimer > 0 ? "#EF4444" : "var(--text)",
                  }}
                />
              ))}
            </div>

            {emailOtpError && (
              <p style={{ textAlign: "center", fontSize: 12, color: "#EF4444", marginBottom: 10, fontWeight: 600 }}>
                {emailOtpError}
              </p>
            )}

            <button className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
              onClick={submitEmailOtp} disabled={emailOtpLoading || emailOtpLockTimer > 0}>
              <Icon name="check" size={15} />
              {emailOtpLoading ? " Verifying…" : " Verify Email"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13 }}>
              {emailOtpTimer > 0 ? (
                <span style={{ color: "var(--text-muted)" }}>
                  Resend OTP in <span style={{ fontWeight: 700, color: "var(--violet)" }}>{emailOtpTimer}s</span>
                </span>
              ) : (
                <span style={{ color: "var(--violet)", fontWeight: 600, cursor: "pointer" }}
                  onClick={resendEmailOtp}>Resend OTP</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
           MODAL 2 — Change Email (password + new email → Firebase)
         ══════════════════════════════════════════════════════════════ */}
      {showEmailChange && (
        <>
          <div className="overlay" onClick={() => setShowEmailChange(false)} />
          <div className="card" style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", zIndex: 100,
            width: "min(400px,94vw)", maxWidth: "94vw", padding: "clamp(16px,4vw,26px)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                {emailChangeStep === "sent" ? "Email Updated ✅" : "Change Email"}
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                onClick={() => setShowEmailChange(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {emailChangeStep === "password" ? (
              <>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                  For security, enter your new email and current password to continue.
                </p>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>New Email Address</label>
                  <input type="email" value={newEmail}
                    onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Current Password</label>
                  <input type="password" value={emailChangePw}
                    onChange={e => setEmailChangePw(e.target.value)}
                    placeholder="Enter current password" />
                </div>
                <button className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={confirmEmailChange} disabled={emailLoading}>
                  <Icon name="shield" size={15} />
                  {emailLoading ? " Updating…" : " Update & Send Verification"}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                  Your email has been changed to{" "}
                  <strong style={{ color: "var(--text)" }}>{newEmail}</strong>.
                  A verification link has been sent there — click it to complete verification.
                </p>
                <div style={{
                  background: "var(--tint-green)", color: "var(--green)",
                  padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 14, textAlign: "center",
                }}>
                  ✅ Email updated — check your new inbox for the verification link
                </div>
                <button className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setShowEmailChange(false)}>
                  Done
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
           MODAL 3 — Change Password (re-auth → updatePassword)
         ══════════════════════════════════════════════════════════════ */}
      {showPw && <ChangePwModal
        onClose={() => { setShowPw(false); setPw({ current:"", next:"", confirm:"" }); }}
        pw={pw} setPw={setPw}
        pwLoading={pwLoading}
        savePassword={savePassword}
        userEmail={auth.currentUser?.email || account.email}
      />}

    </div>
  );
};


// ─── EMPLOYER PORTAL ─────────────────────────────────────────────────────────
const EmployerPage = ({ setPage, user, employerJobs, setEmployerJobs, employerApplicants, setEmployerApplicants }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [step, setStep] = useState(1);
  const [jobForm, setJobForm] = useState({
    title: "", company: "", location: "", department: "",
    description: "", skills: "", experience: "",
    minSalary: "", maxSalary: "", jobType: "", workMode: "",
  });
  const [viewingProfile, setViewingProfile] = useState(null);
  const [schedulingInterview, setSchedulingInterview] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const { showToast } = useContext(AppContext);

  const totalPosted = employerJobs.length;
  const activeJobs = employerJobs.filter((j) => j.status === "active").length;
  const totalApplicants = employerApplicants.length;
  const profileViews = employerJobs.reduce((sum, j) => sum + (j.views || 0), 0) + totalApplicants * 5;

  const stats = [
    { label: "Jobs Posted", value: totalPosted, icon: "briefcase", color: "#7C3AED" },
    { label: "Active Jobs", value: activeJobs, icon: "lightning", color: "#22D3EE" },
    { label: "Total Applicants", value: totalApplicants, icon: "user", color: "var(--green)" },
    { label: "Profile Views", value: profileViews, icon: "eye", color: "var(--amber)" },
  ];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "post", label: "Post a Job", icon: "plus" },
    { id: "listings", label: "Job Listings", icon: "briefcase" },
    { id: "applicants", label: "Applicants", icon: "user" },
  ];
  const renderTab = () => {
    if (activeTab === "dashboard")
      return (
        <div>
          <div
            className="grid-3"
            style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}
          >
            {stats.map((s) => (
              <div key={s.label} className="card" style={{ padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 28, fontWeight: 900, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}
                    >
                      {s.label}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${s.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: s.color,
                    }}
                  >
                    <Icon name={s.icon} size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
              {employerJobs.length > 0 ? "Recent Job Performance" : "No Jobs Posted Yet"}
            </div>
            {employerJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Icon name="briefcase" size={48} className="" style={{ color: "var(--text-faint)", marginBottom: 12 }} />
                <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
                  You haven't posted any jobs yet. Post your first job to see performance here.
                </div>
                <button className="btn-primary" onClick={() => setActiveTab("post")}>
                  <Icon name="plus" size={15} /> Post a Job
                </button>
              </div>
            ) : (
              employerJobs.slice(0, 5).map((j) => (
                <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{j.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{j.location} · Posted {j.postedAt}</div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, color: "#7C3AED" }}>
                        {employerApplicants.filter((a) => a.jobId === j.id).length}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)" }}>Applicants</div>
                    </div>
                    <span className={`badge ${j.status === "active" ? "badge-green" : "badge-orange"}`}>
                      {j.status === "active" ? "Active" : "Closed"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    if (activeTab === "post") {
      const steps = [
        "Basic Info",
        "Description",
        "Skills & Req.",
        "Salary & Benefits",
        "Preview",
      ];
      return (
        <div className="card" style={{ padding: 28 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text)",
              marginBottom: 24,
            }}
          >
            Post a Job
          </div>
          {/* Step indicator */}
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 32 }}
          >
            {steps.map((s, i) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: i < 4 ? 1 : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background:
                        i + 1 < step
                          ? "linear-gradient(135deg, #7C3AED, #22D3EE)"
                          : i + 1 === step
                            ? "#7C3AED"
                            : "var(--border)",
                      color: i + 1 <= step ? "white" : "var(--text-faint)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1 < step ? <Icon name="check" size={14} /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: i + 1 <= step ? "#7C3AED" : "var(--text-faint)",
                      marginTop: 4,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s}
                  </span>
                </div>
                {i < 4 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background: i + 1 < step ? "#7C3AED" : "var(--border)",
                      margin: "0 4px",
                      marginBottom: 18,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {step === 1 && (
            <div className="grid-2">
              {[
                ["Job Title", "e.g. Senior React Developer", "title"],
                ["Company", "Your company name", "company"],
                ["Location", "e.g. Bengaluru or Remote", "location"],
                ["Department", "e.g. Engineering", "department"],
              ].map(([l, p, k]) => (
                <div key={l} className="form-group">
                  <label>{l}</label>
                  <input
                    placeholder={p}
                    value={jobForm[k]}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, [k]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="form-group">
              <label>Job Description</label>
              <textarea
                rows={8}
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                value={jobForm.description}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Required Skills (comma separated)</label>
                <input
                  placeholder="React, TypeScript, Node.js..."
                  value={jobForm.skills}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, skills: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Experience Required</label>
                <select
                  value={jobForm.experience}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, experience: e.target.value }))
                  }
                >
                  <option value="">Select experience</option>
                  <option value="No Experience (Fresher)">No Experience (Fresher)</option>
                  <option value="0–1 years">0–1 years</option>
                  <option value="1–3 years">1–3 years</option>
                  <option value="3–5 years">3–5 years</option>
                  <option value="5–8 years">5–8 years</option>
                  <option value="8+ years">8+ years</option>
                </select>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="grid-2">
              <div className="form-group">
                <label>Min Salary (₹ LPA)</label>
                <input
                  type="number"
                  placeholder="e.g. 6"
                  value={jobForm.minSalary}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, minSalary: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Salary (₹ LPA)</label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={jobForm.maxSalary}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, maxSalary: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Job Type</label>
                <select
                  value={jobForm.jobType}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, jobType: e.target.value }))
                  }
                >
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Work Mode</label>
                <select
                  value={jobForm.workMode}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, workMode: e.target.value }))
                  }
                >
                  <option value="">Select mode</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
            </div>
          )}
          {step === 5 && (
            <div>
              <div
                style={{
                  background: "var(--tint-green)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="check" size={18} style={{ color: "var(--green)" }} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--green)",
                  }}
                >
                  Your job listing is ready to publish! Review below.
                </span>
              </div>
              <div
                className="card"
                style={{
                  padding: 24,
                  border: "2px solid var(--border)",
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 14,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      {jobForm.title || "Untitled Position"}
                    </h3>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {jobForm.company || "Company Name"} ·{" "}
                      {jobForm.location || "Location"}
                    </div>
                  </div>
                  <span className="badge badge-green">New</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {jobForm.experience && (
                    <span className="tag">
                      <Icon name="clock" size={12} /> {jobForm.experience}
                    </span>
                  )}
                  {jobForm.jobType && (
                    <span className="tag tag-cyan">{jobForm.jobType}</span>
                  )}
                  {jobForm.workMode && (
                    <span className="tag tag-green">{jobForm.workMode}</span>
                  )}
                  {jobForm.department && (
                    <span className="tag tag-orange">{jobForm.department}</span>
                  )}
                </div>
                {(jobForm.minSalary || jobForm.maxSalary) && (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--violet)",
                      marginBottom: 14,
                    }}
                  >
                    ₹{jobForm.minSalary || "?"}L – ₹{jobForm.maxSalary || "?"}L
                    /yr
                  </div>
                )}
                {jobForm.description && (
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--text-soft)",
                      lineHeight: 1.65,
                      marginBottom: 14,
                    }}
                  >
                    {jobForm.description}
                  </p>
                )}
                {jobForm.skills && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {jobForm.skills
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: "rgba(124,58,237,0.1)",
                            color: "var(--violet)",
                            border: "1px solid rgba(124,58,237,0.2)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            {step > 1 && (
              <button
                className="btn-ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                ← Previous
              </button>
            )}
            <button
              className="btn-primary"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                if (step < 5) setStep((s) => s + 1);
                else {
                  const newJob = {
                    id: Date.now(),
                    title: jobForm.title,
                    company: jobForm.company || user?.name || "My Company",
                    location: jobForm.location,
                    department: jobForm.department,
                    description: jobForm.description,
                    skills: jobForm.skills ? jobForm.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
                    experience: jobForm.experience,
                    salary: (jobForm.minSalary && jobForm.maxSalary)
                      ? `\u20B9${jobForm.minSalary}L \u2013 \u20B9${jobForm.maxSalary}L/yr`
                      : jobForm.minSalary ? `\u20B9${jobForm.minSalary}L+` : "Negotiable",
                    jobType: jobForm.jobType,
                    workMode: jobForm.workMode,
                    status: "active",
                    postedAt: "Just now",
                    views: Math.floor(Math.random() * 30) + 5,
                  };
                  const sampleNames = [
                    { name: "Aarav Sharma", role: "Senior Developer", experience: "5 years", email: "aarav.sharma@email.com" },
                    { name: "Priya Nair", role: "React Engineer", experience: "3 years", email: "priya.nair@email.com" },
                    { name: "Rohan Mehta", role: "Full Stack Developer", experience: "4 years", email: "rohan.mehta@email.com" },
                    { name: "Deepa Krishnan", role: "Frontend Lead", experience: "6 years", email: "deepa.k@email.com" },
                    { name: "Arjun Gupta", role: "Backend Developer", experience: "3 years", email: "arjun.gupta@email.com" },
                  ];
                  const numApplicants = Math.floor(Math.random() * 4) + 1;
                  const newApplicants = sampleNames.slice(0, numApplicants).map((s, i) => ({
                    id: Date.now() + i + 1,
                    name: s.name,
                    role: s.role,
                    experience: s.experience,
                    email: s.email,
                    jobId: newJob.id,
                    status: "applied",
                  }));
                  setEmployerJobs((prev) => [newJob, ...prev]);
                  setEmployerApplicants((prev) => [...newApplicants, ...prev]);
                  showToast("Job published! \uD83D\uDE80");
                  setStep(1);
                  setActiveTab("listings");
                  setJobForm({
                    title: "", company: "", location: "", department: "",
                    description: "", skills: "", experience: "",
                    minSalary: "", maxSalary: "", jobType: "", workMode: "",
                  });
                }
              }}
            >
              {step < 5 ? "Next →" : "Publish Job"}
            </button>
          </div>
        </div>
      );
    }
    if (activeTab === "listings")
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>Job Listings</div>
            <button className="btn-primary" onClick={() => setActiveTab("post")}>
              <Icon name="plus" size={15} /> Post New Job
            </button>
          </div>
          {employerJobs.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <Icon name="briefcase" size={48} className="" style={{ color: "var(--text-faint)", marginBottom: 12 }} />
              <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>No jobs posted yet.</div>
              <button className="btn-primary" onClick={() => setActiveTab("post")}>
                <Icon name="plus" size={15} /> Post Your First Job
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {employerJobs.map((j) => (
                <div key={j.id} className="card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px", minWidth: "min(200px,100%)" }}>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>{j.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
                      {j.location} · {j.jobType || "Full-time"} · Posted {j.postedAt}
                    </div>
                    {j.skills && j.skills.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {j.skills.slice(0, 3).map((s) => (
                          <span key={s} className="tag" style={{ fontSize: 11 }}>{s}</span>
                        ))}
                        {j.skills.length > 3 && <span className="tag" style={{ fontSize: 11 }}>+{j.skills.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, color: "#7C3AED" }}>
                        {employerApplicants.filter((a) => a.jobId === j.id).length}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Applicants</div>
                    </div>
                    <span className={`badge ${j.status === "active" ? "badge-green" : "badge-orange"}`}>
                      {j.status === "active" ? "Active" : "Closed"}
                    </span>
                    <button className="btn-ghost" style={{ padding: "7px 12px" }} onClick={() => {
                      setEmployerJobs((prev) => prev.map((job) => job.id === j.id ? { ...job, status: job.status === "active" ? "closed" : "active" } : job));
                      showToast(j.status === "active" ? "Job closed" : "Job reopened");
                    }}>
                      <Icon name={j.status === "active" ? "x" : "check"} size={14} />
                    </button>
                    <button className="btn-ghost" style={{ padding: "7px 12px", color: "var(--red)" }} onClick={() => {
                      if (confirm(`Delete "${j.title}"? This cannot be undone.`)) {
                        setEmployerJobs((prev) => prev.filter((job) => job.id !== j.id));
                        setEmployerApplicants((prev) => prev.filter((a) => a.jobId !== j.id));
                        showToast("Job deleted");
                      }
                    }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    if (activeTab === "applicants") {
      const allApplicants = employerApplicants;
      return (
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 16 }}>
            Applicants {allApplicants.length > 0 ? `(${allApplicants.length})` : ""}
          </div>
          {allApplicants.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <Icon name="user" size={48} className="" style={{ color: "var(--text-faint)", marginBottom: 12 }} />
              <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 8 }}>No applicants yet.</div>
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>
                Applicants will appear here once job seekers apply to your posted jobs.
              </div>
            </div>
          ) : (
            allApplicants.map((a) => {
              const job = employerJobs.find((j) => j.id === a.jobId);
              const isShortlisted = a.status === "shortlisted";
              const hasInterview = a.status === "interviewed";
              return (
                <div key={a.id} className="card" style={{ padding: 18, marginBottom: 12, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: isShortlisted ? "linear-gradient(135deg, #059669, #22D3EE)" : hasInterview ? "linear-gradient(135deg, #D97706, #F59E0B)" : "linear-gradient(135deg, #7C3AED, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, flexShrink: 0 }}>
                    {a.name.charAt(0)}
                  </div>
                  <div style={{ flex: "1 1 150px", minWidth: "min(150px,100%)" }}>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>{a.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-faint)" }}>{a.role} · {a.experience}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      Applied for: <strong>{job ? job.title : "Unknown Job"}</strong>
                    </div>
                    {hasInterview && a.interviewDate && (
                      <div style={{ fontSize: 12, color: "#D97706", marginTop: 4, fontWeight: 600 }}>
                        Interview: {a.interviewDate} at {a.interviewTime} {a.interviewNote ? `(${a.interviewNote})` : ""}
                      </div>
                    )}
                    {isShortlisted && !hasInterview && (
                      <div style={{ fontSize: 12, color: "#059669", marginTop: 4, fontWeight: 600 }}>Shortlisted</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => { setSchedulingInterview(a); setInterviewDate(""); setInterviewTime(""); setInterviewNote(""); }}>
                      <Icon name="clock" size={13} /> {hasInterview ? "Reschedule" : "Schedule Interview"}
                    </button>
                    <button className="btn-ghost" style={{ padding: "7px 14px", background: isShortlisted ? "var(--tint-green)" : undefined, color: isShortlisted ? "#059669" : undefined }} onClick={() => {
                      setEmployerApplicants((prev) => prev.map((ap) => ap.id === a.id ? { ...ap, status: isShortlisted ? "applied" : "shortlisted" } : ap));
                      showToast(isShortlisted ? `${a.name} removed from shortlist` : `${a.name} shortlisted!`);
                    }}>
                      <Icon name={isShortlisted ? "check" : "star"} size={13} /> {isShortlisted ? "Shortlisted" : "Shortlist"}
                    </button>
                    <button className="btn-ghost" style={{ padding: "7px 14px" }} onClick={() => setViewingProfile(a)}>
                      <Icon name="eye" size={13} /> View Profile
                    </button>
                  </div>
                </div>
              );
            })
          )}
          {schedulingInterview && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={() => setSchedulingInterview(null)}>
              <div className="card" style={{ width: "100%", maxWidth: 440, padding: 28 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 20 }}>Schedule Interview with {schedulingInterview.name}</div>
                <div className="form-group"><label>Date</label><input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} /></div>
                <div className="form-group"><label>Time</label><input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} /></div>
                <div className="form-group"><label>Note (optional)</label><input placeholder="e.g. Video call via Zoom" value={interviewNote} onChange={(e) => setInterviewNote(e.target.value)} /></div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button className="btn-ghost" onClick={() => setSchedulingInterview(null)}>Cancel</button>
                  <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={() => {
                    if (!interviewDate || !interviewTime) { showToast("Please select date and time", "error"); return; }
                    setEmployerApplicants((prev) => prev.map((ap) => ap.id === schedulingInterview.id ? { ...ap, status: "interviewed", interviewDate, interviewTime, interviewNote } : ap));
                    showToast(`Interview scheduled with ${schedulingInterview.name}!`);
                    setSchedulingInterview(null);
                  }}><Icon name="check" size={15} /> Confirm Interview</button>
                </div>
              </div>
            </div>
          )}
          {viewingProfile && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={() => setViewingProfile(null)}>
              <div className="card" style={{ width: "100%", maxWidth: 500, padding: 28 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>Applicant Profile</div>
                  <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setViewingProfile(null)}><Icon name="x" size={18} /></button>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 24, flexShrink: 0 }}>{viewingProfile.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>{viewingProfile.name}</div>
                    <div style={{ fontSize: 14, color: "var(--text-faint)" }}>{viewingProfile.role} · {viewingProfile.experience}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>EMAIL</div>
                  <div style={{ fontSize: 14, color: "var(--text)" }}>{viewingProfile.email}</div>
                </div>
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>APPLIED FOR</div>
                  <div style={{ fontSize: 14, color: "var(--text)" }}>{employerJobs.find((j) => j.id === viewingProfile.jobId)?.title || "Unknown Job"}</div>
                </div>
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>STATUS</div>
                  <span className={`badge ${viewingProfile.status === "shortlisted" ? "badge-green" : viewingProfile.status === "interviewed" ? "badge-orange" : "badge-violet"}`}>
                    {viewingProfile.status === "shortlisted" ? "Shortlisted" : viewingProfile.status === "interviewed" ? "Interview Scheduled" : "Applied"}
                  </span>
                </div>
                {viewingProfile.status === "interviewed" && (
                  <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>INTERVIEW DETAILS</div>
                    <div style={{ fontSize: 14, color: "var(--text)" }}>
                      Date: {viewingProfile.interviewDate} at {viewingProfile.interviewTime}
                      {viewingProfile.interviewNote && <><br/>Note: {viewingProfile.interviewNote}</>}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="btn-ghost" onClick={() => setViewingProfile(null)}>Close</button>
                  <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={() => {
                    setEmployerApplicants((prev) => prev.map((ap) => ap.id === viewingProfile.id ? { ...ap, status: ap.status === "shortlisted" ? "applied" : "shortlisted" } : ap));
                    setViewingProfile((prev) => ({ ...prev, status: prev.status === "shortlisted" ? "applied" : "shortlisted" }));
                    showToast(viewingProfile.status === "shortlisted" ? "Removed from shortlist" : `${viewingProfile.name} shortlisted!`);
                  }}><Icon name="star" size={15} /> {viewingProfile.status === "shortlisted" ? "Remove from Shortlist" : "Shortlist"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(14px,3vw,28px) clamp(12px,3.5vw,20px)" }}>
      <div
        style={{
          fontWeight: 800,
          fontSize: 24,
          color: "var(--text)",
          marginBottom: 24,
        }}
      >
        Employer Portal
      </div>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--border-soft)",
          padding: 4,
          borderRadius: 14,
          width: "fit-content",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: activeTab === t.id ? "white" : "transparent",
              color: activeTab === t.id ? "#7C3AED" : "var(--text-muted)",
              boxShadow:
                activeTab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
};

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────
// Accounts stored in localStorage as cn_accounts: [{email, passwordHash, name, role}]
const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pw),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
const getAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem("cn_accounts") || "[]");
  } catch {
    return [];
  }
};
const saveAccounts = (arr) =>
  localStorage.setItem("cn_accounts", JSON.stringify(arr));
// OTP is now generated server-side via /send-otp endpoint

// ─── AUTH SUB-COMPONENTS (defined outside AuthPage so React never remounts them) ──
const AuthLogo = () => (
  <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
    <CnLogo size={44} textSize={23} />
  </div>
);

const ErrBox = ({ error }) =>
  error ? (
    <div
      style={{
        background: "var(--tint-red)",
        color: "var(--red)",
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {error}
    </div>
  ) : null;

// Stable component outside AuthPage – never remounts on parent re-render
const PasswordInput = ({
  label,
  value,
  onChange,
  show,
  toggleShow,
  placeholder = "••••••••",
}) => (
  <div className="form-group">
    <label>{label}</label>
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "10px 44px 10px 14px" }}
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleShow();
        }}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-faint)",
          lineHeight: 1,
          padding: "4px",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
        tabIndex={-1}
      >
        {show ? (
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.49 1.8-2.83 3.06-3.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.89 11 7-.57 1.14-1.32 2.19-2.22 3.07" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  </div>
);

const OtpBox = ({
  title,
  sub,
  otpInput,
  otpRefs,
  onOtpKey,
  onOtpBackspace,
  error,
  loading,
  otpTimer,
  lockTimer,
  lockDuration,
  attemptsLeft,
  onVerify,
  onBack,
  onResend,
}) => {
  const isLocked = lockTimer > 0;
  const isWrong = error && error.startsWith("Incorrect");

  // lockDuration is the duration of the CURRENT or just-ended lock (30, 60, 90 …)
  // We use it to calculate correct progress-bar width
  const barTotal = lockDuration || 30;

  const dotBg = (v) =>
    isLocked ? "var(--tint-red)" : v ? "var(--tint-violet)" : "var(--card)";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--auth-bg)",
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 440, padding: 36 }}
      >
        <AuthLogo />

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {isLocked ? "⏳" : "📩"}
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "var(--text)" }}>
            {isLocked ? "Too many attempts" : title}
          </h1>
          <p
            style={{
              color: "var(--text-faint)",
              fontSize: 13,
              marginTop: 6,
              lineHeight: 1.6,
            }}
          >
            {isLocked ? (
              <>
                Wait <strong style={{ color: "#EF4444" }}>{lockTimer}s</strong>{" "}
                before trying again.
              </>
            ) : (
              sub
            )}
          </p>
        </div>

        {/* ── OTP input boxes ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {otpInput.map((v, i) => (
            <input
              key={i}
              ref={otpRefs[i]}
              maxLength={1}
              value={v}
              onChange={(e) => !isLocked && onOtpKey(i, e.target.value)}
              onKeyDown={(e) => !isLocked && onOtpBackspace(i, e)}
              disabled={isLocked}
              style={{
                width: 46,
                height: 54,
                borderRadius: 12,
                border: `2px solid ${isLocked ? "var(--red)" : isWrong ? "#EF4444" : v ? "var(--violet)" : "var(--border)"}`,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 700,
                outline: "none",
                background: dotBg(v),
                color: isLocked ? "#EF4444" : "var(--text)",
                transition: "border 0.2s, background 0.2s",
                cursor: isLocked ? "not-allowed" : "text",
              }}
            />
          ))}
        </div>

        {/* ── Attempt indicator (shown when NOT locked) ── */}
        {!isLocked && attemptsLeft !== null && attemptsLeft < 3 && (
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: attemptsLeft === 1 ? "#EF4444" : "var(--amber)",
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining
          </p>
        )}

        {/* ── Lock countdown UI (shown when locked) ── */}
        {isLocked && (
          <div style={{ marginBottom: 18 }}>
            {/* Simple countdown + progress bar */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#EF4444" }}>
                {lockTimer}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-faint)", marginLeft: 4 }}>
                seconds
              </span>
            </div>
            <div
              style={{
                height: 5,
                background: "var(--tint-red)",
                borderRadius: 99,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#EF4444",
                  borderRadius: 99,
                  width: `${(lockTimer / barTotal) * 100}%`,
                  transition: "width 1s linear",
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
              Too many wrong attempts. Please wait before trying again.
            </p>
          </div>
        )}

        <ErrBox error={error} />

        {/* ── Verify / locked button ── */}
        <button
          className="btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: 13,
            fontSize: 15,
            marginTop: 8,
            opacity: loading || isLocked ? 0.55 : 1,
            cursor: isLocked ? "not-allowed" : "pointer",
            background: isLocked
              ? "linear-gradient(135deg,#EF4444,#F87171)"
              : undefined,
          }}
          onClick={onVerify}
          disabled={loading || isLocked}
        >
          {loading
            ? "Verifying…"
            : isLocked
              ? `Wait ${lockTimer}s`
              : "Verify OTP"}
        </button>

        {/* ── Footer: back + resend ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            fontSize: 13,
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--text-faint)",
              cursor: "pointer",
            }}
            onClick={onBack}
          >
            ← Back
          </button>
          {otpTimer > 0 || isLocked ? (
            <span style={{ color: "var(--text-faint)" }}>
              Resend in {isLocked ? lockTimer : otpTimer}s
            </span>
          ) : (
            <button
              style={{
                background: "none",
                border: "none",
                color: "#7C3AED",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={onResend}
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── GOOGLE SIGN-IN ─────────────────────────────────────────────────────────
// Demo Google accounts shown when no real GOOGLE_CLIENT_ID is configured.
const DEMO_GOOGLE_ACCOUNTS = [
  { name: "Aarav Sharma", email: "aarav.sharma@gmail.com", color: "#4285F4" },
  { name: "Priya Patel", email: "priya.patel@gmail.com", color: "#EA4335" },
  { name: "Rahul Verma", email: "rahul.verma@gmail.com", color: "#FBBC05" },
  { name: "Sneha Iyer", email: "sneha.iyer@gmail.com", color: "#34A853" },
];

// Google account chooser modal (used when GOOGLE_CLIENT_ID is empty).
const GoogleDemoModal = ({ onSelect, onClose }) => {
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 400, padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <GoogleIcon size={28} />
          <span
            style={{
              fontWeight: 800,
              fontSize: 18,
              marginLeft: 8,
              color: "var(--text)",
            }}
          >
            Sign in with Google
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          Choose a demo account (or add your own) to continue with Google.
          <br />
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
            Tip: paste your real Google OAuth Client ID in App.jsx to use
            actual Google accounts.
          </span>
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {DEMO_GOOGLE_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              onClick={() => onSelect({ name: a.name, email: a.email })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--card)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#7C3AED")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: a.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {a.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
                >
                  {a.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  {a.email}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Or use another account</label>
          <input
            placeholder="Full name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <input
            type="email"
            placeholder="you@gmail.com"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
          />
        </div>
        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          disabled={!customName.trim() || !customEmail.includes("@")}
          onClick={() =>
            onSelect({ name: customName.trim(), email: customEmail.trim() })
          }
        >
          <GoogleIcon size={16} /> Continue with Google
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            marginTop: 12,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// The "Continue with Google" button shown on login / signup forms.
// ─── GoogleButton — uses Firebase signInWithGoogle ────────────────────────────
const GoogleButton = ({ onLogin }) => {
  const [busy, setBusy] = useState(false);
  const { showToast } = useContext(AppContext);

  const handleClick = async () => {
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err) {
      // user closed the popup — don't show an error
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        showToast(err.message || "Google sign-in failed.", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="google-btn" onClick={handleClick} disabled={busy}>
      <GoogleIcon size={18} />
      {busy ? "Opening Google…" : "Continue with Google"}
    </button>
  );
};

const ProfileSetupJSX = ({ form, updateForm, strength, skills, newSkill, setNewSkill, addSkill, removeSkill, experience, newExp, setNewExp, addExperience, removeExperience, handleSave, handleSkip }) => (
  <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(18px,3.5vw,32px) clamp(12px,3.5vw,20px) clamp(30px,5vw,60px)" }}>
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: "var(--text)" }}>Build your profile strength</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>Take a minute to complete your profile. You can skip and do this later.</p>
    </div>
    <div className="card" style={{ padding: 22, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: "var(--text)" }}>Profile Strength</div>
        <span style={{ fontWeight: 700, color: "#7C3AED", fontSize: 18 }}>{strength}%</span>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${strength}%` }} /></div>
    </div>
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 14 }}>Basic Info</div>
      <div className="grid-2">
        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={(e) => updateForm("name", e.target.value)} /></div>
        <div className="form-group"><label>Professional Headline</label><input value={form.headline} onChange={(e) => updateForm("headline", e.target.value)} placeholder="e.g. Full Stack Developer" /></div>
        <div className="form-group"><label>Location</label><input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Bengaluru, India" /></div>
        <div className="form-group"><label>Email</label><input value={form.email} disabled /></div>
      </div>
      <div className="form-group" style={{ marginTop: 12 }}><label>About</label><textarea value={form.about} onChange={(e) => updateForm("about", e.target.value)} placeholder="Short professional summary" rows={3} /></div>
    </div>
    <div className="card" style={{ padding: 24, marginTop: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 14 }}>Skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {skills.map((s) => (<span key={s} className="tag">{s}<button onClick={() => removeSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7C3AED", marginLeft: 4, padding: 0, fontSize: 12 }}>×</button></span>))}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Add a skill" style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 12, width: 140, outline: "none", background: "var(--card)", color: "var(--text)" }} />
          <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={addSkill}><Icon name="plus" size={12} /> Add</button>
        </div>
      </div>
    </div>
    <div className="card" style={{ padding: 24, marginTop: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 14 }}>Experience</div>
      {experience.length === 0 ? (<p style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 12 }}>No experience added yet. Add your work history below.</p>) : null}
      {experience.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16, borderBottom: i < experience.length - 1 ? "1px solid var(--border-soft)" : "none", marginBottom: i < experience.length - 1 ? 16 : 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--tint-violet)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED", flexShrink: 0 }}><Icon name="briefcase" size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "var(--text)" }}>{e.role}</div>
            <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>{e.company}</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{e.period}</div>
            {e.desc && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{e.desc}</div>}
          </div>
          <button onClick={() => removeExperience(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 18, alignSelf: "flex-start", padding: 0 }}>×</button>
        </div>
      ))}
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group"><label>Role / Title</label><input value={newExp.role} onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Frontend Developer" /></div>
        <div className="form-group"><label>Company</label><input value={newExp.company} onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))} placeholder="e.g. Tech Corp" /></div>
        <div className="form-group"><label>Period</label><input value={newExp.period} onChange={(e) => setNewExp((p) => ({ ...p, period: e.target.value }))} placeholder="e.g. 2022 – Present" /></div>
        <div className="form-group"><label>Description</label><input value={newExp.desc} onChange={(e) => setNewExp((p) => ({ ...p, desc: e.target.value }))} placeholder="Brief description" /></div>
      </div>
      <button className="btn-ghost" style={{ marginTop: 4 }} onClick={addExperience}><Icon name="plus" size={13} /> Add Experience</button>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
      <button className="btn-ghost" style={{ padding: "12px 24px" }} onClick={handleSkip}>Skip for now</button>
      <button className="btn-primary" style={{ padding: "12px 24px" }} onClick={handleSave}><Icon name="check" size={15} /> Save & Continue</button>
    </div>
  </div>
);

const ProfileSetupPage = ({ user, setPage, profile, setProfile, showToast }) => {
  const [form, setForm] = useState({
    name: user?.name || profile?.form?.name || "",
    headline: profile?.form?.headline || "",
    location: profile?.form?.location || "",
    about: profile?.form?.about || "",
    email: user?.email || profile?.form?.email || "",
  });
  const [skills, setSkills] = useState(profile?.skills || []);
  const [experience, setExperience] = useState(profile?.experience || []);
  const [newSkill, setNewSkill] = useState("");
  const [newExp, setNewExp] = useState({ role: "", company: "", period: "", desc: "" });
  const strength = computeProfileStrength({ form, skills, experience });
  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const addSkill = () => { const s = newSkill.trim(); if (!s) return; setSkills((p) => (p.includes(s) ? p : [...p, s])); setNewSkill(""); };
  const removeSkill = (s) => setSkills((p) => p.filter((x) => x !== s));
  const addExperience = () => {
    if (!newExp.role.trim() || !newExp.company.trim()) return;
    setExperience((p) => [...p, { ...newExp, role: newExp.role.trim(), company: newExp.company.trim() }]);
    setNewExp({ role: "", company: "", period: "", desc: "" });
  };
  const removeExperience = (i) => setExperience((p) => p.filter((_, idx) => idx !== i));
  const handleSave = () => {
    const pd = { form: { ...form, email: user?.email || form.email }, skills, experience };
    setProfile(pd);
    try { localStorage.setItem("cn_profile", JSON.stringify(pd)); } catch {}
    showToast("Profile created! 🎉");
    setPage("dashboard");
  };
  const handleSkip = () => {
    // Save the current (mostly empty) profile so we don't fall back to defaults
    setProfile({ form, skills, experience });
    try { localStorage.setItem("cn_profile", JSON.stringify({ form, skills, experience })); } catch {}
    setPage("dashboard");
  };

  return ProfileSetupJSX({ form, updateForm, strength, skills, newSkill, setNewSkill, addSkill, removeSkill, experience, newExp, setNewExp, addExperience, removeExperience, handleSave, handleSkip });
}; // ProfileSetupPage

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
const AuthPage = ({ mode, setPage, setUser }) => {
  // step: "form" | "otp" | "forgot" | "reset"
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "seeker",
  });
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [otpToken, setOtpToken] = useState(""); // signed token returned by /api/send-otp
  const [otpEmail, setOtpEmail] = useState(""); // for forgot-password flow
  const [resetPassword, setResetPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpAttempts, setOtpAttempts] = useState(0); // wrong guesses so far (max 3)
  const [lockTimer, setLockTimer] = useState(0); // seconds left in lockout
  const [lockDuration, setLockDuration] = useState(30); // grows by 30s each lockout
  const timerRef = useRef(null);
  const lockRef = useRef(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const { showToast } = useContext(AppContext);

  const F = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError("");
  };

  // OTP countdown timer
  useEffect(() => {
    if (step === "otp") {
      setOtpTimer(60);
      timerRef.current = setInterval(
        () =>
          setOtpTimer((t) => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return t - 1;
          }),
        1000,
      );
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  // OTP box: type a digit and auto-advance
  const handleOtpKey = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otpInput];
    next[i] = val;
    setOtpInput(next);
    if (val && i < 5) otpRefs[i + 1].current?.focus();
  };
  const handleOtpBackspace = (i, e) => {
    if (e.key === "Backspace" && !otpInput[i] && i > 0)
      otpRefs[i - 1].current?.focus();
  };

  // Start a lockout of `secs` seconds; each call increments lockDuration by 30
  const startLock = (secs) => {
    clearInterval(lockRef.current);
    setLockTimer(secs);
    lockRef.current = setInterval(() => {
      setLockTimer((t) => {
        if (t <= 1) {
          clearInterval(lockRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    setOtpInput(["", "", "", "", "", ""]);
    setOtpAttempts(0);
    setLockTimer(0);
    setLockDuration(30);
    clearInterval(lockRef.current);
    setOtpTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () =>
        setOtpTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        }),
      1000,
    );
    setError("");
    try {
      const purpose = step === "reset" ? "reset" : "signup";
      const email = step === "reset" ? otpEmail : form.email;
      const name = step === "reset" ? "" : form.name;
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, purpose }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setOtpToken(data.token || "");
      showToast("OTP resent! Check your inbox.", "success");
    } catch (err) {
      setError(err.message || "Could not resend OTP. Try again.");
    }
  };

  // ── Sign-up: step 1 – validate form, send real OTP via server ──────────────
  // ── Sign-up: Firebase email+password ─────────────────────────────────────
  const handleSignupSubmit = async () => {
    if (!form.name.trim())           { setError("Full name is required."); return; }
    if (!form.email.includes("@"))   { setError("Enter a valid email address."); return; }
    if (form.password.length < 6)    { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, name: form.name.trim(), purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send OTP");
      setOtpToken(data.token || "");
      showToast("OTP sent! Check your email inbox.", "success");
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sign-up: step 2 – verify OTP on server, then create Firebase account ──────────────
  const handleOtpVerify = async () => {
    const entered = otpInput.join("");
    if (entered.length < 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpToken, otp: entered }),
      });
      const data = await res.json();
      if (!data.valid) {
        setLoading(false);
        setOtpInput(["", "", "", "", "", ""]);
        if (data.reason === "expired") {
          setError("OTP has expired. Please request a new one.");
        } else if (data.reason === "not_found" || data.reason === "invalid") {
          setError("OTP not found. Please request a new one.");
        } else {
          // wrong — apply local attempt logic for UI feedback
          const newAttempts = otpAttempts + 1;
          setOtpAttempts(newAttempts);
          if (newAttempts >= 3) {
            const dur = lockDuration;
            setLockDuration((d) => d + 30);
            startLock(dur);
            setOtpAttempts(0);
            setError(
              `Too many wrong attempts. Wait ${dur}s before trying again.`,
            );
          } else {
            setError(
              `Incorrect OTP. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} left.`,
            );
            setTimeout(() => otpRefs[0].current?.focus(), 0);
          }
        }
        return;
      }
      // OTP verified ✓ — create the Firebase account (both Job Seeker & Employer)
      const user = await signUpWithEmail(form.name.trim(), form.email, form.password);
      setLoading(false);
      setUser({
        name: user.name,
        email: user.email,
        role: form.role === "employer" ? "Employer" : "Job Seeker",
      });
      showToast("Account created! Welcome to CareerNova 🎉");
      setPage("profile-setup");
    } catch (err) {
      setLoading(false);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(err.message || "Sign-up failed. Please try again.");
      }
    }
  };

  // ── Login: Firebase email+password ──────────────────────────────────────
  const handleLoginSubmit = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    try {
      const user = await signInWithEmail(form.email, form.password);
      setUser({ name: user.name || form.email.split("@")[0], email: user.email, role: "Job Seeker" });
      showToast(`Welcome back, ${user.name || "there"}! 👋`);
      setPage("dashboard");
    } catch (err) {
      setLoading(false);
      // Firebase v9+ uses auth/invalid-credential for both wrong password AND no account
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a few minutes or reset your password.");
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    }
  };

  // ── Google Sign-In (Firebase) ────────────────────────────────────────────
  const handleGoogleLogin = (googleUser) => {
    setUser({
      name: googleUser.name || googleUser.email.split("@")[0],
      email: googleUser.email,
      role: form.role === "employer" ? "Employer" : "Job Seeker",
      photo: googleUser.photo || "",
    });
    showToast(`Welcome, ${googleUser.name || googleUser.email.split("@")[0]}! 🎉`);
    setPage("profile-setup");
  };

  // ── Forgot password: send OTP via server ─────────────────────────────────
  // ── Forgot password: Firebase sends reset link directly ─────────────────
  const handleForgotSend = async () => {
    if (!otpEmail.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true);
    setError("");
    try {
      await resetPasswordEmail(otpEmail);
    } catch (err) {
      // Silently swallow auth/user-not-found so we don't reveal if email is registered.
      // Only surface unexpected errors (network failures etc.)
      if (err.code !== "auth/user-not-found" && err.code !== "auth/invalid-email") {
        setLoading(false);
        setError(err.message || "Could not send reset email. Try again.");
        return;
      }
    }
    // Always show success — whether the email exists or not
    setLoading(false);
    setStep("reset-sent");
    showToast("If this email is registered, a reset link has been sent! 📧");
  };

  // ── Forgot password: verify OTP + set new password ────────────────────────
  const handleResetSubmit = async () => {
    const entered = otpInput.join("");
    if (entered.length < 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    if (resetPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    let verified = false;
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpToken, otp: entered }),
      });
      const data = await res.json();
      if (!data.valid) {
        setLoading(false);
        setOtpInput(["", "", "", "", "", ""]);
        if (data.reason === "expired") {
          setError("OTP has expired. Please request a new one.");
        } else {
          const newAttempts = otpAttempts + 1;
          setOtpAttempts(newAttempts);
          if (newAttempts >= 3) {
            const dur = lockDuration;
            setLockDuration((d) => d + 30);
            startLock(dur);
            setOtpAttempts(0);
            setError(
              `Too many wrong attempts. Wait ${dur}s before trying again.`,
            );
          } else {
            setError(
              `Incorrect OTP. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} left.`,
            );
            setTimeout(() => otpRefs[0].current?.focus(), 0);
          }
        }
        return;
      }
      verified = true;
    } catch (err) {
      setLoading(false);
      setError(
        "Server error. Make sure the OTP server is running on port 4000.",
      );
      return;
    }
    if (!verified) return;
    const hash = await hashPassword(resetPassword);
    const accounts = getAccounts();
    const idx = accounts.findIndex(
      (a) => a.email.toLowerCase() === otpEmail.toLowerCase(),
    );
    if (idx !== -1) {
      accounts[idx].passwordHash = hash;
      saveAccounts(accounts);
    }
    showToast("Password reset successful! Please log in.");
    setStep("form");
    setOtpEmail("");
    setResetPassword("");
    setOtpInput(["", "", "", "", "", ""]);
    setOtpAttempts(0);
    setLockTimer(0);
    setLockDuration(30);
    setForm({ name: "", email: "", password: "", confirm: "", role: "seeker" });
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const wrapSt = {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--auth-bg)",
    padding: "clamp(12px,4vw,20px)",
    // auth-wrap class added in JSX via className
  };
  const cardSt = { width: "100%", maxWidth: "min(440px,96vw)", padding: "clamp(20px,5vw,36px)" };
  // Auth logo: use <AuthLogo /> component defined above

  // ── RENDER: OTP verification (signup) ─────────────────────────────────────
  if (step === "otp")
    return (
      <OtpBox
        title="Verify your email"
        sub={`We sent a 6-digit OTP to ${form.email}`}
        otpInput={otpInput}
        otpRefs={otpRefs}
        onOtpKey={handleOtpKey}
        onOtpBackspace={handleOtpBackspace}
        error={error}
        loading={loading}
        otpTimer={otpTimer}
        lockTimer={lockTimer}
        lockDuration={lockDuration - 30}
        attemptsLeft={3 - otpAttempts}
        onVerify={handleOtpVerify}
        onBack={() => {
          setStep("form");
          setError("");
          setOtpInput(["", "", "", "", "", ""]);
          setOtpAttempts(0);
          setLockTimer(0);
          clearInterval(lockRef.current);
        }}
        onResend={resendOtp}
      />
    );

  // ── RENDER: Forgot password – enter email ─────────────────────────────────
  if (step === "forgot")
    return (
      <div style={wrapSt}>
        <div className="card" style={cardSt}>
          <AuthLogo />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
            <h1 style={{ fontWeight: 800, fontSize: 22, color: "var(--text)" }}>
              Forgot password?
            </h1>
            <p style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 6 }}>
              Enter your email and Firebase will send you a reset link
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label>Registered Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={otpEmail}
                onChange={(e) => { setOtpEmail(e.target.value); setError(""); }}
              />
            </div>
            <ErrBox error={error} />
            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 15, opacity: loading ? 0.6 : 1 }}
              onClick={handleForgotSend}
              disabled={loading}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <button
              style={{ background: "none", border: "none", color: "#7C3AED", fontWeight: 600, cursor: "pointer", fontSize: 13, textAlign: "center" }}
              onClick={() => { setStep("form"); setError(""); }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );

  // ── RENDER: Reset email sent confirmation ─────────────────────────────────
  if (step === "reset-sent")
    return (
      <div style={wrapSt}>
        <div className="card" style={cardSt}>
          <AuthLogo />
          <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <h1 style={{ fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 10 }}>Check your inbox</h1>
            <p style={{ color: "var(--text-faint)", fontSize: 13, lineHeight: 1.7 }}>
              We sent a password reset link to<br/>
              <strong style={{ color: "var(--text)" }}>{otpEmail}</strong>
            </p>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 16px", margin: "20px 0", fontSize: 13, color: "#166534", textAlign: "left" }}>
              <strong>What to do next:</strong>
              <ol style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 2 }}>
                <li>Open the email from <strong>Firebase / noreply@…</strong></li>
                <li>Click <strong>"Reset password"</strong> in the email</li>
                <li>Set your new password on the page that opens</li>
                <li>Come back here and log in ✅</li>
              </ol>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20 }}>
              Didn't get it? Check your spam folder, or{" "}
              <span style={{ color: "#7C3AED", fontWeight: 600, cursor: "pointer" }} onClick={() => { setStep("forgot"); setError(""); }}>try again</span>.
            </p>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }}
              onClick={() => { setStep("form"); setError(""); setOtpEmail(""); }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );

  // ── RENDER: Forgot password – OTP + new password ──────────────────────────
  // Reuses OtpBox for the same lock/attempt UI, with the new-password field appended
  if (step === "reset")
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--auth-bg)",
          padding: 20,
        }}
      >
        <div
          className="card"
          style={{ width: "100%", maxWidth: 440, padding: 36 }}
        >
          <AuthLogo />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              {lockTimer > 0 ? "⏳" : "🔑"}
            </div>
            <h1 style={{ fontWeight: 800, fontSize: 22, color: "var(--text)" }}>
              {lockTimer > 0 ? "Too many attempts" : "Reset your password"}
            </h1>
            <p
              style={{
                color: "var(--text-faint)",
                fontSize: 13,
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              {lockTimer > 0 ? (
                <>
                  Wait{" "}
                  <strong style={{ color: "#EF4444" }}>{lockTimer}s</strong>{" "}
                  before retrying.
                </>
              ) : (
                <>
                  Enter the OTP sent to <strong>{otpEmail}</strong> and your new
                  password
                </>
              )}
            </p>
          </div>

          {/* OTP boxes */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {otpInput.map((v, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                maxLength={1}
                value={v}
                onChange={(e) =>
                  lockTimer === 0 && handleOtpKey(i, e.target.value)
                }
                onKeyDown={(e) => lockTimer === 0 && handleOtpBackspace(i, e)}
                disabled={lockTimer > 0}
                style={{
                  width: 46,
                  height: 54,
                  borderRadius: 12,
                  border: `2px solid ${lockTimer > 0 ? "var(--red)" : error && error.startsWith("Incorrect") ? "#EF4444" : v ? "var(--violet)" : "var(--border)"}`,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  outline: "none",
                  background:
                    lockTimer > 0 ? "var(--tint-red)" : v ? "var(--tint-violet)" : "var(--card)",
                  color: lockTimer > 0 ? "#EF4444" : "var(--text)",
                  transition: "border 0.2s, background 0.2s",
                  cursor: lockTimer > 0 ? "not-allowed" : "text",
                }}
              />
            ))}
          </div>

          {/* Attempt indicator (when not locked) */}
          {lockTimer === 0 && otpAttempts > 0 && (
            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: otpAttempts === 2 ? "#EF4444" : "var(--amber)",
                marginBottom: 14,
                fontWeight: 600,
              }}
            >
              {3 - otpAttempts} attempt{3 - otpAttempts === 1 ? "" : "s"}{" "}
              remaining
            </p>
          )}

          {/* Lock countdown UI (when locked) */}
          {lockTimer > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span
                  style={{ fontSize: 28, fontWeight: 800, color: "#EF4444" }}
                >
                  {lockTimer}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-faint)", marginLeft: 4 }}>
                  seconds
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: "var(--tint-red)",
                  borderRadius: 99,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "#EF4444",
                    borderRadius: 99,
                    width: `${(lockTimer / (lockDuration - 30)) * 100}%`,
                    transition: "width 1s linear",
                  }}
                />
              </div>
              <p
                style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}
              >
                Too many wrong attempts. Please wait before trying again.
              </p>
            </div>
          )}

          {/* New password field — only show when not locked */}
          {lockTimer === 0 && (
            <div style={{ marginBottom: 14 }}>
              <PasswordInput
                label="New Password"
                value={resetPassword}
                onChange={setResetPassword}
                show={showPass}
                toggleShow={() => setShowPass((s) => !s)}
                placeholder="Min. 6 characters"
              />
            </div>
          )}

          <ErrBox error={error} />

          {/* Submit button */}
          <button
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: 13,
              fontSize: 15,
              marginTop: 8,
              opacity: lockTimer > 0 ? 0.55 : 1,
              cursor: lockTimer > 0 ? "not-allowed" : "pointer",
              background:
                lockTimer > 0
                  ? "linear-gradient(135deg,#EF4444,#F87171)"
                  : undefined,
            }}
            onClick={handleResetSubmit}
            disabled={lockTimer > 0}
          >
            {lockTimer > 0 ? `Wait ${lockTimer}s` : "Reset Password"}
          </button>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              fontSize: 13,
            }}
          >
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--text-faint)",
                cursor: "pointer",
              }}
              onClick={() => {
                setStep("forgot");
                setError("");
                setOtpInput(["", "", "", "", "", ""]);
                setOtpAttempts(0);
                setLockTimer(0);
                clearInterval(lockRef.current);
              }}
            >
              ← Back
            </button>
            {otpTimer > 0 || lockTimer > 0 ? (
              <span style={{ color: "var(--text-faint)" }}>
                Resend in {lockTimer > 0 ? lockTimer : otpTimer}s
              </span>
            ) : (
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#7C3AED",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={resendOtp}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    );

  // ── RENDER: Main login / signup form ──────────────────────────────────────
  return (
    <div style={wrapSt}>
      <div className="card" style={cardSt}>
        <AuthLogo />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontWeight: 800, fontSize: 24, color: "var(--text)" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ color: "var(--text-faint)", fontSize: 14, marginTop: 6 }}>
            {mode === "login"
              ? "Sign in to your CareerNova account"
              : "Start your journey with CareerNova"}
          </p>
        </div>

        {/* Role toggle – signup only */}
        {mode === "signup" && (
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "var(--border-soft)",
              padding: 4,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            {[
              ["seeker", "Job Seeker", "user"],
              ["employer", "Employer", "building"],
            ].map(([val, label, icon]) => (
              <button
                key={val}
                onClick={() => F("role", val)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: form.role === val ? "white" : "transparent",
                  color: form.role === val ? "#7C3AED" : "var(--text-muted)",
                  boxShadow:
                    form.role === val ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <Icon name={icon} size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Continue with Google */}
        <GoogleButton onLogin={handleGoogleLogin} />
        <div className="auth-or">or continue with email</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => F("name", e.target.value)}
              />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => F("email", e.target.value)}
            />
          </div>
          <PasswordInput
            label="Password"
            value={form.password}
            onChange={(v) => F("password", v)}
            show={showPass}
            toggleShow={() => setShowPass((s) => !s)}
          />
          {mode === "signup" && (
            <PasswordInput
              label="Confirm Password"
              value={form.confirm}
              onChange={(v) => F("confirm", v)}
              show={showConfirm}
              toggleShow={() => setShowConfirm((s) => !s)}
              placeholder="Repeat your password"
            />
          )}
          {/* Password strength – signup only */}
          {mode === "signup" &&
            form.password.length > 0 &&
            (() => {
              const strength =
                form.password.length < 6
                  ? 1
                  : form.password.length < 10
                    ? 2
                    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password)
                      ? 4
                      : 3;
              const colors = ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"];
              const labels = ["", "Weak", "Fair", "Good", "Strong"];
              return (
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 99,
                          background:
                            i <= strength ? colors[strength] : "var(--border)",
                          transition: "background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors[strength],
                      fontWeight: 600,
                    }}
                  >
                    {labels[strength]}
                  </div>
                </div>
              );
            })()}
          <ErrBox error={error} />
          <button
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: 13,
              fontSize: 15,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={mode === "login" ? handleLoginSubmit : handleSignupSubmit}
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "Signing in…"
                : "Sending OTP…"
              : mode === "login"
                ? "Sign In"
                : "Continue →"}
          </button>
        </div>

        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span
              style={{
                fontSize: 13,
                color: "#7C3AED",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onClick={() => {
                setStep("forgot");
                setError("");
              }}
            >
              Forgot password?
            </span>
          </div>
        )}
        <div className="divider" />
        <div style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <span
                style={{ color: "#7C3AED", fontWeight: 700, cursor: "pointer" }}
                onClick={() => setPage("signup")}
              >
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                style={{ color: "#7C3AED", fontWeight: 700, cursor: "pointer" }}
                onClick={() => setPage("login")}
              >
                Log In
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────────
const RESOURCES = [
  {
    icon: "📝",
    title: "Resume Writing Guide",
    desc: "Learn how to craft a resume that gets past ATS and impresses hiring managers with proven templates and tips.",
    tag: "Guide",
    color: "var(--tint-violet)",
    readTime: "8 min read",
    intro:
      "Your resume is your first impression — and often your only shot at an interview. Recruiters spend about 7 seconds scanning a resume, so every word must earn its place.",
    sections: [
      {
        heading: "1. Tailor it to the role",
        points: [
          "Mirror the exact keywords from the job description — ATS systems filter on them.",
          "Reorder your skills so the most relevant ones appear first.",
          "Create one master resume, then customize a version for each application.",
        ],
      },
      {
        heading: "2. Lead with impact, not duties",
        points: [
          "Use the STAR method (Situation, Task, Action, Result) for every bullet.",
          "Quantify achievements: 'Cut load time by 40%' beats 'improved performance'.",
          "Start bullets with strong action verbs: built, launched, scaled, led.",
        ],
      },
      {
        heading: "3. Keep it clean and scannable",
        points: [
          "Stick to one page for under 10 years of experience, two pages max.",
          "Use consistent formatting, a clear font, and proper margins.",
          "Save as PDF with a professional filename: FirstName_LastName_Resume.pdf.",
        ],
      },
    ],
    tips: [
      "Include a short 2–3 line professional summary at the top.",
      "Add metrics to at least 80% of your bullet points.",
      "Remove 'Objective' — replace it with a tailored summary instead.",
    ],
  },
  {
    icon: "🎤",
    title: "Interview Preparation",
    desc: "Master behavioral, technical, and situational interview questions with practice frameworks and sample answers.",
    tag: "Interview",
    color: "var(--tint-green)",
    readTime: "10 min read",
    intro:
      "Interviews are a two-way conversation: they're assessing your fit just as much as you're assessing theirs. Preparation turns anxiety into confidence.",
    sections: [
      {
        heading: "1. Research the company deeply",
        points: [
          "Know their products, funding, recent news, and company culture.",
          "Review the job description and map your skills to each requirement.",
          "Prepare 3–5 smart questions to ask the interviewer.",
        ],
      },
      {
        heading: "2. Master behavioral questions",
        points: [
          "Use the STAR method to structure every story.",
          "Prepare 5–6 stories covering teamwork, leadership, failure, and conflict.",
          "Keep each answer under 2 minutes and end with a measurable result.",
        ],
      },
      {
        heading: "3. Handle technical rounds",
        points: [
          "Practice coding on a whiteboard or shared editor — think out loud.",
          "Clarify requirements before jumping into a solution.",
          "Review core concepts, data structures, and your own past projects.",
        ],
      },
    ],
    tips: [
      "Do a mock interview with a friend or record yourself answering.",
      "Prepare a confident 60-second self-introduction.",
      "Always send a thank-you note within 24 hours.",
    ],
  },
  {
    icon: "💰",
    title: "Salary Negotiation",
    desc: "Understand your market worth and learn proven strategies to negotiate a compensation package you deserve.",
    tag: "Career",
    color: "var(--tint-amber)",
    readTime: "7 min read",
    intro:
      "Negotiation can boost your lifetime earnings by millions, yet most people skip it out of fear. The key is preparation and confidence.",
    sections: [
      {
        heading: "1. Know your market worth",
        points: [
          "Research salary ranges on Glassdoor, Levels.fyi, and LinkedIn.",
          "Factor in your experience, skills, and the company's size and funding.",
          "Decide on three numbers: your ideal, your target, and your walk-away minimum.",
        ],
      },
      {
        heading: "2. Let them name a number first",
        points: [
          "When asked, say you'd like to learn more about the role first.",
          "If forced, give a range where the bottom is still your target.",
          "Never accept the first offer — there is almost always room to move.",
        ],
      },
      {
        heading: "3. Negotiate the full package",
        points: [
          "Consider base salary, bonus, stock/equity, signing bonus, and benefits.",
          "If base is fixed, negotiate vacation days, remote days, or a signing bonus.",
          "Get the final offer in writing before you resign from your current job.",
        ],
      },
    ],
    tips: [
      "Always be polite — it's a business conversation, not a fight.",
      "Use silence: after making a request, stop talking and wait.",
      "Remember: the worst they can say is no.",
    ],
  },
  {
    icon: "🌐",
    title: "LinkedIn Optimization",
    desc: "Transform your LinkedIn profile into a job magnet with recruiter-focused tips and keyword strategies.",
    tag: "Guide",
    color: "var(--tint-cyan)",
    readTime: "6 min read",
    intro:
      "Recruiters spend hours searching LinkedIn for candidates like you. A fully optimized profile makes you discoverable, credible, and attractive.",
    sections: [
      {
        heading: "1. Optimize your headline & photo",
        points: [
          "Don't just write your job title — add keywords: 'React Developer | UI Engineer'.",
          "Use a clear, professional, well-lit headshot with a plain background.",
          "Add a custom banner that reinforces your personal brand.",
        ],
      },
      {
        heading: "2. Make your About section count",
        points: [
          "Use the first 2 lines to hook readers — that's what shows in search.",
          "Write in first person and mention keywords recruiters search for.",
          "End with a clear call-to-action: 'Open to Frontend roles — DM me'.",
        ],
      },
      {
        heading: "3. Boost your experience & activity",
        points: [
          "Add metrics and keywords to every role in your Experience section.",
          "List skills and get endorsements — top 3 skills matter most.",
          "Post or engage weekly to keep your profile active in search results.",
        ],
      },
    ],
    tips: [
      "Turn on the #OpenToWork feature — it's recruiter bait.",
      "Customize your profile URL to your name.",
      "Ask for and give recommendations to build credibility.",
    ],
  },
  {
    icon: "🤝",
    title: "Networking 101",
    desc: "Build meaningful professional relationships online and in-person that open doors to hidden job opportunities.",
    tag: "Career",
    color: "var(--tint-violet)",
    readTime: "9 min read",
    intro:
      "Up to 70% of jobs are never publicly posted — they're filled through networks. Networking is about building genuine relationships.",
    sections: [
      {
        heading: "1. Start with warm connections",
        points: [
          "Reach out to former colleagues, classmates, and friends first.",
          "Ask for informational interviews, not jobs — it's lower pressure.",
          "Be specific: 'I'd love 15 minutes to learn about your team'.",
        ],
      },
      {
        heading: "2. Give before you ask",
        points: [
          "Share useful articles, congratulate people on wins, and offer help.",
          "Recommend others and celebrate their achievements publicly.",
          "Build a reputation as someone generous — help comes back around.",
        ],
      },
      {
        heading: "3. Follow up and stay in touch",
        points: [
          "Send a thank-you note within 24 hours of any conversation.",
          "Set reminders to check in every few months.",
          "Track your contacts and where you met them.",
        ],
      },
    ],
    tips: [
      "Attend industry meetups, webinars, and conferences.",
      "Use LinkedIn messages: keep them short and personal.",
      "Be patient — networking is a long game.",
    ],
  },
  {
    icon: "🧠",
    title: "AI in Job Search",
    desc: "Use AI tools smartly to write cover letters, prep for interviews, and research companies faster than ever.",
    tag: "Trending",
    color: "var(--tint-red)",
    readTime: "5 min read",
    intro:
      "AI can supercharge your job search — writing tailored cover letters, rehearsing interviews, and researching companies in seconds.",
    sections: [
      {
        heading: "1. Supercharge your application materials",
        points: [
          "Use AI to draft tailored cover letters, then personalize them.",
          "Ask AI to tailor your resume bullets to each job description.",
          "Generate interview questions based on the specific role and company.",
        ],
      },
      {
        heading: "2. Prep with AI mock interviews",
        points: [
          "Paste a job description and ask AI to quiz you like a real interviewer.",
          "Practice behavioral questions and get feedback on your answers.",
          "Use AI to explain tricky technical concepts in plain language.",
        ],
      },
      {
        heading: "3. Research faster & stay human",
        points: [
          "Ask AI to summarize a company, its competitors, and recent news.",
          "Generate smart questions to ask the interviewer.",
          "Always review and rewrite AI output in your own voice.",
        ],
      },
    ],
    tips: [
      "Never send an unedited AI-generated cover letter — it shows.",
      "Verify AI facts about a company before using them in interviews.",
      "Use AI to brainstorm, then apply your own experience and judgment.",
    ],
  },
];

const ResourcesModal = ({ resource, onClose }) => {
  if (!resource) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 32 }}>{resource.icon}</div>
            <div>
              <div
                style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}
              >
                {resource.title}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: resource.color,
                    color: "var(--text-strong)",
                    padding: "2px 9px",
                    borderRadius: 999,
                  }}
                >
                  {resource.tag}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="clock" size={12} /> {resource.readTime}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--border-soft)",
              border: "none",
              width: 34,
              height: 34,
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-soft)",
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          {resource.intro}
        </p>
        {resource.sections.map((sec) => (
          <div key={sec.heading} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#7C3AED",
                marginBottom: 8,
              }}
            >
              {sec.heading}
            </div>
            {sec.points.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13.5,
                  color: "var(--text)",
                  lineHeight: 1.6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "#7C3AED", fontWeight: 700 }}>•</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        ))}
        <div
          style={{
            background: "var(--tint-violet)",
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "var(--violet)",
              marginBottom: 8,
            }}
          >
            💡 Pro Tips
          </div>
          {resource.tips.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                fontSize: 13,
                color: "var(--text)",
                lineHeight: 1.5,
                marginBottom: 5,
              }}
            >
              <span>✔</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourcesPage = () => {
  const [active, setActive] = useState(null);
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(20px,4vw,40px) clamp(12px,3.5vw,20px)" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 className="section-title">Career Resources</h1>
        <p className="section-sub">
          Guides, tips, and tools to help you land your dream role
        </p>
      </div>
      <div className="grid-3">
        {RESOURCES.map((r) => (
          <div
            key={r.title}
            className="card"
            style={{ padding: 24, display: "flex", flexDirection: "column" }}
          >
            <div style={{ fontSize: 36, marginBottom: 14 }}>{r.icon}</div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: r.color,
                color: "var(--text-strong)",
                padding: "3px 10px",
                borderRadius: 999,
                alignSelf: "flex-start",
              }}
            >
              {r.tag}
            </span>
            <h3
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text)",
                margin: "10px 0 8px",
              }}
            >
              {r.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                flex: 1,
              }}
            >
              {r.desc}
            </p>
            <button
              onClick={() => setActive(r)}
              style={{
                marginTop: 16,
                background: "none",
                border: "none",
                color: "#7C3AED",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                alignSelf: "flex-start",
              }}
            >
              Read More <Icon name="chevronRight" size={13} />
            </button>
          </div>
        ))}
      </div>
      <ResourcesModal resource={active} onClose={() => setActive(null)} />
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem("cn_page") || "home"; } catch { return "home"; }
  });
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("cn_profile");
      return saved ? JSON.parse(saved) : emptyProfile;
    } catch { return emptyProfile; }
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [employerJobs, setEmployerJobs] = useState(() => {
    try {
      const stored = localStorage.getItem("cn_employer_jobs");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [employerApplicants, setEmployerApplicants] = useState(() => {
    try {
      const stored = localStorage.getItem("cn_employer_applicants");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [jobFilter, setJobFilter] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("cn_theme") === "dark";
    } catch {
      return false;
    }
  });

  const showToast = (msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── Firebase auth persistence ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(prev => prev || {
          name:  firebaseUser.name  || firebaseUser.email?.split("@")[0],
          email: firebaseUser.email,
          photo: firebaseUser.photo || null,
          role:  "Job Seeker",
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Remember page across reloads ──────────────────────────────────────────
  useEffect(() => {
    try { sessionStorage.setItem("cn_page", page); } catch {}
  }, [page]);

  // ── Apply + persist theme ─────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light",
    );
    try {
      localStorage.setItem("cn_theme", darkMode ? "dark" : "light");
    } catch {}
  }, [darkMode]);

  // Persist to localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("cn_saved");
      const a = localStorage.getItem("cn_apps");
      if (s) setSavedJobs(JSON.parse(s));
      if (a) setApplications(JSON.parse(a));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cn_saved", JSON.stringify(savedJobs));
    } catch {}
  }, [savedJobs]);
  useEffect(() => {
    try {
      localStorage.setItem("cn_apps", JSON.stringify(applications));
    } catch {}
  }, [applications]);
  useEffect(() => {
    try {
      localStorage.setItem("cn_employer_jobs", JSON.stringify(employerJobs));
    } catch {}
  }, [employerJobs]);
  useEffect(() => {
    try {
      localStorage.setItem("cn_employer_applicants", JSON.stringify(employerApplicants));
    } catch {}
  }, [employerApplicants]);

  // Handle selected job from filter
  const selectedJob = jobFilter?.selected;

  const renderPage = () => {
    if (selectedJob && page === "apply-job")
      return (
        <JobApplicationPage
          job={selectedJob}
          setPage={setPage}
          setJobFilter={setJobFilter}
          user={user}
        />
      );
    if (selectedJob && page === "job-detail")
      return (
        <JobDetailPage
          job={selectedJob}
          setPage={setPage}
          setJobFilter={setJobFilter}
          user={user}
        />
      );
    switch (page) {
      case "home":
        return (
          <HomePage setPage={setPage} setJobFilter={setJobFilter} user={user} />
        );
      case "jobs":
        return (
          <JobsPage
            jobFilter={jobFilter}
            setPage={setPage}
            setJobFilter={setJobFilter}
            user={user}
          />
        );
      case "job-detail":
        return selectedJob ? (
          <JobDetailPage
            job={selectedJob}
            setPage={setPage}
            setJobFilter={setJobFilter}
            user={user}
          />
        ) : (
          <JobsPage
            jobFilter={jobFilter}
            setPage={setPage}
            setJobFilter={setJobFilter}
            user={user}
          />
        );
      case "companies":
        return <CompaniesPage setPage={setPage} setJobFilter={setJobFilter} />;
      case "resources":
        return <ResourcesPage />;
      case "employer":
        return user ? (
          <EmployerPage
            setPage={setPage}
            user={user}
            employerJobs={employerJobs}
            setEmployerJobs={setEmployerJobs}
            employerApplicants={employerApplicants}
            setEmployerApplicants={setEmployerApplicants}
          />
        ) : (
          <AuthPage mode="login" setPage={setPage} setUser={setUser} />
        );
      case "dashboard":
        return user ? (
          <DashboardPage
            user={user}
            setPage={setPage}
            setJobFilter={setJobFilter}
            profile={profile}
            setProfile={setProfile}
          />
        ) : (
          <AuthPage mode="login" setPage={setPage} setUser={setUser} />
        );
      case "profile-setup":
        return user ? (
          <ProfileSetupPage
            user={user}
            setPage={setPage}
            profile={profile}
            setProfile={setProfile}
            showToast={showToast}
          />
        ) : (
          <AuthPage mode="signup" setPage={setPage} setUser={setUser} />
        );
      case "login":
        return <AuthPage mode="login" setPage={setPage} setUser={setUser} />;
      case "signup":
        return <AuthPage mode="signup" setPage={setPage} setUser={setUser} />;
      default:
        return (
          <HomePage setPage={setPage} setJobFilter={setJobFilter} user={user} />
        );
    }
  };

  // Watch for job selection changes - only auto-navigate when a new job is selected
  useEffect(() => {
    if (jobFilter?.selected && page !== "apply-job") setPage("job-detail");
  }, [jobFilter?.selected]);

  // ── Loading screen while Firebase confirms session ─────────────────────────
  if (authLoading) return (
    <div style={{
      position:"fixed", inset:0,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background: darkMode ? "#0B1026" : "#F8FAFC",
      gap:24, zIndex:9999,
    }}>
      <style>{`
        @keyframes cn-pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.08);opacity:0.8;}}
        @keyframes cn-slide{0%{transform:translateX(-100%);}100%{transform:translateX(400%);}}
      `}</style>
      <div style={{
        width:64, height:64, borderRadius:20,
        background:"linear-gradient(135deg,#151B3D,#7C3AED)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 8px 32px rgba(124,58,237,0.4)",
        animation:"cn-pulse 1.6s ease-in-out infinite",
      }}>
        <CnMark size={44}/>
      </div>
      <div style={{fontWeight:800, fontSize:22, fontFamily:"Inter,sans-serif"}}>
        <span style={{color: darkMode?"white":"#151B3D"}}>Career</span>
        <span style={{background:"linear-gradient(135deg,#7C3AED,#22D3EE)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Nova</span>
      </div>
      <div style={{width:120,height:3,borderRadius:99,background:darkMode?"#1F2937":"#E5E7EB",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,width:"35%",height:"100%",background:"linear-gradient(90deg,#7C3AED,#22D3EE)",borderRadius:99,animation:"cn-slide 1.1s ease-in-out infinite"}}/>
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <AppContext.Provider
        value={{
          savedJobs,
          setSavedJobs,
          applications,
          setApplications,
          showToast,
        }}
      >
        <style>{styles}</style>
        <Navbar page={page} setPage={setPage} user={user} setUser={setUser} />
        <main style={{ minHeight: "calc(100dvh - 64px)" }}>{renderPage()}</main>
        {toast && (
          <Toast
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}

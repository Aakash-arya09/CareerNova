import { useState, useEffect, useContext, createContext, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

// ─── FIREBASE CONFIG ─────────────────────────────────────────────────────────
// Replace these values with your own from Firebase Console →
// Project Settings → Your Apps → Firebase SDK snippet
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCke2zBvZJbtdCFI7QYTQk3clOhDBuYaQs",
  authDomain: "careernova-3cacc.firebaseapp.com",
  projectId: "careernova-3cacc",
  storageBucket: "careernova-3cacc.firebasestorage.app",
  messagingSenderId: "960586972151",
  appId: "1:960586972151:web:7947cbb8cfb9c805cb0cf2",
  measurementId: "G-DN0RZ0BWJN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Prevent re-initializing if hot-reloaded
const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(firebaseApp);

// ─── CONTEXT ────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

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
  };
  return icons[name] || null;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #1a1a2e; }
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
    --text-muted: #6B7280;
    --border: #E5E7EB;
    --grad: linear-gradient(135deg, #151B3D, #7C3AED, #22D3EE);
    --grad-btn: linear-gradient(135deg, #7C3AED, #22D3EE);
    --shadow: 0 4px 24px rgba(21,27,61,0.08);
    --shadow-lg: 0 8px 40px rgba(21,27,61,0.14);
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
  .card { background: white; border-radius: 16px; box-shadow: var(--shadow); border: 1px solid rgba(229,231,235,0.6); }
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
  .progress-bar { height: 8px; background: #E5E7EB; border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--grad-btn); border-radius: 999px; transition: width 0.6s ease; }
  input, select, textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: var(--primary);
    background: white;
    transition: border 0.2s;
    outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; display: block; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .divider { height: 1px; background: var(--border); margin: 24px 0; }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #4B5563;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .sidebar-link:hover { background: #F3F4F6; color: var(--primary); }
  .sidebar-link.active { background: #EDE9FE; color: var(--violet); font-weight: 600; }
  .section-title { font-size: 28px; font-weight: 800; color: var(--primary); }
  .section-sub { font-size: 16px; color: var(--text-muted); margin-top: 8px; }
  .animate-in { animation: fadeUp 0.4s ease both; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  .job-card { transition: all 0.25s; }
  .job-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
  .company-card { transition: all 0.25s; }
  .company-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .match-ring { background: conic-gradient(var(--violet) var(--pct, 0%), #E5E7EB var(--pct, 0%)); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .nav-link { font-size: 14px; font-weight: 500; color: #4B5563; cursor: pointer; padding: 8px 4px; border: none; background: none; transition: color 0.15s; white-space: nowrap; }
  .nav-link:hover { color: var(--violet); }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; backdrop-filter: blur(2px); }
  @media (max-width: 768px) {
    .section-title { font-size: 22px; }
    .hide-mobile { display: none !important; }
    .show-mobile { display: flex !important; }
  }
  .show-mobile { display: none; }
  .tooltip { position: relative; }
  .tooltip:hover::after { content: attr(data-tip); position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); background: #1F2937; color: white; font-size: 11px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; z-index: 100; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F1F5F9; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .star-bg { position: absolute; width: 3px; height: 3px; background: white; border-radius: 50%; animation: twinkle 3s infinite; }
  @keyframes twinkle { 0%,100% { opacity:0.2; } 50% { opacity:1; } }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  @media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr 1fr; } .grid-2 { grid-template-columns: 1fr; } }
  @media (max-width: 600px) { .grid-3 { grid-template-columns: 1fr; } }
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = "success", onClose }) => (
  <div
    style={{
      position: "fixed",
      bottom: 28,
      right: 28,
      zIndex: 9999,
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
      minWidth: 240,
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

// ─── NAV BAR ────────────────────────────────────────────────────────────────
const Navbar = ({ page, setPage, user, setUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
          borderBottom: `1px solid ${scrolled ? "#E5E7EB" : "transparent"}`,
          transition: "all 0.3s",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            height: 64,
            gap: 32,
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
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #151B3D, #7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name="lightning"
                size={18}
                className=""
                style={{ color: "#22D3EE" }}
              />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 20,
                background: "linear-gradient(135deg, #151B3D, #7C3AED)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CareerNova
            </span>
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
                    border: "1.5px solid #E5E7EB",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
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
                    }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <span className="hide-mobile">{user.name.split(" ")[0]}</span>
                </button>
                <button className="btn-ghost" onClick={() => setUser(null)}>
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
              width: 280,
              height: "100vh",
              background: "white",
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
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  background: "linear-gradient(135deg, #151B3D, #7C3AED)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CareerNova
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
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
                style={{ height: 1, background: "#E5E7EB", margin: "12px 0" }}
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
                    onClick={() => {
                      setUser(null);
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
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#1F2937",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {job.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {job.company}
              </p>
            </div>
            <button
              onClick={() => onSave(job.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: saved ? "#EF4444" : "#9CA3AF",
                transition: "all 0.2s",
                flexShrink: 0,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                color: "#6B7280",
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
                color: "#6B7280",
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
                style={{ fontSize: 11, color: "#9CA3AF", padding: "4px 8px" }}
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
              <span style={{ fontWeight: 700, fontSize: 14, color: "#059669" }}>
                {job.salary}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "#9CA3AF",
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
                      ? "#059669"
                      : job.match >= 80
                        ? "#7C3AED"
                        : "#D97706",
                  background:
                    job.match >= 90
                      ? "#D1FAE5"
                      : job.match >= 80
                        ? "#EDE9FE"
                        : "#FEF3C7",
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
          padding: "80px 20px",
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
              fontSize: "clamp(32px, 6vw, 60px)",
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
              color: "#9CA3AF",
              maxWidth: 560,
              margin: "0 auto 36px",
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
              background: "rgba(255,255,255,0.95)",
            }}
          >
            <div
              style={{
                flex: 2,
                minWidth: 160,
                display: "flex",
                alignItems: "center",
                gap: 10,
                position: "relative",
              }}
            >
              <Icon
                name="search"
                size={18}
                style={{ position: "absolute", left: 12, color: "#9CA3AF" }}
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
                flex: 1.5,
                minWidth: 130,
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderLeft: "1px solid #E5E7EB",
                paddingLeft: 12,
                position: "relative",
              }}
            >
              <Icon
                name="location"
                size={18}
                style={{ position: "absolute", left: 24, color: "#9CA3AF" }}
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
                flex: 1,
                minWidth: 130,
                borderLeft: "1px solid #E5E7EB",
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
                  color: searchExp ? "#1F2937" : "#9CA3AF",
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
              style={{ minWidth: 140, justifyContent: "center" }}
            >
              <Icon name="search" size={16} /> Search Jobs
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "#6B7280" }}>
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
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}
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
                border: "1.5px solid #E5E7EB",
                background: "white",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                transition: "all 0.2s",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7C3AED";
                e.currentTarget.style.color = "#7C3AED";
                e.currentTarget.style.background = "#F5F3FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.color = "#374151";
                e.currentTarget.style.background = "white";
              }}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span> {c.label}
              <span
                style={{
                  background: "#EDE9FE",
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
        style={{ padding: "0 20px 60px", maxWidth: 1200, margin: "0 auto" }}
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
                showToast("Application submitted! 🎉");
              }}
            />
          ))}
        </div>
      </section>

      {/* AI FEATURES */}
      <section
        style={{
          background: "linear-gradient(135deg, #0B1026, #151B3D)",
          padding: "72px 20px",
          color: "white",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
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
                color: "#9CA3AF",
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
                    style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}
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
                    background: "conic-gradient(#7C3AED 92%, #E5E7EB 0%)",
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
                      background: "white",
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
                <div style={{ fontWeight: 700, color: "#1F2937" }}>
                  AI Match Score
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
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
                        color: "#374151",
                        marginBottom: 4,
                      }}
                    >
                      <span>{skill}</span>
                      <span
                        style={{
                          color:
                            pct > 85
                              ? "#059669"
                              : pct > 70
                                ? "#7C3AED"
                                : "#D97706",
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
        style={{ padding: "72px 20px", maxWidth: 1200, margin: "0 auto" }}
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
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1F2937" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
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
              background: "white",
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
          color: "#9CA3AF",
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
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #151B3D, #7C3AED)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="lightning" size={15} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>
                  CareerNova
                </span>
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
                    onMouseLeave={(e) => (e.target.style.color = "#9CA3AF")}
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
const JobsPage = ({ jobFilter, setPage, setJobFilter }) => {
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
    if (!applications.find((a) => a.jobId === job.id)) {
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
    showToast("Application submitted! 🎉");
  };

  const FiltersPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "#1F2937",
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
          opts: ["", "Remote", "Hybrid", "On-site"],
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>
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
              color: "#9CA3AF",
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
        <div style={{ flex: 1, minWidth: 130, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9CA3AF",
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
            top: 80,
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
                width: 280,
                height: "100vh",
                background: "white",
                zIndex: 60,
                padding: 24,
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
        <div style={{ flex: 1, minWidth: 0 }}>
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
            <span style={{ fontWeight: 600, color: "#374151", fontSize: 15 }}>
              <span style={{ color: "#7C3AED", fontWeight: 700 }}>
                {filtered.length}
              </span>{" "}
              jobs found
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Sort:</span>
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
                style={{ fontWeight: 700, color: "#1F2937", marginBottom: 6 }}
              >
                No jobs found
              </h3>
              <p style={{ color: "#9CA3AF" }}>
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
const JobDetailPage = ({ job, setPage, setJobFilter }) => {
  const { savedJobs, setSavedJobs, showToast, applications, setApplications } =
    useContext(AppContext);
  const company = COMPANIES.find((c) => c.id === job.companyId);
  const isSaved = savedJobs.includes(job.id);
  const isApplied = applications.find((a) => a.jobId === job.id);
  const similar = JOBS.filter(
    (j) =>
      j.id !== job.id &&
      (j.category === job.category || j.companyId === job.companyId),
  ).slice(0, 3);

  const handleApply = () => {
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
    showToast(isApplied ? "Already applied!" : "Application submitted! 🎉");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
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
                    color: "#1F2937",
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
                      color: "#6B7280",
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
                      color: "#6B7280",
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
                      color: "#6B7280",
                    }}
                  >
                    <Icon name="clock" size={13} />
                    Posted {job.posted}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}
                >
                  {job.salary}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    background: `${job.match >= 90 ? "#D1FAE5" : "#EDE9FE"}`,
                    color: job.match >= 90 ? "#059669" : "#7C3AED",
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
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleApply}
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
                className={`btn-ghost ${isSaved ? "btn-outline" : ""}`}
                onClick={() => {
                  setSavedJobs((prev) =>
                    prev.includes(job.id)
                      ? prev.filter((id) => id !== job.id)
                      : [...prev, job.id],
                  );
                  showToast(
                    isSaved ? "Job removed" : "Job saved! ❤️",
                    isSaved ? "error" : "success",
                  );
                }}
              >
                <Icon name={isSaved ? "heart-fill" : "heart"} size={16} />
              </button>
              <button
                className="btn-ghost"
                onClick={() => showToast("Link copied to clipboard!")}
              >
                <Icon name="share" size={16} />
              </button>
              <button
                className="btn-ghost"
                onClick={() => showToast("Job reported")}
              >
                <Icon name="flag" size={16} />
              </button>
            </div>
          </div>
          {/* Details */}
          {[
            {
              title: "About the Role",
              content: (
                <p style={{ color: "#4B5563", lineHeight: 1.8 }}>
                  {job.description}
                </p>
              ),
            },
            {
              title: "Key Responsibilities",
              content: (
                <ul
                  style={{ color: "#4B5563", lineHeight: 2, paddingLeft: 18 }}
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
                  style={{ color: "#4B5563", lineHeight: 2, paddingLeft: 18 }}
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
                  color: "#1F2937",
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
                color: "#1F2937",
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
                <div style={{ fontWeight: 700, color: "#1F2937" }}>
                  {company?.name}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {company?.industry}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
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
              <span style={{ color: "#6B7280" }}>Company size</span>
              <span style={{ fontWeight: 600, color: "#374151" }}>
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
              <span style={{ color: "#6B7280" }}>Open positions</span>
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
                color: "#1F2937",
              }}
            >
              Similar Jobs
            </h3>
            {similar.map((j) => (
              <div
                key={j.id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #F3F4F6",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setJobFilter({ selected: j });
                }}
              >
                <div
                  style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}
                >
                  {j.title}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {j.company} · {j.location}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#059669",
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 20px" }}>
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
              color: "#9CA3AF",
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
      <div className="grid-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
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
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>
              {c.name}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>
              {c.industry}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
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
        return (
          <ProfileSection
            user={user}
            showToast={showToast}
            profile={profile}
            setProfile={setProfile}
          />
        );
      case "applications":
        return <ApplicationsSection applications={applications} />;
      case "saved":
        return (
          <SavedSection
            savedJobs={savedJobs}
            setSavedJobs={setSavedJobs}
            setPage={setPage}
            setJobFilter={setJobFilter}
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
    <div
      style={{
        display: "flex",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 20px",
        gap: 24,
      }}
    >
      {/* Sidebar */}
      <div
        className="card hide-mobile"
        style={{
          width: 230,
          padding: 16,
          alignSelf: "flex-start",
          position: "sticky",
          top: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "8px 12px",
            marginBottom: 16,
            background: "#F8FAFC",
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
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{user?.role}</div>
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
      {/* Mobile tab bar */}
      <div
        className="show-mobile"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #E5E7EB",
          zIndex: 40,
          padding: "6px 0",
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
              color: activeSection === item.id ? "#7C3AED" : "#9CA3AF",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <Icon name={item.icon} size={18} />
            {item.label.split(" ")[0]}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>{renderSection()}</div>
    </div>
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
  const completion = computeProfileStrength(profile);
  const form = profile?.form || {};
  const skills = profile?.skills || [];
  const experience = profile?.experience || [];
  const checklist = [
    ["✅ Basic Info", !!(form.name && form.email)],
    ["✅ Work Experience", experience.length > 0],
    ["⚠️ Add Skills", skills.length >= 3],
    ["⚠️ Upload Resume", false],
    ["⚠️ Add Projects", false],
  ];
  const stats = [
    {
      label: "Applications",
      value: applications.length,
      icon: "send",
      color: "#7C3AED",
      bg: "#EDE9FE",
    },
    {
      label: "Saved Jobs",
      value: savedJobs.length,
      icon: "heart",
      color: "#EF4444",
      bg: "#FEE2E2",
    },
    {
      label: "Profile Views",
      value: 142,
      icon: "eye",
      color: "#059669",
      bg: "#D1FAE5",
    },
    {
      label: "Interviews",
      value: 2,
      icon: "trending",
      color: "#D97706",
      bg: "#FEF3C7",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#1F2937" }}>
        Welcome back, {user?.name?.split(" ")[0]} 👋
      </div>
      <div className="grid-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
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
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
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
          <div style={{ fontWeight: 700, color: "#1F2937" }}>
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
          {checklist.map(([item, done]) => (
            <span
              key={item}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 999,
                background: done ? "#D1FAE5" : "#FEF3C7",
                color: done ? "#059669" : "#D97706",
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
          background: "linear-gradient(135deg, #F5F3FF, #ECFEFF)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "#1F2937",
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
                background: "white",
                borderRadius: 12,
                cursor: "pointer",
                border: "1px solid rgba(124,58,237,0.1)",
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}
                >
                  {j.title}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {j.company} · {j.location}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: "#EDE9FE",
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
  const [form, setForm] = useState(
    profile?.form || {
      ...emptyProfile.form,
      name: user?.name || "",
      email: user?.email || "",
    }
  );
  const [skills, setSkills] = useState(profile?.skills || []);
  const [experience, setExperience] = useState(profile?.experience || []);
  const [newSkill, setNewSkill] = useState("");
  const [newExp, setNewExp] = useState({ role: "", company: "", period: "", desc: "" });
  const strength = computeProfileStrength({ form, skills, experience });

  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    setSkills((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setNewSkill("");
  };
  const removeSkill = (s) => setSkills((prev) => prev.filter((x) => x !== s));

  const addExperience = () => {
    if (!newExp.role.trim() || !newExp.company.trim()) return;
    setExperience((prev) => [
      ...prev,
      {
        role: newExp.role.trim(),
        company: newExp.company.trim(),
        period: newExp.period,
        desc: newExp.desc,
      },
    ]);
    setNewExp({ role: "", company: "", period: "", desc: "" });
  };
  const removeExperience = (i) =>
    setExperience((prev) => prev.filter((_, idx) => idx !== i));

  const saveProfile = () => {
    setProfile({
      form: { ...form, email: user?.email || form.email },
      skills,
      experience,
    });
    showToast("Profile saved! ✅");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 20, color: "#1F2937" }}>
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
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 900,
              fontSize: 28,
            }}
          >
            {form.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>
              {form.name}
            </div>
            <div style={{ color: "#7C3AED", fontSize: 14, fontWeight: 600 }}>
              {form.headline}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#9CA3AF",
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
                background: "#EDE9FE",
                padding: "12px 20px",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 22, color: "#7C3AED" }}>
                {strength}%
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
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Skills
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
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
                  padding: 0,
                  fontSize: 12,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1.5px solid #E5E7EB",
                fontSize: 12,
                width: 140,
                outline: "none",
              }}
            />
            <button
              className="btn-ghost"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={addSkill}
            >
              <Icon name="plus" size={12} /> Add
            </button>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Experience
        </div>
        {experience.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>
            No experience added yet. Add your work history below to boost your
            profile strength.
          </p>
        ) : (
          experience.map((e, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                paddingBottom: 16,
                borderBottom:
                  i < experience.length - 1 ? "1px solid #F3F4F6" : "none",
                marginBottom: i < experience.length - 1 ? 16 : 0,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#EDE9FE",
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
                <div style={{ fontWeight: 700, color: "#1F2937" }}>{e.role}</div>
                <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>
                  {e.company}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {e.period}
                </div>
                {e.desc && (
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                    {e.desc}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeExperience(i)}
                title="Remove"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#EF4444",
                  fontSize: 18,
                  alignSelf: "flex-start",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div className="form-group">
            <label>Role / Title</label>
            <input
              value={newExp.role}
              onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
              placeholder="e.g. Frontend Developer"
            />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input
              value={newExp.company}
              onChange={(e) =>
                setNewExp((p) => ({ ...p, company: e.target.value }))
              }
              placeholder="e.g. Tech Corp"
            />
          </div>
          <div className="form-group">
            <label>Period</label>
            <input
              value={newExp.period}
              onChange={(e) =>
                setNewExp((p) => ({ ...p, period: e.target.value }))
              }
              placeholder="e.g. 2022 – Present"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              value={newExp.desc}
              onChange={(e) => setNewExp((p) => ({ ...p, desc: e.target.value }))}
              placeholder="Brief description"
            />
          </div>
        </div>
        <button
          className="btn-ghost"
          style={{ marginTop: 4 }}
          onClick={addExperience}
        >
          <Icon name="plus" size={13} /> Add Experience
        </button>
      </div>
      <button
        className="btn-primary"
        style={{ alignSelf: "flex-start" }}
        onClick={saveProfile}
      >
        <Icon name="check" size={15} /> Save Changes
      </button>
    </div>
  );
};

const ApplicationsSection = ({ applications }) => {
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
          color: "#1F2937",
          marginBottom: 20,
        }}
      >
        Applied Jobs
      </div>
      {applications.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontWeight: 700 }}>No applications yet</h3>
          <p style={{ color: "#9CA3AF" }}>
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
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#1F2937",
                      }}
                    >
                      {app.job.title}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}
                    >
                      {app.job.company} · {app.job.location}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}
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
                              : "#E5E7EB",
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
                              background: "white",
                            }}
                          />
                        )}
                      </div>
                      {si < 4 && (
                        <div
                          style={{
                            height: 2,
                            flex: 1,
                            background: si < statusIdx ? "#7C3AED" : "#E5E7EB",
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
                        color: si <= statusIdx ? "#7C3AED" : "#9CA3AF",
                        fontWeight: si === statusIdx ? 700 : 400,
                        textAlign: "center",
                        flex: si < 4 ? 1 : "none",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SavedSection = ({ savedJobs, setSavedJobs, setPage, setJobFilter }) => {
  const { showToast, applications, setApplications } = useContext(AppContext);
  const saved = JOBS.filter((j) => savedJobs.includes(j.id));
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "#1F2937",
          marginBottom: 20,
        }}
      >
        Saved Jobs
      </div>
      {saved.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
          <h3 style={{ fontWeight: 700 }}>No saved jobs</h3>
          <p style={{ color: "#9CA3AF" }}>
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
                  style={{ fontWeight: 700, fontSize: 15, color: "#1F2937" }}
                >
                  {job.title}
                </div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  {job.company} · {job.location}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#059669",
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
                  if (!applications.find((a) => a.jobId === job.id))
                    setApplications((prev) => [
                      ...prev,
                      {
                        jobId: job.id,
                        job,
                        status: "Applied",
                        appliedAt: new Date().toLocaleDateString(),
                      },
                    ]);
                  showToast("Application submitted! 🎉");
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
  const [alerts, setAlerts] = useState([
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
  ]);
  const [form, setForm] = useState({
    title: "",
    location: "",
    experience: "",
    frequency: "Daily",
  });
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "#1F2937",
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
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
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
        <button
          className="btn-primary"
          style={{ marginTop: 14 }}
          onClick={() => {
            if (form.title) {
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
              showToast("Alert created! 🔔");
            }
          }}
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
              <div style={{ fontWeight: 700, color: "#1F2937" }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                {a.location || "Any location"} · {a.frequency}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                className={`badge ${a.active ? "badge-green" : "badge-orange"}`}
              >
                {a.active ? "Active" : "Paused"}
              </span>
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
  const [template, setTemplate] = useState(0);
  const templates = ["Modern", "Classic", "Minimal"];
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "#1F2937",
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
              border: `2px solid ${template === i ? "#7C3AED" : "#E5E7EB"}`,
              background: template === i ? "#EDE9FE" : "white",
              color: template === i ? "#7C3AED" : "#374151",
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
          {[
            [
              "Personal Details",
              ["Full Name", "Email", "Phone", "Location", "LinkedIn"],
            ],
            [
              "Work Experience",
              ["Job Title", "Company", "Duration", "Description"],
            ],
            ["Education", ["Degree", "Institution", "Year"]],
            ["Skills", ["Add skills separated by commas"]],
          ].map(([section, fields]) => (
            <div key={section} className="card" style={{ padding: 18 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 12,
                  color: "#1F2937",
                }}
              >
                {section}
              </div>
              {fields.map((f) => (
                <input key={f} placeholder={f} style={{ marginBottom: 8 }} />
              ))}
            </div>
          ))}
        </div>
        {/* Preview */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#9CA3AF",
              marginBottom: 14,
            }}
          >
            Preview
          </div>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              padding: 20,
              minHeight: 400,
            }}
          >
            <div
              style={{
                background:
                  template === 0
                    ? "linear-gradient(135deg, #7C3AED, #22D3EE)"
                    : template === 1
                      ? "#151B3D"
                      : "#F8FAFC",
                padding: 20,
                borderRadius: 8,
                color: template < 2 ? "white" : "#1F2937",
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>Your Name</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Professional Headline · Location
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#1F2937",
                  marginBottom: 6,
                  borderBottom: "2px solid #7C3AED",
                  paddingBottom: 4,
                }}
              >
                Experience
              </div>
              <p>Your work experience will appear here...</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => showToast("Resume downloaded! 📄")}
            >
              <Icon name="download" size={15} /> Download PDF
            </button>
            <button
              className="btn-ghost"
              onClick={() => showToast("Resume uploaded! ✅")}
            >
              <Icon name="upload" size={15} /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsSection = ({ showToast }) => (
  <div>
    <div
      style={{
        fontWeight: 800,
        fontSize: 20,
        color: "#1F2937",
        marginBottom: 20,
      }}
    >
      Settings
    </div>
    {[
      {
        title: "Account",
        fields: [
          ["Email", "text", "candidate@email.com"],
          ["Password", "password", "••••••••"],
          ["Phone", "tel", "+91 98765 43210"],
        ],
      },
      {
        title: "Notifications",
        fields: [
          ["Job Alerts", "text", "Enabled"],
          ["Application Updates", "text", "Enabled"],
          ["Company News", "text", "Disabled"],
        ],
      },
      {
        title: "Privacy",
        fields: [
          ["Profile Visibility", "text", "Public"],
          ["Resume Visibility", "text", "Recruiters Only"],
        ],
      },
    ].map((section) => (
      <div
        key={section.title}
        className="card"
        style={{ padding: 22, marginBottom: 16 }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 14,
            color: "#1F2937",
          }}
        >
          {section.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {section.fields.map(([label, type, placeholder]) => (
            <div key={label} className="form-group">
              <label>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                defaultValue={
                  placeholder === "••••••••" ? undefined : placeholder
                }
              />
            </div>
          ))}
        </div>
      </div>
    ))}
    <button
      className="btn-primary"
      onClick={() => showToast("Settings saved! ✅")}
    >
      <Icon name="check" size={15} /> Save Settings
    </button>
  </div>
);

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
    { label: "Total Applicants", value: totalApplicants, icon: "user", color: "#059669" },
    { label: "Profile Views", value: profileViews, icon: "eye", color: "#D97706" },
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
                      style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}
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
                <Icon name="briefcase" size={48} className="" style={{ color: "#9CA3AF", marginBottom: 12 }} />
                <div style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>
                  You haven't posted any jobs yet. Post your first job to see performance here.
                </div>
                <button className="btn-primary" onClick={() => setActiveTab("post")}>
                  <Icon name="plus" size={15} /> Post a Job
                </button>
              </div>
            ) : (
              employerJobs.slice(0, 5).map((j) => (
                <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 14 }}>{j.title}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{j.location} · Posted {j.postedAt}</div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, color: "#7C3AED" }}>
                        {employerApplicants.filter((a) => a.jobId === j.id).length}
                      </div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>Applicants</div>
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
              color: "#1F2937",
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
                            : "#E5E7EB",
                      color: i + 1 <= step ? "white" : "#9CA3AF",
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
                      color: i + 1 <= step ? "#7C3AED" : "#9CA3AF",
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
                      background: i + 1 < step ? "#7C3AED" : "#E5E7EB",
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
                  <input placeholder={p} value={jobForm[k]} onChange={(e) => setJobForm((f) => ({ ...f, [k]: e.target.value }))} />
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
                onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Required Skills (comma separated)</label>
                <input placeholder="React, TypeScript, Node.js..." value={jobForm.skills} onChange={(e) => setJobForm((f) => ({ ...f, skills: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Experience Required</label>
                <select value={jobForm.experience} onChange={(e) => setJobForm((f) => ({ ...f, experience: e.target.value }))}>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>5–8 years</option>
                  <option>8+ years</option>
                </select>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="grid-2">
              {[
                ["Min Salary (₹ LPA)", "minSalary"],
                ["Max Salary (₹ LPA)", "maxSalary"],
                ["Job Type", "jobType"],
                ["Work Mode", "workMode"],
              ].map(([l, k], i) => (
                <div key={l} className="form-group">
                  <label>{l}</label>
                  {i > 1 ? (
                    <select value={jobForm[k]} onChange={(e) => setJobForm((f) => ({ ...f, [k]: e.target.value }))}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                      <option>Hybrid</option>
                    </select>
                  ) : (
                    <input type="number" placeholder="e.g. 12" value={jobForm[k]} onChange={(e) => setJobForm((f) => ({ ...f, [k]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          )}
          {step === 5 && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>
                Ready to publish!
              </h3>
              <p style={{ color: "#9CA3AF", marginTop: 8 }}>
                Your job listing looks great. Click Publish to make it live.
              </p>
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
                    title: jobForm.title || "Untitled Position",
                    company: jobForm.company || user?.name || "My Company",
                    location: jobForm.location || "Remote",
                    department: jobForm.department,
                    description: jobForm.description,
                    skills: jobForm.skills ? jobForm.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
                    experience: jobForm.experience,
                    salary: (jobForm.minSalary && jobForm.maxSalary)
                      ? `\u20B9${jobForm.minSalary}L \u2013 \u20B9${jobForm.maxSalary}L/yr`
                      : jobForm.minSalary ? `\u20B9${jobForm.minSalary}L+` : "Negotiable",
                    jobType: jobForm.jobType || "Full-time",
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
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>Job Listings</div>
            <button className="btn-primary" onClick={() => setActiveTab("post")}>
              <Icon name="plus" size={15} /> Post New Job
            </button>
          </div>
          {employerJobs.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <Icon name="briefcase" size={48} className="" style={{ color: "#9CA3AF", marginBottom: 12 }} />
              <div style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>No jobs posted yet.</div>
              <button className="btn-primary" onClick={() => setActiveTab("post")}>
                <Icon name="plus" size={15} /> Post Your First Job
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {employerJobs.map((j) => (
                <div key={j.id} className="card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, color: "#1F2937" }}>{j.title}</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
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
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>Applicants</div>
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
                    <button className="btn-ghost" style={{ padding: "7px 12px", color: "#DC2626" }} onClick={() => {
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
          <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937", marginBottom: 16 }}>
            Applicants {allApplicants.length > 0 ? `(${allApplicants.length})` : ""}
          </div>
          {allApplicants.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <Icon name="user" size={48} className="" style={{ color: "#9CA3AF", marginBottom: 12 }} />
              <div style={{ color: "#6B7280", fontSize: 14, marginBottom: 8 }}>No applicants yet.</div>
              <div style={{ color: "#9CA3AF", fontSize: 13 }}>
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
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontWeight: 700, color: "#1F2937" }}>{a.name}</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>{a.role} · {a.experience}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
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
                    <button className="btn-ghost" style={{ padding: "7px 14px", background: isShortlisted ? "#D1FAE5" : undefined, color: isShortlisted ? "#059669" : undefined }} onClick={() => {
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
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937", marginBottom: 20 }}>Schedule Interview with {schedulingInterview.name}</div>
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
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>Applicant Profile</div>
                  <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setViewingProfile(null)}><Icon name="x" size={18} /></button>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 24, flexShrink: 0 }}>{viewingProfile.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>{viewingProfile.name}</div>
                    <div style={{ fontSize: 14, color: "#9CA3AF" }}>{viewingProfile.role} · {viewingProfile.experience}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>EMAIL</div>
                  <div style={{ fontSize: 14, color: "#1F2937" }}>{viewingProfile.email}</div>
                </div>
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>APPLIED FOR</div>
                  <div style={{ fontSize: 14, color: "#1F2937" }}>{employerJobs.find((j) => j.id === viewingProfile.jobId)?.title || "Unknown Job"}</div>
                </div>
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>STATUS</div>
                  <span className={`badge ${viewingProfile.status === "shortlisted" ? "badge-green" : viewingProfile.status === "interviewed" ? "badge-orange" : "badge-violet"}`}>
                    {viewingProfile.status === "shortlisted" ? "Shortlisted" : viewingProfile.status === "interviewed" ? "Interview Scheduled" : "Applied"}
                  </span>
                </div>
                {viewingProfile.status === "interviewed" && (
                  <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>INTERVIEW DETAILS</div>
                    <div style={{ fontSize: 14, color: "#1F2937" }}>
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          fontWeight: 800,
          fontSize: 24,
          color: "#1F2937",
          marginBottom: 24,
        }}
      >
        Employer Portal
      </div>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#F3F4F6",
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
              color: activeTab === t.id ? "#7C3AED" : "#6B7280",
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

// ─── PROFILE SETUP (first step after signup) ─────────────────────────────────
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

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    setSkills((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setNewSkill("");
  };
  const removeSkill = (s) => setSkills((prev) => prev.filter((x) => x !== s));

  const addExperience = () => {
    if (!newExp.role.trim() || !newExp.company.trim()) return;
    setExperience((prev) => [
      ...prev,
      { role: newExp.role.trim(), company: newExp.company.trim(), period: newExp.period, desc: newExp.desc },
    ]);
    setNewExp({ role: "", company: "", period: "", desc: "" });
  };
  const removeExperience = (i) =>
    setExperience((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    setProfile({ form: { ...form, email: user?.email || form.email }, skills, experience });
    showToast("Profile created! 🎉");
    setPage("dashboard");
  };
  const handleSkip = () => {
    setPage("dashboard");
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, color: "#1F2937" }}>
          Build your profile strength
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginTop: 6 }}>
          Take a minute to complete your profile. You can skip and do this later.
        </p>
      </div>
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: "#1F2937" }}>Profile Strength</div>
          <span style={{ fontWeight: 700, color: "#7C3AED", fontSize: 18 }}>{strength}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${strength}%` }} />
        </div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937", marginBottom: 14 }}>
          Basic Info
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Professional Headline</label>
            <input value={form.headline} onChange={(e) => updateForm("headline", e.target.value)} placeholder="e.g. Full Stack Developer" />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Bengaluru, India" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label>About</label>
          <textarea rows={3} value={form.about} onChange={(e) => updateForm("about", e.target.value)} placeholder="Tell employers about yourself" />
        </div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937", marginBottom: 14 }}>
          Skills
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {skills.map((s) => (
            <span key={s} className="tag">
              {s}
              <button onClick={() => removeSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7C3AED", marginLeft: 4, padding: 0, fontSize: 12 }}>×</button>
            </span>
          ))}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="Add a skill"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 12, width: 140, outline: "none" }}
            />
            <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={addSkill}>
              <Icon name="plus" size={12} /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937", marginBottom: 14 }}>
          Experience
        </div>
        {experience.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>
            No experience added yet.
          </p>
        ) : (
          experience.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16, borderBottom: i < experience.length - 1 ? "1px solid #F3F4F6" : "none", marginBottom: i < experience.length - 1 ? 16 : 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED", flexShrink: 0 }}>
                <Icon name="briefcase" size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#1F2937" }}>{e.role}</div>
                <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>{e.company}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{e.period}</div>
                {e.desc && <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{e.desc}</div>}
              </div>
              <button onClick={() => removeExperience(i)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 18, alignSelf: "flex-start", padding: 0 }}>×</button>
            </div>
          ))
        )}
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label>Role / Title</label>
            <input value={newExp.role} onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Frontend Developer" />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input value={newExp.company} onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))} placeholder="e.g. Tech Corp" />
          </div>
          <div className="form-group">
            <label>Period</label>
            <input value={newExp.period} onChange={(e) => setNewExp((p) => ({ ...p, period: e.target.value }))} placeholder="e.g. 2022 – Present" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={newExp.desc} onChange={(e) => setNewExp((p) => ({ ...p, desc: e.target.value }))} placeholder="Brief description" />
          </div>
        </div>
        <button className="btn-ghost" style={{ marginTop: 4 }} onClick={addExperience}>
          <Icon name="plus" size={13} /> Add Experience
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
        <button className="btn-ghost" style={{ padding: "12px 24px" }} onClick={handleSkip}>
          Skip for now
        </button>
        <button className="btn-primary" style={{ padding: "12px 24px" }} onClick={handleSave}>
          <Icon name="check" size={15} /> Save & Continue
        </button>
      </div>
    </div>
  );
};

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
const AuthPage = ({ mode, setPage, setUser }) => {
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "seeker" });
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const timerRef = useRef(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const { showToast } = useContext(AppContext);

  // OTP countdown
  useEffect(() => {
    if (step === "otp") {
      setOtpTimer(60);
      timerRef.current = setInterval(() => setOtpTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const genOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    showToast(`Your OTP is: ${code}`, "info");
    return code;
  };

  // OTP input handlers
  const handleOtpKey = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) otpRefs[i + 1].current?.focus();
  };
  const handleOtpBackspace = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  // Login
  const handleLogin = () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setUser({ name: "Alex Johnson", email: form.email, role: form.role === "employer" ? "Employer" : "Job Seeker" });
    showToast("Welcome back! 👋");
    setPage("dashboard");
  };

  // Signup step 1 → send OTP
  const handleSignupSubmit = () => {
    if (!form.name) { setError("Full name is required."); return; }
    if (!form.email || !form.email.includes("@")) { setError("Enter a valid email address."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    genOtp();
    setStep("otp");
  };

  // Signup step 2 → verify OTP
  const handleOtpVerify = () => {
    const entered = otp.join("");
    if (entered.length < 6) { setError("Enter the complete 6-digit OTP."); return; }
    if (entered === generatedOtp) {
      setUser({ name: form.name, email: form.email, role: form.role === "employer" ? "Employer" : "Job Seeker" });
      showToast("Account created! Welcome 🎉");
      setPage(mode === "signup" ? "profile-setup" : "dashboard");
    } else {
      const attempts = otpAttempts + 1;
      setOtpAttempts(attempts);
      setOtp(["", "", "", "", "", ""]);
      if (attempts >= 3) {
        setError("Too many wrong attempts. Going back to form.");
        setStep("form"); setOtpAttempts(0);
      } else {
        setError(`Incorrect OTP. ${3 - attempts} attempt${3 - attempts === 1 ? "" : "s"} left.`);
      }
      setTimeout(() => otpRefs[0].current?.focus(), 0);
    }
  };

  const resendOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpAttempts(0);
    setError("");
    genOtp();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFC",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #151B3D, #7C3AED)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="lightning" size={16} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>
          CareerNova
        </span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 20px 60px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontWeight: 800, fontSize: 24, color: "#111827", marginBottom: 8 }}>
              {step === "otp" ? "Verify your email" : mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p style={{ color: "#6B7280", fontSize: 14 }}>
              {step === "otp" ? `We sent a 6-digit code to ${form.email}` : mode === "login" ? "Sign in to continue to your dashboard" : "Start your job search journey today"}
            </p>
          </div>
          {step === "form" ? (<>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #E5E7EB",
              padding: "36px 32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {mode === "signup" && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "#F3F4F6",
                  padding: 4,
                  borderRadius: 10,
                  marginBottom: 28,
                }}
              >
                {[
                  ["seeker", "Job Seeker", "user"],
                  ["employer", "Employer", "building"],
                ].map(([val, label, icon]) => (
                  <button
                    key={val}
                    onClick={() => setForm((p) => ({ ...p, role: val }))}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "9px 0",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                      background: form.role === val ? "white" : "transparent",
                      color: form.role === val ? "#7C3AED" : "#6B7280",
                      boxShadow:
                        form.role === val
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <Icon name={icon} size={14} />
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {mode === "signup" && (
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #E5E7EB",
                      fontSize: 14,
                      color: "#1F2937",
                      background: "#FAFAFA",
                      outline: "none",
                    }}
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
              )}
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #E5E7EB",
                    fontSize: 14,
                    color: "#1F2937",
                    background: "#FAFAFA",
                    outline: "none",
                  }}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
                  >
                    Password
                  </label>
                  {mode === "login" && (
                    <span
                      style={{
                        fontSize: 13,
                        color: "#7C3AED",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        if (!form.email) {
                          setError(
                            "Please enter your email address above first, then click Forgot password.",
                          );
                          return;
                        }
                        try {
                          await sendPasswordResetEmail(auth, form.email);
                          showToast(
                            "Password reset email sent! Check your inbox 📬",
                          );
                          setError("");
                        } catch (err) {
                          // Show a friendly message based on Firebase error code
                          if (err.code === "auth/user-not-found") {
                            setError(
                              "No account found with that email address.",
                            );
                          } else if (err.code === "auth/invalid-email") {
                            setError("Please enter a valid email address.");
                          } else if (err.code === "auth/too-many-requests") {
                            setError(
                              "Too many attempts. Please wait a few minutes and try again.",
                            );
                          } else {
                            setError(
                              "Could not send reset email: " + err.message,
                            );
                          }
                        }
                      }}
                    >
                      Forgot password?
                    </span>
                  )}
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #E5E7EB",
                    fontSize: 14,
                    color: "#1F2937",
                    background: "#FAFAFA",
                    outline: "none",
                  }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
            </div>
            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  marginTop: 18,
                  border: "1px solid #FECACA",
                }}
              >
                {error}
              </div>
            )}
            <button
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "13px 20px",
                fontSize: 15,
                borderRadius: 10,
                marginTop: error ? 4 : 10,
              }}
              onClick={mode === "login" ? handleLogin : handleSignupSubmit}
            >
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "#6B7280",
              marginTop: 28,
            }}
          >
            {mode === "login" ? (
              <>
                New to CareerNova?{" "}
                <span
                  style={{
                    color: "#7C3AED",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setPage("signup")}
                >
                  Create an account
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  style={{
                    color: "#7C3AED",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setPage("login")}
                >
                  Sign in
                </span>
              </>
            )}
          </p>
          </>) : (/* OTP Step */
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "36px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {/* OTP Input Boxes */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpKey(i, e.target.value)}
                  onKeyDown={e => handleOtpBackspace(i, e)}
                  style={{ width: 48, height: 54, textAlign: "center", fontSize: 22, fontWeight: 700, borderRadius: 12, border: "2px solid", borderColor: digit ? "#7C3AED" : "#E5E7EB", background: "#FAFAFA", color: "#111827", outline: "none", transition: "border-color 0.2s" }}
                />
              ))}
            </div>
            {/* Timer */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              {otpTimer > 0 ? (
                <span style={{ fontSize: 13, color: "#6B7280" }}>Resend OTP in <span style={{ fontWeight: 700, color: "#7C3AED" }}>{otpTimer}s</span></span>
              ) : (
                <span style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600, cursor: "pointer" }} onClick={resendOtp}>Resend OTP</span>
              )}
            </div>
            {error && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16, border: "1px solid #FECACA" }}>{error}</div>
            )}
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 15, borderRadius: 10 }} onClick={handleOtpVerify}>
              Verify & Create Account
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 13, color: "#6B7280", cursor: "pointer" }} onClick={() => { setStep("form"); setError(""); setOtp(["", "", "", "", "", ""]); setOtpAttempts(0); }}>
                ← Back to sign up
              </span>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────────
const ResourcesPage = () => (
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <h1 className="section-title">Career Resources</h1>
      <p className="section-sub">
        Guides, tips, and tools to help you land your dream role
      </p>
    </div>
    <div className="grid-3">
      {[
        {
          icon: "📝",
          title: "Resume Writing Guide",
          desc: "Learn how to craft a resume that gets past ATS and impresses hiring managers with proven templates and tips.",
          tag: "Guide",
          color: "#EDE9FE",
        },
        {
          icon: "🎤",
          title: "Interview Preparation",
          desc: "Master behavioral, technical, and situational interview questions with practice frameworks and sample answers.",
          tag: "Interview",
          color: "#D1FAE5",
        },
        {
          icon: "💰",
          title: "Salary Negotiation",
          desc: "Understand your market worth and learn proven strategies to negotiate a compensation package you deserve.",
          tag: "Career",
          color: "#FEF3C7",
        },
        {
          icon: "🌐",
          title: "LinkedIn Optimization",
          desc: "Transform your LinkedIn profile into a job magnet with recruiter-focused tips and keyword strategies.",
          tag: "Guide",
          color: "#ECFEFF",
        },
        {
          icon: "🤝",
          title: "Networking 101",
          desc: "Build meaningful professional relationships online and in-person that open doors to hidden job opportunities.",
          tag: "Career",
          color: "#EDE9FE",
        },
        {
          icon: "🧠",
          title: "AI in Job Search",
          desc: "Use AI tools smartly to write cover letters, prep for interviews, and research companies faster than ever.",
          tag: "Trending",
          color: "#FEE2E2",
        },
      ].map((r) => (
        <div key={r.title} className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>{r.icon}</div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: r.color,
              color: "#374151",
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {r.tag}
          </span>
          <h3
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "#1F2937",
              margin: "10px 0 8px",
            }}
          >
            {r.title}
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
            {r.desc}
          </p>
          <button
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
            }}
          >
            Read More <Icon name="chevronRight" size={13} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
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

  const showToast = (msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

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
    if (selectedJob && page === "job-detail")
      return (
        <JobDetailPage
          job={selectedJob}
          setPage={setPage}
          setJobFilter={setJobFilter}
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
          />
        );
      case "job-detail":
        return selectedJob ? (
          <JobDetailPage
            job={selectedJob}
            setPage={setPage}
            setJobFilter={setJobFilter}
          />
        ) : (
          <JobsPage
            jobFilter={jobFilter}
            setPage={setPage}
            setJobFilter={setJobFilter}
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

  // Watch for job selection changes
  useEffect(() => {
    if (jobFilter?.selected) setPage("job-detail");
  }, [jobFilter?.selected]);

  return (
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
      <main style={{ minHeight: "calc(100vh - 64px)" }}>{renderPage()}</main>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppContext.Provider>
  );
}

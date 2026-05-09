import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";
import ThemeToggle from "../components/theme-toggle";

type Slide = {
  src: string;
  title: string;
  description: string;
};

type ViewCategory = "freelancer" | "client" | "details";

const slidesData: Record<ViewCategory, Slide[]> = {
  freelancer: [
    { src: "/demo1.png", title: "Freelancer Dashboard", description: "Get a bird's-eye view of your active projects, deadlines, and total earnings." },
    { src: "/demo2.png", title: "Manage Clients", description: "Easily onboard new clients, view their details, and maintain your customer relationships." },
    { src: "/demo3.png", title: "Projects List", description: "Track your active projects, budgets, and their current completion status." },
    { src: "/demo5.png", title: "Integrated Chat", description: "Communicate in real-time with clients through built-in messaging threads." },
    { src: "/demo6.png", title: "Call Management", description: "Keep track of your communication history and quickly start new calls." },
    { src: "/demo7.png", title: "Video Calls", description: "Host real-time face-to-face video meetings with clients seamlessly." },
  ],
  client: [
    { src: "/demo11.png", title: "Client Dashboard", description: "A clean interface summarizing active projects and unread messages." },
    { src: "/demo12.png", title: "My Projects", description: "Easily track project progress, status labels, and delivery updates." },
    { src: "/demo13.png", title: "File Management", description: "Easily access, download, and manage files shared by your freelancer." },
  ],
  details: [
    { src: "/demo8.png", title: "Project Overview", description: "Get instant clarity on project budgets, deadlines, and overall progress." },
    { src: "/demo9.png", title: "File Sharing", description: "Securely upload, organize, and manage all your project deliverables and assets." },
    { src: "/demo10.png", title: "Milestones Tracking", description: "Break down projects into clear phases and check them off as they are completed." },
  ]
};

export default function DemoPage() {
  const {  toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<ViewCategory>("freelancer");
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlides = slidesData[activeCategory];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % currentSlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + currentSlides.length) % currentSlides.length);
  };

  const handleCategoryChange = (cat: ViewCategory) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
          >
            <ThemeToggle />
          </button>
          <Link
            to="/register"
            className="text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm"
          >
            Start for free
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 max-w-7xl mx-auto w-full">
        
        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Interactive Demo</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Take a virtual tour of the platform. Select a view below to see how it works from different perspectives.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-full">
          {(['freelancer', 'client', 'details'] as ViewCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              {cat === 'freelancer' ? "Freelancer View" : cat === 'client' ? "Client View" : "Project Details"}
            </button>
          ))}
        </div>

        {/* Slideshow Container */}
        <div className="relative w-full aspect-video max-h-[70vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          
          <AnimatePresence mode="wait">
            <motion.img
              key={`${activeCategory}-${currentIndex}`}
              src={currentSlides[currentIndex].src}
              alt={currentSlides[currentIndex].title}
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </AnimatePresence>

          {/* Navigation Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white flex items-end justify-between">
            <div className="max-w-xl">
              <motion.h2 
                key={`title-${activeCategory}-${currentIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-1"
              >
                {currentSlides[currentIndex].title}
              </motion.h2>
              <motion.p 
                key={`desc-${activeCategory}-${currentIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-200"
              >
                {currentSlides[currentIndex].description}
              </motion.p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrev}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-sm font-medium">
                {currentIndex + 1} / {currentSlides.length}
              </span>
              <button 
                onClick={handleNext}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

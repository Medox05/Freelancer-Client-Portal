import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, FolderKanban, FileText, Target, ChevronRight, Zap, Calendar, Plus, ChevronLeft, Video, User, Trash2 } from "lucide-react";
import { useTheme } from "../lib/theme";
import ThemeToggle from "../components/theme-toggle";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPremium() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* NAVBAR */}
        <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src={theme === "dark" ? "/M_nobackround_White.png" : "/M_nobackround_Black.png"} className="h-10 md:h-12 w-auto object-contain drop-shadow-sm dark:drop-shadow-md" alt="MhFlow Logo" />
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-slate-100 dark:to-slate-400">MhFlow</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              type="button"
            >
              <ThemeToggle /> 
            </button>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 mb-8 shadow-sm backdrop-blur-sm"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>The ultimate portal for freelancers</span>
          </motion.div>

          <motion.h1
            className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tight leading-[1.1]"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
          >
            Manage your clients <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              in perfect flow.
            </span>
          </motion.h1>

          <motion.p
            className="max-w-2xl text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
          >
            A premium workspace designed to handle projects, chats, and files effortlessly. Impress your clients with a sleek, professional portal.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            <Link
              to="/register"
              className="group flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-4 rounded-full text-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              Start for free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/demo"
              className="flex items-center justify-center px-8 py-4 rounded-full text-lg font-medium border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              View Demo
            </Link>
          </motion.div>
        </section>

        {/* BENTO GRID FEATURES */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Everything in its right place</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Powerful features wrapped in an elegant interface.</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Large Card */}
            <motion.div variants={fadeUp} className="md:col-span-2 relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md transition-shadow group">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-20 transition-opacity">
                <MessageSquare className="w-32 h-32 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end min-h-[200px]">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-200 dark:border-blue-500/30">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Real-time Chat</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md">Communicate directly with clients inside their project workspace. No more lost emails.</p>
              </div>
            </motion.div>

            {/* Small Card */}
            <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative z-10 h-full flex flex-col justify-end min-h-[200px]">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-200 dark:border-purple-500/30">
                  <FolderKanban className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Project Tracking</h3>
                <p className="text-slate-600 dark:text-slate-400">Keep everyone aligned with clear project statuses.</p>
              </div>
            </motion.div>

            {/* Small Card */}
            <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative z-10 h-full flex flex-col justify-end min-h-[200px]">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-200 dark:border-emerald-500/30">
                  <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">File Sharing</h3>
                <p className="text-slate-600 dark:text-slate-400">Securely upload and organize deliverables.</p>
              </div>
            </motion.div>

            {/* Large Card */}
            <motion.div variants={fadeUp} className="md:col-span-2 relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md transition-shadow group">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-20 transition-opacity">
                <Target className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end min-h-[200px]">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-200 dark:border-indigo-500/30">
                  <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Milestones</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md">Break down large projects into manageable goals and track progress seamlessly.</p>
              </div>
            </motion.div>

          </motion.div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-md p-12 text-center shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-purple-500/10 pointer-events-none" />
            
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 relative z-10"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              Ready to elevate your workflow?
            </motion.h2>
            
            <motion.p 
              className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto relative z-10"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
            >
              Join freelancers who deliver a premium experience to their clients.
            </motion.p>
            
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={2}
              className="relative z-10"
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-4 rounded-full text-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                Create your account
                <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img src={theme === "dark" ? "/M_nobackround_White.png" : "/M_nobackround_Black.png"} className="w-6 h-6 grayscale opacity-50" alt="Logo" />
              <span className="font-medium text-slate-500">MhFlow</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} MhFlow. Built for freelancers.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
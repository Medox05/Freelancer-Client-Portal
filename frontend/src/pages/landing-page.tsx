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

function MeetingsMockup() {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md p-1 shadow-2xl relative group">
      {/* Browser bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/20 rounded-t-3xl">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
        </div>
        <div className="bg-slate-200/50 dark:bg-slate-800/50 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 px-6 sm:px-12 py-0.5 sm:py-1 rounded-full border border-slate-300/30 font-medium select-none">
          mhflow.com/meetings
        </div>
        <div className="w-12" /> {/* spacer to center path */}
      </div>

      {/* Screen area */}
      <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 md:grid-cols-12 gap-6 rounded-b-3xl text-left">
        
        {/* Left Column: Calendar Card */}
        <div className="md:col-span-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-xs">Calendar</span>
            </div>
            <button className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
              <Plus size={12} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-900 dark:text-white text-sm">May 2026</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-blue-600 dark:text-blue-400 cursor-pointer"><ChevronLeft size={14} /></button>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-blue-600 dark:text-blue-400 cursor-pointer"><ChevronRight size={14} /></button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          {/* Grid dates */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-slate-700 dark:text-slate-300">
            {/* Empty grid spaces before first of month */}
            <div className="h-8" /><div className="h-8" /><div className="h-8" /><div className="h-8" /><div className="h-8" />
            
            {/* Week 1 */}
            <div className="flex items-center justify-center h-8">1</div>
            <div className="flex items-center justify-center h-8">2</div>
            
            {/* Week 2 */}
            <div className="flex items-center justify-center h-8">3</div>
            <div className="flex items-center justify-center h-8">4</div>
            <div className="flex items-center justify-center h-8">5</div>
            <div className="flex items-center justify-center h-8">6</div>
            <div className="flex items-center justify-center h-8">7</div>
            <div className="flex items-center justify-center h-8">8</div>
            <div className="flex items-center justify-center h-8">9</div>
            
            {/* Week 3 */}
            <div className="flex items-center justify-center h-8">10</div>
            <div className="flex items-center justify-center h-8">11</div>
            <div className="flex items-center justify-center h-8">12</div>
            <div className="flex items-center justify-center h-8">13</div>
            <div className="flex items-center justify-center h-8">14</div>
            <div className="flex items-center justify-center h-8">15</div>
            <div className="flex items-center justify-center h-8">16</div>
            
            {/* Week 4 */}
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">17</span></div>
            <div className="flex items-center justify-center h-8">18</div>
            <div className="flex items-center justify-center h-8">19</div>
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">20</span></div>
            <div className="flex items-center justify-center h-8">21</div>
            <div className="flex items-center justify-center h-8">22</div>
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">23</span></div>
            
            {/* Week 5 */}
            <div className="flex items-center justify-center h-8">24</div>
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">25</span></div>
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">26</span></div>
            <div className="flex items-center justify-center h-8">27</div>
            <div className="flex items-center justify-center h-8"><span className="h-7.5 w-7.5 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-blue-600/30">28</span></div>
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">29</span></div>
            <div className="flex items-center justify-center h-8"><span className="underline decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-4 font-semibold">30</span></div>
            
            {/* Week 6 */}
            <div className="flex items-center justify-center h-8">31</div>
          </div>
        </div>

        {/* Right Column: Meetings List Card */}
        <div className="md:col-span-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex flex-col justify-start">
          <span className="font-bold text-slate-900 dark:text-white text-base mb-4 block">Meetings on May 28, 2026</span>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5 dark:border-emerald-500/10 dark:bg-emerald-500/5 relative group/item">
            <div className="flex items-start gap-3">
              <div className="text-slate-900 dark:text-white shrink-0">
                <div className="text-sm font-bold">10:00 AM</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">10:30 AM</div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">koo</span>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Confirmed</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <User size={11} />
                  <span>With med</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <button className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-[10px] font-bold transition shadow-md shadow-blue-600/20 hover:scale-105 cursor-pointer">
                <Video size={12} />
                <span>Join Call</span>
              </button>
              <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

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

        {/* MEETINGS SHOWCASE */}
        <section className="py-32 px-6 max-w-7xl mx-auto" id="meetings-showcase">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6">
                <Video className="w-4 h-4" />
                Meetings & Video Calls
              </motion.span>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                Schedule, meet, and{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">collaborate</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                Built-in scheduling with an interactive calendar, one-click video calls, and real-time status tracking. Keep your clients connected and your workflow seamlessly organized.
              </motion.p>
              <motion.div variants={staggerContainer} className="space-y-5">
                <motion.div variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/20">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Interactive Calendar</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">View and manage all your meetings with a visual calendar. Days with scheduled meetings are highlighted automatically.</p>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-500/20">
                    <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">One-Click Video Calls</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Join HD video meetings instantly with your clients — no third-party apps or downloads required.</p>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-500/20">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Status Tracking</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">See confirmed, pending, and completed meetings at a glance with automatic real-time status updates.</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Visual Mockup */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              custom={2}
            >
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-[2.5rem] blur-3xl opacity-60 dark:opacity-30" />
                <MeetingsMockup />
              </div>
            </motion.div>
          </div>
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
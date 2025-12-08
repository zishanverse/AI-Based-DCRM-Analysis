"use client"

import { motion } from "framer-motion"
import { 
  Activity, 
  Brain, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Server, 
  Database,
  Lock,
  Wifi,
  Cpu
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const BentoGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto">
      
      {/* Central Hub - Hero Block */}
      <motion.div 
        whileHover={{ scale: 0.98 }}
        className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-linear-to-br from-[#003366] to-[#1a4b8c] rounded-3xl p-8 text-white flex flex-col justify-between relative overflow-hidden group shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/10 transition-colors" />
        
        <div className="relative z-10">
          <Badge className="bg-orange-500/20 text-orange-200 border-0 mb-4 hover:bg-orange-500/30">
            <Zap className="w-3 h-3 mr-1" fill="currentColor" /> 
            Powergrid Intelligence
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-2">Central Analysis<br/>Hub</h2>
          <p className="text-blue-200 max-w-sm">
            Unified control plane integrating real-time DCRM telemetry with predictive AI models.
          </p>
        </div>

        <div className="relative z-10 mt-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 w-fit">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium">System Optimal</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs text-blue-200">99.98% Uptime</span>
            </div>
        </div>
      </motion.div>

      {/* AI Analysis Block */}
      <motion.div 
        whileHover={{ scale: 0.98 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow bg-linear-to-br from-white to-slate-50 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">AI Diagnostics</h3>
            <p className="text-slate-500 text-sm">Automated fault signature classification.</p>
        </div>
      </motion.div>

      {/* Security Block */}
      <motion.div 
        whileHover={{ scale: 0.98 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow bg-linear-to-br from-white to-green-50/30 group"
      >
        <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
            <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Grid Security</h3>
        <p className="text-slate-500 text-sm">End-to-end encrypted telemetry data.</p>
      </motion.div>

      {/* Interactive Graph Mockup */}
      <motion.div 
        whileHover={{ scale: 0.98 }}
        className="col-span-1 md:col-span-2 bg-[#1e293b] rounded-3xl p-6 text-white overflow-hidden relative"
      >
         <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-blue-500/10 to-transparent" />
         <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-bold">Live Resistance</h3>
                <p className="text-slate-400 text-xs">Micro-ohm Variation / Time</p>
            </div>
            <Badge variant="outline" className="border-slate-600 text-slate-300">Live</Badge>
         </div>
         {/* Fake Graph Lines */}
         <div className="flex items-end justify-between h-24 gap-1 opacity-80">
            {[40, 65, 50, 80, 55, 90, 70, 85, 60, 75, 50, 95, 80, 60, 45, 70, 90, 65].map((h, i) => (
                <motion.div 
                    key={i}
                    initial={{ height: "20%" }}
                    animate={{ height: `${h}%` }}
                    transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 2,
                        delay: i * 0.1 
                    }}
                    className="w-full bg-blue-500 rounded-t-sm"
                />
            ))}
         </div>
      </motion.div>

      {/* Compact Stat Blocks */}
      <motion.div whileHover={{ scale: 0.98 }} className="bg-orange-50 rounded-3xl p-6 flex flex-col justify-center items-center text-center border border-orange-100">
         <Activity className="w-8 h-8 text-orange-600 mb-2" />
         <div className="text-2xl font-bold text-slate-800">50ms</div>
         <div className="text-xs text-slate-500 font-medium uppercase">Latency</div>
      </motion.div>

       <motion.div whileHover={{ scale: 0.98 }} className="bg-purple-50 rounded-3xl p-6 flex flex-col justify-center items-center text-center border border-purple-100">
         <Database className="w-8 h-8 text-purple-600 mb-2" />
         <div className="text-2xl font-bold text-slate-800">5PB</div>
         <div className="text-xs text-slate-500 font-medium uppercase">Data Processed</div>
      </motion.div>

      {/* Wide Feature Block */}
      <motion.div 
        whileHover={{ scale: 0.98 }}
        className="md:col-span-2 bg-linear-to-r from-slate-100 to-white rounded-3xl p-6 border border-slate-200 flex items-center justify-between group"
      >
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-700">Edge Computing</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
                Local processing at substation level to reduce bandwidth load.
            </p>
        </div>
        <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Wifi className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </motion.div>

    </div>
  )
}

export default BentoGrid

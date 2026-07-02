import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck, Wrench, Droplets, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Phone,
    title: "1. Nomad Reporting (USSD)",
    description: "Nomads submit an urgent report using the USSD system on their mobile phones, allowing them to report issues instantly without needing internet access.",
    color: "bg-blue-500/10 text-blue-500",
    image: "/images/step1.png"
  },
  {
    icon: ShieldCheck,
    title: "2. Government Verification",
    description: "The government and relevant authorities verify the report within the system to assess the actual need and pinpoint the exact location of the well.",
    color: "bg-amber-500/10 text-amber-500",
    image: "/images/step2.png"
  },
  {
    icon: Wrench,
    title: "3. Well & Riig Repair",
    description: "Technical teams are dispatched to repair the broken well or riig, ensuring water flow is restored and can be poured for the livestock.",
    color: "bg-emerald-500/10 text-emerald-500",
    image: "/images/step3.png"
  },
  {
    icon: Droplets,
    title: "4. Water, Life & Happiness",
    description: "Clean water is restored! The nomads and their livestock finally get the water they need, bringing happiness, health, and life back to the community.",
    color: "bg-cyan-500/10 text-cyan-500",
    image: "/images/step4.png"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-cyan-500/30 text-slate-900">
      <Head>
        <title>Biyo-dhawr | Solving Drought & Water Scarcity</title>
        <meta name="description" content="A modern system connecting rural communities and the government to address droughts and water scarcity." />
      </Head>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                Biyo-dhawr
              </span>
            </div>
            <div>
              <Link 
                href="/auth/login" 
                className="inline-flex items-center px-6 py-2.5 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all duration-300 shadow-lg shadow-slate-900/20"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero.png" 
            alt="Drought in Somalia" 
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-cyan-400 bg-cyan-400/10 ring-1 ring-inset ring-cyan-400/20 mb-6">
                A Modern Solution for Droughts
              </span>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                Save Lives, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Provide Water.
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl">
                Biyo-dhawr is a modern system connecting rural communities and the government to quickly address broken wells, mitigating the severe impact of droughts and water scarcity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/25 group"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300"
                >
                  How it works
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay z-10" />
                <img 
                  src="/images/nomads.png" 
                  alt="Nomads searching for water" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                The Crisis of <span className="text-cyan-600">Water Scarcity</span>
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Droughts severely impact the lives of people and livestock in Somalia. When wells break down or dry up, rural communities and nomads are left without access to clean drinking water, leading to devastating consequences.
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Biyo-dhawr bridges the communication gap. It ensures that critical information about broken water infrastructure reaches the authorities immediately, preventing prolonged suffering.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="text-4xl font-bold text-cyan-600 mb-2">60%+</div>
                  <div className="text-sm font-medium text-slate-600">Nomads in need of clean water</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="text-4xl font-bold text-cyan-600 mb-2">Real-time</div>
                  <div className="text-sm font-medium text-slate-600">Emergency reporting & response</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 blur-3xl">
          <div className="w-96 h-96 rounded-full bg-cyan-500" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Works</span>
            </h2>
            <p className="text-xl text-slate-400">
              Four simple steps connecting the crisis to the solution, from the initial report to flowing water.
            </p>
          </div>

          <div className="space-y-24 lg:space-y-32">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="w-full lg:w-1/2 relative">
                  <div className="absolute inset-0 bg-cyan-500/10 rounded-[2.5rem] blur-xl -z-10 transform scale-105" />
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="rounded-[2.5rem] shadow-2xl w-full h-auto object-cover aspect-[4/3] border border-slate-700/50"
                  />
                </div>
                
                <div className="w-full lg:w-1/2">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${step.color} shadow-lg`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">{step.title}</h3>
                  <p className="text-lg lg:text-xl text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution/Impact Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12 lg:p-20 flex flex-col justify-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  The Impact: <br />
                  <span className="text-cyan-600">Water, Livestock & Farming</span>
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  When a well is repaired, life returns to the community. Nomads gain access to clean drinking water, livestock are saved from thirst, and agricultural lands receive much-needed irrigation. This system ensures not a single drop of water or life is lost due to delayed action.
                </p>
                <ul className="space-y-4 mb-10">
                  {['Renewed life for nomad families', 'Saving livestock from severe droughts', 'Boosting agricultural productivity'].map((item, i) => (
                    <li key={i} className="flex items-center text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div>
                  <Link 
                    href="/auth/login"
                    className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all duration-300"
                  >
                    Join the System
                  </Link>
                </div>
              </div>
              <div className="relative h-96 lg:h-auto">
                <img 
                  src="/images/well.png" 
                  alt="Restored water well" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Droplets className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold text-white">Biyo-dhawr</span>
          </div>
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} Biyo-dhawr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

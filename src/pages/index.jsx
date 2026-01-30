import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, FileText, Share2, Calendar, MessagesSquare, ArrowRight, BookOpen, Users, Award } from 'lucide-react';

const features = [
    {
        title: "AI Content Agents",
        description: "Specialized AI agents trained in classical education principles to create content reflecting our commitment to Truth, Honor, and Virtue.",
        icon: BrainCircuit,
        url: createPageUrl("AIAgents"),
        color: "text-[#1E3A5F]"
    },
    {
        title: "Blog Library",
        description: "Create thoughtful, intellectually rigorous blog content that reflects our Socratic method and classical liberal arts tradition.",
        icon: FileText,
        url: createPageUrl("BlogLibrary"),
        color: "text-[#1E3A5F]"
    },
    {
        title: "Social Post Library",
        description: "Generate engaging social media content that showcases our academic excellence and vibrant community culture.",
        icon: Share2,
        url: createPageUrl("SocialPostLibrary"),
        color: "text-[#1E3A5F]"
    },
    {
        title: "Content Calendar",
        description: "Plan and schedule content strategically to maintain consistent communication with our community.",
        icon: Calendar,
        url: createPageUrl("ContentCalendar"),
        color: "text-[#1E3A5F]"
    },
    {
        title: "Team Chat",
        description: "Collaborate with colleagues on content strategy and institutional messaging in real-time.",
        icon: MessagesSquare,
        url: createPageUrl("TeamChat"),
        color: "text-[#1E3A5F]"
    }
];

export default function Index() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50">
      <div className="text-center p-8 bg-gradient-to-br from-[#1E3A5F] to-[#0F1F3D] rounded-xl shadow-lg border border-[#C5A572]">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913cd6e72cfe077f734af95/1d1b466a6_newestlogoblack11.png" 
            alt="Karl G. Maeser Preparatory Academy" 
            className="h-64 w-auto max-w-md"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{fontFamily: "'Crimson Text', Georgia, serif"}}>
          Content Hub
        </h1>
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C5A572]" />
            <span className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide">Truth</span>
          </div>
          <div className="w-1 h-6 bg-[#C5A572]"></div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C5A572]" />
            <span className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide">Honor</span>
          </div>
          <div className="w-1 h-6 bg-[#C5A572]"></div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C5A572]" />
            <span className="text-[#C5A572] font-semibold text-sm uppercase tracking-wide">Virtue</span>
          </div>
        </div>
        <p className="text-lg text-white/90 max-w-3xl mx-auto mb-2">
          Accelerate your content creation with AI-powered tools grounded in classical liberal arts pedagogy and the Socratic method.
        </p>
        <p className="text-base text-white/75 max-w-2xl mx-auto">
          Create intellectually rigorous content that reflects our commitment to critical thinking, character formation, and academic excellence—preparing students not merely for college, but for life as thoughtful, virtuous citizens.
        </p>
        <div className="mt-6 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-[#C5A572] to-[#D4B883] rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link to={feature.url} key={feature.title}>
            <Card className="group h-full bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-slate-200 hover:border-[#C5A572]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-slate-800" style={{fontFamily: "'Crimson Text', Georgia, serif"}}>{feature.title}</CardTitle>
                <feature.icon className={`h-8 w-8 text-slate-300 group-hover:${feature.color} transition-colors`} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{feature.description}</p>
                <div className="flex items-center text-sm font-semibold text-[#1E3A5F] group-hover:text-[#0F1F3D] transition-colors">
                  Get started
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
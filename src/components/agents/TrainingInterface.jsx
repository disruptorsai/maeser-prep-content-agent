import React, { useState, useEffect } from 'react';
import { Client } from '@/entities/Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BookOpen, Save, Loader2, Award } from 'lucide-react';

const defaultKeywords = "classical education, Socratic method, liberal arts education, character education, Truth Honor Virtue, college preparatory, Great Books curriculum, charter school Utah, critical thinking education, primary source learning, discussion-based learning, character formation, academic excellence";

const defaultDirectives = `Voice & Tone Principles:
- Intellectually Serious Yet Warm: Balance academic rigor with genuine care for students and families
- Classically Grounded: Root content in timeless educational wisdom and proven pedagogical methods
- Character-Focused: Emphasize Truth, Honor, and Virtue as living commitments, not mere slogans
- Discussion-Driven: Reflect Socratic method principles—questioning, dialogue, collaborative inquiry
- Community-Oriented: Small, unified 'PRIDE' where every student is known and valued
- Academically Rigorous: Challenging curriculum, high expectations, proven excellence (#1 in Utah)

Style Mechanics:
- Structure: Question/Challenge → Educational Philosophy → Student Experience → Community Impact → Evidence/Results → Call to Action
- Readability: Grade 11-13 (sophisticated but accessible); define classical/educational terms clearly
- Evidence: Cite rankings, test scores, college acceptance rates, scholarship awards
- POV: Educational experts and thought leaders in classical liberal arts pedagogy

Lexicon & Terminology:
- Use: Socratic method, Socratic Seminar, Great Books, primary sources, classical liberal arts, character formation, critical thinking, integrated curriculum, discussion-based learning, intellectual courage, lifelong learners, virtuous citizens
- Core Values: Truth, Honor, Virtue (capitalize when referring to school values)
- Preferred: empower, inspire, rigorous, holistic, thoughtful dialogue, intellectual formation, classical tradition
- Avoid: teaching to the test, superficial learning, memorization, passive learning, value-neutral education

Educational Philosophy:
- Emphasize Socratic method: learning through questioning and dialogue
- Highlight integrated curriculum: history, literature, art, philosophy woven together
- Primary source engagement: students read Aristotle, Plutarch, Shakespeare directly
- Character alongside intellect: educating the whole person—head, heart, hands
- Small community advantage: every student known, valued, able to participate`;

export default function TrainingInterface({ agent }) {
  const [client, setClient] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [directives, setDirectives] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClientData = async () => {
        setIsLoading(true);
        try {
            let clientData = await Client.list("name", 1);
            
            if (clientData.length === 0) {
              const defaultClient = await Client.create({
                name: "Karl G. Maeser Preparatory Academy",
                service_details: "A top-ranked public charter school in Lindon, Utah, serving grades 7-12. Maeser Prep offers a rigorous classical liberal arts education distinguished by the Socratic method, primary source engagement, and holistic character development rooted in Truth, Honor, and Virtue.",
                industry: "Classical Liberal Arts Education, Charter School",
                focus_keywords: defaultKeywords,
                ai_writing_directives: defaultDirectives,
                hourly_rate: 0,
                currency: "USD",
                color: "#1E3A5F",
                status: "active"
              });
              clientData = [defaultClient];
            }
            
            const loadedClient = clientData[0];
            setClient(loadedClient);
            setKeywords(loadedClient.focus_keywords || defaultKeywords);
            setDirectives(loadedClient.ai_writing_directives || defaultDirectives);

        } catch (error) {
            console.error("Failed to load client settings", error);
            toast.error("Could not load training data.");
        } finally {
            setIsLoading(false);
        }
    }
    loadClientData();
  }, []);

  const handleSaveTrainingData = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      await Client.update(client.id, {
        focus_keywords: keywords,
        ai_writing_directives: directives,
      });
      toast.success("Training data saved successfully! The agent will now use this information for all content generation.", {
        duration: 4000
      });
    } catch (error) {
      console.error("Error saving training data:", error);
      toast.error("Failed to save training data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const agentDisplayName = agent?.display_name || agent?.name?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'AI Agent';
  
  if (isLoading) {
    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                <CardTitle className="font-serif">Loading Training Data...</CardTitle>
            </CardHeader>
            <CardContent><Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" /></CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F1F3D] rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-6 h-6 text-[#C5A572]" />
          <h2 className="text-2xl font-bold" style={{fontFamily: "'Crimson Text', Georgia, serif"}}>Truth • Honor • Virtue</h2>
        </div>
        <p className="text-white/90">Configure global training data for <strong>{client?.name}</strong></p>
      </div>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <BookOpen className="w-5 h-5 text-[#1E3A5F]" />
            Global Training Data
          </CardTitle>
          <CardDescription>
            These settings guide all AI agents in generating content that reflects our classical liberal arts pedagogy, Socratic method, and commitment to character formation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="keywords" className="font-semibold text-[#1E3A5F]">Focus Keywords</Label>
            <p className="text-sm text-slate-500">Enter comma-separated keywords relevant to classical education, our educational philosophy, and institutional identity. The AI will strategically select 1-3 most relevant keywords per piece of content.</p>
            <Textarea
              id="keywords"
              placeholder="e.g., classical education, Socratic method, liberal arts, character formation"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={4}
              className="bg-white font-serif"
            />
            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
              <p className="font-medium mb-1">📚 Educational Content Strategy:</p>
              <p>AI agents will strategically select keywords that best serve the content's educational purpose, avoiding keyword stuffing while ensuring natural integration that reflects our Socratic principles.</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="directives" className="font-semibold text-[#1E3A5F]">AI Writing Directives &amp; Educational Philosophy</Label>
            <p className="text-sm text-slate-500">Provide detailed instructions about institutional voice, educational philosophy, classical pedagogy principles, and content guardrails. This ensures all content reflects our commitment to Truth, Honor, and Virtue.</p>
            <Textarea
              id="directives"
              placeholder="Voice: Intellectually serious yet warm. Focus: Classical liberal arts pedagogy, Socratic method, character formation..."
              value={directives}
              onChange={(e) => setDirectives(e.target.value)}
              rows={16}
              className="bg-white font-serif"
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveTrainingData} 
              disabled={isSaving}
              className="bg-[#1E3A5F] hover:bg-[#0F1F3D] text-white"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Training Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif">Current Agent: {agentDisplayName}</CardTitle>
          <CardDescription>
            This agent specializes in {agent?.description?.toLowerCase() || 'content creation'}. It will use the global training data above to create content aligned with our educational mission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 border border-[#C5A572]/30 rounded-md text-sm text-slate-700">
            <p className="font-medium mb-2 text-[#1E3A5F]">Agent Core Instructions:</p>
            <p className="font-serif">{agent?.description || "This agent helps create high-quality content tailored to classical education principles and institutional values."}</p>
            <p className="mt-3 text-xs text-slate-500">
              <strong>Note:</strong> The agent will automatically combine these core instructions with institutional training data to ensure all content reflects our commitment to the Socratic method, classical liberal arts tradition, and character formation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
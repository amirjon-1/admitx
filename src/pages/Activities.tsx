import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trophy, Trash2, Edit, Award, Mic } from "lucide-react";
import { Header } from "../components/layout";
import { Card, CardContent, Button, Input, Badge, Modal, Select, TextArea } from "../components/ui";
import { useStore } from "../store/useStore";
import { fetchLatestVoiceInterview } from "../lib/supabase";
import type { Activity, Honor, ActivityCategory } from "../types";

const CATEGORY_OPTIONS = [
  { value: "STEM", label: "STEM" },
  { value: "Arts", label: "Arts" },
  { value: "Service", label: "Community Service" },
  { value: "Sports", label: "Sports" },
  { value: "Leadership", label: "Leadership" },
  { value: "Work", label: "Work Experience" },
  { value: "Other", label: "Other" },
];

const TIER_OPTIONS = [
  { value: "International", label: "International" },
  { value: "National", label: "National" },
  { value: "Regional", label: "Regional" },
  { value: "State", label: "State" },
  { value: "School", label: "School" },
];

type GeneratedActivity = {
  position_title: string;
  organization: string;
  description: string;
  years: string; // e.g. "9-11"
  hours_per_week: number;
  weeks_per_year: number;
};

type GeneratedHonor = {
  name: string;
  level: "School" | "State" | "Regional" | "National" | "International";
  description: string;
  grade_received: "9" | "10" | "11" | "12";
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function yearsToYearsParticipated(years: string): number {
  // "9-11" -> 3
  const m = years.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 1;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (Number.isFinite(a) && Number.isFinite(b) && b >= a) return b - a + 1;
  return 1;
}

export function Activities() {
  const { user, activities, honors, addActivity, removeActivity, addHonor, removeHonor } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"activities" | "honors">("activities");

  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddHonorOpen, setIsAddHonorOpen] = useState(false);

  // ----- Generate state -----
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedActivities, setGeneratedActivities] = useState<GeneratedActivity[] | null>(null);
  const [generatedHonors, setGeneratedHonors] = useState<GeneratedHonor[] | null>(null);

  // Activity Form State
  const [activityForm, setActivityForm] = useState({
    name: "",
    role: "",
    category: "STEM" as ActivityCategory,
    description: "",
    hoursPerWeek: "",
    weeksPerYear: "",
    yearsParticipated: "",
    tier: "School" as Activity["tier"],
    leadershipPosition: false,
  });

  // Honor Form State
  const [honorForm, setHonorForm] = useState({
    name: "",
    level: "School" as Honor["level"],
    description: "",
    gradeReceived: "12" as Honor["gradeReceived"],
  });

  const filteredActivities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activities;
    return activities.filter(
      (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
  }, [activities, searchQuery]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      STEM: "bg-blue-100 text-blue-800",
      Arts: "bg-purple-100 text-purple-800",
      Service: "bg-green-100 text-green-800",
      Sports: "bg-orange-100 text-orange-800",
      Leadership: "bg-yellow-100 text-yellow-800",
      Work: "bg-gray-100 text-gray-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      International: "bg-purple-100 text-purple-800",
      National: "bg-blue-100 text-blue-800",
      Regional: "bg-green-100 text-green-800",
      State: "bg-yellow-100 text-yellow-800",
      School: "bg-gray-100 text-gray-800",
    };
    return colors[tier] || colors.School;
  };

  const resetActivityForm = () =>
    setActivityForm({
      name: "",
      role: "",
      category: "STEM",
      description: "",
      hoursPerWeek: "",
      weeksPerYear: "",
      yearsParticipated: "",
      tier: "School",
      leadershipPosition: false,
    });

  const resetHonorForm = () =>
    setHonorForm({
      name: "",
      level: "School",
      description: "",
      gradeReceived: "12",
    });

  const handleAddActivity = () => {
    if (!user) return;

    const activity: Activity = {
      id: crypto.randomUUID(),
      userId: user.id,
      category: activityForm.category,
      name: activityForm.name,
      role: activityForm.role,
      description: activityForm.description,
      hoursPerWeek: parseInt(activityForm.hoursPerWeek) || 0,
      weeksPerYear: parseInt(activityForm.weeksPerYear) || 0,
      yearsParticipated: parseInt(activityForm.yearsParticipated) || 0,
      leadershipPosition: activityForm.leadershipPosition,
      tier: activityForm.tier,
      photoUrl: null,
      photoAnalysis: null,
      createdAt: new Date(),
    };

    addActivity(activity);
    setIsAddActivityOpen(false);
    resetActivityForm();
  };

  const handleAddHonor = () => {
    if (!user) return;

    const honor: Honor = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: honorForm.name,
      level: honorForm.level,
      description: honorForm.description,
      gradeReceived: honorForm.gradeReceived,
      createdAt: new Date(),
    };

    addHonor(honor);
    setIsAddHonorOpen(false);
    resetHonorForm();
  };

  const generateFromInterview = async () => {
    if (!user) {
      setGenError("You must be logged in to import from interview");
      setGenOpen(true);
      return;
    }

    setGenOpen(true);
    setGenLoading(true);
    setGenError(null);
    setGeneratedActivities(null);
    setGeneratedHonors(null);

    try {
      console.log("1. Fetching voice interview from Supabase for user:", user.id);

      // Fetch the latest voice interview transcript from Supabase
      const interview = await fetchLatestVoiceInterview(user.id);

      console.log("2. Supabase response:", interview ? "Found interview" : "No interview found");

      if (!interview) {
        throw new Error("No voice interview found. Complete a voice interview first.");
      }

      console.log("3. Transcript length:", interview.transcript?.length || 0);

      if (!interview.transcript || interview.transcript.trim().length === 0) {
        throw new Error("Voice interview has no transcript data.");
      }

      console.log("4. Sending to backend...");

      // Send transcript to backend for activity and honors generation
      // Use the same API_BASE logic as api.ts
      const getApiBase = () => {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          return '/api';
        }
        if (apiUrl.startsWith('http')) {
          // Full URL - remove trailing slash, then add /api
          const cleanUrl = apiUrl.replace(/\/+$/, ''); // Remove trailing slashes
          return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
        }
        // Relative path - ensure it starts with / and doesn't have double slashes
        const cleanPath = apiUrl.replace(/^\/+/, ''); // Remove leading slashes
        return `/${cleanPath}`;
      };
      
      const res = await fetch(`${getApiBase()}/activities/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: interview.transcript }),
      });

      console.log("5. Backend response status:", res.status);

      const data = await res.json().catch(() => ({}));

      console.log("6. Backend response data:", data);

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate from interview");
      }

      const activityList = data?.activities as GeneratedActivity[] | undefined;
      const honorList = data?.honors as GeneratedHonor[] | undefined;

      console.log("7. Activities:", activityList?.length || 0, "Honors:", honorList?.length || 0);

      setGeneratedActivities(Array.isArray(activityList) ? activityList : []);
      setGeneratedHonors(Array.isArray(honorList) ? honorList : []);
    } catch (e: any) {
      console.error("Error in generateFromInterview:", e);
      setGenError(e?.message ?? "Failed to generate from interview");
    } finally {
      setGenLoading(false);
    }
  };

  const importGeneratedActivities = async () => {
    if (!user || !generatedActivities?.length) return;

    console.log('📥 Importing', generatedActivities.length, 'activities from voice interview...');
    
    for (const g of generatedActivities) {
      const a: Activity = {
        id: crypto.randomUUID(),
        userId: user.id,
        category: "Other",
        name: g.organization || "Activity",
        role: g.position_title || "Member",
        description: g.description || "",
        hoursPerWeek: clamp(Number(g.hours_per_week) || 0, 0, 80),
        weeksPerYear: clamp(Number(g.weeks_per_year) || 0, 0, 52),
        yearsParticipated: clamp(yearsToYearsParticipated(g.years || ""), 0, 4),
        leadershipPosition: false,
        tier: "School",
        photoUrl: null,
        photoAnalysis: null,
        createdAt: new Date(),
      };

      addActivity(a);
      // Add a small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Finished importing activities');
    setGenOpen(false);
  };

  const importGeneratedHonors = async () => {
    if (!user || !generatedHonors?.length) return;

    console.log('📥 Importing', generatedHonors.length, 'honors from voice interview...');
    
    for (const h of generatedHonors) {
      const honor: Honor = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: h.name || "Honor",
        level: h.level || "School",
        description: h.description || "",
        gradeReceived: h.grade_received || "12",
        createdAt: new Date(),
      };

      addHonor(honor);
      // Add a small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Finished importing honors');
    setGenOpen(false);
  };

  const importAll = async () => {
    if (!user) return;

    console.log('📥 Importing all activities and honors from voice interview...');
    
    if (generatedActivities?.length) {
      for (const g of generatedActivities) {
        const a: Activity = {
          id: crypto.randomUUID(),
          userId: user.id,
          category: "Other",
          name: g.organization || "Activity",
          role: g.position_title || "Member",
          description: g.description || "",
          hoursPerWeek: clamp(Number(g.hours_per_week) || 0, 0, 80),
          weeksPerYear: clamp(Number(g.weeks_per_year) || 0, 0, 52),
          yearsParticipated: clamp(yearsToYearsParticipated(g.years || ""), 0, 4),
          leadershipPosition: false,
          tier: "School",
          photoUrl: null,
          photoAnalysis: null,
          createdAt: new Date(),
        };
        addActivity(a);
        // Add a small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (generatedHonors?.length) {
      for (const h of generatedHonors) {
        const honor: Honor = {
          id: crypto.randomUUID(),
          userId: user.id,
          name: h.name || "Honor",
          level: h.level || "School",
          description: h.description || "",
          gradeReceived: h.grade_received || "12",
          createdAt: new Date(),
        };
        addHonor(honor);
        // Add a small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('✅ Finished importing all items');
    setGenOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Activities & Honors"
        subtitle="Track your extracurriculars and achievements"
        action={{
          label: activeTab === "activities" ? "Add Activity" : "Add Honor",
          onClick: () => (activeTab === "activities" ? setIsAddActivityOpen(true) : setIsAddHonorOpen(true)),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="p-8">
        {/* Tabs + Generate */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "activities" ? "primary" : "secondary"}
              onClick={() => setActiveTab("activities")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Activities ({activities.length})
            </Button>
            <Button
              variant={activeTab === "honors" ? "primary" : "secondary"}
              onClick={() => setActiveTab("honors")}
            >
              <Award className="w-4 h-4 mr-2" />
              Honors ({honors.length})
            </Button>
          </div>

          <Button variant="secondary" onClick={generateFromInterview} disabled={genLoading}>
            <Mic className="w-4 h-4 mr-2" />
            {genLoading ? "Generating..." : "Import from Voice Interview"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Activities */}
        {activeTab === "activities" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2">
                        <Badge className={getCategoryColor(activity.category)}>{activity.category}</Badge>
                        <Badge className={getTierColor(activity.tier)}>{activity.tier}</Badge>
                      </div>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeActivity(activity.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{activity.name}</h3>
                    <p className="text-sm text-primary-600 mb-2">
                      {activity.role}
                      {activity.leadershipPosition && <span className="ml-2 text-yellow-600">★ Leader</span>}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">{activity.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{activity.hoursPerWeek}</p>
                        <p className="text-gray-500">hrs/week</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{activity.weeksPerYear}</p>
                        <p className="text-gray-500">weeks/yr</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{activity.yearsParticipated}</p>
                        <p className="text-gray-500">years</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Add Activity Card */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: filteredActivities.length * 0.05 }}>
              <Card
                className="h-full border-dashed cursor-pointer hover:border-primary-300 transition-colors"
                onClick={() => setIsAddActivityOpen(true)}
              >
                <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <Plus className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">Add Activity</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Honors */}
        {activeTab === "honors" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {honors.map((honor, index) => (
              <motion.div
                key={honor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={getTierColor(honor.level)}>{honor.level}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeHonor(honor.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <h3 className="font-semibold text-gray-900">{honor.name}</h3>
                    </div>

                    {honor.description && <p className="text-sm text-gray-600 mb-2">{honor.description}</p>}
                    <p className="text-xs text-gray-500">Grade {honor.gradeReceived}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <Card
              className="border-dashed cursor-pointer hover:border-primary-300 transition-colors"
              onClick={() => setIsAddHonorOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                <Plus className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Add Honor</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Generated Modal */}
      <Modal isOpen={genOpen} onClose={() => setGenOpen(false)} title="Import from Voice Interview" size="lg">
        <div className="space-y-4">
          {genError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{genError}</div>
          )}

          {genLoading && <div className="text-sm text-gray-600">Analyzing your interview transcript...</div>}

          {!genLoading && !genError && (!generatedActivities?.length && !generatedHonors?.length) && (
            <div className="text-sm text-gray-600">No activities or honors found in your interview.</div>
          )}

          {/* Activities Section */}
          {!genLoading && generatedActivities && generatedActivities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Activities ({generatedActivities.length})
                </h3>
                <Button size="sm" onClick={importGeneratedActivities}>
                  Import Activities
                </Button>
              </div>
              {generatedActivities.map((g, i) => (
                <Card key={`activity-${i}`}>
                  <CardContent className="p-4 space-y-1">
                    <div className="font-semibold text-gray-900">
                      {g.position_title} — {g.organization}
                    </div>
                    <div className="text-xs text-gray-600">
                      {g.years} • {g.hours_per_week} hrs/wk • {g.weeks_per_year} wks/yr
                    </div>
                    <div className="text-sm text-gray-800">{g.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Honors Section */}
          {!genLoading && generatedHonors && generatedHonors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Honors ({generatedHonors.length})
                </h3>
                <Button size="sm" onClick={importGeneratedHonors}>
                  Import Honors
                </Button>
              </div>
              {generatedHonors.map((h, i) => (
                <Card key={`honor-${i}`}>
                  <CardContent className="p-4 space-y-1">
                    <div className="font-semibold text-gray-900">{h.name}</div>
                    <div className="text-xs text-gray-600">
                      {h.level} • Grade {h.grade_received}
                    </div>
                    {h.description && <div className="text-sm text-gray-800">{h.description}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setGenOpen(false)}>
              Close
            </Button>
            <Button
              onClick={importAll}
              disabled={!user || (!generatedActivities?.length && !generatedHonors?.length)}
            >
              Import All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Activity Modal */}
      <Modal isOpen={isAddActivityOpen} onClose={() => setIsAddActivityOpen(false)} title="Add Activity" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Activity Name"
              value={activityForm.name}
              onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
              placeholder="e.g., Robotics Club"
            />
            <Input
              label="Your Role"
              value={activityForm.role}
              onChange={(e) => setActivityForm({ ...activityForm, role: e.target.value })}
              placeholder="e.g., Team Captain"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={activityForm.category}
              onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value as ActivityCategory })}
            />
            <Select
              label="Recognition Level"
              options={TIER_OPTIONS}
              value={activityForm.tier}
              onChange={(e) => setActivityForm({ ...activityForm, tier: e.target.value as Activity["tier"] })}
            />
          </div>

          <TextArea
            label="Description"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            placeholder="Describe your involvement and achievements..."
            rows={3}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Hours/Week"
              type="number"
              value={activityForm.hoursPerWeek}
              onChange={(e) => setActivityForm({ ...activityForm, hoursPerWeek: e.target.value })}
            />
            <Input
              label="Weeks/Year"
              type="number"
              value={activityForm.weeksPerYear}
              onChange={(e) => setActivityForm({ ...activityForm, weeksPerYear: e.target.value })}
            />
            <Input
              label="Years"
              type="number"
              value={activityForm.yearsParticipated}
              onChange={(e) => setActivityForm({ ...activityForm, yearsParticipated: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={activityForm.leadershipPosition}
              onChange={(e) => setActivityForm({ ...activityForm, leadershipPosition: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Leadership Position</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsAddActivityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity} disabled={!activityForm.name}>
              Add Activity
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Honor Modal */}
      <Modal isOpen={isAddHonorOpen} onClose={() => setIsAddHonorOpen(false)} title="Add Honor" size="md">
        <div className="space-y-4">
          <Input
            label="Honor/Award Name"
            value={honorForm.name}
            onChange={(e) => setHonorForm({ ...honorForm, name: e.target.value })}
            placeholder="e.g., National Merit Semifinalist"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Recognition Level"
              options={TIER_OPTIONS}
              value={honorForm.level}
              onChange={(e) => setHonorForm({ ...honorForm, level: e.target.value as Honor["level"] })}
            />
            <Select
              label="Grade Received"
              options={[
                { value: "9", label: "Grade 9" },
                { value: "10", label: "Grade 10" },
                { value: "11", label: "Grade 11" },
                { value: "12", label: "Grade 12" },
              ]}
              value={honorForm.gradeReceived}
              onChange={(e) => setHonorForm({ ...honorForm, gradeReceived: e.target.value as Honor["gradeReceived"] })}
            />
          </div>

          <TextArea
            label="Description (optional)"
            value={honorForm.description}
            onChange={(e) => setHonorForm({ ...honorForm, description: e.target.value })}
            placeholder="Brief description of the award..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsAddHonorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHonor} disabled={!honorForm.name}>
              Add Honor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

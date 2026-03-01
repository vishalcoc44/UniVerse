'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Briefcase, MapPin, Globe, Plus, X, ToggleLeft, ToggleRight, Save, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CareerProfileData {
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[];
  openToWork: boolean;
  preferredRoles: string[];
  preferredLocations: string[];
  portfolioUrl: string | null;
}

const ROLE_SUGGESTIONS = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'ML Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Business Analyst'];
const LOCATION_SUGGESTIONS = ['Remote', 'New York', 'San Francisco', 'Austin', 'Seattle', 'London', 'Toronto', 'Berlin', 'Bangalore'];

export function CareerProfile() {
  const [profileData, setProfileData] = useState<CareerProfileData>({
    name: null, bio: null, avatarUrl: null, skills: [], openToWork: false,
    preferredRoles: [], preferredLocations: [], portfolioUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('Profile')
        .select('fullName, bio, avatarUrl, skills, openToWork, preferredRoles, preferredLocations, portfolioUrl')
        .eq('id', user.id)
        .single();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setProfileData({
          name: data.fullName,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          skills: data.skills ?? [],
          openToWork: data.openToWork ?? false,
          preferredRoles: data.preferredRoles ?? [],
          preferredLocations: data.preferredLocations ?? [],
          portfolioUrl: data.portfolioUrl,
        });
      }
      setLoading(false);
    })();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('Profile').update({
      fullName: profileData.name,
      skills: profileData.skills,
      openToWork: profileData.openToWork,
      preferredRoles: profileData.preferredRoles,
      preferredLocations: profileData.preferredLocations,
      portfolioUrl: profileData.portfolioUrl || null,
      updatedAt: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTag = (field: 'skills' | 'preferredRoles' | 'preferredLocations', value: string) => {
    if (!value.trim()) return;
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].includes(value.trim()) ? prev[field] : [...prev[field], value.trim()],
    }));
  };

  const removeTag = (field: 'skills' | 'preferredRoles' | 'preferredLocations', value: string) => {
    setProfileData(prev => ({ ...prev, [field]: prev[field].filter((v: string) => v !== value) }));
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Identity Card */}
      <div className="bg-card/40 border border-border/40 rounded-2xl p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-xl font-black overflow-hidden shrink-0">
          {profileData.avatarUrl ? (
            <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            profileData.name?.charAt(0) ?? <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base">{profileData.name ?? 'Your Name'}</p>
          {profileData.bio && <p className="text-xs text-muted-foreground line-clamp-1">{profileData.bio}</p>}
        </div>
        <button
          onClick={() => setProfileData(prev => ({ ...prev, openToWork: !prev.openToWork }))}
          className={cn("flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all",
            profileData.openToWork
              ? "bg-green-500/15 border-green-500/40 text-green-400"
              : "bg-border/20 border-border/40 text-muted-foreground")}
        >
          {profileData.openToWork ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          Open to Work
        </button>
      </div>

      {/* Portfolio URL */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" /> Portfolio URL
        </label>
        <Input
          placeholder="https://yourportfolio.dev"
          value={profileData.portfolioUrl ?? ''}
          onChange={e => setProfileData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
          className="h-9 bg-card/40 border-border/40 rounded-xl text-xs"
        />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skills</label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill..."
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { addTag('skills', skillInput); setSkillInput(''); }}}
            className="h-9 flex-1 bg-card/40 border-border/40 rounded-xl text-xs"
          />
          <Button size="sm" variant="outline" className="h-9 rounded-xl px-3"
            onClick={() => { addTag('skills', skillInput); setSkillInput(''); }}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profileData.skills.map(skill => (
            <Badge key={skill} variant="secondary" className="text-[10px] font-bold pl-2 pr-1 py-0.5 flex items-center gap-1">
              {skill}
              <button onClick={() => removeTag('skills', skill)} className="hover:text-red-400">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Preferred Roles */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Briefcase className="h-3 w-3" /> Preferred Roles
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {ROLE_SUGGESTIONS.filter(r => !profileData.preferredRoles.includes(r)).map(r => (
            <button key={r} onClick={() => addTag('preferredRoles', r)}
              className="text-[9px] font-bold border border-dashed border-border/40 text-muted-foreground px-2 py-0.5 rounded-full hover:border-primary/40 hover:text-primary transition-all">
              + {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a role..."
            value={roleInput}
            onChange={e => setRoleInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { addTag('preferredRoles', roleInput); setRoleInput(''); }}}
            className="h-9 flex-1 bg-card/40 border-border/40 rounded-xl text-xs"
          />
          <Button size="sm" variant="outline" className="h-9 rounded-xl px-3"
            onClick={() => { addTag('preferredRoles', roleInput); setRoleInput(''); }}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profileData.preferredRoles.map(role => (
            <Badge key={role} variant="secondary" className="text-[10px] font-bold pl-2 pr-1 py-0.5 flex items-center gap-1">
              {role}
              <button onClick={() => removeTag('preferredRoles', role)} className="hover:text-red-400">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Preferred Locations
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {LOCATION_SUGGESTIONS.filter(l => !profileData.preferredLocations.includes(l)).map(l => (
            <button key={l} onClick={() => addTag('preferredLocations', l)}
              className="text-[9px] font-bold border border-dashed border-border/40 text-muted-foreground px-2 py-0.5 rounded-full hover:border-primary/40 hover:text-primary transition-all">
              + {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profileData.preferredLocations.map(loc => (
            <Badge key={loc} variant="secondary" className="text-[10px] font-bold pl-2 pr-1 py-0.5 flex items-center gap-1">
              {loc}
              <button onClick={() => removeTag('preferredLocations', loc)} className="hover:text-red-400">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button
        className={cn("w-full h-10 font-black rounded-2xl transition-all", saved ? "bg-green-600 hover:bg-green-600" : "")}
        onClick={saveProfile}
        disabled={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        {saved ? 'Saved!' : 'Save Career Profile'}
      </Button>
    </div>
  );
}

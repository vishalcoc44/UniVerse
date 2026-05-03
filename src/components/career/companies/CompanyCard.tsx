'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, Star, Users, Loader2, X, ExternalLink,
  CheckCircle2, MessageSquare, Briefcase, ChevronRight, Globe, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  verified: boolean;
  avgRating?: number;
  reviewCount?: number;
  openRoles?: number;
}

interface Review {
  id: string;
  userId: string;
  rating: number;
  pros?: string;
  cons?: string;
  role?: string;
  isAnonymous: boolean;
  createdAt: string;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            size === 'lg' ? "h-4 w-4" : "h-3 w-3",
            i <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

interface CompanyProfileDrawerProps {
  companyId: string;
  onClose: () => void;
  currentUserId?: string;
}

function CompanyProfileDrawer({ companyId, onClose, currentUserId }: CompanyProfileDrawerProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', description: '', website: '', industry: '', size: '', headquarters: '', verified: false });
  const [reviewForm, setReviewForm] = useState({ rating: 5, pros: '', cons: '', role: '', isAnonymous: true });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: co }, { data: rv }] = await Promise.all([
        supabase.from('Company').select('*').eq('id', companyId).single(),
        supabase.from('CompanyReview').select('*').eq('companyId', companyId).order('createdAt', { ascending: false }),
      ]);
      if (co) {
        const avgRating = rv && rv.length > 0 ? rv.reduce((a, r) => a + r.rating, 0) / rv.length : undefined;
        setCompany({ ...co, avgRating, reviewCount: rv?.length ?? 0 });
      }
      setReviews((rv ?? []) as Review[]);
      setLoading(false);
    };
    load();
    // check admin role of current user if provided
    (async () => {
      if (!currentUserId) return;
      // FC-1 fix: Company admin RLS is is_platform_admin().
      const { data: profile } = await supabase.from('Profile').select('role, universityId').eq('id', currentUserId).single();
      setIsAdminUser(profile?.role === 'ADMIN' && !profile?.universityId);
    })();
  }, [companyId]);

  const submitReview = async () => {
    if (!currentUserId) return;
    setSubmitting(true);
    await supabase.from('CompanyReview').insert({
      companyId,
      userId: currentUserId,
      ...reviewForm,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase.from('CompanyReview').delete().eq('id', reviewId);
    if (error) {
      alert(error.message);
      return;
    }
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        className="bg-card border border-border/50 rounded-3xl w-full max-w-lg h-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !company ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground font-bold">Company not found</p>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="relative h-28 bg-gradient-to-br from-primary/20 via-violet-500/10 to-transparent shrink-0">
              {company.bannerUrl && (
                <img src={company.bannerUrl} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute -bottom-6 left-5 h-12 w-12 rounded-2xl bg-card border-2 border-border flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-10 space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-black text-xl italic tracking-tight">{company.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {company.industry && (
                        <span className="text-xs text-muted-foreground font-bold">{company.industry}</span>
                      )}
                      {company.verified && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                  {company.website && (
                        <div className="flex items-center gap-2">
                          <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-xl border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                          {isAdminUser && (
                            <button
                              onClick={() => {
                                setCompanyForm({
                                  name: company.name || '',
                                  description: company.description || '',
                                  website: company.website || '',
                                  industry: company.industry || '',
                                  size: company.size || '',
                                  headquarters: company.headquarters || '',
                                  verified: !!company.verified,
                                });
                                setEditingCompany(s => !s);
                              }}
                              className="p-2 rounded-xl border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors"
                            >Edit</button>
                          )}
                        </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground font-bold">
                  {company.headquarters && <span>📍 {company.headquarters}</span>}
                  {company.size && <span>👥 {company.size.toLowerCase()}</span>}
                  {company.openRoles !== undefined && (
                    <span className="text-primary">{company.openRoles} open roles</span>
                  )}
                </div>

                {/* Rating */}
                {company.avgRating !== undefined && (
                  <div className="flex items-center gap-2 mt-3">
                    <StarRating rating={Math.round(company.avgRating)} size="lg" />
                    <span className="font-black text-sm">{company.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({company.reviewCount} reviews)</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {editingCompany ? (
                <div className="space-y-3">
                  <Input value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} className="h-9" />
                  <Input value={companyForm.industry} onChange={e => setCompanyForm(f => ({ ...f, industry: e.target.value }))} className="h-9" />
                  <Input value={companyForm.size} onChange={e => setCompanyForm(f => ({ ...f, size: e.target.value }))} className="h-9" />
                  <Input value={companyForm.headquarters} onChange={e => setCompanyForm(f => ({ ...f, headquarters: e.target.value }))} className="h-9" />
                  <Input value={companyForm.website} onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))} className="h-9" />
                  <textarea value={companyForm.description} onChange={e => setCompanyForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    className="w-full bg-card/40 border border-border/40 rounded-xl px-3 py-2 text-xs resize-none text-foreground" />
                  <div className="flex gap-2">
                    <Button onClick={async () => {
                      const { error } = await supabase.from('Company').update({
                        name: companyForm.name || null,
                        description: companyForm.description || null,
                        website: companyForm.website || null,
                        industry: companyForm.industry || null,
                        size: companyForm.size || null,
                        headquarters: companyForm.headquarters || null,
                        verified: companyForm.verified,
                      }).eq('id', companyId);
                      if (error) { alert(error.message); return; }
                      setCompany(prev => prev ? ({ ...prev, ...companyForm }) : prev);
                      setEditingCompany(false);
                    }}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingCompany(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                company.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>
                )
              )}

              {/* Reviews */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">
                  Reviews
                </h4>
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-card/50 border border-border/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <StarRating rating={r.rating} />
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {r.isAnonymous ? 'Anonymous' : r.role ?? 'Reviewer'} · {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {currentUserId && r.userId === currentUserId && (
                          <button
                            onClick={() => deleteReview(r.id)}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                            title="Delete review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {r.pros && <p className="text-xs text-green-400 font-bold mb-1">✓ {r.pros}</p>}
                      {r.cons && <p className="text-xs text-red-400 font-bold">✗ {r.cons}</p>}
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No reviews yet. Be the first!</p>
                  )}
                </div>
              </div>

              {/* Submit review */}
              {!submitted && currentUserId && (
                <div className="bg-card/30 border border-border/30 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Leave a Review
                  </h4>
                  {/* Star picker */}
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} onClick={() => setReviewForm(f => ({ ...f, rating: i }))}>
                        <Star className={cn("h-5 w-5 transition-colors",
                          i <= reviewForm.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                        )} />
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Your role (optional)"
                    value={reviewForm.role}
                    onChange={e => setReviewForm(f => ({ ...f, role: e.target.value }))}
                    className="h-9 rounded-xl bg-background/40 border-border/40 text-xs font-bold"
                  />
                  <Input
                    placeholder="Pros"
                    value={reviewForm.pros}
                    onChange={e => setReviewForm(f => ({ ...f, pros: e.target.value }))}
                    className="h-9 rounded-xl bg-background/40 border-border/40 text-xs font-bold"
                  />
                  <Input
                    placeholder="Cons"
                    value={reviewForm.cons}
                    onChange={e => setReviewForm(f => ({ ...f, cons: e.target.value }))}
                    className="h-9 rounded-xl bg-background/40 border-border/40 text-xs font-bold"
                  />
                  <Button
                    size="sm"
                    className="w-full rounded-xl font-black"
                    onClick={submitReview}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
                  </Button>
                </div>
              )}
              {submitted && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <p className="text-sm font-black text-green-400">Review submitted!</p>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

interface CompanyCardProps {
  company: Company;
  currentUserId?: string;
}

export function CompanyCard({ company, currentUserId }: CompanyCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setDrawerOpen(true)}
        className="group cursor-pointer bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm italic group-hover:text-primary transition-colors">{company.name}</h3>
              {company.verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            </div>
            {company.industry && <p className="text-[10px] text-muted-foreground font-bold">{company.industry}</p>}
          </div>
        </div>

        {company.avgRating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={Math.round(company.avgRating)} />
            <span className="text-xs font-black">{company.avgRating.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">({company.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground font-bold space-x-2">
            {company.headquarters && <span>📍 {company.headquarters}</span>}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </motion.div>

      <AnimatePresence>
        {drawerOpen && (
          <CompanyProfileDrawer
            companyId={company.id}
            onClose={() => setDrawerOpen(false)}
            currentUserId={currentUserId}
          />
        )}
      </AnimatePresence>
    </>
  );
}

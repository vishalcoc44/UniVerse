'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StatCard } from '@/components/dashboard/StatCard';
import { motion } from 'framer-motion';
import {
  Building2,
  Layers,
  Megaphone,
  Users,
  UserCog,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Bell,
} from 'lucide-react';

type Role = 'STUDENT' | 'FACULTY' | 'ALUMNI' | 'ADMIN' | 'EMPLOYER';
type AnnouncementScopeType = 'UNIVERSITY' | 'DEPARTMENT' | 'SECTION';

type CurrentUserProfile = {
  id: string;
  fullName: string | null;
  role: Role;
  universityId: string | null;
  universityName: string | null;
};

type DepartmentRow = {
  id: string;
  universityId: string;
  name: string;
  code: string;
  createdAt: string;
};

type SectionRow = {
  id: string;
  universityId: string;
  departmentId: string;
  name: string;
  code: string;
};

type StudentAssignmentRow = {
  id: string;
  universityId: string;
  studentId: string;
  departmentId: string;
  sectionId: string;
};

type TeacherAssignmentRow = {
  id: string;
  universityId: string;
  teacherId: string;
  departmentId: string;
  sectionId: string;
};

type DepartmentAdminAssignmentRow = {
  id: string;
  universityId: string;
  departmentId: string;
  userId: string;
};

type DepartmentAnnouncementRow = {
  id: string;
  universityId: string;
  title: string;
  content: string;
  scopeType: AnnouncementScopeType;
  departmentId: string | null;
  sectionId: string | null;
  createdAt: string;
};

type ProfileSummary = {
  id: string;
  fullName: string | null;
  username: string | null;
  role: Role;
  avatarUrl: string | null;
  universityId: string | null;
  department: string | null;
};

export default function DepartmentsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');

  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignmentRow[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentRow[]>([]);
  const [departmentAdminAssignments, setDepartmentAdminAssignments] = useState<DepartmentAdminAssignmentRow[]>([]);
  const [announcements, setAnnouncements] = useState<DepartmentAnnouncementRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);

  const [newDepartment, setNewDepartment] = useState({ name: '', code: '' });
  const [newSection, setNewSection] = useState({ name: '', code: '', departmentId: '' });
  const [studentAssignmentForm, setStudentAssignmentForm] = useState({ studentId: '', sectionId: '' });
  const [teacherAssignmentForm, setTeacherAssignmentForm] = useState({ teacherId: '', sectionId: '' });
  const [departmentAdminForm, setDepartmentAdminForm] = useState({ userId: '', departmentId: '' });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    scopeType: 'UNIVERSITY' as AnnouncementScopeType,
    departmentId: '',
    sectionId: '',
  });

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [createDepartmentOpen, setCreateDepartmentOpen] = useState(false);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [assignStudentOpen, setAssignStudentOpen] = useState(false);
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const profileMap = useMemo(() => {
    return new Map(profiles.map((item) => [item.id, item]));
  }, [profiles]);

  const managedDepartmentIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(
      departmentAdminAssignments
        .filter((item) => item.userId === currentUser.id)
        .map((item) => item.departmentId),
    );
  }, [departmentAdminAssignments, currentUser]);

  const isUniversityAdmin = currentUser?.role === 'ADMIN' && !!currentUser.universityId;
  const isDepartmentAdmin = managedDepartmentIds.size > 0;

  const scopedAdmin = isSuperAdmin || isUniversityAdmin;

  const effectiveUniversityId = selectedUniversityId || currentUser?.universityId || null;

  const groupedSectionsByDepartment = useMemo(() => {
    const map = new Map<string, SectionRow[]>();
    for (const section of sections) {
      const list = map.get(section.departmentId) || [];
      list.push(section);
      map.set(section.departmentId, list);
    }
    return map;
  }, [sections]);

  const studentsBySection = useMemo(() => {
    const map = new Map<string, StudentAssignmentRow[]>();
    for (const item of studentAssignments) {
      const list = map.get(item.sectionId) || [];
      list.push(item);
      map.set(item.sectionId, list);
    }
    return map;
  }, [studentAssignments]);

  const teachersBySection = useMemo(() => {
    const map = new Map<string, TeacherAssignmentRow[]>();
    for (const item of teacherAssignments) {
      const list = map.get(item.sectionId) || [];
      list.push(item);
      map.set(item.sectionId, list);
    }
    return map;
  }, [teacherAssignments]);

  const myStudentAssignment = useMemo(() => {
    if (!currentUser) return null;
    return studentAssignments.find((item) => item.studentId === currentUser.id) || null;
  }, [studentAssignments, currentUser]);

  const myTeacherSectionAssignments = useMemo(() => {
    if (!currentUser) return [];
    return teacherAssignments.filter((item) => item.teacherId === currentUser.id);
  }, [teacherAssignments, currentUser]);

  const visibleDepartmentIds = useMemo(() => {
    if (!currentUser) return new Set<string>();

    if (scopedAdmin) {
      return new Set(departments.map((item) => item.id));
    }

    const ids = new Set<string>();

    if (myStudentAssignment) {
      ids.add(myStudentAssignment.departmentId);
    }

    for (const item of myTeacherSectionAssignments) {
      ids.add(item.departmentId);
    }

    for (const id of managedDepartmentIds.values()) {
      ids.add(id);
    }

    return ids;
  }, [currentUser, scopedAdmin, departments, myStudentAssignment, myTeacherSectionAssignments, managedDepartmentIds]);

  const visibleDepartments = useMemo(() => {
    const base = departments.filter((item) => visibleDepartmentIds.has(item.id));
    if (selectedDepartmentId === 'all') return base;
    return base.filter((item) => item.id === selectedDepartmentId);
  }, [departments, visibleDepartmentIds, selectedDepartmentId]);

  const visibleAnnouncements = useMemo(() => {
    if (!currentUser) return [];
    if (scopedAdmin) return announcements;

    const mySectionIds = new Set(myTeacherSectionAssignments.map((item) => item.sectionId));
    if (myStudentAssignment) {
      mySectionIds.add(myStudentAssignment.sectionId);
    }

    return announcements.filter((item) => {
      if (item.scopeType === 'UNIVERSITY') return true;

      if (item.scopeType === 'DEPARTMENT' && item.departmentId) {
        return visibleDepartmentIds.has(item.departmentId);
      }

      if (item.scopeType === 'SECTION' && item.sectionId) {
        return mySectionIds.has(item.sectionId);
      }

      return false;
    });
  }, [announcements, currentUser, scopedAdmin, myStudentAssignment, myTeacherSectionAssignments, visibleDepartmentIds]);

  const departmentStats = useMemo(() => {
    return departments.map((department) => {
      const sectionCount = sections.filter((item) => item.departmentId === department.id).length;
      const studentCount = studentAssignments.filter((item) => item.departmentId === department.id).length;
      return {
        ...department,
        sectionCount,
        studentCount,
      };
    });
  }, [departments, sections, studentAssignments]);

  const candidateStudents = useMemo(() => {
    return profiles.filter((item) => item.role === 'STUDENT');
  }, [profiles]);

  const candidateTeachers = useMemo(() => {
    return profiles.filter((item) => item.role === 'FACULTY');
  }, [profiles]);

  const candidateDepartmentAdmins = useMemo(() => {
    return profiles.filter((item) => item.role === 'ADMIN');
  }, [profiles]);

  const initializeContext = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to open Uni Dashboard.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('Profile')
        .select('id, fullName, role, universityId, universityName')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw profileError || new Error('Could not load user profile.');
      }

      const profileData = profile as CurrentUserProfile;
      setCurrentUser(profileData);

      if (!profileData.universityId) {
        toast.error('Departments dashboard is university-scoped. Please use a university admin account.');
        setLoading(false);
        return;
      }

      let superFlag = false;

      if (profileData.role === 'ADMIN') {
        const { data: adminRole } = await supabase
          .from('UniversityAdminRole')
          .select('isSuper')
          .eq('userId', profileData.id)
          .eq('universityId', profileData.universityId)
          .maybeSingle();

        superFlag = !!adminRole?.isSuper;
      }

      setIsSuperAdmin(superFlag);
      setSelectedUniversityId(profileData.universityId);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to initialize Uni Dashboard context.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrganizationData = useCallback(async (universityId: string) => {
    setRefreshing(true);

    try {
      const [
        departmentsResp,
        sectionsResp,
        studentAssignmentsResp,
        teacherAssignmentsResp,
        departmentAdminsResp,
        announcementsResp,
        profileResp,
      ] = await Promise.all([
        supabase
          .from('Department')
          .select('id, universityId, name, code, createdAt')
          .eq('universityId', universityId)
          .order('name', { ascending: true }),
        supabase
          .from('DepartmentSection')
          .select('id, universityId, departmentId, name, code')
          .eq('universityId', universityId)
          .order('name', { ascending: true }),
        supabase
          .from('DepartmentStudentAssignment')
          .select('id, universityId, studentId, departmentId, sectionId')
          .eq('universityId', universityId),
        supabase
          .from('DepartmentTeacherAssignment')
          .select('id, universityId, teacherId, departmentId, sectionId')
          .eq('universityId', universityId),
        supabase
          .from('DepartmentAdminAssignment')
          .select('id, universityId, departmentId, userId')
          .eq('universityId', universityId),
        supabase
          .from('DepartmentAnnouncement')
          .select('id, universityId, title, content, scopeType, departmentId, sectionId, createdAt')
          .eq('universityId', universityId)
          .order('createdAt', { ascending: false }),
        supabase
          .from('Profile')
          .select('id, fullName, username, role, avatarUrl, universityId, department')
          .eq('universityId', universityId)
          .in('role', ['STUDENT', 'FACULTY', 'ADMIN'])
          .order('fullName', { ascending: true }),
      ]);

      const queryErrors = [
        departmentsResp.error,
        sectionsResp.error,
        studentAssignmentsResp.error,
        teacherAssignmentsResp.error,
        departmentAdminsResp.error,
        announcementsResp.error,
        profileResp.error,
      ].filter(Boolean);

      if (queryErrors.length > 0) {
        throw queryErrors[0];
      }

      const departmentRows = (departmentsResp.data || []) as DepartmentRow[];

      setDepartments(departmentRows);
      setSections((sectionsResp.data || []) as SectionRow[]);
      setStudentAssignments((studentAssignmentsResp.data || []) as StudentAssignmentRow[]);
      setTeacherAssignments((teacherAssignmentsResp.data || []) as TeacherAssignmentRow[]);
      setDepartmentAdminAssignments((departmentAdminsResp.data || []) as DepartmentAdminAssignmentRow[]);
      setAnnouncements((announcementsResp.data || []) as DepartmentAnnouncementRow[]);
      setProfiles((profileResp.data || []) as ProfileSummary[]);

      setSelectedDepartmentId((prev) => {
        if (prev === 'all') return 'all';
        if (departmentRows.some((item) => item.id === prev)) return prev;
        return 'all';
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to load organization data.');
      toast.error(message);

      if (String(message).includes('relation') && String(message).includes('does not exist')) {
        toast.error('Run the new Supabase migration for Uni Dashboard tables, then refresh.');
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  useEffect(() => {
    if (!effectiveUniversityId) return;
    loadOrganizationData(effectiveUniversityId);
  }, [effectiveUniversityId, loadOrganizationData]);

  const withBusy = async (key: string, runner: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await runner();
    } finally {
      setBusyAction(null);
    }
  };

  const canManageDepartment = (departmentId: string) => {
    if (scopedAdmin) return true;
    return managedDepartmentIds.has(departmentId);
  };

  const createDepartment = async () => {
    if (!effectiveUniversityId || !currentUser) return;
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can create departments.');
      return;
    }

    const name = newDepartment.name.trim();
    const code = newDepartment.code.trim().toUpperCase();

    if (!name || !code) {
      toast.error('Department name and code are required.');
      return;
    }

    await withBusy('create-department', async () => {
      const { error } = await supabase.from('Department').insert({
        id: crypto.randomUUID(),
        universityId: effectiveUniversityId,
        name,
        code,
        createdBy: currentUser.id,
      });

      if (error) throw error;

      setNewDepartment({ name: '', code: '' });
      setCreateDepartmentOpen(false);
      toast.success('Department created.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const createSection = async () => {
    if (!effectiveUniversityId || !currentUser) return;
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can create sections.');
      return;
    }

    const name = newSection.name.trim();
    const code = newSection.code.trim().toUpperCase();

    if (!name || !code || !newSection.departmentId) {
      toast.error('Select a department and provide section name/code.');
      return;
    }

    await withBusy('create-section', async () => {
      const { error } = await supabase.from('DepartmentSection').insert({
        id: crypto.randomUUID(),
        universityId: effectiveUniversityId,
        departmentId: newSection.departmentId,
        name,
        code,
        createdBy: currentUser.id,
      });

      if (error) throw error;

      setNewSection({ name: '', code: '', departmentId: '' });
      setCreateSectionOpen(false);
      toast.success('Section created.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const assignStudentToSection = async () => {
    if (!effectiveUniversityId || !currentUser) return;

    const { studentId, sectionId } = studentAssignmentForm;
    if (!studentId || !sectionId) {
      toast.error('Select both student and section.');
      return;
    }

    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      toast.error('Selected section not found.');
      return;
    }

    if (!canManageDepartment(section.departmentId)) {
      toast.error('You can only manage students within your allowed departments.');
      return;
    }

    await withBusy('assign-student', async () => {
      const { data: existing } = await supabase
        .from('DepartmentStudentAssignment')
        .select('id')
        .eq('studentId', studentId)
        .maybeSingle();

      const payload = {
        id: existing?.id || crypto.randomUUID(),
        universityId: effectiveUniversityId,
        studentId,
        departmentId: section.departmentId,
        sectionId: section.id,
        assignedBy: currentUser.id,
      };

      const { error } = await supabase
        .from('DepartmentStudentAssignment')
        .upsert(payload, { onConflict: 'studentId' });

      if (error) throw error;

      setStudentAssignmentForm({ studentId: '', sectionId: '' });
      setAssignStudentOpen(false);
      toast.success('Student assignment updated.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const unassignStudent = async (assignmentId: string) => {
    if (!effectiveUniversityId) return;

    await withBusy(`unassign-student-${assignmentId}`, async () => {
      const assignment = studentAssignments.find((item) => item.id === assignmentId);
      if (!assignment) return;

      if (!canManageDepartment(assignment.departmentId)) {
        toast.error('You cannot remove this student assignment.');
        return;
      }

      const { error } = await supabase
        .from('DepartmentStudentAssignment')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Student removed from section.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const assignTeacherToSection = async () => {
    if (!effectiveUniversityId || !currentUser) return;

    if (!scopedAdmin) {
      toast.error('Only Admin or Super Admin can assign teachers.');
      return;
    }

    const { teacherId, sectionId } = teacherAssignmentForm;
    if (!teacherId || !sectionId) {
      toast.error('Select both teacher and section.');
      return;
    }

    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      toast.error('Selected section not found.');
      return;
    }

    await withBusy('assign-teacher', async () => {
      const { error } = await supabase.from('DepartmentTeacherAssignment').insert({
        id: crypto.randomUUID(),
        universityId: effectiveUniversityId,
        teacherId,
        departmentId: section.departmentId,
        sectionId,
        assignedBy: currentUser.id,
      });

      if (error) throw error;

      setTeacherAssignmentForm({ teacherId: '', sectionId: '' });
      setAssignTeacherOpen(false);
      toast.success('Teacher assigned to section.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const removeTeacherAssignment = async (assignmentId: string) => {
    if (!effectiveUniversityId) return;

    if (!scopedAdmin) {
      toast.error('Only Admin or Super Admin can remove teacher assignments.');
      return;
    }

    await withBusy(`remove-teacher-${assignmentId}`, async () => {
      const { error } = await supabase
        .from('DepartmentTeacherAssignment')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Teacher assignment removed.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const assignDepartmentAdmin = async () => {
    if (!effectiveUniversityId || !currentUser) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can assign Department Admin roles.');
      return;
    }

    const { userId, departmentId } = departmentAdminForm;
    if (!userId || !departmentId) {
      toast.error('Select an admin and a department.');
      return;
    }

    await withBusy('assign-department-admin', async () => {
      const { error } = await supabase.from('DepartmentAdminAssignment').insert({
        id: crypto.randomUUID(),
        universityId: effectiveUniversityId,
        departmentId,
        userId,
        assignedBy: currentUser.id,
      });

      if (error) throw error;

      setDepartmentAdminForm({ userId: '', departmentId: '' });
      toast.success('Department Admin assigned.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const removeDepartmentAdmin = async (assignmentId: string) => {
    if (!effectiveUniversityId) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can remove Department Admin roles.');
      return;
    }

    await withBusy(`remove-department-admin-${assignmentId}`, async () => {
      const { error } = await supabase
        .from('DepartmentAdminAssignment')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Department Admin role removed.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const createAnnouncement = async () => {
    if (!effectiveUniversityId || !currentUser) return;

    const title = announcementForm.title.trim();
    const content = announcementForm.content.trim();

    if (!title || !content) {
      toast.error('Announcement title and content are required.');
      return;
    }

    let departmentId: string | null = null;
    let sectionId: string | null = null;

    if (announcementForm.scopeType === 'DEPARTMENT') {
      if (!announcementForm.departmentId) {
        toast.error('Select a department for this announcement.');
        return;
      }
      departmentId = announcementForm.departmentId;
    }

    if (announcementForm.scopeType === 'SECTION') {
      if (!announcementForm.sectionId) {
        toast.error('Select a section for this announcement.');
        return;
      }
      const section = sections.find((item) => item.id === announcementForm.sectionId);
      if (!section) {
        toast.error('Selected section not found.');
        return;
      }
      sectionId = section.id;
      departmentId = section.departmentId;
    }

    if (!scopedAdmin && !isDepartmentAdmin) {
      toast.error('You do not have permission to create announcements.');
      return;
    }

    if (!scopedAdmin) {
      if (announcementForm.scopeType === 'UNIVERSITY') {
        toast.error('Department Admin can create only department or section announcements.');
        return;
      }

      if (!departmentId || !managedDepartmentIds.has(departmentId)) {
        toast.error('You can only announce within your managed departments.');
        return;
      }
    }

    await withBusy('create-announcement', async () => {
      const { error } = await supabase.from('DepartmentAnnouncement').insert({
        id: crypto.randomUUID(),
        universityId: effectiveUniversityId,
        title,
        content,
        scopeType: announcementForm.scopeType,
        departmentId,
        sectionId,
        createdBy: currentUser.id,
      });

      if (error) throw error;

      setAnnouncementForm({
        title: '',
        content: '',
        scopeType: 'UNIVERSITY',
        departmentId: '',
        sectionId: '',
      });

      toast.success('Announcement published.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const removeAnnouncement = async (announcementId: string) => {
    if (!effectiveUniversityId) return;

    await withBusy(`remove-announcement-${announcementId}`, async () => {
      const item = announcements.find((entry) => entry.id === announcementId);
      if (!item) return;

      if (!scopedAdmin) {
        if (!item.departmentId || !managedDepartmentIds.has(item.departmentId)) {
          toast.error('You can only delete announcements in your managed departments.');
          return;
        }
      }

      const { error } = await supabase
        .from('DepartmentAnnouncement')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      toast.success('Announcement deleted.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const renameDepartment = async (department: DepartmentRow) => {
    if (!effectiveUniversityId) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can rename departments.');
      return;
    }

    const name = window.prompt('New department name', department.name)?.trim();
    if (!name) return;

    await withBusy(`rename-department-${department.id}`, async () => {
      const { error } = await supabase
        .from('Department')
        .update({ name })
        .eq('id', department.id);

      if (error) throw error;
      toast.success('Department renamed.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!effectiveUniversityId) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete departments.');
      return;
    }

    if (!window.confirm('Delete this department, all sections, assignments, and announcements inside it?')) {
      return;
    }

    await withBusy(`delete-department-${departmentId}`, async () => {
      const { error } = await supabase
        .from('Department')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;
      toast.success('Department deleted.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const renameSection = async (section: SectionRow) => {
    if (!effectiveUniversityId) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can rename sections.');
      return;
    }

    const name = window.prompt('New section name', section.name)?.trim();
    if (!name) return;

    await withBusy(`rename-section-${section.id}`, async () => {
      const { error } = await supabase
        .from('DepartmentSection')
        .update({ name })
        .eq('id', section.id);

      if (error) throw error;
      toast.success('Section renamed.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const deleteSection = async (sectionId: string) => {
    if (!effectiveUniversityId) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete sections.');
      return;
    }

    if (!window.confirm('Delete this section and all assignments/announcements tied to it?')) {
      return;
    }

    await withBusy(`delete-section-${sectionId}`, async () => {
      const { error } = await supabase
        .from('DepartmentSection')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      toast.success('Section deleted.');
      await loadOrganizationData(effectiveUniversityId);
    });
  };

  const filteredVisibleDepartments = useMemo(() => {
    if (!studentSearch.trim()) return visibleDepartments;

    const term = studentSearch.trim().toLowerCase();
    const matchedSectionIds = new Set<string>();

    for (const assignment of studentAssignments) {
      const profile = profileMap.get(assignment.studentId);
      const label = `${profile?.fullName || ''} ${profile?.username || ''}`.toLowerCase();
      if (label.includes(term)) {
        matchedSectionIds.add(assignment.sectionId);
      }
    }

    return visibleDepartments.filter((department) => {
      const deptSections = groupedSectionsByDepartment.get(department.id) || [];
      return deptSections.some((section) => matchedSectionIds.has(section.id));
    });
  }, [visibleDepartments, studentSearch, studentAssignments, profileMap, groupedSectionsByDepartment]);

  const dashboardAction = (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => {
        if (effectiveUniversityId) {
          loadOrganizationData(effectiveUniversityId);
        }
      }}
      disabled={refreshing || !effectiveUniversityId}
    >
      {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      Refresh
    </Button>
  );

  const statCards = [
    {
      title: 'Departments',
      value: departments.length,
      subtitle: 'Active university units',
      icon: Building2,
      variant: 'sky' as const,
    },
    {
      title: 'Sections',
      value: sections.length,
      subtitle: 'Batch and class clusters',
      icon: Layers,
      variant: 'lavender' as const,
    },
    {
      title: 'Student Assignments',
      value: studentAssignments.length,
      subtitle: 'One student to one section',
      icon: GraduationCap,
      variant: 'mint' as const,
    },
    {
      title: 'Announcements',
      value: visibleAnnouncements.length,
      subtitle: 'University, department, section',
      icon: Bell,
      variant: 'amber' as const,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        title="Uni Dashboard"
        subtitle="Loading department hierarchy..."
        breadcrumb={["UniVerse", "Departments"]}
        activeNav="/departments"
      >
        <div className="min-h-[55vh] grid place-items-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading Uni Dashboard</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Uni Dashboard</h1>
            <p className="text-sm text-muted-foreground">Departments to sections to students with scoped announcements</p>
          </div>
        </div>
      }
      subtitle={
        currentUser
          ? `${currentUser.fullName || 'User'} • ${currentUser.role}${isSuperAdmin ? ' • Super Admin' : ''}`
          : 'Department hierarchy and role control'
      }
      breadcrumb={["UniVerse", "Departments"]}
      activeNav="/departments"
      action={dashboardAction}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-8 relative">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-56 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-amber-500/10 blur-3xl rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {statCards.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              variant={item.variant}
            />
          ))}
        </motion.div>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl shadow-lg shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scope & Filters</CardTitle>
            <CardDescription>Choose context for the hierarchy view and management actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">University</p>
              <div className="h-10 rounded-md border px-3 flex items-center text-sm">
                {currentUser?.universityName || 'No university assigned'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Department</p>
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All visible departments</SelectItem>
                  {Array.from(visibleDepartmentIds.values())
                    .map((id) => departments.find((item) => item.id === id))
                    .filter((item): item is DepartmentRow => !!item)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Student Search</p>
              <Input
                placeholder="Search by name or username"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="organization" className="space-y-4">
          <TabsList className="grid w-full max-w-xl grid-cols-3 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-1.5 h-auto">
            <TabsTrigger value="organization" className="gap-2 rounded-xl py-2.5"><Users className="h-4 w-4" /> Organization</TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2 rounded-xl py-2.5"><Megaphone className="h-4 w-4" /> Announcements</TabsTrigger>
            <TabsTrigger value="access" className="gap-2 rounded-xl py-2.5"><ShieldCheck className="h-4 w-4" /> Access Control</TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4">
            {(isSuperAdmin || isDepartmentAdmin || scopedAdmin) && (
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <CardDescription>Open focused modals to manage departments, sections, and assignments.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {isSuperAdmin && (
                    <Dialog open={createDepartmentOpen} onOpenChange={setCreateDepartmentOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 rounded-xl">
                          <Plus className="h-4 w-4" />
                          Create Department
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Create Department
                          </DialogTitle>
                          <DialogDescription>Set up a new department in your university.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input
                            placeholder="Department name"
                            value={newDepartment.name}
                            onChange={(event) => setNewDepartment((prev) => ({ ...prev, name: event.target.value }))}
                          />
                          <Input
                            placeholder="Department code (e.g. CSE)"
                            value={newDepartment.code}
                            onChange={(event) => setNewDepartment((prev) => ({ ...prev, code: event.target.value }))}
                          />
                          <Button onClick={createDepartment} disabled={busyAction === 'create-department'} className="gap-2 w-full rounded-xl">
                            {busyAction === 'create-department' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create Department
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {isSuperAdmin && (
                    <Dialog open={createSectionOpen} onOpenChange={setCreateSectionOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl">
                          <Layers className="h-4 w-4" />
                          Create Section
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Create Section
                          </DialogTitle>
                          <DialogDescription>Add a section inside a department (example: CSE-A).</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Select
                            value={newSection.departmentId}
                            onValueChange={(value) => setNewSection((prev) => ({ ...prev, departmentId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.code} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Section name"
                            value={newSection.name}
                            onChange={(event) => setNewSection((prev) => ({ ...prev, name: event.target.value }))}
                          />
                          <Input
                            placeholder="Section code"
                            value={newSection.code}
                            onChange={(event) => setNewSection((prev) => ({ ...prev, code: event.target.value }))}
                          />
                          <Button onClick={createSection} disabled={busyAction === 'create-section'} className="gap-2 w-full rounded-xl">
                            {busyAction === 'create-section' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create Section
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {(scopedAdmin || isDepartmentAdmin) && (
                    <Dialog open={assignStudentOpen} onOpenChange={setAssignStudentOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl">
                          <GraduationCap className="h-4 w-4" />
                          Assign Student to Section
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Assign Student to Section
                          </DialogTitle>
                          <DialogDescription>Student mapping stays one department and one section at a time.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Select
                            value={studentAssignmentForm.studentId}
                            onValueChange={(value) => setStudentAssignmentForm((prev) => ({ ...prev, studentId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {candidateStudents.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.fullName || item.username || item.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={studentAssignmentForm.sectionId}
                            onValueChange={(value) => setStudentAssignmentForm((prev) => ({ ...prev, sectionId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {sections
                                .filter((section) => canManageDepartment(section.departmentId))
                                .map((item) => {
                                  const department = departments.find((d) => d.id === item.departmentId);
                                  return (
                                    <SelectItem key={item.id} value={item.id}>
                                      {department?.code || 'DEP'} / {item.code}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                          <Button onClick={assignStudentToSection} disabled={busyAction === 'assign-student'} className="gap-2 w-full rounded-xl">
                            {busyAction === 'assign-student' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                            Save Student Assignment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {scopedAdmin && (
                    <Dialog open={assignTeacherOpen} onOpenChange={setAssignTeacherOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl">
                          <UserCog className="h-4 w-4" />
                          Assign Teacher to Section
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-primary" />
                            Assign Teacher to Section
                          </DialogTitle>
                          <DialogDescription>Faculty can be assigned to one or many sections.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Select
                            value={teacherAssignmentForm.teacherId}
                            onValueChange={(value) => setTeacherAssignmentForm((prev) => ({ ...prev, teacherId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {candidateTeachers.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.fullName || item.username || item.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={teacherAssignmentForm.sectionId}
                            onValueChange={(value) => setTeacherAssignmentForm((prev) => ({ ...prev, sectionId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {sections.map((item) => {
                                const department = departments.find((d) => d.id === item.departmentId);
                                return (
                                  <SelectItem key={item.id} value={item.id}>
                                    {department?.code || 'DEP'} / {item.code}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Button onClick={assignTeacherToSection} disabled={busyAction === 'assign-teacher'} className="gap-2 w-full rounded-xl">
                            {busyAction === 'assign-teacher' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                            Assign Teacher
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Department to section to student hierarchy</CardTitle>
                <CardDescription>
                  Students and teachers see only their allowed departments. Admins can switch and manage across departments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredVisibleDepartments.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-10 text-center">No departments visible for your role and filters.</div>
                ) : (
                  <Accordion type="multiple" className="w-full space-y-2">
                    {filteredVisibleDepartments.map((department) => {
                      const deptSections = groupedSectionsByDepartment.get(department.id) || [];
                      const deptStudents = studentAssignments.filter((item) => item.departmentId === department.id).length;

                      return (
                        <AccordionItem key={department.id} value={department.id} className="rounded-xl border border-border/50 px-4 bg-gradient-to-br from-background via-background/80 to-sky-500/5">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-3 text-left">
                              <Badge variant="secondary">{department.code}</Badge>
                              <div>
                                <p className="font-semibold">{department.name}</p>
                                <p className="text-xs text-muted-foreground">{deptSections.length} sections • {deptStudents} students</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {isSuperAdmin && (
                                  <>
                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => renameDepartment(department)}>
                                      <Pencil className="h-3.5 w-3.5" /> Rename
                                    </Button>
                                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => deleteDepartment(department.id)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </Button>
                                  </>
                                )}
                              </div>

                              {deptSections.length === 0 ? (
                                <div className="text-xs text-muted-foreground">No sections in this department yet.</div>
                              ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                  {deptSections.map((section) => {
                                    const sectionStudents = (studentsBySection.get(section.id) || []).filter((assignment) => {
                                      if (!studentSearch.trim()) return true;
                                      const profile = profileMap.get(assignment.studentId);
                                      const term = studentSearch.toLowerCase();
                                      return `${profile?.fullName || ''} ${profile?.username || ''}`.toLowerCase().includes(term);
                                    });
                                    const sectionTeachers = teachersBySection.get(section.id) || [];

                                    return (
                                      <Card key={section.id} className="border-border/60 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-lg shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-center justify-between gap-2">
                                            <div>
                                              <CardTitle className="text-sm">{section.name}</CardTitle>
                                              <CardDescription>{section.code}</CardDescription>
                                            </div>
                                            {isSuperAdmin && (
                                              <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => renameSection(section)}>
                                                  <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => deleteSection(section.id)}>
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          <div>
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Teachers</p>
                                            {sectionTeachers.length === 0 ? (
                                              <p className="text-xs text-muted-foreground">No teacher assigned.</p>
                                            ) : (
                                              <div className="space-y-1.5">
                                                {sectionTeachers.map((assignment) => {
                                                  const teacher = profileMap.get(assignment.teacherId);
                                                  return (
                                                    <div key={assignment.id} className="flex items-center justify-between text-sm">
                                                      <span>{teacher?.fullName || teacher?.username || assignment.teacherId}</span>
                                                      {scopedAdmin && (
                                                        <Button
                                                          size="icon"
                                                          variant="ghost"
                                                          onClick={() => removeTeacherAssignment(assignment.id)}
                                                          disabled={busyAction === `remove-teacher-${assignment.id}`}
                                                        >
                                                          {busyAction === `remove-teacher-${assignment.id}` ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                          ) : (
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                          )}
                                                        </Button>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>

                                          <div>
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Students</p>
                                            {sectionStudents.length === 0 ? (
                                              <p className="text-xs text-muted-foreground">No students found in this section.</p>
                                            ) : (
                                              <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                                                {sectionStudents.map((assignment) => {
                                                  const student = profileMap.get(assignment.studentId);
                                                  return (
                                                    <div key={assignment.id} className="flex items-center justify-between text-sm">
                                                      <span>{student?.fullName || student?.username || assignment.studentId}</span>
                                                      {(scopedAdmin || isDepartmentAdmin) && canManageDepartment(department.id) && (
                                                        <Button
                                                          size="icon"
                                                          variant="ghost"
                                                          onClick={() => unassignStudent(assignment.id)}
                                                          disabled={busyAction === `unassign-student-${assignment.id}`}
                                                        >
                                                          {busyAction === `unassign-student-${assignment.id}` ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                          ) : (
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                          )}
                                                        </Button>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            {(scopedAdmin || isDepartmentAdmin) && (
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Create Targeted Announcement</CardTitle>
                  <CardDescription>
                    Publish global, department, or section updates. Students only see what matches their scope.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Announcement title"
                    value={announcementForm.title}
                    onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <Textarea
                    placeholder="Write the message..."
                    value={announcementForm.content}
                    onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, content: event.target.value }))}
                    className="min-h-[110px]"
                  />

                  <div className="grid gap-3 md:grid-cols-3">
                    <Select
                      value={announcementForm.scopeType}
                      onValueChange={(value) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          scopeType: value as AnnouncementScopeType,
                          departmentId: '',
                          sectionId: '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNIVERSITY">Entire University</SelectItem>
                        <SelectItem value="DEPARTMENT">Specific Department</SelectItem>
                        <SelectItem value="SECTION">Specific Section</SelectItem>
                      </SelectContent>
                    </Select>

                    {announcementForm.scopeType !== 'UNIVERSITY' && (
                      <Select
                        value={announcementForm.departmentId}
                        onValueChange={(value) =>
                          setAnnouncementForm((prev) => ({
                            ...prev,
                            departmentId: value,
                            sectionId: '',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments
                            .filter((item) => scopedAdmin || managedDepartmentIds.has(item.id))
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.code} - {item.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}

                    {announcementForm.scopeType === 'SECTION' && (
                      <Select
                        value={announcementForm.sectionId}
                        onValueChange={(value) => setAnnouncementForm((prev) => ({ ...prev, sectionId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections
                            .filter((item) => !announcementForm.departmentId || item.departmentId === announcementForm.departmentId)
                            .filter((item) => scopedAdmin || managedDepartmentIds.has(item.departmentId))
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.code}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <Button onClick={createAnnouncement} disabled={busyAction === 'create-announcement'} className="gap-2">
                    {busyAction === 'create-announcement' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                    Publish Announcement
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Visible Announcements</CardTitle>
                <CardDescription>Filtered by your role, department, and section.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleAnnouncements.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No announcements available for your current scope.</div>
                ) : (
                  visibleAnnouncements.map((item) => {
                    const department = item.departmentId ? departments.find((dep) => dep.id === item.departmentId) : null;
                    const section = item.sectionId ? sections.find((sec) => sec.id === item.sectionId) : null;

                    return (
                      <Card key={item.id} className="border-border/60 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-lg">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-base">{item.title}</CardTitle>
                              <CardDescription>
                                {item.scopeType === 'UNIVERSITY' ? 'Entire University' : item.scopeType === 'DEPARTMENT' ? department?.name : section?.name}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">{item.scopeType}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm leading-relaxed">{item.content}</p>
                          {(scopedAdmin || (item.departmentId && managedDepartmentIds.has(item.departmentId))) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => removeAnnouncement(item.id)}
                              disabled={busyAction === `remove-announcement-${item.id}`}
                            >
                              {busyAction === `remove-announcement-${item.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Your Access Profile</CardTitle>
                  <CardDescription>Role-based permissions currently active.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span>Role</span>
                    <Badge>{currentUser?.role || 'UNKNOWN'}</Badge>
                  </div>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span>Super Admin</span>
                    <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>{isSuperAdmin ? 'Yes' : 'No'}</Badge>
                  </div>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span>University Admin</span>
                    <Badge variant={isUniversityAdmin ? 'default' : 'secondary'}>{isUniversityAdmin ? 'Yes' : 'No'}</Badge>
                  </div>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span>Department Admin</span>
                    <Badge variant={isDepartmentAdmin ? 'default' : 'secondary'}>{isDepartmentAdmin ? 'Yes' : 'No'}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    Teacher section assignment can be managed only by Admin or Super Admin.
                  </div>
                </CardContent>
              </Card>

              {isSuperAdmin && (
                <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base">Assign Department Admin</CardTitle>
                    <CardDescription>Map an ADMIN user to one department for department-level management.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={departmentAdminForm.userId}
                      onValueChange={(value) => setDepartmentAdminForm((prev) => ({ ...prev, userId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select admin user" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidateDepartmentAdmins.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.fullName || item.username || item.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={departmentAdminForm.departmentId}
                      onValueChange={(value) => setDepartmentAdminForm((prev) => ({ ...prev, departmentId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code} - {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={assignDepartmentAdmin} disabled={busyAction === 'assign-department-admin'} className="gap-2">
                      {busyAction === 'assign-department-admin' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Assign Department Admin
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Department Admin Mapping</CardTitle>
                <CardDescription>Current user-to-department admin assignments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {departmentAdminAssignments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No department admin assignments yet.</div>
                ) : (
                  departmentAdminAssignments.map((item) => {
                    const user = profileMap.get(item.userId);
                    const department = departments.find((entry) => entry.id === item.departmentId);

                    return (
                      <div key={item.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{user?.fullName || user?.username || item.userId}</p>
                          <p className="text-xs text-muted-foreground">{department?.code} - {department?.name}</p>
                        </div>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDepartmentAdmin(item.id)}
                            disabled={busyAction === `remove-department-admin-${item.id}`}
                          >
                            {busyAction === `remove-department-admin-${item.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Department Snapshot</CardTitle>
                <CardDescription>Quick analytics by department and section distribution.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {departmentStats
                  .filter((item) => visibleDepartmentIds.has(item.id))
                  .map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/50 bg-gradient-to-br from-background to-sky-500/5 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{item.code}</p>
                        <Badge variant="secondary">{item.name}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Sections: {item.sectionCount}</p>
                      <p className="text-xs text-muted-foreground">Students: {item.studentCount}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

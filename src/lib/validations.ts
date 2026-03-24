import { z } from "zod";

export const feedbackSchema = z.object({
  type: z.enum(["feature", "bug"]),
  description: z.string().min(10).max(2000),
});

export const chatHistorySchema = z.array(
  z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(10000),
  })
).min(1).max(100);

export const chatMessageSchema = z.object({
  chatId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(50000),
});

export const studyPlanInputSchema = z.object({
  title: z.string().min(1).max(200),
  targetGpa: z.number().min(0).max(4.0).optional(),
  topics: z.string().min(1).max(5000),
  examDate: z.string().min(1),
  hoursPerDay: z.number().min(0.5).max(24),
  courseId: z.string().optional(),
});

export const flashcardTopicSchema = z.string().min(1).max(500);

export const quizTopicSchema = z.string().min(1).max(500);

export const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),
  noteId: z.string().optional(),
  courseId: z.string().optional(),
});

export const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  type: z.string().min(1).max(50),
  courseId: z.string().min(1),
  universityId: z.string().min(1),
});

export const studyGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  universityId: z.string().min(1),
});

export const marketplaceListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  price: z.number().min(0).max(1000000),
  category: z.string().optional(),
});

export const mapsQuerySchema = z.object({
  query: z.string().min(2).max(500),
});

export const mapsDirectionsSchema = z.object({
  origin: z.string().min(1).max(500),
  destination: z.string().min(1).max(500),
  waypoints: z.string().max(2000).optional(),
});

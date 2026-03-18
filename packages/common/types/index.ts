import { z } from "zod";

export const SignupSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8).max(20),
});
   
export const SigninSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8).max(20),
});


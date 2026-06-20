import { z } from "zod";

export const signUpSchema = z.object({
  ownerName: z.string().min(2, "Name must be at least 2 characters").max(50),
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters").max(200),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character"),
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;

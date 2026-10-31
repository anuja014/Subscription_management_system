// src/lib/validators.js
import { z } from 'zod';

// Password: more than 8 chars (at least 9), uppercase, lowercase, special char
export const signupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string()
    .min(9, 'Password must be more than 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  full_name: z.string().min(1, 'Full name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.string().min(1, 'Select a type'),
  sales_price: z.coerce.number().min(0, 'Price must be positive'),
  cost_price: z.coerce.number().min(0, 'Cost must be positive'),
  notes: z.string().optional(),
  is_active: z.boolean(),
});

export const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  price: z.coerce.number().min(0),
  billing_period: z.string().min(1, 'Select billing period'),
  min_quantity: z.coerce.number().min(1, 'Minimum quantity must be at least 1'),
  available_from: z.string().optional(),
  available_to: z.string().optional(),
  auto_close: z.boolean(),
  allow_early_close: z.boolean(),
  allow_pause: z.boolean(),
  allow_renew: z.boolean(),
  is_active: z.boolean(),
});

export const taxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  type: z.string().min(1, 'Select tax type'),
  rate: z.coerce.number().min(0, 'Rate must be positive'),
  is_active: z.boolean(),
});

export const discountSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  type: z.string().min(1, 'Select discount type'),
  value: z.coerce.number().min(0, 'Value must be positive'),
  min_purchase: z.coerce.number().min(0).optional(),
  min_quantity: z.coerce.number().min(1).optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  usage_limit: z.coerce.number().min(1).optional(),
  applies_to: z.string().min(1, 'Select what it applies to'),
  is_active: z.boolean(),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Enter a valid email'),
  company: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
});

export const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice is required'),
  method: z.string().min(1, 'Select payment method'),
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

export const passwordStrengthChecks = (password) => ({
  length: password.length > 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

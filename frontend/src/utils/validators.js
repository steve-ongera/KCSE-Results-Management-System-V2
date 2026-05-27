/**
 * src/utils/validators.js
 *
 * Client-side validation helpers for KCSE-specific fields.
 *
 * All validators return:
 *   - undefined / null  → field is valid
 *   - string            → error message to display
 *
 * These are compatible with React Hook Form's `validate` option:
 *   <input {...register('index_number', { validate: validateIndexNumber })} />
 *
 * Zod schemas are also exported for use with zodResolver in RHF.
 */

import { z } from 'zod'


// ═════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL VALIDATORS  (React Hook Form style)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * KNEC 11-digit index number.
 * Format: 8-digit center code + 3-digit candidate number.
 * Example: "10234001023"
 *
 * @param {string} value
 * @returns {string | undefined}
 */
export function validateIndexNumber(value) {
  if (!value) return 'Index number is required.'
  const clean = value.replace(/\s|\//g, '')    // strip spaces and slashes
  if (!/^\d{11}$/.test(clean)) {
    return 'Index number must be exactly 11 digits (e.g. 10234001023).'
  }
  return undefined
}

/**
 * KCPE 10-digit index number.
 * @param {string} value
 * @returns {string | undefined}
 */
export function validateKCPEIndex(value) {
  if (!value) return 'KCPE index number is required.'
  const clean = value.replace(/\s/g, '')
  if (!/^\d{10}$/.test(clean)) {
    return 'KCPE index number must be exactly 10 digits.'
  }
  return undefined
}

/**
 * Full name — must contain at least 2 words (first + surname).
 * The API stores names in uppercase; we normalise before submission.
 *
 * @param {string} value
 * @returns {string | undefined}
 */
export function validateFullName(value) {
  if (!value || !value.trim()) return 'Full name is required.'
  const parts = value.trim().split(/\s+/)
  if (parts.length < 2) {
    return 'Please enter at least a first name and surname.'
  }
  if (parts.some((p) => p.length < 2)) {
    return 'Each part of the name must be at least 2 characters.'
  }
  return undefined
}

/**
 * KNEC 8-digit examination center code.
 * @param {string} value
 * @returns {string | undefined}
 */
export function validateCenterCode(value) {
  if (!value) return 'Center code is required.'
  if (!/^\d{8}$/.test(value.trim())) {
    return 'Center code must be exactly 8 digits.'
  }
  return undefined
}

/**
 * Subject marks — must be 0 to maxMarks (inclusive).
 * @param {number}  marks
 * @param {number}  maxMarks
 * @returns {string | undefined}
 */
export function validateMarks(marks, maxMarks = 100) {
  if (marks === null || marks === undefined || marks === '') {
    return 'Marks are required.'
  }
  const n = Number(marks)
  if (isNaN(n)) return 'Marks must be a number.'
  if (n < 0)    return 'Marks cannot be negative.'
  if (n > maxMarks) return `Marks cannot exceed ${maxMarks}.`
  return undefined
}

/**
 * Password — minimum 10 characters, at least one digit and one letter.
 * @param {string} value
 * @returns {string | undefined}
 */
export function validatePassword(value) {
  if (!value) return 'Password is required.'
  if (value.length < 10) return 'Password must be at least 10 characters.'
  if (!/\d/.test(value))    return 'Password must contain at least one number.'
  if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter.'
  return undefined
}

/**
 * Date of birth — candidate must be at least 14 years old.
 * @param {string} value  ISO date string (YYYY-MM-DD)
 * @returns {string | undefined}
 */
export function validateDateOfBirth(value) {
  if (!value) return undefined  // Optional field
  const dob  = new Date(value)
  if (isNaN(dob.getTime())) return 'Please enter a valid date.'
  const age  = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  if (age < 14) return 'Candidate must be at least 14 years old.'
  if (age > 40) return 'Please verify the date of birth — candidate appears too old.'
  return undefined
}

/**
 * File upload — validates type and size.
 * @param {File}     file
 * @param {string[]} allowedTypes   e.g. ['image/jpeg', 'image/png']
 * @param {number}   maxMB          e.g. 2
 * @returns {string | undefined}
 */
export function validateFile(file, allowedTypes = ['image/jpeg', 'image/png'], maxMB = 2) {
  if (!file) return undefined  // Optional field
  if (!allowedTypes.includes(file.type)) {
    return `Unsupported file type. Allowed: ${allowedTypes.join(', ')}.`
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `File size must not exceed ${maxMB} MB.`
  }
  return undefined
}

/**
 * KCPE marks — 0 to 500.
 * @param {number} value
 * @returns {string | undefined}
 */
export function validateKCPEMarks(value) {
  if (value === null || value === undefined || value === '') return undefined
  const n = Number(value)
  if (isNaN(n) || n < 0 || n > 500) {
    return 'KCPE marks must be between 0 and 500.'
  }
  return undefined
}


// ═════════════════════════════════════════════════════════════════════════════
// ZOD SCHEMAS  (for zodResolver with React Hook Form)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Public results lookup form.
 */
export const resultsLookupSchema = z.object({
  index_number: z
    .string()
    .min(1, 'Index number is required.')
    .transform((v) => v.replace(/\s|\//g, ''))
    .refine((v) => /^\d{11}$/.test(v), {
      message: 'Index number must be exactly 11 digits (e.g. 10234001023).',
    }),
  full_name: z
    .string()
    .min(1, 'Full name is required.')
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => v.split(/\s+/).length >= 2, {
      message: 'Please enter at least a first name and surname.',
    }),
})

/**
 * Staff login form.
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
})

/**
 * Candidate registration form.
 */
export const candidateRegistrationSchema = z.object({
  index_number: z
    .string()
    .transform((v) => v.replace(/\s|\//g, ''))
    .refine((v) => /^\d{11}$/.test(v), {
      message: 'Index number must be exactly 11 digits.',
    }),
  full_name: z
    .string()
    .min(3, 'Full name is required.')
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => v.split(/\s+/).length >= 2, {
      message: 'Please enter at least a first name and surname.',
    }),
  gender: z.enum(['M', 'F'], { message: 'Please select a gender.' }),
  date_of_birth: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(new Date(v).getTime()),
      { message: 'Please enter a valid date of birth.' }
    ),
  kcpe_index_number: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine((v) => /^\d{10}$/.test(v), {
      message: 'KCPE index number must be exactly 10 digits.',
    }),
  kcpe_marks: z
    .number()
    .min(0).max(500)
    .optional()
    .nullable(),
  birth_certificate_number: z.string().optional(),
  examination_center_id: z.string().uuid('Please select a valid examination center.'),
  examination_year_id:   z.string().uuid('Please select a valid examination year.'),
  has_special_needs: z.boolean().default(false),
  special_needs_details: z.string().optional(),
  subject_ids: z
    .array(z.string().uuid())
    .max(6, 'You may select a maximum of 6 optional subjects.'),
})

/**
 * Marks entry form.
 */
export const marksEntrySchema = z.object({
  script:       z.string().uuid('Please select a valid script.'),
  candidate:    z.string().uuid(),
  subject_paper: z.string().uuid('Please select a subject paper.'),
  marks: z
    .number({ invalid_type_error: 'Marks must be a number.' })
    .min(0, 'Marks cannot be negative.')
    .max(100, 'Marks cannot exceed 100.'),
})

/**
 * Reject candidate form.
 */
export const rejectCandidateSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason of at least 10 characters.'),
})

/**
 * Publish results confirmation form.
 */
export const publishResultsSchema = z.object({
  examination_year_id:  z.string().uuid('Please select an examination year.'),
  announcement_message: z.string().optional(),
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm before publishing.' }),
  }),
})


// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Extract the first error message from a DRF validation error object.
 * DRF returns: { field: ["error msg"], non_field_errors: ["..."] }
 *
 * @param {object} errors  — apiError.errors from a caught API call
 * @returns {string}
 */
export function extractApiError(errors) {
  if (!errors || typeof errors !== 'object') return ''
  // non_field_errors first
  if (errors.non_field_errors?.length) return errors.non_field_errors[0]
  // Then first field error
  for (const key of Object.keys(errors)) {
    const val = errors[key]
    if (Array.isArray(val) && val.length) return `${key}: ${val[0]}`
    if (typeof val === 'string') return `${key}: ${val}`
  }
  return 'An unexpected error occurred.'
}

/**
 * Map DRF field errors onto React Hook Form setError.
 * Call this in a mutation's onError handler.
 *
 * @param {object}   apiErrors  — apiError.errors
 * @param {Function} setError   — RHF setError function
 */
export function setFormErrors(apiErrors, setError) {
  if (!apiErrors || typeof apiErrors !== 'object') return
  for (const [field, messages] of Object.entries(apiErrors)) {
    const message = Array.isArray(messages) ? messages[0] : String(messages)
    setError(field, { type: 'server', message })
  }
}

/**
 * Returns true if the given string looks like a valid UUID v4.
 * @param {string} value
 * @returns {boolean}
 */
export function isUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
import { z } from "zod/v4";
import { isValidCountryCode } from "./countries";

export const createItinerarySchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateItinerarySchema = z.object({
  id: z.guid(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export const deleteItinerarySchema = z.object({
  id: z.guid(),
});

export const addLegSchema = z
  .object({
    itineraryId: z.guid(),
    countryCode: z.string().length(2).refine(isValidCountryCode, {
      message: "Unsupported country code",
    }),
    arrivalDate: z.iso.date(),
    departureDate: z.iso.date(),
    city: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .refine((data) => data.departureDate >= data.arrivalDate, {
    message: "Departure must be on or after arrival",
  });

export const updateLegSchema = z.object({
  id: z.guid(),
  countryCode: z.string().length(2).optional(),
  arrivalDate: z.iso.date().optional(),
  departureDate: z.iso.date().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const removeLegSchema = z.object({
  id: z.guid(),
});

export const reorderLegsSchema = z.object({
  itineraryId: z.guid(),
  legIds: z.array(z.guid()).min(1),
});

export type CreateItineraryInput = z.infer<typeof createItinerarySchema>;
export type UpdateItineraryInput = z.infer<typeof updateItinerarySchema>;
export type AddLegInput = z.infer<typeof addLegSchema>;
export type UpdateLegInput = z.infer<typeof updateLegSchema>;
export type ReorderLegsInput = z.infer<typeof reorderLegsSchema>;

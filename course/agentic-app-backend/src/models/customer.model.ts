import { Document, model, Schema } from "mongoose";
import { globalSchemaOptions } from "./schemaOptions.ts";

export interface ICustomer extends Document {
  name: string;
  email: string;
  joinedAt: Date | string;
}

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    joinedAt: {
      type: Date,
      default: Date.now,
      // The Getter: This makes the API return a string
      get: (date: Date) => (date instanceof Date ? date.toISOString() : date),
    },
  },
  globalSchemaOptions
);

export const Customer = model<ICustomer>("Customer", CustomerSchema);

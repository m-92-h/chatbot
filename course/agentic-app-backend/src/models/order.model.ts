import { Document, model, Schema, Types } from "mongoose";
import { globalSchemaOptions } from "./schemaOptions.ts";
import type { ICustomer } from "./customer.model.ts";

export interface IOrder extends Document {
  product: string;
  price: number;
  customer: Types.ObjectId | string | ICustomer; // Reference to Customer ID
  date: Date | string;
}

const OrderSchema = new Schema(
  {
    product: { type: String, required: true },
    price: { type: Number, required: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      get: (customerId: any) =>
        customerId instanceof Types.ObjectId
          ? customerId.toString()
          : customerId,
    }, // Store Customer ID as string
    date: {
      type: Date,
      default: Date.now,
      get: (date: Date) => (date instanceof Date ? date.toISOString() : date),
    },
  },
  globalSchemaOptions,
);

export const Order = model<IOrder>("Order", OrderSchema);

import type { SchemaOptions } from "mongoose";

export const globalSchemaOptions: SchemaOptions = {
  versionKey: false, // Disable the __v field
  // timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: {
    virtuals: true, // ensures 'id' string is created from '_id' ObjectId when converting to JSON
    getters: true, // Apply getters when converting to JSON
    transform: (doc, ret: Record<string, any>) => {
      delete ret._id; // Remove the _id field from the output
      delete ret.__v; // Remove the version key from the output
      return ret;
    },
  },
  toObject: {
    virtuals: true, // ensures 'id' string is created from '_id' ObjectId when converting to plain object
    getters: true, // Apply getters when converting to plain object
    transform: (doc, ret: Record<string, any>) => {
      delete ret._id; // Remove the _id field from the output
      delete ret.__v; // Remove the version key from the output
      return ret;
    },
  },
};

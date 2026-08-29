// import { MOCK_CUSTOMERS } from "../data/customers.data.ts";
import { Customer } from "../models/customer.model.ts";

export class CustomerService {
  static async getLatestCustomers(limit?: number) {
    // const sortedCustomers = MOCK_CUSTOMERS.sort(
    //   (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    // );

    // if (limit && limit > 0) {
    //   return sortedCustomers.slice(0, limit);
    // }

    // return sortedCustomers;

    const customers = await Customer.find().sort({ joinedAt: -1 }).limit(limit || 0);
    console.log("Fetched customers:", customers);
    return customers;
  }

  static async getCustomerById(id: string) {
    // return MOCK_CUSTOMERS.find((customer) => customer._id === id) || null;
    const customer = await Customer.findOne({ _id: id });
    return customer;
  }

  // insert some records into the database
  static async createCustomer(name: string, email: string) {
   const result = await Customer.insertOne({
      name,
      email,
      joinedAt: new Date().toISOString(),
   });

   return result;
  }
}

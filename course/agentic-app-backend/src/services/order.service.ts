// import { MOCK_CUSTOMERS } from "../data/customers.data.ts";
// import { MOCK_ORDERS } from "../data/orders.data.ts";
import { Order } from "../models/order.model.ts";

export class OrderService {
  static async getLatestOrders(limit?: number) {
    // Implementation to fetch latest orders with optional limit

    // const sortedOrders = MOCK_ORDERS.sort(
    //   (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    // );

    // if (limit && limit > 0) {
    //   return sortedOrders.slice(0, limit);
    // }

    // return sortedOrders;
    const orders = await Order.find()
      .sort({ date: -1 })
      .limit(limit || 0);
    console.log("Fetched orders:", orders);
    return orders;
  }

  static async getLatestOrderswithCustomerDetails(limit?: number) {
    // Implementation to fetch latest orders along with customer details
    // const customers = MOCK_CUSTOMERS;

    // const orders = MOCK_ORDERS.map((order) => {
    //   const customer = customers.find((c) => c._id === order.customer);
    //   return { ...order, customer: customer?.name };
    // });

    // const sortedOrders = orders.sort(
    //   (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    // );

    // if (limit && limit > 0) {
    //   return sortedOrders.slice(0, limit);
    // }

    // return sortedOrders;

    const orders = await Order.find()
      .sort({ date: -1 })
      .limit(limit || 0)
      .populate("customer", "name email");

      console.log("Fetched orders with customer details:", orders);
    return orders;
  }

  static async getOrderById(id: string) {
    // Implementation to fetch order by ID
    // return MOCK_ORDERS.find((order) => order._id === id) || null;
    const order = await Order.findOne({ _id: id }).populate("customer", "name");
    return order;
  }

  // insert some records into the database
  static async createOrder(customerId: string, product: string, price: number) {
    const result = await Order.insertOne({
      product,
      customer: customerId,
      price,
      date: new Date().toISOString(),
    });

    return result;
  }
}

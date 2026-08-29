import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OrderService } from "../../../services/order.service.ts";

export function registerOrderTools(mcpServer: McpServer) {
  console.log("Registering Order Tools...");

  // tool 1: Get Orders
  mcpServer.registerTool(
    "getOrders",
    {
      title: "Fetch all orders",
      description: "Retrieve all orders from the json data based on limit",
      inputSchema: {
        limit: z.number().optional(),
      },
      outputSchema: {
        orders: z.array(
          z.object({
            id: z.string(),
            product: z.string(),
            price: z.number(),
            customer: z.string(),
            date: z.string().optional(),
          }),
        ),
      },
    },
    async ({ limit }) => {
      console.log("Fetching orders...", limit);

      const orders = await OrderService.getLatestOrders(limit);

      return {
        content: [{ type: "text", text: JSON.stringify(orders, null, 2) }],
        structuredContent: { orders },
      };
    },
  );

  // tool 2: Get orders with Customer details
  mcpServer.registerTool(
    "getOrdersWithCustomerDetails",
    {
      title: "Fetch all orders with customer details",
      description:
        "Retrieve the latest orders along with customer details (name) with optional limit",
      inputSchema: {
        limit: z.number().optional(),
      },
      outputSchema: {
        orders: z.array(
          z.object({
            id: z.string(),
            product: z.string(),
            price: z.number(),
            // customer: z.string(),
            customer: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().optional(),
              joinedAt: z.string().optional(),
            }),
            date: z.string().optional(),
          }),
        ),
      },
    },
    async ({ limit }) => {
      console.log("Get Orders with Customer names");
      const orders =
        await OrderService.getLatestOrderswithCustomerDetails(limit);

      return {
        content: [{ type: "text", text: JSON.stringify(orders, null, 2) }],
        structuredContent: { orders },
      };
    },
  );

  // tool 3: Get Order by ID
  mcpServer.registerTool(
    "getOrderById",
    {
      title: "Fetch order by id",
      description: "Retrieve order from the json data based on id",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        order: z.object({
          id: z.string(),
          product: z.string(),
          price: z.number(),
          customer: z.string(),
          date: z.string().optional(),
        }),
      },
    },
    async ({ id }) => {
      console.log("Fetching order by id...", id);

      const order = await OrderService.getOrderById(id);

      return {
        content: [{ type: "text", text: JSON.stringify(order, null, 2) }],
        structuredContent: { order },
      };
    },
  );

  mcpServer.registerTool(
    "createOrder",
    {
      title: "Create a new order",
      description: "Create a new order with customer id, product and amount",
      inputSchema: {
        customerId: z.string(),
        product: z.string(),
        price: z.number(),
      },
      outputSchema: {
        success: z.boolean(),
        orderId: z.string().optional(),
      },
    },
    async ({ customerId, product, price }) => {
      console.log("Creating a new order...", { customerId, product, price });

      const result = await OrderService.createOrder(customerId, product, price);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: { success: true, orderId: result.id },
      };
    },
  );
}

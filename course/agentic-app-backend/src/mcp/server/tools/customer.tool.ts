import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CustomerService } from "../../../services/customer.service.ts";

export function registerCustomerTools(mcpServer: McpServer) {
  console.log("Registering Customer Tools...");

  // tool 1: get customers
  mcpServer.registerTool(
    "getCustomers",
    {
      title: "Fetch all customers",
      description: "Retrieve all customers from the json data based on limit",
      inputSchema: {
        limit: z.number().optional(),
      },
      outputSchema: {
        customers: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            joinedAt: z.string().optional(),
          }),
        ),
      },
    },
    async ({ limit }) => {
      console.log("Fetching customers...", limit);

      const customers = await CustomerService.getLatestCustomers(limit);

      return {
        content: [{ type: "text", text: JSON.stringify(customers, null, 2) }],
        structuredContent: { customers },
      };
    },
  );

  // tool 2: get customer by id
  mcpServer.registerTool(
    "getCustomerById",
    {
      title: "Fetch customer by id",
      description: "Retrieve customer from the json data based on id",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        customer: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          joinedAt: z.string().optional(),
        }),
      },
    },
    async ({ id }) => {
      console.log("Fetching customer by id...", id);

      const customer = await CustomerService.getCustomerById(id);

      return {
        content: [{ type: "text", text: JSON.stringify(customer, null, 2) }],
        structuredContent: { customer },
      };
    },
  );

  mcpServer.registerTool(
    "createCustomer",
    {
      title: "Create a new customer",
      description: "Create a new customer with name and email",
      inputSchema: {
        name: z.string(),
        email: z.string(),
      },
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
      },
    },
    async ({ name, email }) => {
      console.log("Creating customer...", name, email);

      try {
        const result = await CustomerService.createCustomer(name, email);
        return {
          content: [
            {
              type: "text",
              text: `Customer created with ID: ${ result._id }`,
            },
          ],
          structuredContent: {
            success: true,
            message: `Customer created with ID: ${ result._id }`,
          },
        };
      } catch (error: any) {
        console.error("Error creating customer:", error);
        return {
          content: [
            { type: "text", text: `Error creating customer: ${error.message}` },
          ],
          structuredContent: {
            success: false,
            message: `Error creating customer: ${error.message}`,
          },
        };
      }
    },
  );
}

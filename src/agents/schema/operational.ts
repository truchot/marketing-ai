// JSON Schema for OperationalLayer — mirrors types in src/types/marketing-strategy.ts

export const operationalLayerSchema = {
  type: "object",
  required: ["tasks", "calendar", "weeklyKPIs"],
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        required: [
          "id", "campaignId", "title", "description", "owner",
          "deadline", "priority", "status", "estimatedHours",
          "dependencies", "deliverable",
        ],
        properties: {
          id: { type: "string" },
          campaignId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          owner: { type: "string" },
          deadline: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
          estimatedHours: { type: "number" },
          dependencies: { type: "array", items: { type: "string" } },
          deliverable: { type: "string" },
        },
      },
    },
    calendar: {
      type: "array",
      items: {
        type: "object",
        required: ["week", "tasks"],
        properties: {
          week: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              required: ["taskId", "channel", "contentType", "topic"],
              properties: {
                taskId: { type: "string" },
                channel: { type: "string" },
                contentType: { type: "string" },
                topic: { type: "string" },
              },
            },
          },
        },
      },
    },
    weeklyKPIs: {
      type: "array",
      items: {
        type: "object",
        required: ["metric", "targetPerWeek", "trackingTool"],
        properties: {
          metric: { type: "string" },
          targetPerWeek: { type: "string" },
          trackingTool: { type: "string" },
        },
      },
    },
  },
};

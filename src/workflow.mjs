import { WorkflowEntrypoint } from "cloudflare:workers";
import { preparePlan } from "../public/src/domain.mjs";

const now = () => new Date().toISOString();

export class BusinessReviewWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { workflowId, ownerId, taskId } = event.payload || {};
    if (!workflowId || !ownerId || !taskId) throw new Error("A workflow, owner and task are required.");

    try {
      const prepared = await step.do("prepare owner review", async () => {
        const task = await this.env.DB.prepare(`SELECT tasks.id, tasks.title, tasks.source_message_id,
          chat_messages.body AS source_message
          FROM tasks LEFT JOIN chat_messages ON chat_messages.id = tasks.source_message_id
            AND chat_messages.user_id = tasks.user_id
          WHERE tasks.id = ? AND tasks.user_id = ?`)
          .bind(taskId, ownerId).first();
        if (!task) throw new Error("The task was not found in this owner's workspace.");

        const plan = preparePlan(task.source_message || task.title);
        const saved = await this.env.DB.prepare(`UPDATE workflow_runs
          SET status = 'awaiting_approval', plan_json = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND task_id = ? AND status = 'queued'`)
          .bind(JSON.stringify(plan), now(), workflowId, ownerId, taskId).run();
        if (saved.meta?.changes !== 1) throw new Error("The workflow review could not be saved.");
        return { taskTitle: task.title, plan };
      });

      return await step.do("record review ready", async () => ({
        status: "awaiting_approval",
        taskTitle: prepared.taskTitle,
        externalActionTaken: false
      }));
    } catch (error) {
      console.error("Chatbliz review workflow failed", error?.message || "unknown error");
      await step.do("record review failure", async () => {
        await this.env.DB.prepare(`UPDATE workflow_runs SET status = 'failed', updated_at = ?
          WHERE id = ? AND user_id = ? AND status = 'queued'`)
          .bind(now(), workflowId, ownerId).run();
      });
      throw error;
    }
  }
}

import { z } from "zod";

import { ApiError, handleRouteError, jsonOk, requireApiSession } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireApiSession();
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(400, "invalid_id", "ID percakapan tidak valid.");
    }

    const { data: conversation, error } = await supabase
      .from("ai_conversations")
      .select("id, title, lesson_id, updated_at")
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !conversation) {
      throw new ApiError(404, "not_found", "Percakapan tidak ditemukan.");
    }

    const { data: messages, error: messagesError } = await supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", parsedId.data)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (messagesError) {
      throw new ApiError(500, "messages_failed", "Pesan percakapan belum bisa dibaca.");
    }

    return jsonOk({
      conversation: {
        id: conversation.id as string,
        title: conversation.title as string,
        lesson_id: (conversation.lesson_id as string | null) ?? null,
        updated_at: conversation.updated_at as string,
      },
      messages: (messages ?? []).map((message) => ({
        id: message.id as string,
        role: message.role as "user" | "assistant",
        content: message.content as string,
        created_at: message.created_at as string,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * Deletes a conversation owned by the signed-in user. Messages are removed by
 * the database cascade; the explicit user_id filter keeps the operation scoped
 * even if RLS were ever misconfigured.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireApiSession();
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(400, "invalid_id", "ID percakapan tidak valid.");
    }

    const { data, error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "delete_failed", "Percakapan belum bisa dihapus. Coba lagi.");
    }
    if (!data) {
      throw new ApiError(404, "not_found", "Percakapan tidak ditemukan.");
    }

    return jsonOk({ deleted: true, id: parsedId.data });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { Op } from "sequelize";

import {
  DirectMessage,
  DirectMessageConversation,
  Post,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

const INITIAL_LIMIT = 30;
const DM_LIMIT = 20;

interface SSRData {
  routeData: Record<string, unknown>;
  activeUser: unknown | null;
}

export async function fetchSSRData(
  pathname: string,
  sessionUserId: string | undefined,
): Promise<SSRData> {
  const routeData: Record<string, unknown> = {};

  // Fetch active user if session exists
  let activeUser: unknown | null = null;
  if (sessionUserId) {
    try {
      const user = await User.scope("withProfileImage").findByPk(sessionUserId);
      if (user) {
        activeUser = user.toJSON();
      }
    } catch {
      // Ignore errors fetching active user
    }
  }

  try {
    // Timeline page: /
    if (pathname === "/") {
      const posts = await Post.scope("withRelations").findAll({
        limit: INITIAL_LIMIT,
      });
      routeData["/api/v1/posts"] = posts.map((p) => p.toJSON());
    }

    // Post detail page: /posts/:postId
    const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
    if (postMatch) {
      const postId = postMatch[1]!;
      const post = await Post.scope("withRelations").findByPk(postId);
      if (post) {
        routeData[`/api/v1/posts/${postId}`] = post.toJSON();
      }
    }

    // DM detail page: /dm/:conversationId
    const dmMatch = pathname.match(/^\/dm\/([^/]+)$/);
    if (dmMatch && sessionUserId) {
      const conversationId = dmMatch[1]!;
      const conversation = await DirectMessageConversation.scope("withParticipants").findOne({
        where: {
          id: conversationId,
          [Op.or]: [{ initiatorId: sessionUserId }, { memberId: sessionUserId }],
        },
      });
      if (conversation) {
        routeData[`/api/v1/dm/${conversationId}`] = conversation.toJSON();

        const rows = await DirectMessage.scope("withSender").findAll({
          where: { conversationId: conversation.id },
          order: [["createdAt", "DESC"]],
          limit: DM_LIMIT + 1,
        });
        const hasMore = rows.length > DM_LIMIT;
        const messages = rows.slice(0, DM_LIMIT).reverse().map((m) => m.toJSON());
        routeData[`/api/v1/dm/${conversationId}/messages`] = { messages, hasMore };
      }
    }

    // User profile page: /users/:username
    const userMatch = pathname.match(/^\/users\/([^/]+)$/);
    if (userMatch) {
      const username = decodeURIComponent(userMatch[1]!);
      const user = await User.scope("withProfileImage").findOne({
        where: { username },
      });
      if (user) {
        routeData[`/api/v1/users/${username}`] = user.toJSON();
        const posts = await Post.scope("withRelations").findAll({
          where: { userId: user.get("id") as string },
          limit: INITIAL_LIMIT,
        });
        routeData[`/api/v1/users/${username}/posts`] = posts.map((p) => p.toJSON());
      }
    }
  } catch (err) {
    console.error("SSR data fetch error:", err);
  }

  return { routeData, activeUser };
}

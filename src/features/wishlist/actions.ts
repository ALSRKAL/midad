"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { toggleWishlist } from "@/server/wishlist";

/**
 * Toggle a course in the signed-in learner's wishlist.
 *
 * The UI sends a guest to the login form before this runs, but authorization lives here as well:
 * a direct call without a session is refused.
 */
const toggleInternal = createAction<{ courseId: string }, { wishlisted: boolean }>({
  name: "wishlist.toggle",
  schema: z.object({ courseId: z.string().min(1, { message: "COURSE_REQUIRED" }) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return toggleWishlist(user.id, input.courseId);
  },
});

export async function toggleWishlistAction(input: unknown) {
  return toggleInternal(input);
}
